# Monitoring Setup (Prometheus & Grafana)

This guide walks you through setting up monitoring on your Kubernetes cluster using the `kube-prometheus-stack` Helm chart.

## Prerequisites
1. An active Kubernetes cluster (e.g., the EKS cluster from the AWS guide).
2. [Helm](https://helm.sh/docs/intro/install/) installed on your machine.

---

## 1. Install kube-prometheus-stack

Add the Prometheus community Helm repository:
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

Install the stack into a new namespace called `monitoring`:
```bash
helm install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace
```

This chart installs:
- Prometheus (for scraping and storing metrics)
- Grafana (for visualizing metrics)
- Node Exporter (for cluster hardware metrics)
- Kube State Metrics (for Kubernetes object metrics)
- Prometheus Operator

> [!NOTE]
> Since we added the `prometheus.io/scrape: "true"` annotation to the `pc-backend` pod template in `k8s/backend.yaml`, Prometheus will automatically discover the `/metrics` endpoint and begin scraping your Express API.

---

## 2. Access Grafana

By default, Grafana is not exposed to the public internet for security. We will use port-forwarding to access it locally.

```bash
# Forward local port 8080 to Grafana's port 80
kubectl port-forward svc/prometheus-grafana 8080:80 -n monitoring
```

Open your browser and navigate to: `http://localhost:8080`

**Login Credentials:**
- **Username:** `admin`
- **Password:** `prom-operator`

---

## 3. Visualize Node.js Metrics

Your backend is using `express-prom-bundle`, which outputs standard Node.js metrics. We can import a community dashboard to visualize them.

1. In the Grafana sidebar, go to **Dashboards** -> **Import**.
2. Enter the Dashboard ID `11159` (this is a popular Node.js application dashboard).
3. Click **Load**.
4. Select `Prometheus` as the data source at the bottom.
5. Click **Import**.

You should now see graphs for API Request Rates, Response Times, Memory Usage, and CPU Usage for your `pc-backend` pods!

---

## 4. Teardown Monitoring

If you need to remove the monitoring stack to free up cluster resources:

```bash
helm uninstall prometheus -n monitoring
kubectl delete namespace monitoring
```
