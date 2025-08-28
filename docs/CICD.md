# CI/CD Pipeline for AWOS Dashboard

This directory contains the CI/CD pipeline configuration and deployment scripts for the AWOS Dashboard application.

## Pipeline Overview

The CI/CD pipeline consists of three main stages:

1. **Test**: Runs linting and builds the application to verify code quality
2. **Build**: Creates and pushes Docker images to GitHub Container Registry
3. **Deploy**: Deploys the application to production VPS

## Files

- `.github/workflows/deploy.yml` - Main GitHub Actions workflow
- `Dockerfile` - Multi-stage Docker build for production
- `docker-compose.prod.yml` - Production Docker Compose configuration
- `healthcheck.js` - Health check script for Docker containers
- `scripts/deploy.sh` - Manual deployment script

## Setup Instructions

### 1. Repository Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

**Required secrets:**

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (safe for client-side)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only, keep secret!)
- `NEXT_PUBLIC_BASE_URL` - Your production domain (e.g., https://yourdomain.com)

**VPS Deployment secrets:**

- `VPS_HOST` - Your VPS IP address or hostname
- `VPS_USERNAME` - SSH username for VPS access
- `VPS_SSH_KEY` - Private SSH key for VPS access (generate with ssh-keygen)
- `VPS_PORT` - SSH port (optional, defaults to 22)

**Optional staging secrets:**

- `STAGING_HOST` - Staging server hostname
- `STAGING_SUPABASE_URL` - Staging Supabase URL
- `STAGING_SUPABASE_ANON_KEY` - Staging Supabase anon key
- `STAGING_SUPABASE_SERVICE_ROLE_KEY` - Staging service role key
- `STAGING_BASE_URL` - Staging domain

### 2. VPS Setup

On your VPS, run these commands as a non-root user with sudo access:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose (if not included)
sudo apt install -y docker-compose-plugin

# Create deployment directory
sudo mkdir -p /srv/awos-dashboard
sudo chown $USER:$USER /srv/awos-dashboard

# Clone your repository
cd /srv/awos-dashboard
git clone https://github.com/roshanmohamad/awos-dashboard.git .

# Create environment file
cp .env.example .env.production
# Edit .env.production with your actual values

# Make deployment script executable
chmod +x scripts/deploy.sh
```

### 3. SSH Key Setup

Generate an SSH key pair for GitHub Actions:

```bash
# Generate key pair
ssh-keygen -t ed25519 -f ~/.ssh/github_actions -N ""

# Add public key to authorized_keys on VPS
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Copy private key content to GitHub secret VPS_SSH_KEY
cat ~/.ssh/github_actions
```

### 4. Domain and SSL

Update the Nginx configuration in `deploy/nginx/conf.d/sites/yourdomain.com.conf`:

1. Replace `example.com` with your actual domain
2. Ensure DNS points to your VPS IP
3. Obtain SSL certificates:

```bash
# Run certbot to get certificates
docker run --rm -v "$(pwd)/deploy/certs:/etc/letsencrypt" -v "$(pwd)/deploy/www:/var/www/certbot" certbot/certbot certonly --webroot -w /var/www/certbot -d yourdomain.com -d www.yourdomain.com --email you@yourdomain.com --agree-tos --no-eff-email

# Reload nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Manual Deployment

You can also deploy manually using the deployment script:

```bash
# On your VPS
cd /srv/awos-dashboard
./scripts/deploy.sh
```

## Monitoring

### View logs:

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

### Check service status:

```bash
docker compose -f docker-compose.prod.yml ps
```

### Health check:

```bash
curl -f https://roshanmohamad.github.io/awos-dashboard/api/health
```

## Rollback

To rollback to a previous version:

```bash
# Stop current deployment
docker compose -f docker-compose.prod.yml down

# Checkout previous commit
git checkout <previous-commit-hash>

# Redeploy
docker compose -f docker-compose.prod.yml up -d --build
```

## Troubleshooting

### Build fails:

- Check that all required environment variables are set in GitHub secrets
- Verify Supabase credentials are correct
- Check build logs in GitHub Actions

### Deployment fails:

- Verify SSH key is correctly configured
- Check VPS has sufficient resources (CPU, memory, disk)
- Ensure Docker is running on VPS

### Health check fails:

- Check application logs: `docker compose -f docker-compose.prod.yml logs app`
- Verify database connectivity
- Check environment variables in .env.production

### SSL issues:

- Verify domain DNS points to VPS
- Check that ports 80 and 443 are open
- Ensure certbot has write access to webroot directory

## Security Notes

- Never commit sensitive environment variables to the repository
- Use GitHub secrets for all sensitive data
- Regularly rotate SSH keys and API keys
- Keep Docker images updated
- Monitor logs for suspicious activity
- Use HTTPS for all external communication

## ESP32 Integration

After deployment, update your ESP32 code to use the production endpoint:

```c
const char* INGEST_URL = "https://roshanmohamad.github.io/awos-dashboard/api/ingest";
```

The pipeline ensures your ESP32 can reliably send data to the deployed application with automatic failover and health monitoring.
