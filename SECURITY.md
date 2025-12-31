# Security Configuration

This document describes the security measures implemented in the Players application, including host authorization, HTTPS enforcement, and related security features.

## Overview

The application implements multiple layers of security:

1. **Host Authorization** - Only accept requests from known hostnames
2. **HTTPS Enforcement** - Force all connections over SSL/TLS
3. **Secure Cookies** - Use secure, HTTP-only cookies
4. **HSTS Headers** - Enforce HTTPS at the browser level
5. **No Wildcard Hosts** - Explicit hostname allowlist

---

## Host Authorization

### Purpose

Host authorization prevents DNS rebinding attacks by ensuring the application only responds to requests with expected `Host` headers. This prevents malicious actors from tricking the application into processing requests intended for other domains.

### Configuration

**File**: `rails/config/initializers/host_authorization.rb`

**How it works**:
- In production, Rails checks the `Host` header of every incoming request
- Only hostnames explicitly listed in the allowlist are accepted
- Wildcard patterns are explicitly forbidden
- Invalid hosts receive a 403 Forbidden response

### Allowed Hostnames

Hostnames are configured via environment variables:

```bash
# Primary hostname (required)
APP_HOST=players.billymartinplayersleague.com

# Additional hostnames (optional, comma-separated)
TRUSTED_HOSTS=www.players.billymartinplayersleague.com,api.players.billymartinplayersleague.com
```

**Default hostname** (if `APP_HOST` not set):
- `players.billymartinplayersleague.com`

### Rules

1. ✅ **Explicit hostnames only** - Each hostname must be explicitly listed
2. ❌ **NO wildcards** - Patterns like `*.example.com` are forbidden
3. ✅ **No port numbers** - Just the hostname (port is ignored by Rails)
4. ✅ **Subdomains must be explicit** - `example.com` ≠ `www.example.com`

### Examples

**Valid configurations**:
```bash
APP_HOST=players.billymartinplayersleague.com
TRUSTED_HOSTS=www.players.billymartinplayersleague.com,admin.players.billymartinplayersleague.com
```

**Invalid configurations**:
```bash
# ❌ WRONG - Wildcard not allowed
TRUSTED_HOSTS=*.billymartinplayersleague.com

# ❌ WRONG - Includes protocol
APP_HOST=https://players.billymartinplayersleague.com

# ❌ WRONG - Includes port
APP_HOST=players.billymartinplayersleague.com:443
```

### Verification

On startup, Rails logs the configured hosts:

```
================================================================================
Host Authorization Configured
================================================================================
Allowed hosts:
  • players.billymartinplayersleague.com
  • www.players.billymartinplayersleague.com
================================================================================
```

### Testing

**Test valid host**:
```bash
curl -H "Host: players.billymartinplayersleague.com" https://your-app.com/health
# Expected: 200 OK
```

**Test invalid host**:
```bash
curl -H "Host: evil.com" https://your-app.com/health
# Expected: 403 Blocked host: evil.com
```

---

## HTTPS Enforcement (SSL)

### Purpose

HTTPS enforcement ensures all connections are encrypted, protecting user data from eavesdropping and man-in-the-middle attacks.

### Configuration

**File**: `rails/config/environments/production.rb`

```ruby
config.force_ssl = true
```

**Status**: ✅ **ALWAYS ENABLED** in production

### Behavior

When `force_ssl` is enabled:

1. **HTTP → HTTPS Redirect**
   - All HTTP requests are redirected to HTTPS
   - Uses 301 Moved Permanently status

2. **Secure Cookies**
   - All cookies have `Secure` flag set
   - Cookies only sent over HTTPS connections

3. **HSTS Header**
   - Sets `Strict-Transport-Security` header
   - Tells browsers to always use HTTPS
   - Default: `max-age=31536000` (1 year)

4. **Secure Session Cookies**
   - Session cookies marked as secure
   - Cannot be transmitted over HTTP

### HSTS (HTTP Strict Transport Security)

**What is HSTS?**
- Browser security feature that enforces HTTPS
- Prevents protocol downgrade attacks
- Blocks connections to sites with invalid certificates

**Response Header**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Parameters**:
- `max-age=31536000` - Remember for 1 year
- `includeSubDomains` - Apply to all subdomains

### Asset URLs

Assets (CSS, JS, images) are served over HTTPS:

**Configuration**:
```ruby
# Set asset host with HTTPS
config.action_controller.asset_host = "https://#{ENV['APP_HOST']}"
```

**Examples**:
```html
<!-- ✅ Correct - HTTPS -->
<script src="https://players.billymartinplayersleague.com/assets/application.js"></script>

<!-- ❌ Wrong - HTTP -->
<script src="http://players.billymartinplayersleague.com/assets/application.js"></script>
```

### Testing HTTPS Enforcement

**Test HTTP redirect**:
```bash
curl -I http://your-app.com/
# Expected: 301 Moved Permanently
# Location: https://your-app.com/
```

**Test HSTS header**:
```bash
curl -I https://your-app.com/
# Expected headers:
# Strict-Transport-Security: max-age=31536000
```

**Test secure cookies**:
```bash
curl -I https://your-app.com/
# Expected: Set-Cookie header includes "Secure"
```

---

## Development vs Production

### Production
- ✅ Host authorization enabled
- ✅ Explicit hostname allowlist
- ✅ HTTPS enforced (`force_ssl = true`)
- ✅ Secure cookies
- ✅ HSTS headers
- ❌ No wildcards allowed

### Development
- ✅ Localhost allowed
- ✅ Common dev patterns (`.local`, `.localhost`)
- ✅ All IPs allowed (IPv4/IPv6)
- ❌ HTTPS not enforced
- ❌ HSTS not set

### Test
- ✅ Test hostnames allowed
- ✅ Localhost allowed
- ❌ HTTPS not enforced

---

## Proxy & Load Balancer Configuration

### Behind a Reverse Proxy

If running behind Caddy, nginx, or a load balancer:

**Caddy** (already configured):
```caddyfile
{$DOMAIN} {
    reverse_proxy web:3000 {
        header_up X-Forwarded-Proto https
        header_up X-Forwarded-For {remote_host}
    }
}
```

**Nginx**:
```nginx
location / {
    proxy_pass http://upstream;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

### Important Headers

Rails needs these headers from the proxy:
- `X-Forwarded-Proto: https` - Tells Rails the original protocol was HTTPS
- `X-Forwarded-For` - Original client IP
- `Host` - Original hostname requested

---

## Common Issues

### Issue: "Blocked host" error

**Cause**: Request has a `Host` header not in the allowlist

**Fix**:
1. Add hostname to `TRUSTED_HOSTS`:
   ```bash
   TRUSTED_HOSTS=missing-hostname.com
   ```
2. Restart application
3. Verify in startup logs

### Issue: Infinite redirect loop

**Cause**: Proxy not setting `X-Forwarded-Proto: https`

**Fix**: Configure proxy to set proper headers (see above)

### Issue: Mixed content warnings

**Cause**: Assets loaded over HTTP instead of HTTPS

**Fix**: Verify `ASSET_HOST` or `APP_HOST` is set correctly

### Issue: Wildcard hostname rejected

**Cause**: Attempted to use `*.example.com` in configuration

**Fix**: List each subdomain explicitly:
```bash
# ❌ Wrong
TRUSTED_HOSTS=*.example.com

# ✅ Correct
TRUSTED_HOSTS=www.example.com,api.example.com,admin.example.com
```

---

## Security Checklist

Before deploying to production:

- [ ] `APP_HOST` is set to your primary domain
- [ ] Additional hostnames listed in `TRUSTED_HOSTS`
- [ ] No wildcards in host configuration
- [ ] Verify `force_ssl = true` in `config/environments/production.rb`
- [ ] Reverse proxy sets `X-Forwarded-Proto: https`
- [ ] SSL/TLS certificate is valid and not expired
- [ ] Test HTTP redirect: `curl -I http://your-app.com`
- [ ] Test HSTS header: `curl -I https://your-app.com`
- [ ] Verify allowed hosts in startup logs
- [ ] Test with invalid host header (should return 403)

---

## Additional Security Features

### CORS Configuration

CORS origins are configured separately in `config/application.rb`:

```ruby
config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV['CORS_ORIGINS'].split(',')
    resource '*', headers: :any, methods: :any
  end
end
```

Set via:
```bash
CORS_ORIGINS=https://app.example.com,https://www.example.com
```

### Session Security

Sessions use secure, HTTP-only cookies:
- `Secure` flag: Cookie only sent over HTTPS
- `HttpOnly` flag: Cookie not accessible via JavaScript
- `SameSite`: Protection against CSRF

### Content Security Policy

Consider adding a CSP header for additional security:

```ruby
# config/initializers/content_security_policy.rb
Rails.application.config.content_security_policy do |policy|
  policy.default_src :self, :https
  policy.script_src  :self, :https
  policy.style_src   :self, :https, :unsafe_inline
end
```

---

## References

- [Rails Security Guide](https://guides.rubyonrails.org/security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Rails Host Authorization](https://api.rubyonrails.org/classes/ActionDispatch/HostAuthorization.html)
- [HSTS Specification](https://tools.ietf.org/html/rfc6797)
- [OWASP HSTS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html)

---

## Monitoring

### Logs to Monitor

**Blocked hosts**:
```
ActionDispatch::HostAuthorization::DefaultResponseApp: Blocked host: evil.com
```

**SSL redirects**:
```
Redirecting to https://your-app.com/ (301 Moved Permanently)
```

### Metrics to Track

- Count of blocked host attempts (potential attacks)
- Count of HTTP→HTTPS redirects
- SSL certificate expiration date
- HSTS header presence in responses

---

## Emergency Procedures

### Temporarily Allow Additional Host

If you need to urgently allow a new hostname:

1. **Add to environment**:
   ```bash
   export TRUSTED_HOSTS="existing.com,newhost.com"
   ```

2. **Restart application**:
   ```bash
   docker-compose restart web
   ```

3. **Verify in logs**:
   ```
   Allowed hosts:
     • existing.com
     • newhost.com
   ```

### Disable HTTPS Enforcement (NOT RECOMMENDED)

Only in extreme emergencies:

```ruby
# config/environments/production.rb
config.force_ssl = false  # DO NOT DO THIS
```

**Better alternatives**:
- Fix SSL certificate
- Configure reverse proxy correctly
- Use Cloudflare flexible SSL as temporary measure
