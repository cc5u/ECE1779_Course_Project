## Session Title 
The image on the report lost card was not updated in real-time
 
### Prompt
 
I found that when a user create a report, the image cannot be shown instantly in another user view, they need to refresh to get the image, why is that?
 
### AI Response
 
The image problem happened because report creation and image upload are two separate calls in ReportLostItem.tsx (line 199). Before this change, other users got the real-time report_created event before the second upload call completed, and there was no follow-up websocket event after the image was saved. So other clients kept showing the report without images until a manual refresh.
 
### What Your Team Did With It
 
1-3 bullet points describing:
 
- It pointed out where the problem was and explained why this bug happened.
- We think everything aligns with our initial thoughts, so nothing is incorrect, misleading, or not applicable.
- We follow the guide, find the mentioned piece of code, and validate the logic error. We change the logic in the backend by adding broadcasting in imageController.ts.
---

## Session Title
 Resolving Helm Installation Failures (Unexpected EOF)
 
### Prompt
 
helm install monitoring prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace
Error: INSTALLATION FAILED: failed to install CRD... unexpected EOF.
 
### AI Response
 
The "unexpected EOF" was likely due to network instability or DigitalOcean API limits when pushing large CRD files. It suggested a "cleanup and retry" strategy:

Manually apply CRDs one by one using kubectl apply.

Re-run Helm with the --set prometheusOperator.createCustomResourceDefs=false flag to skip the heavy CRD installation phase. 
### What Your Team Did With It
 
1-3 bullet points describing:
 
- The manual CRD application was the only way to bypass the network timeout issues on the DigitalOcean cluster.
- We initially tried to just increase the timeout, but the AI's second suggestion (manual CRD + skip flag) was the actual fix that worked.
- Verified by running kubectl get crd to ensure all Prometheus-related definitions were present before re-running Helm.

---

## Session Title 
 Fixing Grafana 404 and Data Source Connectivity
### Prompt 
 
404 Not Found - There was an error returned querying the Prometheus API in Grafana.
 
### AI Response

kube-state-metrics is only a translator, not a database. To fix the 404, we needed a dedicated Prometheus Server to store the metrics. It provided the Helm command to install the standalone Prometheus server and the internal K8s DNS URL (http://prometheus-server.monitoring.svc.cluster.local) to link Grafana to the database. 
### What Your Team Did With It
 
1-3 bullet points describing:
 
- Explained the architectural difference between a "metrics exporter" and a "time-series database," which helped us understand why a data source was missing.
- We tested the internal DNS string provided by the AI in the Grafana "Data Source" settings and achieved a green "Data source is working" status.
