# Custom Domain Setup for BillHarmony Subdomain

## Current Status

✅ BillHarmony is now deployed to its own Firebase Hosting site:
- **Firebase URL**: https://billharmony.web.app
- **Site ID**: `billharmony` (in project `spitegarden`)

## Setting Up a Custom Subdomain

To add a subdomain like `demo.yourdomain.com` or `billharmony.yourdomain.com`:

### Step 1: Add Custom Domain in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/spitegarden/hosting)
2. Click on the **billharmony** site
3. Click **"Add custom domain"**
4. Enter your subdomain (e.g., `demo.yourdomain.com` or `billharmony.yourdomain.com`)
5. Click **"Continue"**

### Step 2: Verify Domain Ownership

Firebase will provide you with DNS records to add:

**Option A: If using a subdomain (recommended)**
- Add a **TXT record** to verify ownership
- Add an **A record** pointing to Firebase's IP addresses (provided by Firebase)

**Option B: If your domain is already verified in Firebase**
- You may only need to add the A record

### Step 3: Update DNS Records

In your domain registrar (where you manage DNS):

1. Add the **TXT record** for verification:
   ```
   Type: TXT
   Name: demo (or billharmony, depending on your subdomain)
   Value: [provided by Firebase]
   ```

2. Add the **A records** pointing to Firebase:
   ```
   Type: A
   Name: demo (or billharmony)
   Value: [IP addresses provided by Firebase - usually 2-4 IPs]
   ```

### Step 4: Wait for Propagation

- DNS changes can take a few minutes to 48 hours
- Firebase will automatically detect when DNS is configured correctly
- You'll see a green checkmark in the Firebase Console when it's ready

### Step 5: SSL Certificate

Firebase automatically provisions SSL certificates for custom domains. This happens automatically after DNS is verified (can take a few minutes to a few hours).

## Example Setup

If your main domain is `jordancorbett.com`:

1. **Main site** (`spitegarden`): `jordancorbett.com` (your personal website)
2. **BillHarmony demo** (`billharmony`): `demo.jordancorbett.com` or `billharmony.jordancorbett.com`

## Deploying Updates

After setting up the custom domain, continue using:
```bash
npm run deploy
```

This will deploy to the `billharmony` site, which will be accessible via both:
- The Firebase URL: `https://billharmony.web.app`
- Your custom domain: `https://demo.yourdomain.com` (once configured)

## Troubleshooting

- **DNS not propagating**: Wait up to 48 hours, or check with `dig` or `nslookup`
- **SSL certificate pending**: This is normal, Firebase provisions automatically
- **Wrong site showing**: Make sure you're adding the domain to the `billharmony` site, not the `spitegarden` site

