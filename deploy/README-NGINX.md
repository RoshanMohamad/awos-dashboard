AWOS Dashboard - Nginx reverse proxy + Let's Encrypt (certbot)

What this provides

- An Nginx configuration that proxies traffic to your AWOS app (default: `http://app:3001`).
- A small docker-compose file to run Nginx and a certbot helper container.
- A webroot path for the ACME challenge at `./deploy/www` and certificate storage at `./deploy/certs`.

Quick setup

1. Update the Nginx config

   - Edit `deploy/nginx/conf.d/default.conf` and replace `example.com` with your domain.
   - If your Next.js app runs on the host (not in Docker) change `proxy_pass` to `http://host.docker.internal:3001`.

2. Start Nginx

   - From the repository root run:
     docker-compose -f deploy/docker-compose.proxy.yml up -d nginx

3. Obtain certificates using certbot (webroot)

   - Replace `you@example.com` and `example.com` with your email and domain:

   Windows (cmd.exe):
   docker run --rm -v "%cd%/deploy/certs:/etc/letsencrypt" -v "%cd%/deploy/www:/var/www/certbot" certbot/certbot certonly --webroot -w /var/www/certbot -d example.com -d www.example.com --email you@example.com --agree-tos --no-eff-email

   - The command will create certificates under `./deploy/certs/live/example.com/`.

4. Reload Nginx
   docker-compose -f deploy/docker-compose.proxy.yml exec nginx nginx -s reload

Renewal

- You can renew manually with:
  docker run --rm -v "%cd%/deploy/certs:/etc/letsencrypt" -v "%cd%/deploy/www:/var/www/certbot" certbot/certbot renew
- Or create a scheduled task / cron to run the renew command periodically and reload nginx after successful renewal.

Notes & alternatives

- If you prefer all-in-one solutions, consider using `linuxserver/swag` or `nginx-proxy` + `letsencrypt` companion images which automate proxying and certificate management.
- If your app is not inside Docker, keep `nginx` in Docker and set `proxy_pass` to `http://host.docker.internal:3001`.
- I can't request or install certificates for you from here — run the certbot command with your actual domain and email on your host.

Security

- Protect your certificate directory and only mount what is necessary into containers.
- For production, test the renewal flow and monitor certificate expiration.
