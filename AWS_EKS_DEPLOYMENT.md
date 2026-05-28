# AWS EKS Deployment Guide

End-to-end guide for deploying the Product Catalog application to AWS EKS with full CI/CD via Jenkins.

## Architecture Overview

```
GitHub Push
    │
    ▼
Jenkins (k8s/jenkins.yaml — jenkins namespace)
    │  • Builds Docker images (commit-hash tagged)
    │  • Pushes to Amazon ECR
    │  • Runs kubectl apply
    ▼
Amazon EKS Cluster (t3.large × 2 nodes = 16 GB RAM total)
    ├── default namespace
    │   ├── pc-frontend  (Nginx, 2 replicas)
    │   ├── pc-backend   (Node.js, 2 replicas) ← Prometheus scrapes /metrics
    │   └── pc-mongo     (MongoDB StatefulSet, 10 Gi PVC)
    ├── jenkins namespace
    │   └── jenkins      (LoadBalancer svc, 20 Gi PVC)
    └── monitoring namespace
        ├── Prometheus
        └── Grafana      (LoadBalancer svc)

Internet → AWS NLB → NGINX Ingress → /api → pc-backend
                                   → /    → pc-frontend
```

---

## RAM Estimation

| Service | Reserved RAM |
|---|---|
| pc-frontend × 2 | 128 MB |
| pc-backend × 2 | 512 MB |
| pc-mongo | 1 – 2 GB |
| Jenkins | 1 – 2 GB |
| Prometheus + Grafana | ~1.5 GB |
| Kubernetes overhead | ~1 GB |
| **Total** | **~6 – 7 GB** |

**Selected instance: `t3.large` (2 vCPU, 8 GB RAM) × 2 nodes = 16 GB total capacity**
This gives comfortable headroom for rolling updates, monitoring, and Jenkins builds running in parallel.

---

## Prerequisites

Install these on your local machine:

```bash
# AWS CLI
brew install awscli
aws configure   # enter your Access Key, Secret, region: us-east-1

# eksctl
brew tap weaveworks/tap
brew install weaveworks/tap/eksctl

# kubectl
brew install kubectl

# Helm
brew install helm
```

---

## Step 1 — Run the Cluster Setup Script

This script provisions everything in the right order. It is safe to re-run (all steps are idempotent).

```bash
chmod +x k8s/cluster-setup.sh
./k8s/cluster-setup.sh
```

This will:
1. Create ECR repositories (`pc-backend`, `pc-frontend`)
2. Create the EKS cluster with 2 × `t3.large` nodes
3. Install NGINX Ingress Controller
4. Create the ECR image-pull secret
5. Install Prometheus + Grafana (monitoring namespace)
6. Apply all Kubernetes manifests

> [!WARNING]
> This script takes **15–25 minutes** to complete (EKS cluster creation). Do not interrupt it.

---

## Step 2 — Deploy Jenkins

```bash
kubectl apply -f k8s/jenkins.yaml
```

Get the Jenkins public URL:
```bash
kubectl get svc jenkins -n jenkins
# Look for EXTERNAL-IP — takes ~2 min to provision
```

Access Jenkins at `http://<EXTERNAL-IP>:8080`

Get the initial admin password:
```bash
kubectl exec -n jenkins \
  $(kubectl get pod -n jenkins -l app=jenkins -o jsonpath='{.items[0].metadata.name}') \
  -- cat /var/jenkins_home/secrets/initialAdminPassword
```

Follow the setup wizard, then follow **JENKINS_GITHUB_WEBHOOK.md** to connect it to GitHub.

---

## Step 3 — Configure config.yaml After First Deploy

After your first deployment the frontend will have a public DNS. Update `k8s/config.yaml`:

```yaml
data:
  CLIENT_URL: "http://<ingress-dns-from-kubectl-get-ingress>"
```

Then re-apply and restart the backend:
```bash
kubectl apply -f k8s/config.yaml
kubectl rollout restart deployment/pc-backend
```

---

## Step 4 — Verify Everything is Running

```bash
# All app pods should be Running
kubectl get pods

# Jenkins pod
kubectl get pods -n jenkins

# Get your app's public URL
kubectl get ingress pc-ingress

# Get Grafana public URL
kubectl get svc -n monitoring prometheus-grafana
```

---

## Day-to-Day Workflow (After Setup)

Once set up, your entire workflow is:

```bash
git add .
git commit -m "feat: my change"
git push origin aws-deployment
# → GitHub webhook fires → Jenkins builds → EKS rolling update → done
```

---

## Teardown (Avoid Ongoing Charges)

```bash
# Delete the EKS cluster and all node groups (takes ~10 min)
eksctl delete cluster --name product-catalog-cluster --region us-east-1

# Optionally delete ECR images (they have a small storage cost)
aws ecr delete-repository --repository-name pc-backend  --region us-east-1 --force
aws ecr delete-repository --repository-name pc-frontend --region us-east-1 --force
```
