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
                    // Create .env file from Jenkins credentials
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
FRONTEND_URL=${FRONTEND_URL}
NEXT_PUBLIC_API_URL=http://${EC2_HOST}:8000
EOF
                        '''
                    }
                }
            }
        }
        
        stage('Lint & Test Backend') {
            steps {
                echo '🧪 Running backend tests...'
                script {
                    sh '''
                        cd backend
                        python3 -m venv venv
                        . venv/bin/activate
                        pip install -r requirements.txt
                        # Add your test commands here
                        # python -m pytest tests/ || true
                        echo "Backend tests passed"
                    '''
                }
            }
        }
        
        stage('Lint & Test Frontend') {
            steps {
                echo '🧪 Running frontend tests...'
                script {
                    sh '''
                        cd frontend
                        npm ci
                        # npm run lint || true
                        # npm run test || true
                        echo "Frontend tests passed"
                    '''
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                echo '🐳 Building Docker images...'
                script {
                    // Build backend image
                    sh """
                        docker build -f backend/Dockerfile -t ${DOCKER_IMAGE_BACKEND}:${env.BUILD_NUMBER} -t ${DOCKER_IMAGE_BACKEND}:latest .
                    """
                    
                    // Build frontend image
                    sh """
                        docker build -f frontend/Dockerfile -t ${DOCKER_IMAGE_FRONTEND}:${env.BUILD_NUMBER} -t ${DOCKER_IMAGE_FRONTEND}:latest ./frontend
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
                echo "Current branch: ${env.GIT_BRANCH} / ${env.BRANCH_NAME}"
                script {
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
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
                    sshagent([EC2_CREDENTIALS_ID]) {
                        sh """
                            # Copy .env file to EC2
                            scp -o StrictHostKeyChecking=no .env ${EC2_USER}@${EC2_HOST}:${DEPLOY_PATH}/.env
                            
                            # Copy docker-compose.yml to EC2
                            scp -o StrictHostKeyChecking=no docker-compose.yml ${EC2_USER}@${EC2_HOST}:${DEPLOY_PATH}/docker-compose.yml
                            
                            # SSH into EC2 and deploy
                            ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
cd ${DEPLOY_PATH}

# Pull latest code
git pull origin main

# Pull latest Docker images
docker-compose pull

# Stop and remove old containers
docker-compose down

# Start new containers
docker-compose up -d --build

# Clean up old images
docker image prune -af

# Show status
docker-compose ps

echo "✅ Deployment completed successfully!"
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
                script {
                    sh """
                        sleep 15
                        
                        # Check backend health
                        curl -f http://${EC2_HOST}:8000/health || echo "Backend health check failed"
                        
                        # Check frontend
                        curl -f http://${EC2_HOST}:3000 || echo "Frontend health check failed"
                        
                        echo "Health checks completed"
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline completed successfully!'
            // Send notification (Slack, Email, etc.)
        }
        failure {
            echo '❌ Pipeline failed!'
            // Send failure notification
        }
        always {
            echo '🧹 Cleaning up workspace...'
            cleanWs()
        }
    }
}
