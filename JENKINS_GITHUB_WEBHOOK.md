# GitHub → Jenkins Webhook Setup Guide

This guide connects your GitHub repository to your Jenkins server so that every `git push` automatically triggers a CI/CD pipeline build.

---

## Prerequisites

- Jenkins is running and accessible at a **public URL** (e.g., `http://<jenkins-lb-dns>:8080`)
- You have admin access to the GitHub repository

---

## Step 1 — Install Required Jenkins Plugins

Open Jenkins → **Manage Jenkins** → **Plugins** → **Available Plugins** and install:

| Plugin | Purpose |
|---|---|
| **GitHub Integration Plugin** | Handles incoming webhooks from GitHub |
| **GitHub Plugin** | Git polling + SCM trigger |
| **Credentials Binding Plugin** | Securely inject AWS/Cloudinary secrets |
| **Docker Pipeline Plugin** | `docker.build()` support in pipelines |
| **Kubernetes CLI Plugin** | `kubectl` support in pipelines |

Restart Jenkins after installation.

---

## Step 2 — Add AWS & App Credentials to Jenkins

Go to **Manage Jenkins** → **Credentials** → **System** → **Global credentials** → **Add Credential**.

Add the following **Secret Text** credentials (the IDs must match exactly what the Jenkinsfile uses):

| Credential ID | Value |
|---|---|
| `VITE_API_URL` | Your public backend URL (e.g., `http://<ingress-dns>/api`) |
| `VITE_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Your Cloudinary upload preset |

> [!NOTE]
> AWS credentials are picked up automatically from the EC2/EKS node's **IAM Instance Profile** — you do NOT need to store `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` in Jenkins if your node has the right IAM role attached.

---

## Step 3 — Create the Jenkins Pipeline Job

1. On the Jenkins dashboard click **New Item**.
2. Enter name: `product-catalog-pipeline` → select **Pipeline** → click OK.
3. Under **Build Triggers**, check ✅ **GitHub hook trigger for GITScm polling**.
4. Under **Pipeline**, set:
   - **Definition**: `Pipeline script from SCM`
   - **SCM**: `Git`
   - **Repository URL**: `https://github.com/ADIIgits/productsite.git`
   - **Branch**: `*/aws-deployment`
   - **Script Path**: `Jenkinsfile`
5. Click **Save**.

---

## Step 4 — Add the Webhook on GitHub

1. Go to your GitHub repo → **Settings** → **Webhooks** → **Add webhook**.
2. Fill in the form:

   | Field | Value |
   |---|---|
   | **Payload URL** | `http://<your-jenkins-lb-dns>:8080/github-webhook/` |
   | **Content type** | `application/json` |
   | **Secret** | *(leave blank or set one and add it to Jenkins)* |
   | **Which events** | `Just the push event` |

3. Click **Add webhook**. GitHub will immediately send a ping — you should see a ✅ green checkmark.

---

## Step 5 — Test the Full Pipeline

```bash
# Make a small change and push to the aws-deployment branch
git checkout aws-deployment
echo "# Trigger test" >> README.md
git add README.md
git commit -m "test: trigger Jenkins pipeline"
git push origin aws-deployment
```

Watch the Jenkins dashboard — a new build should appear within seconds.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Webhook shows ❌ red | Check your Jenkins URL is publicly accessible (not `localhost`) |
| Build doesn't trigger | Verify **GitHub hook trigger** is checked on the job |
| `aws` command not found in pipeline | Install AWS CLI on the Jenkins pod / node image |
| `kubectl` command not found | Install kubectl on the Jenkins pod image or use the Kubernetes CLI plugin |
| ECR push fails | Verify the Jenkins node's IAM role has `AmazonEC2ContainerRegistryFullAccess` |
