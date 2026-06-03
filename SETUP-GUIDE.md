# GRACE HOME CANDLES — COMPLETE SETUP GUIDE

## Project Structure

```
grace-home/
├── index.html                  ← Homepage
├── css/
│   └── main.css               ← All styles (design system)
├── js/
│   ├── core.js                ← Cart, security, animations, Supabase, Razorpay
│   └── products.js            ← Product data & card renderer
├── pages/
│   ├── shop.html              ← Shop / All products
│   ├── product.html           ← Individual product detail
│   ├── checkout.html          ← Checkout form + Razorpay
│   ├── order-success.html     ← Post-payment confirmation
│   ├── about.html             ← Brand story
│   ├── contact.html           ← Contact form
│   ├── faq.html               ← FAQ accordion
│   ├── gifting.html           ← Gift sets & corporate
│   ├── privacy-policy.html    ← Privacy Policy
│   ├── terms.html             ← Terms & Conditions
│   ├── return-policy.html     ← Return & Refund Policy
│   └── shipping-policy.html   ← Shipping Policy
└── supabase-schema.sql        ← Full database schema + seed data
```

---

## STEP 1 — Supabase Setup

### 1.1 Create a Supabase Project
1. Go to https://supabase.com and sign up / log in
2. Click **New Project**
3. Choose a name (e.g. `grace-home-candles`), set a database password, choose region (ap-south-1 for India)
4. Wait for project to initialise (~2 minutes)

### 1.2 Run the SQL Schema
1. In your Supabase dashboard, go to **SQL Editor** → **New query**
2. Copy the entire contents of `supabase-schema.sql`
3. Paste and click **Run**
4. You should see "Success" and all tables created with seed data

### 1.3 Get Your API Keys
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g. `https://xyzabc.supabase.co`)
   - **anon/public key** (safe to use in frontend)
3. Open `js/core.js` and replace:
   ```js
   url: 'YOUR_SUPABASE_URL',        // ← paste Project URL
   key: 'YOUR_SUPABASE_ANON_KEY',   // ← paste anon key
   ```

### 1.4 Verify RLS is Working
- In Supabase Dashboard → **Table Editor** → products
- You should see all 5 candles seeded
- RLS is enabled by default from the schema

---

## STEP 2 — Razorpay Setup

### 2.1 Create a Razorpay Account
1. Go to https://razorpay.com and sign up
2. Complete KYC verification (required for live payments)
3. For testing, use **Test Mode** (no KYC required)

### 2.2 Get API Keys
1. Dashboard → **Settings** → **API Keys**
2. Generate a **Test Key** (starts with `rzp_test_`)
3. For production, generate a **Live Key** (starts with `rzp_live_`)

### 2.3 Add Key to Code
Open `js/core.js` and replace:
```js
key: 'YOUR_RAZORPAY_KEY_ID',   // ← paste your Razorpay Key ID
```

**NEVER put your Razorpay Key Secret in frontend code.**

### 2.4 Test Cards (Test Mode)
| Card Number        | CVV  | Expiry  | Result  |
|--------------------|------|---------|---------|
| 4111 1111 1111 1111| Any  | Any future | Success |
| 5267 3181 8797 5449| Any  | Any future | Success |

**Test UPI ID:** `success@razorpay`

### 2.5 Payment Verification (Production)
For production, add server-side payment verification using a backend:
```
POST /verify-payment
  razorpay_payment_id
  razorpay_order_id  
  razorpay_signature
→ HMAC-SHA256 verify with your Key Secret
```
Use Netlify Functions, Vercel Serverless, or a Node.js backend.

---

## STEP 3 — Deployment

### Option A: Netlify (Recommended — Free)
1. Drag and drop the `grace-home/` folder to https://netlify.com/drop
2. Or connect your GitHub repo for continuous deployment
3. Set custom domain: gracehomecandles.in

**Add `netlify.toml` to root:**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://checkout.razorpay.com https://fonts.googleapis.com 'unsafe-inline'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src https://fonts.gstatic.com; img-src 'self' https://images.unsplash.com data:; connect-src 'self' https://*.supabase.co https://api.razorpay.com;"
```

### Option B: Vercel
```bash
npm install -g vercel
cd grace-home
vercel --prod
```

### Option C: GitHub Pages
1. Push to a GitHub repository
2. Settings → Pages → Deploy from main branch / root

---

## STEP 4 — Security Checklist

### Already Implemented in Code
- [x] XSS prevention via `Security.sanitize()` on all user inputs
- [x] Input validation (email, phone, pincode, name lengths)
- [x] Rate limiting on forms (contact: 3/5min, newsletter: 3/min, payment: 3/min)
- [x] Honeypot field on contact form (spam bot detection)
- [x] Cart stored in sessionStorage (cleared on tab close, not localStorage)
- [x] No sensitive data in frontend (no Razorpay secret, no Supabase service key)
- [x] Row Level Security (RLS) on all Supabase tables
- [x] CSP-ready (add server headers — see netlify.toml above)
- [x] ARIA labels for accessibility
- [x] noindex on checkout/success pages

### Additional Recommendations
- [ ] Add Supabase Realtime alerts for new orders (email via SendGrid/Resend)
- [ ] Set up Razorpay Webhook for server-side payment verification
- [ ] Enable Supabase Auth for an admin dashboard
- [ ] Add Google reCAPTCHA v3 on contact form for extra bot protection
- [ ] Set up error logging (Sentry.io free tier)
- [ ] Enable Cloudflare proxy for DDoS protection

---

## STEP 5 — Customisation

### Update Brand Info
Search and replace across all files:
- `gracehomecandles.in` → your actual domain
- `hello@gracehomecandles.in` → your email
- `+91 98765 43210` → your phone
- `Bandra West, Mumbai` → your city
- `400050` → your pincode

### Add Real Product Images
Replace Unsplash URLs in `js/products.js` with your own product photography.
Recommended: Upload to Supabase Storage or Cloudinary.

### Add Your GST Number
In `pages/terms.html`:
```html
<li><strong>GST Number:</strong> [To be added upon GST registration]</li>
```
Replace `[To be added upon GST registration]` with your actual GSTIN.

---

## STEP 6 — Admin (Viewing Orders)

Currently, orders are stored in Supabase. To view them:

1. **Supabase Dashboard** → Table Editor → orders
2. Or build a simple admin page using the `service_role` key (server-side only)

### Quick Admin SQL Queries
```sql
-- All orders (newest first)
SELECT * FROM orders ORDER BY created_at DESC;

-- Paid orders today
SELECT * FROM orders 
WHERE payment_status = 'paid' 
AND DATE(created_at) = CURRENT_DATE;

-- Revenue this month
SELECT SUM(total) as monthly_revenue
FROM orders 
WHERE payment_status = 'paid'
AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());

-- Newsletter subscribers
SELECT email, subscribed_at FROM newsletter_subscribers WHERE is_active = TRUE;

-- Unread contact messages
SELECT * FROM contact_messages WHERE is_read = FALSE ORDER BY created_at DESC;
```

---

## Tech Stack Summary

| Layer        | Technology                    |
|--------------|-------------------------------|
| Frontend     | HTML5, CSS3, Vanilla JS       |
| Fonts        | Google Fonts (Cormorant + Jost)|
| Database     | Supabase (PostgreSQL)          |
| Payments     | Razorpay                       |
| Images       | Unsplash (replace with own)   |
| Hosting      | Netlify / Vercel / GitHub Pages|
| Security     | RLS, CSP, XSS sanitization    |

---

## Support

For any setup issues, email: hello@gracehomecandles.in

---

## STEP 7 — Admin Dashboard

### Access the Dashboard
URL: `https://yourdomain.com/pages/admin.html`

### Default Credentials
```
Username: admin
Password: GraceHome@2025
```
**⚠ IMPORTANT: Change these before going live!**

Open `pages/admin.html`, find `ADMIN_CONFIG` at the top of the `<script>` block and change:
```js
const ADMIN_CONFIG = {
  USERNAME: 'your_username',        // ← change
  PASSWORD: 'YourStr0ngP@ss!',      // ← change to something strong
  ...
};
```

### Admin Features
| Feature | Description |
|---|---|
| Dashboard | Revenue, order count, subscriber count, pending actions |
| Revenue Chart | Last 7 days bar chart |
| Order Status Donut | Visual breakdown by status |
| Orders Table | Search, filter by status/payment, paginated |
| Order Detail Modal | Full customer info, update status, add tracking |
| Products | View all products, active/inactive status |
| Messages | Read contact form submissions, mark read, reply |
| Subscribers | View newsletter list, export CSV |
| Analytics | Revenue KPIs, orders by state, conversion rate |
| CSV Export | Orders and subscribers export |

### Also Set Supabase Keys in Admin
In `pages/admin.html`, in `ADMIN_CONFIG`:
```js
SUPABASE_URL: 'https://your-project.supabase.co',
SUPABASE_KEY: 'your-anon-key',
```

### Security Notes for Admin
- The dashboard uses `sessionStorage` (cleared on browser close)
- Session expires after 8 hours automatically
- For production, consider moving to Supabase Auth (see below)
- Do NOT host admin.html on a public/indexed path
- Add HTTP Basic Auth at the server level (Netlify/Vercel) for extra protection

**Netlify HTTP Basic Auth** (add to `netlify.toml`):
```toml
[[redirects]]
  from = "/pages/admin.html"
  to = "/pages/admin.html"
  status = 200
  conditions = {Role = ["admin"]}
```

---

## STEP 8 — Delivery API Setup

### Option A: Pincode-Zone Based (No API Key — Works out of the box)
Already configured in `js/core.js`. Charges are based on pincode prefix zones:

| Zone | Pincodes | Charge |
|---|---|---|
| Local (Mumbai/Pune) | 40x, 41x | ₹49 |
| Regional (MH/GJ) | 42x–44x, 36x | ₹79 |
| National (Delhi/Hyd) | 50x–51x, 56x–59x, 11x–12x | ₹99 |
| South India | 60x–66x | ₹119 |
| East India | 70x–75x | ₹149 |
| Remote/Northeast | 78x–79x, 97x | ₹199 |

To customise zones, edit `DELIVERY_TIERS` in `js/core.js` and the `zones` object in `_pincodeZoneFallback()`.

### Option B: Google Maps Distance Matrix (Live KM-based pricing)
1. Go to https://console.cloud.google.com
2. Create a project → Enable **Distance Matrix API**
3. Create an API Key, restrict it to your domain
4. In `js/core.js`, set:
   ```js
   const GMAPS_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
   ```
5. Delivery charges will now be calculated live based on actual road distance from your warehouse pincode to the customer's pincode

### Option C: Shiprocket API (Real courier rates)
Shiprocket provides real-time rate cards from multiple couriers:
```
POST https://apiv2.shiprocket.in/v1/external/courier/serviceability/
Headers: Authorization: Bearer <token>
Body: { pickup_postcode, delivery_postcode, weight, cod }
```
To integrate, create a Netlify/Vercel serverless function (to keep your Shiprocket token server-side) and call it from `DeliveryEngine.getShipping()`.

### Free Shipping Logic
Currently: free shipping on orders ≥ ₹999 (set in `CONFIG.FREE_SHIP_ABOVE`).
To change, update in `js/core.js`:
```js
FREE_SHIP_ABOVE: 1499,  // Change threshold here
```

---

## File Summary (v2)

| File | Purpose |
|---|---|
| `js/core.js` | Fixed core: Cart, Security, DeliveryEngine, Supabase, Razorpay |
| `pages/checkout.html` | Live shipping calculation on pincode input |
| `pages/admin.html` | Full admin dashboard (login, orders, products, messages, analytics) |
| `supabase-schema.sql` | Updated schema with shipping_label, tracking, delivery_zones |
