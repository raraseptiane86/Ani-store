/* Ani Store Plant V5 — multi-page storefront (static site + optional Supabase).
   One shared script powers every page; document.body.dataset.page selects the page controller. */
(function () {
'use strict';

/* ---------- Settings & demo data (replaced by Supabase when config.js is filled in) ---------- */
const SETTINGS = { whatsappNumber: '6283819428819', businessEmail: 'raafikyi@gmail.com', minimumOrder: 10 };
const IMAGES = {
  monstera: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=700&q=80',
  anthurium: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=700&q=80',
  philodendron: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=700&q=80',
  alocasia: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=700&q=80',
  scindapsus: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=700&q=80',
  hoya: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=80',
  other: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=700&q=80'
};
// Demo products and imagery are placeholders, not actual inventory. `featured` marks Most Wanted plants.
const DEMO_PRODUCTS = [
  { id: 'asp-01', name: 'Monstera Deliciosa', category: 'Monstera', price: 22, stock: 30, tag: 'POPULAR', featured: true, image: IMAGES.monstera, description: 'A striking tropical foliage plant with iconic split leaves. A beautiful addition to any botanical collection.' },
  { id: 'asp-02', name: 'Anthurium Crystallinum', category: 'Anthurium', price: 38, stock: 18, tag: 'COLLECTOR FAVORITE', featured: true, image: IMAGES.anthurium, description: 'Velvety, heart-shaped leaves and luminous veins make this a sought-after foliage plant.' },
  { id: 'asp-03', name: 'Philodendron Brasil', category: 'Philodendron', price: 16, stock: 42, tag: '', image: IMAGES.philodendron, description: 'An easy-to-love climbing philodendron with beautifully variegated green foliage.' },
  { id: 'asp-04', name: 'Alocasia Frydek', category: 'Alocasia', price: 29, stock: 12, tag: 'NEW', featured: true, image: IMAGES.alocasia, description: 'Distinctive arrow-shaped leaves with contrasting pale veins.' },
  { id: 'asp-05', name: 'Scindapsus Pictus', category: 'Scindapsus', price: 18, stock: 36, tag: '', image: IMAGES.scindapsus, description: 'Soft, silver-patterned leaves and an elegant trailing growth habit.' },
  { id: 'asp-06', name: 'Hoya Carnosa', category: 'Hoya', price: 20, stock: 24, tag: '', image: IMAGES.hoya, description: 'Waxy foliage and an enduring collector appeal.' },
  { id: 'asp-07', name: 'Monstera Adansonii', category: 'Monstera', price: 25, stock: 22, tag: 'NEW', image: IMAGES.monstera, description: 'A tropical climber celebrated for its naturally perforated leaves.' },
  { id: 'asp-08', name: 'Anthurium Clarinervium', category: 'Anthurium', price: 45, stock: 15, tag: 'RARE FIND', featured: true, image: IMAGES.anthurium, description: 'An elegant foliage specimen with pronounced silvery venation.' },
  { id: 'asp-09', name: 'Philodendron Gloriosum', category: 'Philodendron', price: 34, stock: 17, tag: '', image: IMAGES.philodendron, description: 'A crawling philodendron with large, velvety heart-shaped foliage.' },
  { id: 'asp-10', name: 'Alocasia Cuprea', category: 'Alocasia', price: 32, stock: 19, tag: '', image: IMAGES.alocasia, description: 'A dramatic tropical plant with richly textured metallic foliage.' },
  { id: 'asp-11', name: 'Scindapsus Treubii', category: 'Scindapsus', price: 26, stock: 20, tag: '', image: IMAGES.scindapsus, description: 'A beautiful climbing plant with a refined leaf shape and finish.' },
  { id: 'asp-12', name: 'Hoya Pubicalyx', category: 'Hoya', price: 24, stock: 25, tag: 'NEW', image: IMAGES.hoya, description: 'An attractive Hoya with elongated leaves, well suited to collectors.' }
];
const DEMO_CATEGORY_DESC = {
  Monstera: 'Iconic split-leaf and fenestrated climbers.',
  Anthurium: 'Velvety, richly veined foliage for collectors.',
  Philodendron: 'Climbing and crawling classics, from easy to rare.',
  Alocasia: 'Sculptural arrow-shaped leaves with bold veining.',
  Scindapsus: 'Silver-patterned trailing and climbing foliage.',
  Hoya: 'Waxy leaves and long-lived collector favorites.'
};
const DEFAULT_SHIPPING = [
  { min: 10, max: 45, fee: 130, method: 'DHL Express' },
  { min: 46, max: 95, fee: 180, method: 'DHL Express' },
  { min: 96, max: 200, fee: 200, method: 'Air Cargo' },
  { min: 201, max: 350, fee: 300, method: 'Air Cargo' },
  { min: 351, max: 500, fee: 350, method: 'Air Cargo' }
];

const usingDb = !!window.aspDb;
let PRODUCTS = usingDb ? [] : DEMO_PRODUCTS.slice();   // single source of product data for every page
let SHIPPING = DEFAULT_SHIPPING.slice();
let CATEGORY_ORDER = [];
let CATEGORY_DESC = usingDb ? {} : Object.assign({}, DEMO_CATEGORY_DESC);
let catalogError = false;

/* ---------- Small helpers ---------- */
const $ = id => document.getElementById(id);
const usd = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slugify = s => String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const round2 = n => Math.round(n * 100) / 100;
const page = () => document.body.dataset.page;

/* ---------- Cart: one source of truth, persisted in localStorage ---------- */
const CART_KEY = 'asp_cart_v3';
function readCart() {
  const clean = {};
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '{}') || {};
    for (const id of Object.keys(raw)) { const n = Math.floor(Number(raw[id])); if (n > 0) clean[id] = n; }
  } catch (e) { /* storage blocked or corrupt: start empty */ }
  return clean;
}
let cart = readCart();
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ }
  updateBag();
  if (pageRender) pageRender();
}
const totalUnits = c => Object.values(c).reduce((a, b) => a + b, 0);     // total PLANTS, not product types
const cartLines = (c = cart, products = PRODUCTS) =>
  products.filter(p => c[p.id]).map(p => ({ product: p, qty: c[p.id], total: round2(p.price * c[p.id]) }));
const subtotalOf = lines => round2(lines.reduce((a, l) => a + l.total, 0));

function shippingFor(units, tiers = SHIPPING, min = SETTINGS.minimumOrder) {
  if (!(units >= min)) return { status: 'below' };
  const t = tiers.find(r => units >= r.min && units <= r.max);
  return t ? { status: 'ok', method: t.method, fee: t.fee } : { status: 'custom' };   // above the published tiers → manual quote
}
function cartStatus() {
  const lines = cartLines();
  const units = totalUnits(Object.fromEntries(lines.map(l => [l.product.id, l.qty])));
  const subtotal = subtotalOf(lines);
  const ship = shippingFor(units);
  const dataOk = lines.every(l => Number.isFinite(l.product.price) && l.product.price >= 0 && l.qty <= l.product.stock);
  const canCheckout = lines.length > 0 && dataOk && units >= SETTINGS.minimumOrder;
  const total = ship.status === 'ok' ? round2(subtotal + ship.fee) : null;
  return { lines, units, subtotal, ship, dataOk, canCheckout, total };
}
function addToCart(id, n = 1) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p || p.stock <= 0) return false;
  const next = Math.min(p.stock, (cart[id] || 0) + n);
  if (next === (cart[id] || 0)) { toast(`Only ${p.stock} available for ${p.name}.`); return false; }
  cart[id] = next; saveCart(); return true;
}
function setQty(id, n) {
  const p = PRODUCTS.find(x => x.id === id);
  n = Math.floor(Number(n));
  if (!p || !(n > 0)) { delete cart[id]; } else { cart[id] = Math.min(n, p.stock); }
  saveCart();
}
function removeFromCart(id) { delete cart[id]; saveCart(); }
// Drops items that no longer exist / are sold out and clamps to stock. Returns removed product ids.
function reconcileCart() {
  const removed = [];
  for (const id of Object.keys(cart)) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p || p.stock <= 0) { delete cart[id]; removed.push(id); } else if (cart[id] > p.stock) cart[id] = p.stock;
  }
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ }
  return removed;
}

/* ---------- Catalog helpers (shared by Home, category pages and search) ---------- */
function getCategories() {
  const names = [...new Set(PRODUCTS.map(p => p.category))];   // only categories that really have products
  names.sort((a, b) => { const ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib); });
  return names.map(n => ({
    name: n, slug: slugify(n), count: PRODUCTS.filter(p => p.category === n).length,
    description: CATEGORY_DESC[n] || '', image: (PRODUCTS.find(p => p.category === n) || {}).image || IMAGES.other
  }));
}
function filterProducts(list, query) {
  const tokens = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return list.slice();
  return list.filter(p => { const hay = `${p.name} ${p.category} ${p.tag} ${p.description}`.toLowerCase(); return tokens.every(t => hay.includes(t)); });
}
const newestAvailable = list => list.length > 0 && list.every(p => Number.isFinite(p.created));
function sortProducts(list, mode) {
  const out = list.slice();
  const byName = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
  switch (mode) {
    case 'name-asc': out.sort(byName); break;
    case 'name-desc': out.sort((a, b) => byName(b, a)); break;
    case 'price-asc': out.sort((a, b) => a.price - b.price || byName(a, b)); break;
    case 'price-desc': out.sort((a, b) => b.price - a.price || byName(a, b)); break;
    case 'newest': if (newestAvailable(out)) out.sort((a, b) => b.created - a.created); break;
    default: out.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));   // Featured: flag from product data, stable otherwise
  }
  return out;
}
function sortOptionsHTML(selected) {
  const opts = [['featured', 'Featured'], ['name-asc', 'Name: A to Z'], ['name-desc', 'Name: Z to A'], ['price-asc', 'Price: Low to High'], ['price-desc', 'Price: High to Low']];
  if (newestAvailable(PRODUCTS)) opts.push(['newest', 'Newest Arrivals']);   // only when real dates exist
  return opts.map(([v, l]) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${l}</option>`).join('');
}

/* ---------- Order, validation & message builders (pure; also used by tests) ---------- */
const COUNTRIES = ('Afghanistan|Albania|Algeria|Andorra|Angola|Antigua and Barbuda|Argentina|Armenia|Australia|Austria|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belgium|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burundi|Cambodia|Cameroon|Canada|Cape Verde|Central African Republic|Chad|Chile|China|Colombia|Comoros|Congo (Democratic Republic)|Congo (Republic)|Costa Rica|Côte d’Ivoire|Croatia|Cuba|Cyprus|Czech Republic|Denmark|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Estonia|Eswatini|Ethiopia|Fiji|Finland|France|Gabon|Gambia|Georgia|Germany|Ghana|Greece|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hong Kong|Hungary|Iceland|India|Indonesia|Iran|Iraq|Ireland|Israel|Italy|Jamaica|Japan|Jordan|Kazakhstan|Kenya|Kiribati|Kosovo|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Liechtenstein|Lithuania|Luxembourg|Macau|Madagascar|Malawi|Malaysia|Maldives|Mali|Malta|Marshall Islands|Mauritania|Mauritius|Mexico|Micronesia|Moldova|Monaco|Mongolia|Montenegro|Morocco|Mozambique|Myanmar|Namibia|Nauru|Nepal|Netherlands|New Zealand|Nicaragua|Niger|Nigeria|North Korea|North Macedonia|Norway|Oman|Pakistan|Palau|Palestine|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Portugal|Puerto Rico|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|San Marino|Sao Tome and Principe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Singapore|Slovakia|Slovenia|Solomon Islands|Somalia|South Africa|South Korea|South Sudan|Spain|Sri Lanka|Sudan|Suriname|Sweden|Switzerland|Syria|Taiwan|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Turkey|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|United Kingdom|United States|Uruguay|Uzbekistan|Vanuatu|Vatican City|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe').split('|');
// Countries without a postal-code system / without states or provinces. Everywhere else both are requested.
const NO_POSTAL = new Set('Angola|Antigua and Barbuda|Bahamas|Belize|Benin|Botswana|Burkina Faso|Burundi|Cameroon|Central African Republic|Comoros|Djibouti|Dominica|Equatorial Guinea|Eritrea|Fiji|Gambia|Grenada|Guyana|Hong Kong|Kiribati|Macau|Malawi|Mali|Mauritania|Nauru|North Korea|Qatar|Rwanda|Saint Kitts and Nevis|Sao Tome and Principe|Seychelles|Sierra Leone|Solomon Islands|Suriname|Syria|Timor-Leste|Togo|Tonga|Tuvalu|Uganda|United Arab Emirates|Vanuatu|Yemen|Zimbabwe'.split('|'));
const NO_STATE = new Set('Singapore|Hong Kong|Macau|Monaco|Vatican City|Luxembourg|Malta|Liechtenstein|San Marino|Qatar|Bahrain'.split('|'));
const matchCountry = v => COUNTRIES.find(c => c.toLowerCase() === String(v || '').trim().toLowerCase()) || '';
const stateRequired = country => !!country && !NO_STATE.has(country);
const postalRequired = country => !!country && !NO_POSTAL.has(country);

function validateCheckout(v) {
  const e = {};
  const country = matchCountry(v.country);
  if (v.fullName.trim().length < 2) e.fullName = 'Please enter your full name.';
  if (!v.email.trim()) e.email = 'Please enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Please enter a valid email address, e.g. name@example.com.';
  if (v.whatsapp.trim()) {
    const digits = v.whatsapp.replace(/\D/g, '');
    if (!/^[+\d\s().-]+$/.test(v.whatsapp.trim()) || digits.length < 6 || digits.length > 15) e.whatsapp = 'Enter a valid number with country code, e.g. +1 555 123 4567.';
  }
  if (!v.country.trim()) e.country = 'Please choose your destination country.';
  else if (!country) e.country = 'Please choose your country from the list.';
  if (v.street.trim().length < 3) e.street = 'Please enter your street address.';
  if (!v.city.trim()) e.city = 'Please enter your city.';
  if (stateRequired(country) && !v.state.trim()) e.state = 'Please enter your state, province or region.';
  if (postalRequired(country) && !v.postal.trim()) e.postal = 'Please enter your postal / ZIP code.';
  return { errors: e, country };
}
function buildOrder(v, status) {
  const country = matchCountry(v.country) || v.country.trim();
  const { lines, units, subtotal, ship, total } = status;
  const L = [];
  L.push('Hello Ani Store Plant! 🌿', '', 'I would like to request an international plant order.', '');
  L.push('CUSTOMER', `Name: ${v.fullName.trim()}`, `Email: ${v.email.trim()}`);
  if (v.whatsapp.trim()) L.push(`WhatsApp: ${v.whatsapp.trim()}`);
  L.push('', 'DELIVERY ADDRESS', v.street.trim(), [v.city.trim(), v.state.trim(), v.postal.trim()].filter(Boolean).join(', '), country, '');
  L.push('ORDER');
  lines.forEach((l, i) => L.push(`${i + 1}. ${l.product.name} — ${l.qty} × ${usd(l.product.price)} = ${usd(l.total)}`));
  L.push('', `Total plants: ${units} pcs`, `Plant subtotal: ${usd(subtotal)}`);
  if (ship.status === 'ok') L.push(`Shipping service: ${ship.method}`, `Shipping fee: ${usd(ship.fee)}`, `Estimated total: ${usd(total)}`);
  else L.push('Shipping service: Custom quote required', 'Shipping fee: To be confirmed', 'Estimated total: To be confirmed (plant subtotal + custom shipping quote)');
  if (v.notes.trim()) L.push('', 'NOTES', v.notes.trim());
  L.push('', 'This is an order request, not a confirmed or paid order. Please confirm plant availability, shipping eligibility to my country, import requirements, the final price and payment details. Import duties and taxes are not included. Thank you!');
  return { subject: 'Ani Store Plant — New Order Inquiry', text: L.join('\n') };
}
const whatsappUrl = (digits, text) => `https://wa.me/${String(digits).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
const mailtoUrl = (email, subject, text) => `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text.replace(/\n/g, '\r\n'))}`;

window.ASP = { slugify, shippingFor, filterProducts, sortProducts, validateCheckout, buildOrder, whatsappUrl, mailtoUrl, totalUnits,
  get state() { return { PRODUCTS, SHIPPING, SETTINGS, cart }; }, _test: { setProducts: p => { PRODUCTS = p; }, setCart: c => { cart = c; } } };

/* ---------- Shared layout: header, side menu, footer, overlay, modals ---------- */
const BRAND = '<span class="brand-mark">✳</span><span>ANI <em>STORE</em> PLANT<small>BOTANICAL EXPORTS · INDONESIA</small></span>';
const NAV = [['/', 'Home', 'home'], ['/shipping', 'Worldwide Shipping', 'shipping'], ['/story', 'Our Story', 'story']];
const current = id => (page() === id ? ' aria-current="page"' : '');

function mountLayout() {
  const header = $('siteHeader');
  header.outerHTML = `<div class="announcement">WORLDWIDE PLANT EXPORT <span>·</span> PHYTOSANITARY INCLUDED <span>·</span> MINIMUM 10 PLANTS</div>
<header class="site-header"><div class="header-inner"><button class="icon-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false" aria-controls="sideMenu">☰</button><a class="brand" href="/">${BRAND}</a><div class="header-actions"><button class="icon-btn" id="searchBtn" aria-label="Search">⌕</button><a class="bag-btn" id="cartBtn" href="/cart" aria-label="Open my collection">Bag <span id="bagCount">0</span></a></div></div></header>`;
  $('siteFooter').outerHTML = `<footer><div class="container footer-grid"><div><a class="brand footer-brand" href="/">${BRAND}</a><p>Tropical plants, thoughtfully selected.<br>Indonesia → Worldwide.</p></div><div><h4>Explore</h4><a href="/categories">Shop by category</a><a href="/shipping">Shipping rates</a><a href="/cart">My Collection</a></div><div><h4>Information</h4><a href="/shipping">How to order</a><a href="/shipping#import">Export &amp; phytosanitary</a><a href="/story">About us</a></div><div><h4>Get in touch</h4><p>Questions about an order?</p><a href="#" id="footerWa">Chat on WhatsApp ↗</a></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Ani Store Plant. All rights reserved.</span><span>Made for plant collectors worldwide.</span></div></footer>
<div class="overlay hidden" id="overlay"></div>
<aside class="side-menu" id="sideMenu" aria-hidden="true" aria-label="Main menu"><div class="side-top"><span class="eyebrow">MENU</span><button class="close-btn" id="closeMenu" aria-label="Close menu">×</button></div><nav class="side-nav">
<a href="/"${current('home')}>Home</a>
<button class="side-toggle" id="catToggle" aria-expanded="false" aria-controls="catSub">Shop by Category <span class="chev">▾</span></button><div class="side-sub" id="catSub"></div>
<a href="/shipping"${current('shipping')}>Worldwide Shipping</a><a href="/story"${current('story')}>Our Story</a>
<a href="/cart"${current('cart')}>My Collection / Cart <span class="side-count" id="menuCount">0</span></a></nav></aside>
<div class="modal hidden" id="productModal" role="dialog" aria-modal="true" aria-label="Product details"><button class="close-btn modal-close" id="closeModal" aria-label="Close">×</button><div id="modalBody"></div></div>
<form class="search-modal hidden" id="searchModal" role="search"><button class="close-btn" id="closeSearch" type="button" aria-label="Close">×</button><label><span>SEARCH THE COLLECTION</span><input id="searchOverlayInput" type="search" placeholder="What are you looking for?"></label><p>Try “Monstera”, “Anthurium”, or “Variegated”. Press Enter to search.</p></form>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`;

  $('menuBtn').addEventListener('click', openMenu);
  $('closeMenu').addEventListener('click', closeMenu);
  $('catToggle').addEventListener('click', () => { const open = $('catSub').classList.toggle('open'); $('catToggle').setAttribute('aria-expanded', open); });
  $('sideMenu').addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  $('overlay').addEventListener('click', closeAll);
  $('closeModal').addEventListener('click', closeModal);
  $('searchBtn').addEventListener('click', openSearch);
  $('closeSearch').addEventListener('click', closeSearch);
  $('searchModal').addEventListener('submit', e => { e.preventDefault(); const q = $('searchOverlayInput').value.trim(); location.href = '/categories' + (q ? '?q=' + encodeURIComponent(q) : ''); });
  $('footerWa').addEventListener('click', e => {
    e.preventDefault();
    if (!SETTINGS.whatsappNumber) { toast('WhatsApp number has not been configured yet.'); return; }
    openLink(whatsappUrl(SETTINGS.whatsappNumber, 'Hello Ani Store Plant! I have a question about your plants.'));
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
  $('productModal').addEventListener('click', e => { const b = e.target.closest('#modalAdd'); if (b) { if (addToCart(b.dataset.id)) toast('Added to your collection', '/cart', 'View collection'); } });
}
function openLink(url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; document.body.appendChild(a); a.click(); a.remove(); }
function syncOverlay() {
  const open = $('sideMenu').classList.contains('open') || !$('productModal').classList.contains('hidden') || !$('searchModal').classList.contains('hidden');
  $('overlay').classList.toggle('hidden', !open);
  document.body.style.overflow = open ? 'hidden' : '';
}
function openMenu() { closeModal(); closeSearch(); $('sideMenu').classList.add('open'); $('sideMenu').setAttribute('aria-hidden', 'false'); $('menuBtn').setAttribute('aria-expanded', 'true'); syncOverlay(); }
function closeMenu() { $('sideMenu').classList.remove('open'); $('sideMenu').setAttribute('aria-hidden', 'true'); $('menuBtn').setAttribute('aria-expanded', 'false'); syncOverlay(); }
function closeModal() { $('productModal').classList.add('hidden'); syncOverlay(); }
function openSearch() { closeMenu(); closeModal(); $('searchModal').classList.remove('hidden'); syncOverlay(); setTimeout(() => $('searchOverlayInput').focus(), 50); }
function closeSearch() { $('searchModal').classList.add('hidden'); syncOverlay(); }
function closeAll() { closeMenu(); closeModal(); closeSearch(); }
let toastTimer;
function toast(msg, href, linkText) {
  const t = $('toast');
  t.innerHTML = `<span>${safe(msg)}</span>${href ? `<a href="${href}">${safe(linkText)}</a>` : ''}`;
  t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}
function updateBag() {
  const n = totalUnits(Object.fromEntries(cartLines().map(l => [l.product.id, l.qty]))) || (PRODUCTS.length ? 0 : totalUnits(cart));
  if ($('bagCount')) $('bagCount').textContent = n;
  if ($('menuCount')) $('menuCount').textContent = n;
}
function renderMenuCategories() {
  const cats = getCategories();
  $('catSub').innerHTML = cats.length
    ? cats.map(c => `<a href="/categories/${c.slug}">${safe(c.name)} <small>${c.count}</small></a>`).join('')
    : `<div class="side-empty">${catalogError ? 'Categories are temporarily unavailable.' : 'Loading…'}</div>`;
}

/* ---------- Product cards & detail modal ---------- */
function productCard(p) {
  return `<article class="product-card"><div class="product-img" data-detail="${safe(p.id)}" role="button" tabindex="0" aria-label="View ${safe(p.name)}"><img src="${safe(p.image)}" alt="Illustrative foliage photo for ${safe(p.name)}" loading="lazy">${p.tag ? `<span class="tag">${safe(p.tag)}</span>` : ''}</div><div class="product-meta"><small>${safe(p.category)}</small><div class="product-name" data-detail="${safe(p.id)}" role="button" tabindex="0">${safe(p.name)}</div><div class="product-price">${usd(p.price)}</div><button class="add-btn" data-add="${safe(p.id)}" ${p.stock === 0 ? 'disabled' : ''}>${p.stock === 0 ? 'SOLD OUT' : '+ ADD TO COLLECTION'}</button></div></article>`;
}
function bindGrid(el) {
  if (!el || el.dataset.bound) return; el.dataset.bound = '1';
  el.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (add) { if (addToCart(add.dataset.add)) toast('Added to your collection', '/cart', 'View collection'); return; }
    const d = e.target.closest('[data-detail]'); if (d) openProduct(d.dataset.detail);
  });
  el.addEventListener('keydown', e => { const d = e.target.closest('[data-detail]'); if (d && e.key === 'Enter') openProduct(d.dataset.detail); });
}
function openProduct(id) {
  const p = PRODUCTS.find(x => x.id === id); if (!p) return;
  closeMenu(); closeSearch();
  $('modalBody').innerHTML = `<div class="modal-body-grid"><img src="${safe(p.image)}" alt="Illustrative photo for ${safe(p.name)}"><div class="modal-info"><span class="eyebrow">${safe(p.category)} COLLECTION</span><h3>${safe(p.name)}</h3><div class="modal-price">${usd(p.price)}</div><p>${safe(p.description)}</p><p>Availability: ${p.stock > 0 ? `${p.stock} pieces` : 'Sold out'}</p><p>Mix and match any plants. Minimum ${SETTINGS.minimumOrder} pieces per international order.</p><button class="button button-dark" id="modalAdd" data-id="${safe(p.id)}" ${p.stock === 0 ? 'disabled' : ''}>Add to Collection ↗</button><p class="fineprint">Plant photos, size and condition should be confirmed before payment.</p></div></div>`;
  $('productModal').classList.remove('hidden'); syncOverlay();
}
function categoryCards() {
  const cats = getCategories();
  if (!cats.length) return `<p class="empty-state">${catalogError ? 'The catalog is temporarily unavailable. Please try again later.' : 'Loading…'}</p>`;
  return cats.map(c => `<a class="category-card" href="/categories/${c.slug}"><img src="${safe(c.image)}" alt="${safe(c.name)} collection" loading="lazy"><span class="category-title">${safe(c.name)}<small>EXPLORE COLLECTION ↗</small></span></a>`).join('');
}
const loadingOrError = () => `<p class="empty-state">${catalogError ? 'The catalog is temporarily unavailable. Please try again later.' : 'Loading plants…'}</p>`;

/* ---------- Page controllers ---------- */
let pageRender = null;

function pageHome() {
  pageRender = null;
  const grid = $('featuredGrid'); bindGrid(grid);
  let list = PRODUCTS.filter(p => p.featured);
  if (!list.length) list = PRODUCTS.slice(0, 8);   // fallback until featured plants are flagged in admin
  grid.innerHTML = PRODUCTS.length ? sortProducts(list, 'featured').slice(0, 8).map(productCard).join('') : loadingOrError();
  $('categoryGrid').innerHTML = categoryCards();
}

function pageCategory() {
  const m = location.pathname.match(/^\/categories\/([^/]+)\/?$/);
  const slug = (m ? decodeURIComponent(m[1]) : new URLSearchParams(location.search).get('c') || '').toLowerCase();
  const params = new URLSearchParams(location.search);
  const state = { q: params.get('q') || '', sort: params.get('sort') || 'featured' };
  const grid = $('productGrid'); bindGrid(grid);
  const cats = getCategories();
  const cat = slug ? cats.find(c => c.slug === slug) : null;
  const ready = PRODUCTS.length > 0;

  $('catChips').innerHTML = (slug ? '<a class="chip" href="/categories">All collections</a>' : '<span class="chip active">All collections</span>') +
    cats.map(c => `<a class="chip ${c.slug === slug ? 'active' : ''}" href="/categories/${c.slug}">${safe(c.name)}</a>`).join('');

  const notFound = ready && slug && !cat;
  $('catNotFound').classList.toggle('hidden', !notFound);
  $('catBody').classList.toggle('hidden', notFound);
  if (cat) {
    document.title = `${cat.name} — Ani Store Plant`;
    $('catEyebrow').textContent = 'PLANT COLLECTION';
    $('catTitle').innerHTML = safe(cat.name);
    $('catDesc').textContent = cat.description; $('catDesc').classList.toggle('hidden', !cat.description);
    $('crumbCurrent').textContent = cat.name; setCrumb(true);
  } else if (!slug) {
    document.title = 'Shop by Category — Ani Store Plant';
    $('catEyebrow').textContent = 'FIND YOUR FAVORITE';
    $('catTitle').innerHTML = 'Shop by <i>category.</i>';
    $('catDesc').textContent = 'Choose a collection, or search for a plant by name.'; $('catDesc').classList.remove('hidden');
    setCrumb(false);
  } else { $('catTitle').textContent = ready ? 'Collection not found' : 'Loading…'; $('catDesc').classList.add('hidden'); setCrumb(false); }

  if (!$('sortSelect').dataset.built || $('sortSelect').dataset.built !== String(newestAvailable(PRODUCTS))) {
    $('sortSelect').innerHTML = sortOptionsHTML(state.sort); $('sortSelect').dataset.built = String(newestAvailable(PRODUCTS));
  }
  if (!Array.from($('sortSelect').options).some(o => o.value === state.sort)) state.sort = 'featured';
  $('sortSelect').value = state.sort; $('catSearch').value = state.q;

  const overview = !slug && !state.q.trim();
  $('categoryGrid').classList.toggle('hidden', !overview);
  $('categoryGrid').innerHTML = overview ? categoryCards() : '';
  $('productGrid').classList.toggle('hidden', overview);
  $('sortWrap').classList.toggle('hidden', overview);
  $('resultCount').textContent = '';
  $('emptyState').classList.add('hidden');
  if (overview || notFound) return;
  if (!ready) { grid.innerHTML = loadingOrError(); return; }
  const base = cat ? PRODUCTS.filter(p => p.category === cat.name) : PRODUCTS;
  const list = sortProducts(filterProducts(base, state.q), state.sort);
  $('resultCount').textContent = `${list.length} plant${list.length === 1 ? '' : 's'}`;
  $('emptyState').classList.toggle('hidden', list.length !== 0);
  grid.innerHTML = list.map(productCard).join('');
}
function setCrumb(show) { $('crumbSep').classList.toggle('hidden', !show); $('crumbCurrent').classList.toggle('hidden', !show); }
function bindCategoryControls() {
  const update = () => {
    const u = new URL(location.href);
    const q = $('catSearch').value, s = $('sortSelect').value;
    q ? u.searchParams.set('q', q) : u.searchParams.delete('q');
    s !== 'featured' ? u.searchParams.set('sort', s) : u.searchParams.delete('sort');
    history.replaceState(null, '', u);
    pageCategory();
  };
  $('catSearch').addEventListener('input', update);
  $('sortSelect').addEventListener('change', update);
  $('catSearchForm').addEventListener('submit', e => e.preventDefault());
}

function moqInfo(units) {
  const min = SETTINGS.minimumOrder;
  return {
    text: units < min ? `Add ${min - units} more plant${min - units === 1 ? '' : 's'} to checkout` : 'Minimum order reached ✓',
    pct: Math.min(units / min * 100, 100), fraction: `${units} / ${min}`
  };
}
let removedNotice = '';
function pageCart() {
  pageRender = pageCart;
  const s = cartStatus(), moq = moqInfo(s.units);
  $('cartNotice').classList.toggle('hidden', !removedNotice); $('cartNotice').textContent = removedNotice;
  $('cartLines').innerHTML = !PRODUCTS.length ? loadingOrError() : s.lines.length ? s.lines.map(l => {
    const p = l.product;
    return `<div class="cart-item" data-id="${safe(p.id)}"><a href="/categories/${slugify(p.category)}"><img src="${safe(p.image)}" alt="${safe(p.name)}"></a><div><small>${safe(p.category)}</small><strong>${safe(p.name)}</strong><p>${usd(p.price)} each</p><div class="quantity"><button data-dec="${safe(p.id)}" aria-label="Decrease ${safe(p.name)}">−</button><input class="qty-input" type="number" inputmode="numeric" min="1" max="${p.stock}" value="${l.qty}" data-qty="${safe(p.id)}" aria-label="Quantity of ${safe(p.name)}"><button data-inc="${safe(p.id)}" aria-label="Increase ${safe(p.name)}" ${l.qty >= p.stock ? 'disabled' : ''}>+</button></div></div><div class="cart-side"><strong>${usd(l.total)}</strong><button class="remove-btn" data-remove="${safe(p.id)}" aria-label="Remove ${safe(p.name)}">Remove</button></div></div>`;
  }).join('') : '<div class="cart-empty">Your collection is waiting.<br>Explore the plants and add your favorites.</div>';
  $('moqText').textContent = s.units > 500 && s.ship.status === 'custom' ? 'Custom shipping quote required' : moq.text;
  $('moqFraction').textContent = moq.fraction; $('moqProgress').style.width = moq.pct + '%';
  $('cartUnits').textContent = s.units; $('subtotal').textContent = usd(s.subtotal);
  const btn = $('proceedBtn'); btn.disabled = !s.canCheckout;
  const hint = $('cartHint');
  hint.textContent = !s.lines.length ? 'Your collection is empty.' : s.units < SETTINGS.minimumOrder ? `Minimum order is ${SETTINGS.minimumOrder} plants in total (any mix). You have ${s.units}.`
    : !s.dataOk ? 'Some items need attention — please review quantities.' : s.ship.status === 'custom' ? 'Orders above the published shipping tiers are quoted manually; you can continue to checkout.' : 'Shipping is calculated at checkout from your total number of plants.';
}
function bindCartPage() {
  $('cartLines').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.inc) setQty(t.dataset.inc, (cart[t.dataset.inc] || 0) + 1);
    else if (t.dataset.dec) setQty(t.dataset.dec, (cart[t.dataset.dec] || 0) - 1);
    else if (t.dataset.remove) removeFromCart(t.dataset.remove);
  });
  $('cartLines').addEventListener('change', e => { const i = e.target.closest('[data-qty]'); if (i) setQty(i.dataset.qty, i.value); });
  $('proceedBtn').addEventListener('click', () => { if (cartStatus().canCheckout) location.href = '/checkout'; });
}

/* Checkout */
const FIELDS = ['fullName', 'email', 'whatsapp', 'country', 'street', 'city', 'state', 'postal', 'notes'];
const DRAFT_KEY = 'asp_checkout_draft';   // sessionStorage only: cleared when the tab closes
const values = () => Object.fromEntries(FIELDS.map(f => [f, $(f).value]));
function summaryHTML(s) {
  const ship = s.ship;
  const rows = ship.status === 'ok'
    ? [['Shipping Service', safe(ship.method)], ['Shipping Fee', usd(ship.fee)]]
    : [['Shipping Service', 'Custom quote'], ['Shipping Fee', 'To be confirmed']];
  return `<div class="summary-items">${s.lines.map(l => `<div class="summary-item"><img src="${safe(l.product.image)}" alt=""><div><strong>${safe(l.product.name)}</strong><small>${l.qty} × ${usd(l.product.price)}</small></div><strong>${usd(l.total)}</strong></div>`).join('')}</div>
<div class="totals"><div><span>Total plants</span><strong>${s.units}</strong></div><div><span>Plant Subtotal</span><strong>${usd(s.subtotal)}</strong></div>${rows.map(r => `<div><span>${r[0]}</span><strong>${r[1]}</strong></div>`).join('')}<div class="grand-total"><span>Estimated Total</span><strong>${s.total !== null ? usd(s.total) : 'To be confirmed'}</strong></div></div>
${ship.status === 'custom' ? '<p class="notice warn">Orders above 500 plants (or outside our published shipping tiers) need a custom shipping quote. Our team will confirm the shipping price manually.</p>' : ''}
<a class="summary-edit" href="/cart">← Edit my collection</a>
<p class="fineprint">Import duties, taxes and any destination-country charges are not included.</p>`;
}
function updateRegionLabels() {
  const c = matchCountry($('country').value);
  const mark = (id, required) => { $('lbl-' + id).querySelector('.rq').innerHTML = required ? '<span class="req">*</span>' : '<span class="opt">(optional)</span>'; $(id).required = required; };
  mark('state', !c || stateRequired(c)); mark('postal', !c || postalRequired(c));
}
function showErrors(errors) {
  FIELDS.forEach(f => { const err = $('error-' + f); if (!err) return; err.textContent = errors[f] || ''; $(f).setAttribute('aria-invalid', errors[f] ? 'true' : 'false'); });
  const first = FIELDS.find(f => errors[f]);
  if (first) { $(first).scrollIntoView({ block: 'center', behavior: 'smooth' }); $(first).focus({ preventScroll: true }); }
  return !first;
}
function setStatus(msg, isError) { const el = $('orderStatus'); el.textContent = msg; el.classList.toggle('hidden', !msg); el.classList.toggle('error', !!isError); }
function pageCheckout() {
  pageRender = null;
  const s = cartStatus();
  const ok = PRODUCTS.length > 0 && s.canCheckout;
  $('checkoutBlocked').classList.toggle('hidden', ok || !PRODUCTS.length);
  $('checkoutForm').classList.toggle('hidden', !ok);
  if (!PRODUCTS.length) { return; }
  if (!ok) {
    $('blockedText').textContent = !s.lines.length ? 'Your collection is empty. Choose your plants first, then come back to checkout.'
      : s.units < SETTINGS.minimumOrder ? `Your collection has ${s.units} plant${s.units === 1 ? '' : 's'}. The minimum order is ${SETTINGS.minimumOrder} plants in total.` : 'Some items in your collection need attention. Please review your collection.';
    return;
  }
  $('orderSummary').innerHTML = summaryHTML(s);
  updateRegionLabels();
}
function bindCheckout() {
  $('countryList').innerHTML = COUNTRIES.map(c => `<option value="${safe(c)}">`).join('');
  try { const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}'); FIELDS.forEach(f => { if (d[f]) $(f).value = d[f]; }); } catch (e) { /* ignore */ }
  $('checkoutForm').addEventListener('input', e => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values())); } catch (err) { /* ignore */ }
    if (e.target.id === 'country') updateRegionLabels();
    const err = $('error-' + e.target.id); if (err) { err.textContent = ''; e.target.setAttribute('aria-invalid', 'false'); }
  });
  $('checkoutForm').addEventListener('submit', e => e.preventDefault());
  const send = channel => {
    setStatus('');
    const status = cartStatus();
    if (!status.canCheckout) { setStatus('Your collection changed and no longer meets the order requirements. Please review it first.', true); return; }
    const v = values();
    const { errors } = validateCheckout(v);
    if (!showErrors(errors)) { setStatus('Please correct the highlighted fields.', true); return; }
    const order = buildOrder(v, status);
    if (channel === 'wa') {
      if (!SETTINGS.whatsappNumber) { setStatus('WhatsApp ordering is not available yet (business number not configured). Please use email instead.', true); return; }
      openLink(whatsappUrl(SETTINGS.whatsappNumber, order.text));
      setStatus('WhatsApp should now open with your order message. Please press Send in WhatsApp — we have not received anything until you do.');
    } else {
      if (!SETTINGS.businessEmail) { setStatus('Email ordering is not available yet (business email not configured). Please use WhatsApp instead.', true); return; }
      location.href = mailtoUrl(SETTINGS.businessEmail, order.subject, order.text);
      setStatus('Your email app should now open with a draft. Please send it from your email app — we have not received anything until you do. If nothing opened, contact us via WhatsApp.');
    }
  };
  $('waBtn').addEventListener('click', () => send('wa'));
  $('mailBtn').addEventListener('click', () => send('mail'));
}

function pageShipping() {
  pageRender = null;
  const rows = SHIPPING.map(r => `<tr><td>${r.min}–${r.max} plants</td><td>${safe(r.method)}</td><td>${usd(r.fee).replace('.00', '')}</td></tr>`);
  const top = SHIPPING.reduce((m, r) => Math.max(m, r.max), 0);
  if (top) rows.push(`<tr><td>More than ${top} plants</td><td>Custom quote</td><td>Confirmed manually</td></tr>`);
  $('shippingRows').innerHTML = rows.join('');
}

/* ---------- Data loading ---------- */
async function loadStore() {
  if (!window.aspDb) { console.info('Demo mode: configure Supabase in config.js'); return; }
  try {
    const [pr, cat, ship, settings] = await Promise.all([
      aspDb.from('products').select('*').eq('active', true).order('created_at', { ascending: false }),
      aspDb.from('categories').select('*').order('sort_order'),
      aspDb.from('shipping_rates').select('*').order('min_qty'),
      aspDb.from('store_settings').select('*')
    ]);
    if (pr.error) throw pr.error; if (ship.error) throw ship.error; if (settings.error) throw settings.error;
    PRODUCTS = (pr.data || []).map(p => ({
      id: p.id, name: p.name, category: p.category || 'Other', price: Number(p.price), stock: p.stock, tag: p.tag || '',
      featured: !!p.featured, created: p.created_at ? Date.parse(p.created_at) : NaN,
      image: p.image_url || IMAGES.other, description: p.description || ''
    }));
    if (ship.data && ship.data.length) SHIPPING = ship.data.map(r => ({ min: r.min_qty, max: r.max_qty, fee: Number(r.fee), method: r.method }));
    if (!cat.error && cat.data) { CATEGORY_ORDER = cat.data.map(c => c.name); CATEGORY_DESC = Object.fromEntries(cat.data.filter(c => c.description).map(c => [c.name, c.description])); }
    for (const row of settings.data || []) {
      if (row.key === 'whatsapp_number') SETTINGS.whatsappNumber = String(row.value || '').replace(/\D/g, '');
      if (row.key === 'business_email') SETTINGS.businessEmail = String(row.value || '').trim();
      if (row.key === 'minimum_order') SETTINGS.minimumOrder = Number(row.value) || 10;
    }
  } catch (err) { console.error(err); catalogError = true; }
}

/* ---------- Boot ---------- */
function render() {
  updateBag(); renderMenuCategories();
  ({ home: pageHome, categories: pageCategory, cart: pageCart, checkout: pageCheckout, shipping: pageShipping }[page()] || (() => {}))();
}
async function boot() {
  mountLayout();
  const p = page();
  if (p === 'categories') bindCategoryControls();
  if (p === 'cart') bindCartPage();
  if (p === 'checkout') bindCheckout();
  render();                                   // first paint (loading state in Supabase mode)
  window.addEventListener('storage', e => { if (e.key === CART_KEY) { cart = readCart(); updateBag(); render(); } });
  window.addEventListener('pageshow', e => { if (e.persisted) { cart = readCart(); render(); } });   // back/forward cache
  await loadStore();
  if (!catalogError) {
    const removed = reconcileCart();
    if (removed.length) removedNotice = `${removed.length} item${removed.length === 1 ? ' was' : 's were'} removed from your collection because ${removed.length === 1 ? 'it is' : 'they are'} no longer available.`;
  }
  render();
}
if (document.body) boot();
})();
