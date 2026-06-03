// ============================================================
// GRACE HOME CANDLES — PRODUCT DATA
// ============================================================

'use strict';

const PRODUCTS = [
  {
    id: 'velvet-vanilla',
    name: 'Velvet Vanilla',
    notes: 'Tahitian Vanilla · Warm Musk · Amber',
    shortDesc: 'Enveloping and intimate, like cashmere on skin.',
    description: 'A luxurious depth of pure Tahitian vanilla harmonises with warm amber and whispered musk. Sensual, unhurried, and utterly indulgent — Velvet Vanilla transforms any room into a sanctuary of quiet luxury.',
    fragrance: { top: 'Madagascar Vanilla', mid: 'Warm Amber', base: 'White Musk & Sandalwood' },
    burnTime: '60–70 hours',
    size: '300g',
    wax: 'Coconut-Soy Blend',
    wick: 'Cotton Braided',
    originalPrice: 1499,
    salePrice: 1199,
    badges: ['Bestseller'],
    image: 'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=800&q=85',
    images: [
      'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=800&q=85',
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=85',
      'https://images.unsplash.com/photo-1588776814546-1ffbb172aa59?w=800&q=85'
    ],
    featured: true,
    bestseller: true
  },
  {
    id: 'midnight-oud',
    name: 'Midnight Oud',
    notes: 'Aged Oud · Dark Rose · Patchouli',
    shortDesc: 'The scent of velvet dusk and ancient wood.',
    description: 'Rare aged oud meets the shadow of dark rose petals, grounded in deep patchouli and cedarwood. Midnight Oud is a statement — bold yet meditative, evoking the quiet grandeur of an evening in an intimate Arabian parlour.',
    fragrance: { top: 'Saffron & Black Pepper', mid: 'Dark Rose & Oud', base: 'Patchouli & Cedarwood' },
    burnTime: '65–75 hours',
    size: '300g',
    wax: 'Coconut-Soy Blend',
    wick: 'Cotton Braided',
    originalPrice: 1799,
    salePrice: 1499,
    badges: ['Bestseller', 'New'],
    image: 'https://images.unsplash.com/photo-1608181831718-6b9c7e1bda9f?w=800&q=85',
    images: [
      'https://images.unsplash.com/photo-1608181831718-6b9c7e1bda9f?w=800&q=85',
      'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=800&q=85',
      'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=800&q=85'
    ],
    featured: true,
    bestseller: true
  },
  {
    id: 'cashmere-rose',
    name: 'Cashmere Rose',
    notes: 'Centifolia Rose · Cashmere Wood · Peony',
    shortDesc: 'Infinitely feminine. Quietly powerful.',
    description: 'A bouquet of centifolia rose at full bloom, softened by the warmth of cashmere wood and the tender blush of peony. Cashmere Rose is timeless femininity — graceful, warm, and utterly beautiful.',
    fragrance: { top: 'Pink Peony & Bergamot', mid: 'Centifolia Rose', base: 'Cashmere Wood & Vanilla' },
    burnTime: '60–70 hours',
    size: '300g',
    wax: 'Coconut-Soy Blend',
    wick: 'Cotton Braided',
    originalPrice: 1699,
    salePrice: 1349,
    badges: ['New'],
    image: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800&q=85',
    images: [
      'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800&q=85',
      'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=800&q=85',
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=85'
    ],
    featured: true,
    bestseller: false
  },
  {
    id: 'amber-sandalwood',
    name: 'Amber Sandalwood',
    notes: 'Mysore Sandalwood · Golden Amber · Vetiver',
    shortDesc: 'Sun-warmed skin and sacred wood.',
    description: 'The richness of authentic Mysore sandalwood is married with golden amber resin and a whisper of earthy vetiver. Amber Sandalwood is grounding, sophisticated, and deeply meditative — a candle for stillness.',
    fragrance: { top: 'Bergamot & Cardamom', mid: 'Mysore Sandalwood & Amber', base: 'Vetiver & Tonka Bean' },
    burnTime: '70–80 hours',
    size: '300g',
    wax: 'Coconut-Soy Blend',
    wick: 'Cotton Braided',
    originalPrice: 1699,
    salePrice: 1299,
    badges: ['Bestseller'],
    image: 'https://images.unsplash.com/photo-1543342384-1f1350e27861?w=800&q=85',
    images: [
      'https://images.unsplash.com/photo-1543342384-1f1350e27861?w=800&q=85',
      'https://images.unsplash.com/photo-1608181831718-6b9c7e1bda9f?w=800&q=85',
      'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800&q=85'
    ],
    featured: false,
    bestseller: true
  },
  {
    id: 'lavender-silk',
    name: 'Lavender Silk',
    notes: 'Provençal Lavender · White Tea · Musk',
    shortDesc: 'The art of doing nothing, beautifully.',
    description: 'Fields of Provençal lavender drift over delicate white tea and a barely-there silk musk. Lavender Silk is effortless calm — the olfactory equivalent of linen curtains in afternoon light. Sleep, breathe, be.',
    fragrance: { top: 'Lavender & Eucalyptus', mid: 'White Tea & Iris', base: 'Silk Musk & Cedarwood' },
    burnTime: '55–65 hours',
    size: '300g',
    wax: 'Coconut-Soy Blend',
    wick: 'Cotton Braided',
    originalPrice: 1499,
    salePrice: 1149,
    badges: ['New'],
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=85',
    images: [
      'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=85',
      'https://images.unsplash.com/photo-1543342384-1f1350e27861?w=800&q=85',
      'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=800&q=85'
    ],
    featured: false,
    bestseller: false
  }
];

// Render product card HTML
function renderProductCard(product, index = 0) {
  const savings = product.originalPrice - product.salePrice;
  const pct = Math.round((savings / product.originalPrice) * 100);
  const badges = product.badges.map(b =>
    `<span class="badge badge-${b.toLowerCase().replace(' ', '-')}">${b}</span>`
  ).join('');

  return `
    <article class="product-card reveal reveal-delay-${(index % 4) + 1}" data-product-id="${product.id}">
      <div class="product-image-wrap">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="product-badge">${badges}</div>
        <div class="product-quick-add">
          <button class="btn btn-primary btn-sm btn-full"
            onclick="event.stopPropagation(); Cart.add({id:'${product.id}',name:'${product.name}',notes:'${product.notes}',price:${product.salePrice},originalPrice:${product.originalPrice},image:'${product.image}'})">
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
      <div class="product-body">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-notes">${product.notes}</p>
        <div class="product-meta">
          <span class="price-sale">₹${product.salePrice.toLocaleString('en-IN')}</span>
          <span class="price-original">₹${product.originalPrice.toLocaleString('en-IN')}</span>
          <span class="price-savings">Save ${pct}%</span>
        </div>
      </div>
    </article>
  `;
}
