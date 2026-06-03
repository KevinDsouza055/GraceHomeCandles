/* ============================================================
   GRACE HOME CANDLES — CORE JS v2.0
   Security-hardened | Delivery API | Production-ready
   ============================================================ */

'use strict';

/* ── SECURITY ─────────────────────────────────────────────── */
const Security = {
  sanitize(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  },
  sanitizeNum(val, min = 0, max = Infinity) {
    const n = parseFloat(val);
    if (isNaN(n)) return min;
    return Math.min(Math.max(n, min), max);
  },
  validateEmail(email) {
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(String(email).trim());
  },
  validatePhone(phone) {
    return /^[6-9]\d{9}$/.test(String(phone).replace(/[\s\-]/g, ''));
  },
  validatePincode(pin) {
    return /^[1-9][0-9]{5}$/.test(String(pin).trim());
  },
  _rateLimits: {},
  checkRateLimit(action, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    if (!this._rateLimits[action]) this._rateLimits[action] = [];
    this._rateLimits[action] = this._rateLimits[action].filter(t => now - t < windowMs);
    if (this._rateLimits[action].length >= maxAttempts) return false;
    this._rateLimits[action].push(now);
    return true;
  }
};

/* ── CONFIG ────────────────────────────────────────────────── */
const CONFIG = {
  SUPABASE_URL:  'https://igiehnunaapgxefshrhi.supabase.co',
  SUPABASE_KEY:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnaWVobnVuYWFwZ3hlZnNocmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzQ1MjQsImV4cCI6MjA5NjA1MDUyNH0.2Zla8WMuQDi0HAIurAhrEzBKNWjHCYwFsEGZTieRgYo',
  RAZORPAY_KEY:  'YOUR_RAZORPAY_KEY_ID',
  STORE_PINCODE: '400050',            // Your Mumbai warehouse pincode
  FREE_SHIP_ABOVE: 999,               // Free shipping threshold (₹)
  BASE_SHIPPING:   99,                // Base shipping charge (₹)
  // Delivery tiers by distance (km)
  DELIVERY_TIERS: [
    { maxKm: 50,   charge: 0,   label: 'Local Delivery' },
    { maxKm: 500,  charge: 99,  label: 'Standard Shipping' },
    { maxKm: 1500, charge: 149, label: 'Long Distance' },
    { maxKm: 4000, charge: 199, label: 'Pan-India Shipping' },
  ]
};

/* ── DELIVERY ENGINE ───────────────────────────────────────── */
const DeliveryEngine = {
  _cache: {},           // pincode → { charge, label, distance, city }
  _pendingResolvers: {},

  // Calculate shipping from pincode using Google Maps Distance Matrix API
  // Falls back gracefully to tiered flat rates if API unavailable
  async getShipping(destPincode, subtotal) {
    if (!Security.validatePincode(destPincode)) {
      return { charge: CONFIG.BASE_SHIPPING, label: 'Standard Shipping', error: false };
    }

    // Free shipping threshold
    if (subtotal >= CONFIG.FREE_SHIP_ABOVE) {
      return { charge: 0, label: 'Free Shipping', distance: null };
    }

    // Return cached result
    const cacheKey = destPincode;
    if (this._cache[cacheKey]) return this._cache[cacheKey];

    // Try Google Maps Distance Matrix (needs API key set below)
    const GMAPS_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Set this for live distance
    if (GMAPS_KEY && GMAPS_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
      try {
        const result = await this._fetchGoogleDistance(CONFIG.STORE_PINCODE, destPincode, GMAPS_KEY);
        if (result) {
          this._cache[cacheKey] = result;
          return result;
        }
      } catch (e) { /* fall through to pincode-based fallback */ }
    }

    // Fallback: Pincode-zone based pricing (no API needed)
    const result = this._pincodeZoneFallback(destPincode, subtotal);
    this._cache[cacheKey] = result;
    return result;
  },

  async _fetchGoogleDistance(originPin, destPin, apiKey) {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originPin},India&destinations=${destPin},India&units=metric&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const element = data?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') return null;
    const distKm = element.distance.value / 1000;
    return this._tierFromDistance(distKm);
  },

  _tierFromDistance(distKm) {
    for (const tier of CONFIG.DELIVERY_TIERS) {
      if (distKm <= tier.maxKm) {
        return { charge: tier.charge, label: tier.label, distance: Math.round(distKm) };
      }
    }
    const last = CONFIG.DELIVERY_TIERS[CONFIG.DELIVERY_TIERS.length - 1];
    return { charge: last.charge, label: last.label, distance: Math.round(distKm) };
  },

  // Pincode-zone system (no external API needed)
  // Indian pincode first digit = zone
  _pincodeZoneFallback(pincode, subtotal) {
    const firstTwo = parseInt(pincode.substring(0, 2));
    // Mumbai-centric zones (update for your warehouse location)
    const zones = {
      local:    [40, 41],                                    // Mumbai & Pune metro
      near:     [42, 43, 36, 44, 39],                       // Maharashtra, Gujarat
      mid:      [50, 51, 56, 57, 58, 59, 11, 12, 16, 17],  // Hyderabad, Delhi, Punjab
      far:      [60, 61, 62, 63, 64, 70, 71, 74, 75, 73],  // Chennai, Kolkata
    };
    if (zones.local.some(z => firstTwo === z))
      return { charge: 49,  label: 'Local Delivery (1–2 days)',    distance: null };
    if (zones.near.some(z => firstTwo === z))
      return { charge: 79,  label: 'Regional Shipping (2–3 days)', distance: null };
    if (zones.mid.some(z => firstTwo === z))
      return { charge: 99,  label: 'Standard Shipping (3–4 days)', distance: null };
    if (zones.far.some(z => firstTwo === z))
      return { charge: 149, label: 'Long Distance (4–5 days)',     distance: null };
    return { charge: 199, label: 'Pan-India Shipping (5–7 days)', distance: null };
  },

  // Get serviceability (for UI validation)
  async isServiceable(pincode) {
    if (!Security.validatePincode(pincode)) return false;
    // First 2 digits — all valid Indian pincodes (1xx–9xx) are serviceable
    const first = parseInt(pincode[0]);
    return first >= 1 && first <= 9;
  }
};

/* ── SUPABASE CLIENT ───────────────────────────────────────── */
const SupabaseClient = {
  get url() { return CONFIG.SUPABASE_URL; },
  get key() { return CONFIG.SUPABASE_KEY; },

  async request(endpoint, method = 'GET', body = null, extraHeaders = {}) {
    if (!this.url || this.url === 'YOUR_SUPABASE_URL') {
      console.warn('Supabase not configured — skipping DB call');
      return null;
    }
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        ...extraHeaders
      }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${this.url}/rest/v1/${endpoint}`, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.status === 204 ? null : res.json();
  },

  async getProducts() {
    return this.request('products?select=*&is_active=eq.true&order=sort_order.asc');
  },
  async getProduct(id) {
    const rows = await this.request(`products?id=eq.${encodeURIComponent(id)}&select=*`);
    return rows && rows[0];
  },
  async createOrder(data) {
    return this.request('orders', 'POST', data, { 'Prefer': 'return=representation' });
  },
  async createOrderItems(items) {
    return this.request('order_items', 'POST', items, { 'Prefer': 'return=representation' });
  },
  async updateOrderPayment(id, paymentId, status) {
    return this.request(`orders?id=eq.${encodeURIComponent(id)}`, 'PATCH', {
      payment_id: paymentId,
      payment_status: status,
      status: status === 'paid' ? 'confirmed' : 'payment_failed',
      updated_at: new Date().toISOString()
    });
  },
  async submitContact(data) {
    return this.request('contact_messages', 'POST', data);
  },
  async subscribeNewsletter(email) {
    return this.request('newsletter_subscribers', 'POST', {
      email, subscribed_at: new Date().toISOString()
    }, { 'Prefer': 'return=minimal' });
  }
};

/* ── CART ──────────────────────────────────────────────────── */
const Cart = {
  items: [],

  init() {
    try {
      const stored = sessionStorage.getItem('gh_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.items = parsed.filter(item =>
            item &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.price === 'number' &&
            typeof item.qty === 'number' &&
            item.qty > 0
          );
        }
      }
    } catch (e) { this.items = []; }
    this.updateUI();
  },

  save() {
    try { sessionStorage.setItem('gh_cart', JSON.stringify(this.items)); } catch (e) {}
  },

  add(product, qty = 1) {
    if (!product || !product.id || !product.name) return;
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 20);
    } else {
      this.items.push({
        id:            Security.sanitize(String(product.id)),
        name:          Security.sanitize(String(product.name)),
        notes:         Security.sanitize(String(product.notes || '')),
        price:         Security.sanitizeNum(product.price, 0),
        originalPrice: Security.sanitizeNum(product.originalPrice || product.price, 0),
        image:         Security.sanitize(String(product.image || '')),
        qty:           Security.sanitizeNum(qty, 1, 20)
      });
    }
    this.save();
    this.updateUI();
    Toast.show(`${Security.sanitize(product.name)} added to cart`, 'success');
    if (typeof CartDrawer !== 'undefined') CartDrawer.open();
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.updateUI();
    if (typeof CartDrawer !== 'undefined') CartDrawer.render();
  },

  updateQty(id, qty) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    const newQty = Security.sanitizeNum(qty, 1, 20);
    if (newQty < 1) { this.remove(id); return; }
    item.qty = newQty;
    this.save();
    this.updateUI();
    if (typeof CartDrawer !== 'undefined') CartDrawer.render();
  },

  total() {
    return this.items.reduce((s, i) => s + (i.price * i.qty), 0);
  },

  count() {
    return this.items.reduce((s, i) => s + i.qty, 0);
  },

  clear() {
    this.items = [];
    this.save();
    this.updateUI();
  },

  updateUI() {
    const count = this.count();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count > 0 ? count : '';
      el.classList.toggle('visible', count > 0);
    });
  }
};

/* ── CART DRAWER ───────────────────────────────────────────── */
const CartDrawer = {
  el: null, overlay: null,

  init() {
    this.el = document.getElementById('cart-drawer');
    this.overlay = document.getElementById('cart-overlay');
    if (!this.el) return;
    document.querySelectorAll('[data-cart-open]').forEach(b => b.addEventListener('click', () => this.open()));
    document.querySelectorAll('[data-cart-close]').forEach(b => b.addEventListener('click', () => this.close()));
    if (this.overlay) this.overlay.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
    this.render();
  },

  open() {
    if (!this.el) return;
    this.render();
    this.el.style.visibility = 'visible';
    this.el.style.opacity = '1';
    this.el.classList.add('open');
    if (this.overlay) this.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.el.setAttribute('aria-hidden', 'false');
  },

  close() {
    if (!this.el) return;
    this.el.classList.remove('open');
    if (this.overlay) this.overlay.classList.remove('open');
    document.body.style.overflow = '';
    this.el.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      if (!this.el.classList.contains('open')) {
        this.el.style.visibility = 'hidden';
        this.el.style.opacity = '0';
      }
    }, 450);
  },

  render() {
    const body = document.getElementById('cart-body');
    const footer = document.getElementById('cart-footer');
    if (!body) return;

    if (Cart.items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:52px;height:52px">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/>
            </svg>
          </div>
          <h3>Your cart is empty</h3>
          <p class="body-sm">Discover our luxury collection</p>
          <a href="pages/shop.html" class="btn btn-outline btn-sm" style="margin-top:16px"><span>Explore Collection</span></a>
        </div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'block';

    body.innerHTML = Cart.items.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${Security.sanitize(item.image)}" alt="${Security.sanitize(item.name)}" loading="lazy" onerror="this.style.background='var(--cashmere)'">
        </div>
        <div class="cart-item-info">
          <p class="cart-item-name">${Security.sanitize(item.name)}</p>
          <p class="cart-item-notes">${Security.sanitize(item.notes)}</p>
          <div class="cart-item-footer">
            <div class="quantity-control">
              <button onclick="Cart.updateQty('${Security.sanitize(item.id)}',${item.qty - 1})" aria-label="Decrease">−</button>
              <span>${item.qty}</span>
              <button onclick="Cart.updateQty('${Security.sanitize(item.id)}',${item.qty + 1})" aria-label="Increase">+</button>
            </div>
            <p class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</p>
          </div>
          <span class="cart-item-remove" role="button" tabindex="0"
            onclick="Cart.remove('${Security.sanitize(item.id)}')"
            onkeydown="if(event.key==='Enter')Cart.remove('${Security.sanitize(item.id)}')">Remove</span>
        </div>
      </div>`).join('');

    const subtotalEl = document.getElementById('cart-subtotal');
    if (subtotalEl) subtotalEl.textContent = `₹${Cart.total().toLocaleString('en-IN')}`;

    const noteEl = document.getElementById('cart-shipping-note');
    if (noteEl) {
      const remaining = CONFIG.FREE_SHIP_ABOVE - Cart.total();
      noteEl.textContent = remaining <= 0
        ? '✓ You qualify for free shipping!'
        : `Add ₹${remaining.toLocaleString('en-IN')} more for free shipping`;
      noteEl.style.color = remaining <= 0 ? 'var(--gold)' : 'var(--muted)';
    }
  }
};

/* ── TOAST ─────────────────────────────────────────────────── */
const Toast = {
  container: null,
  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 3500) {
    if (!this.container) this.init();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = Security.sanitize(String(message));
    toast.setAttribute('role', 'alert');
    this.container.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, duration);
  }
};

/* ── SCROLL REVEAL ─────────────────────────────────────────── */
const ScrollReveal = {
  observer: null,
  init() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
      return;
    }
    if (this.observer) this.observer.disconnect();
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          this.observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    document.querySelectorAll('.reveal:not(.revealed)').forEach(el => this.observer.observe(el));
  }
};

/* ── HEADER ────────────────────────────────────────────────── */
const Header = {
  init() {
    const el = document.getElementById('site-header');
    if (!el) return;
    const update = () => el.classList.toggle('scrolled', window.scrollY > 60);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }
};

/* ── MOBILE NAV ────────────────────────────────────────────── */
const MobileNav = {
  init() {
    const nav    = document.getElementById('mobile-nav');
    const toggle = document.getElementById('mobile-nav-toggle');
    if (!nav) return;
    const open  = () => { 
      const isOpen = nav.classList.toggle('open');
      toggle.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      toggle.setAttribute('aria-expanded', isOpen);
    };
    const shut  = () => { nav.classList.remove('open'); toggle.classList.remove('active'); document.body.style.overflow = ''; toggle.setAttribute('aria-expanded','false'); };
    if (toggle) toggle.addEventListener('click', open);
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', shut));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') shut(); });
  }
};

/* ── FAQ ───────────────────────────────────────────────────── */
const FAQ = {
  init() {
    document.querySelectorAll('.faq-question').forEach(q => {
      q.addEventListener('click', () => {
        const item   = q.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(i => {
          i.classList.remove('open');
          i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          q.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
};

/* ── PAGE LOADER ───────────────────────────────────────────── */
const Loader = {
  init() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    const hide = () => loader.classList.add('hidden');
    if (document.readyState === 'complete') {
      setTimeout(hide, 400);
    } else {
      window.addEventListener('load', () => setTimeout(hide, 400));
      // Fallback if load event already fired
      setTimeout(hide, 3000);
    }
  }
};

/* ── NEWSLETTER FORM ───────────────────────────────────────── */
const NewsletterForm = {
  init() {
    document.querySelectorAll('[data-newsletter-form]').forEach(form => {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!Security.checkRateLimit('newsletter', 3, 60000)) {
          Toast.show('Please wait before trying again.', 'error'); return;
        }
        const input = form.querySelector('input[type="email"]');
        const email = input ? input.value.trim() : '';
        if (!Security.validateEmail(email)) {
          Toast.show('Please enter a valid email address.', 'error'); return;
        }
        const btn = form.querySelector('button[type="submit"]');
        const orig = btn ? btn.textContent : 'Subscribe';
        if (btn) { btn.textContent = '...'; btn.disabled = true; }
        try {
          await SupabaseClient.subscribeNewsletter(email);
          Toast.show('Welcome to Grace Home! Thank you.', 'success');
          if (input) input.value = '';
        } catch {
          Toast.show('Something went wrong. Please try again.', 'error');
        } finally {
          if (btn) { btn.textContent = orig; btn.disabled = false; }
        }
      });
    });
  }
};

/* ── CHECKOUT ──────────────────────────────────────────────── */
const Checkout = {
  orderId: null,

  async initPayment(customerData) {
    if (!Security.checkRateLimit('payment', 3, 60000)) {
      Toast.show('Too many attempts. Please wait.', 'error'); return;
    }
    const subtotal = Cart.total();
    if (subtotal < 100) { Toast.show('Minimum order is ₹100.', 'error'); return; }

    // Get dynamic shipping
    const shippingInfo = await DeliveryEngine.getShipping(customerData.pincode, subtotal);
    const shipping = shippingInfo.charge;
    const total    = subtotal + shipping;

    // Save order to Supabase
    try {
      const rows = await SupabaseClient.createOrder({
        customer_name:    Security.sanitize(customerData.name),
        customer_email:   Security.sanitize(customerData.email),
        customer_phone:   Security.sanitize(customerData.phone),
        shipping_address: {
          address: Security.sanitize(customerData.address),
          city:    Security.sanitize(customerData.city),
          state:   Security.sanitize(customerData.state),
          pincode: Security.sanitize(customerData.pincode)
        },
        gift_message:   Security.sanitize(customerData.giftMessage || ''),
        order_notes:    Security.sanitize(customerData.notes || ''),
        shipping_label: shippingInfo.label,
        subtotal, shipping, total,
        payment_status: 'pending',
        status:         'pending',
        created_at:     new Date().toISOString()
      });
      this.orderId = rows?.[0]?.id;
      if (this.orderId) {
        await SupabaseClient.createOrderItems(
          Cart.items.map(i => ({
            order_id:     this.orderId,
            product_id:   i.id,
            product_name: i.name,
            price:        i.price,
            quantity:     i.qty,
            subtotal:     i.price * i.qty
          }))
        );
      }
    } catch (e) { console.warn('DB order save skipped:', e.message); }

    // Launch Razorpay
    if (typeof Razorpay === 'undefined') {
      Toast.show('Payment gateway failed to load. Check your connection.', 'error'); return;
    }
    const rzp = new Razorpay({
      key:         CONFIG.RAZORPAY_KEY,
      amount:      Math.round(total * 100),
      currency:    'INR',
      name:        'Grace Home Candles',
      description: `Order — ${Cart.items.map(i => i.name).join(', ')}`,
      handler: resp => this._onSuccess(resp),
      prefill: {
        name:    Security.sanitize(customerData.name),
        email:   Security.sanitize(customerData.email),
        contact: Security.sanitize(customerData.phone)
      },
      notes: {
        order_id:        this.orderId || '',
        shipping_method: shippingInfo.label,
        delivery_charge: shipping
      },
      theme:  { color: '#B8965A' },
      modal:  { ondismiss: () => Toast.show('Payment cancelled.') },
      retry:  { enabled: false }
    });
    rzp.on('payment.failed', resp => {
      Toast.show(`Payment failed: ${Security.sanitize(resp.error?.description || 'Unknown error')}`, 'error');
      if (this.orderId) SupabaseClient.updateOrderPayment(this.orderId, '', 'failed').catch(() => {});
    });
    rzp.open();
  },

  async _onSuccess(response) {
    if (this.orderId) {
      try { await SupabaseClient.updateOrderPayment(this.orderId, response.razorpay_payment_id, 'paid'); }
      catch (e) { console.warn('Payment update skipped:', e.message); }
    }
    Cart.clear();
    const params = new URLSearchParams({
      orderId:   this.orderId || ('ORD' + Date.now()),
      paymentId: response.razorpay_payment_id || ''
    });
    window.location.href = `order-success.html?${params}`;
  }
};

/* ── FORMAT HELPERS ────────────────────────────────────────── */
function formatINR(n) { return `₹${Number(n).toLocaleString('en-IN')}`; }

/* ── INIT ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  Loader.init();
  Toast.init();
  Cart.init();
  CartDrawer.init();
  ScrollReveal.init();
  Header.init();
  MobileNav.init();
  FAQ.init();
  NewsletterForm.init();
});
