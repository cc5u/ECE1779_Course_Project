# Deployment Notes

## Current Production Shape

- `findit_backend/docker-stack.yml` deploys backend, Postgres, and Redis with Docker Swarm.
- `deploy/nginx/findit.conf` is the public entrypoint config for serving the frontend and proxying `/api` and `/ws`.
- `FindIt_frontend` now defaults to same-origin API and WebSocket URLs, so a production build does not need hardcoded server IPs.

## Manager Node Steps

1. Update the backend stack env file on the manager:

   - `BASE_URL=http://<manager-ip>`
   - `CORS_ORIGIN=http://localhost:5173,http://localhost:5174`
   - configure `DO_SPACES_*` if you want image uploads to use DigitalOcean Spaces

2. Deploy the backend stack:

   ```bash
   cd /opt/findit/repo/ECE1779_Course_Project/findit_backend
   ENV_FILE=/opt/findit/shared/.env.stack ./scripts/deploy-stack.sh
   ```

3. Build the frontend:

   ```bash
   cd /opt/findit/repo/ECE1779_Course_Project/FindIt_frontend
   npm ci
   npm run build
   ```

4. Publish the frontend files:

   ```bash
   cd /opt/findit/repo/ECE1779_Course_Project
   ./deploy/frontend/publish-static.sh
   ```

5. Install the Nginx config:

   ```bash
   sudo cp /opt/findit/repo/ECE1779_Course_Project/deploy/nginx/findit.conf /etc/nginx/sites-available/findit
   sudo ln -sf /etc/nginx/sites-available/findit /etc/nginx/sites-enabled/findit
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. Visit:

   - `http://<manager-ip>/`

## GitHub Actions CD

- `backend_dev` push:
  - builds and pushes the backend image
  - deploys the backend stack to the `staging` environment
- `main` push:
  - builds and pushes the backend image
  - deploys the backend stack
  - builds and publishes the frontend static files
  - installs the Nginx config and reloads Nginx

Create a `production` GitHub Environment with:

- `SSH_HOST`
- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `SSH_KNOWN_HOSTS`
- `SSH_PORT` if not using port 22

The production deploy expects the manager node to already have:

- the repo at `/opt/findit/repo/ECE1779_Course_Project`
- backend env file at `/opt/findit/shared/.env.stack`
- Node.js 22+
- Nginx installed
- `sudo` access for the SSH user to copy the Nginx config and reload Nginx

## Upload Storage

If `DO_SPACES_ENDPOINT`, `DO_SPACES_BUCKET`, `DO_SPACES_KEY`, `DO_SPACES_SECRET`, and `DO_SPACES_REGION` are configured, uploaded images go to DigitalOcean Spaces.

If those variables are missing, the backend falls back to local files under `/app/uploads` inside the backend container and serves them at `/uploads`. That local fallback is fine for a single backend instance, but it is not suitable for multi-node scaling.
