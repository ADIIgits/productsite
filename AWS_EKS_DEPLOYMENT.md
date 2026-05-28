# AWS EKS Deployment Guide

This guide will walk you through containerizing your application and deploying it to a Kubernetes cluster running on AWS Elastic Kubernetes Service (EKS).

## Prerequisites
1. **AWS CLI** configured (`aws configure`) with an IAM user with sufficient permissions.
2. **eksctl** installed ([Installation Guide](https://eksctl.io/introduction/#installation)).
3. **kubectl** installed.
4. **Docker** installed and running.

---

## 1. Create Amazon ECR Repositories

First, you need a place to store your Docker images in AWS.

```bash
# Create a repository for the backend
aws ecr create-repository --repository-name pc-backend --region us-east-1

# Create a repository for the frontend
aws ecr create-repository --repository-name pc-frontend --region us-east-1
```

> [!NOTE]
> Replace `us-east-1` with your preferred AWS region in all commands.

---

## 2. Build and Push Docker Images

Authenticate Docker to your ECR registry:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

### Build and Push Backend
```bash
cd backend
docker build -t pc-backend .
docker tag pc-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/pc-backend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/pc-backend:latest
cd ..
```

### Build and Push Frontend
```bash
cd frontend
docker build -t pc-frontend .
docker tag pc-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/pc-frontend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/pc-frontend:latest
cd ..
```

---

## 3. Create the EKS Cluster

We will use `eksctl` to easily provision a cluster. This process takes 15-20 minutes.

```bash
eksctl create cluster \
  --name product-catalog-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3
```

> [!WARNING]
> EKS clusters and EC2 nodes cost money. Be sure to tear down the cluster when you are finished!

---

## 4. Deploy to Kubernetes

Before deploying, **edit the `k8s/backend.yaml` and `k8s/frontend.yaml` files**.
Find the `image:` fields and replace `<AWS_ACCOUNT_ID>` and `<REGION>` with your actual values so Kubernetes can pull your newly pushed images.

Apply the configurations:

```bash
# Apply secrets and config
kubectl apply -f k8s/config.yaml

# Apply the database
kubectl apply -f k8s/mongo.yaml

# Apply backend and frontend
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

Check the status of your pods:
```bash
kubectl get pods
```

---

## 5. Access the Application

The frontend is exposed via an AWS Classic Load Balancer. Get the URL:

```bash
kubectl get service pc-frontend
```

Look for the `EXTERNAL-IP`. It will look something like `a1b2c3d4...us-east-1.elb.amazonaws.com`.

**Important Update:**
Copy that `EXTERNAL-IP`, and update the `k8s/config.yaml` file so the `CLIENT_URL` matches this URL (with `http://`). Then re-apply the config:
```bash
kubectl apply -f k8s/config.yaml
```
You may need to restart the backend pods so they pick up the new environment variable:
```bash
kubectl rollout restart deployment pc-backend
```

---

## 6. Teardown (Important to avoid charges)

When you are finished with your project, delete the cluster and load balancers:

```bash
eksctl delete cluster --name product-catalog-cluster --region us-east-1
```
