# Admin Subdomain Setup

This guide explains how to configure `admin.billymartinplayersleague.com` to serve the Rails Admin interface.

## Overview

Instead of accessing Rails Admin at `players.billymartinplayersleague.com/admin`, you can access it at `admin.billymartinplayersleague.com`.

This is achieved through:
1. Caddy reverse proxy configuration (path rewrite)
2. Rails host authorization (trusting the admin subdomain)

---

## Step 1: Update Caddy Configuration

Add the admin subdomain route to your Caddyfile:

```caddyfile
# Admin subdomain → Rails app /admin path
admin.billymartinplayersleague.com {
    # Rewrite all requests to /admin path
    rewrite * /admin{uri}
    reverse_proxy players:3000
}
```

**How it works:**
- Requests to `admin.billymartinplayersleague.com` are rewritten to `/admin{uri}`
- Then proxied to the Rails app on port 3000
- Example: `admin.billymartinplayersleague.com/player/123` → `players:3000/admin/player/123`

**Apply the changes:**

If Caddy is running in Docker:
```bash
docker exec -it <caddy-container> caddy reload
```

If Caddy is running as a system service:
```bash
sudo systemctl reload caddy
# or
caddy reload
```

---

## Step 2: Update Rails Environment Variables

Add `admin.billymartinplayersleague.com` to the trusted hosts in your environment configuration.

### For Docker/Portainer Deployment

Update your stack environment variables to include:

```bash
APP_HOST=players.billymartinplayersleague.com
TRUSTED_HOSTS=admin.billymartinplayersleague.com
```

Or if you already have TRUSTED_HOSTS:
```bash
TRUSTED_HOSTS=admin.billymartinplayersleague.com,other-host.com
```

### For Local .env File

Update your `.env` file:

```bash
APP_HOST=players.billymartinplayersleague.com
TRUSTED_HOSTS=admin.billymartinplayersleague.com
```

---

## Step 3: Restart Rails App

After updating environment variables, restart the Rails container:

```bash
docker restart <players-container>
```

Or in Portainer:
1. Go to Containers
2. Select the players container
3. Click "Restart"

---

## Step 4: Test the Setup

Visit https://admin.billymartinplayersleague.com and verify:

✅ You're redirected to the login page
✅ After login, you see the Rails Admin dashboard
✅ No "Blocked host" errors
✅ SSL certificate is valid (Caddy auto-generates via Let's Encrypt)

---

## Troubleshooting

### "Blocked host: admin.billymartinplayersleague.com"

**Cause:** Rails isn't configured to accept requests from the admin subdomain.

**Fix:** Ensure `TRUSTED_HOSTS` includes `admin.billymartinplayersleague.com` and restart the app.

### Admin page shows 404

**Cause:** Caddy path rewrite might not be working.

**Fix:**
1. Check Caddyfile has the `rewrite * /admin{uri}` line
2. Reload Caddy configuration
3. Check Caddy logs: `docker logs <caddy-container>`

### SSL certificate issues

**Cause:** Caddy needs to generate a Let's Encrypt certificate for the new subdomain.

**Fix:**
1. Ensure DNS is pointing to your server
2. Wait a few minutes for Caddy to request the certificate
3. Check Caddy logs for certificate errors

---

## Reference Configuration Files

- **Caddyfile.example** - Full Caddy configuration with all subdomains
- **rails/config/initializers/host_authorization.rb** - Rails host validation logic

---

## Alternative: Keep Using /admin Path

If you prefer to keep the admin at `players.billymartinplayersleague.com/admin`, you don't need to make any changes. The admin interface works perfectly at both:
- `players.billymartinplayersleague.com/admin` (default)
- `admin.billymartinplayersleague.com` (with this configuration)

Both can coexist.
