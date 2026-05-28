pipeline {
    agent any

    environment {
        AWS_ACCOUNT_ID = '262046948996'
        REGION = 'us-east-1'
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('AWS ECR Login') {
            steps {
                sh 'aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REGISTRY'
            }
        }

        stage('Build & Push Backend') {
            steps {
                dir('backend') {
                    sh 'docker build -t pc-backend .'
                    sh 'docker tag pc-backend:latest $ECR_REGISTRY/pc-backend:latest'
                    sh 'docker push $ECR_REGISTRY/pc-backend:latest'
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                dir('frontend') {
                    sh 'docker build -t pc-frontend .'
                    sh 'docker tag pc-frontend:latest $ECR_REGISTRY/pc-frontend:latest'
                    sh 'docker push $ECR_REGISTRY/pc-frontend:latest'
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh 'kubectl apply -f k8s/'
            }
        }
    }
}
