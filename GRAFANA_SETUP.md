# Monitoring Setup (Prometheus & Grafana)

Prometheus and Grafana are installed automatically by the `k8s/cluster-setup.sh` script using the `kube-prometheus-stack` Helm chart. This guide explains how to access and use them.

---

## What Gets Installed

The `kube-prometheus-stack` Helm chart installs the full monitoring stack in the `monitoring` namespace:

| Component | Purpose |
|---|---|
| **Prometheus** | Scrapes and stores metrics from all pods |
| **Grafana** | Dashboards and visualisations |
| **Node Exporter** | CPU, RAM, disk metrics per EKS node |
| **Kube State Metrics** | Kubernetes object metrics (pods, deployments, etc.) |
| **Alertmanager** | Alerting rules and routing |

The `pc-backend` pods expose metrics at `/metrics` and are auto-discovered by Prometheus via these annotations in `k8s/backend.yaml`:
```yaml
prometheus.io/scrape: "true"
prometheus.io/port: "5000"
prometheus.io/path: "/metrics"
```

---

## Access Grafana

The cluster-setup script exposes Grafana via a **LoadBalancer** service. Get the URL:

```bash
kubectl get svc prometheus-grafana -n monitoring
# Copy the EXTERNAL-IP (takes ~2 min to appear)
```

Open `http://<EXTERNAL-IP>` in your browser.

**Login Credentials:**
- **Username:** `admin`
- **Password:** `ProductCatalog@2024`

> [!IMPORTANT]
> Change the Grafana admin password after first login: **Profile → Change Password**

---

## Import Pre-Built Dashboards

### 1. Node.js API Metrics (your backend)

1. Sidebar → **Dashboards** → **Import**
2. Enter Dashboard ID: **`11159`**
3. Click **Load** → select `Prometheus` as the data source → **Import**

You'll see: Request Rate, Response Times, Memory Usage, CPU, Active Connections.

### 2. Kubernetes Cluster Overview

1. Import Dashboard ID: **`315`**
2. Select `Prometheus` → **Import**

Shows CPU/RAM usage per node and namespace.

### 3. MongoDB Metrics (if you add mongo-exporter later)

1. Import Dashboard ID: **`7353`**

---

## Key Metrics to Watch

| Metric | What It Tells You |
|---|---|
| `http_requests_total` | Total API requests by route and status code |
| `http_request_duration_seconds` | API latency (P50, P95, P99) |
| `process_resident_memory_bytes` | Backend memory usage |
| `nodejs_eventloop_lag_seconds` | Event loop health |
| `kube_pod_container_status_restarts_total` | Pod crash loops |
| `node_memory_MemAvailable_bytes` | Free RAM on each EC2 node |

---

## Set Up an Alert (Example: High Error Rate)

1. Sidebar → **Alerting** → **Alert Rules** → **New Alert Rule**
2. Query: `rate(http_requests_total{status=~"5.."}[5m]) > 0.1`
3. Set condition: fires when value is above `0.1` for 5 minutes
4. Save and optionally connect a **Contact Point** (email/Slack) via **Alerting → Contact Points**

---

## Teardown Monitoring

To remove the monitoring stack (frees ~1.5 GB RAM on the cluster):

```bash
helm uninstall prometheus -n monitoring
kubectl delete namespace monitoring
```
