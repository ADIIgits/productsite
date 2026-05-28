# ─────────────────────────────────────────────────────────────────────────────
# EKS Cluster Setup Script
# Run this ONCE to provision the cluster before first deployment.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

CLUSTER_NAME="product-catalog-cluster"
REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "────────────────────────────────────────────"
echo "  AWS Account : $AWS_ACCOUNT_ID"
echo "  Region      : $REGION"
echo "  Cluster     : $CLUSTER_NAME"
echo "────────────────────────────────────────────"

# ── 1. Create ECR repositories (idempotent) ───────────────────────────────────
echo "→ Creating ECR repositories..."
aws ecr create-repository --repository-name pc-backend  --region $REGION 2>/dev/null || echo "  pc-backend repo already exists"
aws ecr create-repository --repository-name pc-frontend --region $REGION 2>/dev/null || echo "  pc-frontend repo already exists"

# ── 2. Create EKS Cluster (t3.large = 2vCPU, 8GB RAM) ────────────────────────
echo "→ Creating EKS cluster (this takes ~15-20 minutes)..."
eksctl create cluster \
  --name "$CLUSTER_NAME" \
  --region "$REGION" \
  --nodegroup-name standard-workers \
  --node-type t3.large \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed \
  --asg-access \
  --full-ecr-access \
  --alb-ingress-access

# ── 3. Update local kubeconfig ────────────────────────────────────────────────
echo "→ Updating kubeconfig..."
aws eks update-kubeconfig --region "$REGION" --name "$CLUSTER_NAME"

# ── 4. Install AWS Load Balancer Controller (needed for Ingress) ──────────────
echo "→ Installing AWS Load Balancer Controller..."
eksctl utils associate-iam-oidc-provider --region=$REGION --cluster=$CLUSTER_NAME --approve

curl -fsSL https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json \
  -o /tmp/iam_policy.json

aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file:///tmp/iam_policy.json 2>/dev/null || echo "  IAM policy already exists"

eksctl create iamserviceaccount \
  --cluster=$CLUSTER_NAME \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name "AmazonEKSLoadBalancerControllerRole" \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve \
  --region=$REGION 2>/dev/null || echo "  IAM service account already exists"

helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$CLUSTER_NAME \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller 2>/dev/null || echo "  LB controller already installed"

# ── 5. Install NGINX Ingress (simpler alternative to ALB Ingress) ─────────────
echo "→ Installing NGINX Ingress Controller..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace 2>/dev/null || echo "  ingress-nginx already installed"

# ── 6. Deploy ECR secret for imagePull ───────────────────────────────────────
echo "→ Creating ECR image pull secret..."
kubectl create secret docker-registry ecr-registry-secret \
  --docker-server="${ECR_REGISTRY}" \
  --docker-username=AWS \
  --docker-password="$(aws ecr get-login-password --region $REGION)" \
  --namespace=default 2>/dev/null || echo "  ecr-registry-secret already exists"

# ── 7. Install Prometheus + Grafana ──────────────────────────────────────────
echo "→ Installing kube-prometheus-stack (Prometheus + Grafana)..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --set grafana.service.type=LoadBalancer \
  --set grafana.adminPassword=ProductCatalog@2024 2>/dev/null || echo "  prometheus stack already installed"

# ── 8. Apply App Manifests ────────────────────────────────────────────────────
echo "→ Applying Kubernetes manifests..."
kubectl apply -f k8s/config.yaml
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml

echo ""
echo "✅  Cluster setup complete!"
echo ""
echo "Run the following to get your app endpoints:"
echo "  kubectl get svc pc-frontend"
echo "  kubectl get svc -n monitoring prometheus-grafana"
echo "  kubectl get ingress pc-ingress"
