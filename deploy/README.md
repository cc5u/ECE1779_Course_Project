# Deployment Notes

## Final Deployment Platform

The finalized deployment for this project is Kubernetes.

The active deployment shape is:

- DigitalOcean Kubernetes cluster
- `findit` namespace
- `findit-backend` Deployment and ClusterIP Service
- `findit-frontend` Deployment and ClusterIP Service
- `postgres` Deployment with a PersistentVolumeClaim
- `redis` Deployment and ClusterIP Service
- `findit-ingress` Ingress routing:
  - `/` -> frontend
  - `/api` -> backend
  - `/ws` -> backend
  - `/uploads` -> backend

The authoritative manifests live under `findit_backend/k8s/`.

## Kubernetes Manifests

- `findit_backend/k8s/namespace.yaml`
- `findit_backend/k8s/backend-config.yaml`
- `findit_backend/k8s/postgres.yaml`
- `findit_backend/k8s/redis.yaml`
- `findit_backend/k8s/backend.yaml`
- `findit_backend/k8s/frontend.yaml`
- `findit_backend/k8s/ingress.yaml`

## Cluster Prerequisites

Before deploying, make sure the target cluster already has:

- an ingress controller that supports `ingressClassName: nginx`
- a storage class named `do-block-storage`
- outbound access for pulling Docker images
- access to DigitalOcean Spaces if you plan to use Spaces-backed uploads

If your cluster does not use the `do-block-storage` storage class, update `findit_backend/k8s/postgres.yaml` before deploying.

## Required Kubernetes Secret

The backend manifests expect a secret named `findit-secrets` in the `findit` namespace.

Important:
- every referenced key must exist
- for optional values such as DigitalOcean Spaces config, set the key to an empty string if you are not using it

Create the namespace first:

```bash
kubectl apply -f ./findit_backend/k8s/namespace.yaml
```

Create or update the secret:

```bash
kubectl -n findit create secret generic findit-secrets \
  --from-literal=POSTGRES_PASSWORD='replace-me' \
  --from-literal=JWT_SECRET='replace-me' \
  --from-literal=JWT_EXPIRES_IN='7d' \
  --from-literal=CORS_ORIGIN='https://your-domain.example' \
  --from-literal=BASE_URL='https://your-domain.example' \
  --from-literal=REDIS_URL='redis://redis:6379' \
  --from-literal=DO_SPACES_ENDPOINT='' \
  --from-literal=DO_SPACES_BUCKET='' \
  --from-literal=DO_SPACES_KEY='' \
  --from-literal=DO_SPACES_SECRET='' \
  --from-literal=DO_SPACES_REGION='' \
  --from-literal=DO_SPACES_CDN_ENDPOINT='' \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Manual Deployment

Use `doctl` to authenticate and fetch the kubeconfig:

```bash
doctl auth init --access-token "$DIGITALOCEAN_ACCESS_TOKEN"
doctl kubernetes cluster kubeconfig save "$DIGITALOCEAN_CLUSTER_NAME"
```

Apply the manifests:

```bash
kubectl apply -f ./findit_backend/k8s/namespace.yaml
kubectl apply -f ./findit_backend/k8s/backend-config.yaml
kubectl apply -f ./findit_backend/k8s/postgres.yaml
kubectl apply -f ./findit_backend/k8s/redis.yaml
kubectl apply -f ./findit_backend/k8s/backend.yaml
kubectl apply -f ./findit_backend/k8s/frontend.yaml
kubectl apply -f ./findit_backend/k8s/ingress.yaml
```

If you want to deploy a specific image tag instead of whatever `latest` points to:

```bash
kubectl -n findit set image deployment/findit-backend \
  findit-backend=chiachun5/findit-backend:sha-<git-sha>

kubectl -n findit set image deployment/findit-frontend \
  findit-frontend=chiachun5/findit-frontend:sha-<git-sha>
```

## Verification

Check the deployed resources:

```bash
kubectl -n findit get deploy,svc,ingress,pods,pvc
```

Wait for rollouts:

```bash
kubectl -n findit rollout status deployment/postgres --timeout=180s
kubectl -n findit rollout status deployment/redis --timeout=180s
kubectl -n findit rollout status deployment/findit-backend --timeout=180s
kubectl -n findit rollout status deployment/findit-frontend --timeout=180s
```

Useful follow-up commands:

```bash
kubectl -n findit describe ingress findit-ingress
kubectl -n findit logs deployment/findit-backend --tail=200
kubectl -n findit logs deployment/findit-frontend --tail=200
```

## GitHub Actions CI/CD

The active CI/CD path is GitHub Actions plus Kubernetes.

Backend workflow:
- file: `.github/workflows/backend-image.yml`
- triggers on pushes to `main` and `k8s-findit`
- builds and pushes the backend image
- applies backend-related Kubernetes manifests
- updates the backend deployment image to `sha-${{ github.sha }}`

Frontend workflow:
- file: `.github/workflows/frontend-image.yml`
- triggers on pushes to `main` and `k8s-findit`
- builds and pushes the frontend image
- applies frontend and ingress manifests
- updates the frontend deployment image to `sha-${{ github.sha }}`

Repository secrets required by CI/CD:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `DIGITALOCEAN_ACCESS_TOKEN`
- `DIGITALOCEAN_CLUSTER_NAME`

The backend deploy job also uses the GitHub `staging` environment.

## Upload Storage

If the `DO_SPACES_*` secret values are set, uploads are stored in DigitalOcean Spaces.

If those values are left empty, the backend falls back to local `/uploads` storage inside the backend container. That fallback works for simple setups, but it is not a good long-term choice for multi-replica or multi-node production deployments.

## Notes

- This README treats Kubernetes as the only supported deployment target.
- Older Docker Swarm references should be considered historical and should not be used for the finalized deployment.
