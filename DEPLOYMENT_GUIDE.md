# 🚀 AWOS Dashboard Deployment Guide

## Prerequisites Complete ✅

Your AWOS Dashboard is now **95% ready for deployment**! Here's what we've set up:

### ✅ Already Configured:

- ✅ Next.js application with TypeScript
- ✅ Supabase database integration
- ✅ Docker production setup
- ✅ GitHub Actions CI/CD pipeline
- ✅ Nginx reverse proxy with SSL support
- ✅ MQTT broker for IoT connectivity
- ✅ Health monitoring endpoints
- ✅ Production environment file (`.env.production`)
- ✅ SSL certificate directories (`deploy/certs`, `deploy/www`)
- ✅ Domain configuration template (`yourdomain.com.conf`)

## 🎯 Next Steps (5-10 minutes)

### Step 1: Get a VPS Server

Choose one of these providers:

**Recommended Options:**

- **DigitalOcean**: $6/month droplet (Ubuntu 22.04)
- **AWS EC2**: t3.micro (free tier eligible)
- **Google Cloud**: e2-micro (free tier)
- **Linode**: $5/month VPS
- **Vultr**: $6/month VPS

**VPS Requirements:**

- OS: Ubuntu 20.04+ or 22.04
- RAM: At least 2GB
- CPU: At least 1 vCPU
- Storage: At least 20GB

### Step 2: Configure Your Domain (Optional but Recommended)

If you have a domain name:

1. **Point your domain to VPS IP:**

   ```
   A Record: yourdomain.com → YOUR_VPS_IP
   A Record: www.yourdomain.com → YOUR_VPS_IP
   ```

2. **Update nginx config:**
   ```bash
   # Edit deploy/nginx/conf.d/sites/yourdomain.com.conf
   # Replace 'example.com' with your actual domain
   ```

### Step 3: Set Up GitHub Repository Secrets

Go to: https://github.com/RoshanMohamad/awos-dashboard/settings/secrets/actions

**Add these secrets:**

| Secret Name                 | Value                                    | Where to Get It                     |
| --------------------------- | ---------------------------------------- | ----------------------------------- |
| `VPS_HOST`                  | `192.168.1.100`                          | Your VPS IP address                 |
| `VPS_USERNAME`              | `root` or `ubuntu`                       | SSH username for your VPS           |
| `VPS_SSH_KEY`               | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Your SSH private key                |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiI...`                 | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_BASE_URL`      | `https://yourdomain.com`                 | Your domain or `http://VPS_IP`      |

**Additional secrets (already have values):**

- `NEXT_PUBLIC_SUPABASE_URL` - Already configured
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Already configured

### Step 4: Prepare Your VPS

SSH into your VPS and run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y

# Add user to docker group (if not root)
sudo usermod -aG docker $USER

# Create deployment directory
sudo mkdir -p /srv/awos-dashboard
sudo chown $USER:$USER /srv/awos-dashboard

# Clone repository
cd /srv/awos-dashboard
git clone https://github.com/RoshanMohamad/awos-dashboard.git .
```

### Step 5: Deploy! 🚀

Once everything is configured:

```bash
# Commit your changes
git add .
git commit -m "Complete deployment setup"
git push origin main
```

**GitHub Actions will automatically:**

1. ✅ Run tests and build verification
2. ✅ Create and push Docker image to GitHub Container Registry
3. ✅ Deploy to your VPS
4. ✅ Set up SSL certificates (if domain configured)
5. ✅ Start all services with health checks

## 🎉 Your App Will Be Live At:

- **HTTP**: `http://YOUR_VPS_IP`
- **HTTPS**: `https://yourdomain.com` (if domain configured)
- **Health Check**: `http://YOUR_VPS_IP/api/health`

## 📊 Features Available After Deployment:

- 🌐 **Real-time Weather Dashboard**
- 📈 **Interactive Data Visualizations**
- 📡 **IoT Device Connectivity (ESP32 + MQTT)**
- 🔒 **Secure API Endpoints**
- 📱 **Responsive PWA Interface**
- 🚀 **Auto-scaling Docker Services**
- 🔍 **Health Monitoring & Logging**

## 🛠️ Troubleshooting

### Check Deployment Status:

```bash
# View GitHub Actions
https://github.com/RoshanMohamad/awos-dashboard/actions

# Check services on VPS
ssh user@your-vps-ip 'cd /srv/awos-dashboard && docker compose -f docker-compose.prod.yml ps'

# View logs
ssh user@your-vps-ip 'cd /srv/awos-dashboard && docker compose -f docker-compose.prod.yml logs -f app'
```

### Common Issues:

- **Build fails**: Check Supabase secrets are correct
- **Deploy fails**: Verify SSH key and VPS access
- **SSL issues**: Domain DNS must point to VPS IP
- **Health check fails**: Check if port 3000 is accessible

## 📞 Support

- **Documentation**: Check `/docs` directory
- **Issues**: Open a GitHub issue
- **ESP32 Setup**: See `scripts/esp32-server-example.ino`

---

**Ready to deploy? Follow the 5 steps above and your AWOS Dashboard will be live! 🌤️**
