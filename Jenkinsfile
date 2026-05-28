pipeline {
    agent any

    environment {
        AWS_ACCOUNT_ID  = '262046948996'
        REGION          = 'us-east-1'
        ECR_REGISTRY    = "${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
        IMAGE_TAG       = "${env.GIT_COMMIT?.take(7) ?: 'latest'}"
        CLUSTER_NAME    = 'product-catalog-cluster'
        K8S_NAMESPACE   = 'default'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {

        // ── 1. Checkout ──────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Ensure IMAGE_TAG is set even if GIT_COMMIT env wasn't populated
                    env.IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    echo "Building image tag: ${env.IMAGE_TAG}"
                }
            }
        }

        // ── 2. ECR Login ─────────────────────────────────────────────────────
        stage('ECR Login') {
            steps {
                sh '''
                    aws ecr get-login-password --region $REGION \
                      | docker login --username AWS --password-stdin $ECR_REGISTRY
                '''
            }
        }

        // ── 3. Build & Push (parallel) ────────────────────────────────────────
        stage('Build & Push Images') {
            parallel {

                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh '''
                                docker build \
                                  -t pc-backend:$IMAGE_TAG \
                                  -t $ECR_REGISTRY/pc-backend:$IMAGE_TAG \
                                  -t $ECR_REGISTRY/pc-backend:latest \
                                  .
                                docker push $ECR_REGISTRY/pc-backend:$IMAGE_TAG
                                docker push $ECR_REGISTRY/pc-backend:latest
                            '''
                        }
                    }
                }

                stage('Frontend') {
                    steps {
                        withCredentials([
                            string(credentialsId: 'VITE_API_URL',                    variable: 'VITE_API_URL'),
                            string(credentialsId: 'VITE_CLOUDINARY_CLOUD_NAME',      variable: 'VITE_CLOUDINARY_CLOUD_NAME'),
                            string(credentialsId: 'VITE_CLOUDINARY_UPLOAD_PRESET',  variable: 'VITE_CLOUDINARY_UPLOAD_PRESET')
                        ]) {
                            dir('frontend') {
                                sh '''
                                    docker build \
                                      --build-arg VITE_API_URL=$VITE_API_URL \
                                      --build-arg VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME \
                                      --build-arg VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET \
                                      -t pc-frontend:$IMAGE_TAG \
                                      -t $ECR_REGISTRY/pc-frontend:$IMAGE_TAG \
                                      -t $ECR_REGISTRY/pc-frontend:latest \
                                      .
                                    docker push $ECR_REGISTRY/pc-frontend:$IMAGE_TAG
                                    docker push $ECR_REGISTRY/pc-frontend:latest
                                '''
                            }
                        }
                    }
                }
            }
        }

        // ── 4. Update Kubeconfig ──────────────────────────────────────────────
        stage('Configure kubectl') {
            steps {
                sh 'aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME'
            }
        }

        // ── 5. Inject Image Tags & Deploy ─────────────────────────────────────
        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    # Stamp the exact image tag into a temporary copy of the manifests
                    cp k8s/backend.yaml  /tmp/backend-deploy.yaml
                    cp k8s/frontend.yaml /tmp/frontend-deploy.yaml

                    sed -i "s|pc-backend:latest|pc-backend:$IMAGE_TAG|g"  /tmp/backend-deploy.yaml
                    sed -i "s|pc-frontend:latest|pc-frontend:$IMAGE_TAG|g" /tmp/frontend-deploy.yaml

                    # Apply config & secrets first (idempotent)
                    kubectl apply -f k8s/config.yaml   -n $K8S_NAMESPACE
                    kubectl apply -f k8s/mongo.yaml    -n $K8S_NAMESPACE

                    # Rolling updates for app services
                    kubectl apply -f /tmp/backend-deploy.yaml  -n $K8S_NAMESPACE
                    kubectl apply -f /tmp/frontend-deploy.yaml -n $K8S_NAMESPACE

                    # Wait for rollouts to complete
                    kubectl rollout status deployment/pc-backend  -n $K8S_NAMESPACE --timeout=180s
                    kubectl rollout status deployment/pc-frontend -n $K8S_NAMESPACE --timeout=180s
                '''
            }
        }

        // ── 6. Health Check ───────────────────────────────────────────────────
        stage('Health Check') {
            steps {
                sh '''
                    echo "Waiting for backend to be reachable..."
                    BACKEND_IP=$(kubectl get svc pc-backend -n $K8S_NAMESPACE -o jsonpath="{.spec.clusterIP}")
                    # Use a temporary debug pod to curl the health endpoint from inside the cluster
                    kubectl run health-check-$IMAGE_TAG \
                        --image=curlimages/curl:latest \
                        --restart=Never \
                        --rm \
                        -i \
                        --timeout=60s \
                        -- curl -sf http://$BACKEND_IP:5000/health || echo "Health check pod unavailable — check pods manually"
                '''
            }
        }

        // ── 7. Clean Up Local Docker Images ───────────────────────────────────
        stage('Docker Cleanup') {
            steps {
                sh '''
                    docker rmi pc-backend:$IMAGE_TAG           || true
                    docker rmi pc-frontend:$IMAGE_TAG          || true
                    docker rmi $ECR_REGISTRY/pc-backend:$IMAGE_TAG  || true
                    docker rmi $ECR_REGISTRY/pc-frontend:$IMAGE_TAG || true
                    docker image prune -f || true
                '''
            }
        }
    }

    post {
        success {
            echo "✅  Deployment of tag [${env.IMAGE_TAG}] succeeded!"
        }
        failure {
            echo "❌  Pipeline failed. Check the logs above."
        }
        always {
            sh 'docker logout $ECR_REGISTRY || true'
        }
    }
}
