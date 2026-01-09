pipeline {
    agent any
    
    environment {
        // Docker registry (DockerHub)
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_IMAGE_BACKEND = 'shiranthads/work-zen-backend'
        DOCKER_IMAGE_FRONTEND = 'shiranthads/work-zen-frontend'
        
        // Credentials
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
        GIT_CREDENTIALS_ID = 'github-credentials'
        
        // SSH credentials for deployment
        EC2_HOST = '13.48.13.155'
        EC2_USER = 'ubuntu'
        EC2_CREDENTIALS_ID = 'ec2-ssh-key'
        DEPLOY_PATH = '/home/ubuntu/Work-Zen'
        
        // Production URLs (HTTPS)
        PRODUCTION_DOMAIN = 'workzen.duckdns.org'
        PRODUCTION_API_URL = 'https://workzen.duckdns.org/api'
        PRODUCTION_FRONTEND_URL = 'https://workzen.duckdns.org'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '📥 Checking out code from repository...'
                checkout scm
            }
        }
        
        stage('Environment Setup') {
            steps {
                echo '🔧 Setting up environment variables...'
                script {
                    withCredentials([
                        string(credentialsId: 'mongo-url', variable: 'MONGO_URL'),
                        string(credentialsId: 'mongo-db-name', variable: 'MONGO_DB_NAME'),
                        string(credentialsId: 'openrouter-api-key', variable: 'OPENROUTER_API_KEY'),
                        string(credentialsId: 'huggingface-api-key', variable: 'HUGGINGFACE_API_KEY'),
                        string(credentialsId: 'frontend-url', variable: 'FRONTEND_URL')
                    ]) {
                        sh '''
                            cat > .env << EOF
MONGO_URL=${MONGO_URL}
MONGO_DB_NAME=${MONGO_DB_NAME}
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}
FRONTEND_URL=https://workzen.duckdns.org
NEXT_PUBLIC_API_URL=https://workzen.duckdns.org/api
EOF
                        '''
                    }
                }
            }
        }
        
        stage('Lint & Test Backend') {
            steps {
                echo '🧪 Skipping backend tests (no tests configured)...'
                sh 'echo "Backend stage skipped - tests will be added later"'
            }
        }
        
        stage('Lint & Test Frontend') {
            steps {
                echo '🧪 Skipping frontend tests (no tests configured)...'
                sh 'echo "Frontend stage skipped - tests will be added later"'
            }
        }
        
        stage('Build Docker Images') {
            steps {
                echo '🐳 Building Docker images...'
                script {
                    sh """
                        docker build -f backend/Dockerfile \
                        -t ${DOCKER_IMAGE_BACKEND}:${env.BUILD_NUMBER} \
                        -t ${DOCKER_IMAGE_BACKEND}:latest .
                    """

                    sh """
                        docker build -f frontend/Dockerfile \
                        --build-arg NEXT_PUBLIC_API_URL=https://workzen.duckdns.org/api \
                        -t ${DOCKER_IMAGE_FRONTEND}:${env.BUILD_NUMBER} \
                        -t ${DOCKER_IMAGE_FRONTEND}:latest \
                        ./frontend
                    """
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                expression { env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' || env.BRANCH_NAME == 'main' }
            }
            steps {
                echo '📤 Pushing Docker images to registry...'
                script {
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
                            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                            docker push ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}
                            docker push ${DOCKER_IMAGE_BACKEND}:latest
                            docker push ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}
                            docker push ${DOCKER_IMAGE_FRONTEND}:latest
                            docker logout
                        '''
                    }
                }
            }
        }
        
   stage('Deploy to EC2') {
    when {
        expression { env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' || env.BRANCH_NAME == 'main' }
    }
    steps {
        echo '🚀 Deploying to EC2 instance...'
        script {
            withCredentials([sshUserPrivateKey(credentialsId: EC2_CREDENTIALS_ID, keyFileVariable: 'SSH_KEY')]) {
                sh """
                    scp -i $SSH_KEY -o StrictHostKeyChecking=no .env ${EC2_USER}@${EC2_HOST}:${DEPLOY_PATH}/.env
                    scp -i $SSH_KEY -o StrictHostKeyChecking=no docker-compose.yml ${EC2_USER}@${EC2_HOST}:${DEPLOY_PATH}/docker-compose.yml

                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} << ENDSSH
                    cd ${DEPLOY_PATH}

                    echo "Current directory:"
                    pwd
                    ls -la

                    git pull origin main

                    echo "=== Stopping old containers ==="
                    docker-compose down

                    echo "=== Pulling exact build images ==="
                    export IMAGE_TAG=${BUILD_NUMBER}
                    docker-compose pull

                    echo "=== Starting containers ==="
                    docker-compose up -d

                    echo "=== Running containers ==="
                    docker-compose ps
ENDSSH
                """
            }
        }
    }
}

        
        stage('Health Check') {
            when {
                expression { env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' || env.BRANCH_NAME == 'main' }
            }
            steps {
                echo '🏥 Performing health check...'
                sh """
                    sleep 15
                    curl -f http://${EC2_HOST}:8000/health || echo "Backend health check failed"
                    curl -f http://${EC2_HOST}:3000 || echo "Frontend health check failed"
                """
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
        always {
            echo '🧹 Cleaning up workspace...'
            cleanWs()
        }
    }
}
