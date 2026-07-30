/* =========================================================
   COUPEX — DEMO APP LOGIC
   Data is kept in memory + browser localStorage so the demo
   persists on refresh. In a real system this file would be
   replaced by API calls to a backend (see database_schema.sql
   for the matching table design).
   ========================================================= */

const DB_KEY = "coupex_demo_db_v1";

let DB = loadDB();
let currentUser = null;
let myCouponsTab = "listed";

function loadDB(){
  const raw = localStorage.getItem(DB_KEY);
  if(raw){ return JSON.parse(raw); }
  const seedExpiry = (days) => {
    const d = new Date(); d.setDate(d.getDate()+days);
    return d.toISOString().slice(0,10);
  };
  const seed = {
    users: {
      "demo@coupex.com": {
        name: "Demo User", email:"demo@coupex.com", phone:"9999999999",
        password:"demo123", upi:"demo@okbank", wallet: 250, createdAt: Date.now()
      }
    },
    coupons: [
      {id:"C1001", seller:"demo@coupex.com", store:"Zomato", category:"Food & Dining",
        code:"ZOM200OFF", desc:"Min order ₹499", discount:"₹200 off", original:200,
        price:120, expiry: seedExpiry(20), status:"active"},
      {id:"C1002", seller:"demo@coupex.com", store:"Myntra", category:"Fashion",
        code:"MYN30FLAT", desc:"On fashion & lifestyle", discount:"30% off", original:600,
        price:250, expiry: seedExpiry(10), status:"active"},
      {id:"C1003", seller:"demo@coupex.com", store:"Croma", category:"Electronics",
        code:"CROMA500", desc:"On orders above ₹4999", discount:"₹500 off", original:500,
        price:300, expiry: seedExpiry(-3), status:"active"}, // expired seed example
      {id:"C1004", seller:"demo@coupex.com", store:"MakeMyTrip", category:"Travel",
        code:"MMT1200", desc:"Domestic flights", discount:"₹1200 off", original:1200,
        price:700, expiry: seedExpiry(45), status:"active"},
      {id:"C1005", seller:"demo@coupex.com", store:"BigBasket", category:"Groceries",
        code:"BB15OFF", desc:"First order only", discount:"15% off", original:150,
        price:60, expiry: seedExpiry(5), status:"active"},
      {id:"C1006", seller:"demo@coupex.com", store:"BookMyShow", category:"Entertainment",
        code:"BMS100", desc:"Movie tickets", discount:"₹100 off", original:100,
        price:45, expiry: seedExpiry(15), status:"active"}
    ],
    transactions: []
  };
  saveDBRaw(seed);
  return seed;
}
function saveDB(){ localStorage.setItem(DB_KEY, JSON.stringify(DB)); }
function saveDBRaw(obj){ localStorage.setItem(DB_KEY, JSON.stringify(obj)); }

/* ---------------- NAV / PAGE ROUTING ---------------- */
function showPage(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  const target = document.getElementById("page-"+name);
  if(target) target.classList.add("active");

  const authPages = ["login","signup"];
  if(!currentUser && !authPages.includes(name)){
    document.getElementById("page-login").classList.add("active");
    target && target.classList.remove("active");
    return;
  }

  document.getElementById("adStrip").classList.toggle("show", name==="marketplace");

  if(name==="marketplace") renderMarketplace();
  if(name==="mycoupons") renderMyCoupons();
  if(name==="wallet") renderWallet();
  window.scrollTo({top:0, behavior:"smooth"});
}

/* ---------------- EXPIRY CHECK (automatic) ---------------- */
function isExpired(dateStr){
  const today = new Date(); today.setHours(0,0,0,0);
  const exp = new Date(dateStr); exp.setHours(0,0,0,0);
  return exp < today;
}
function refreshExpiries(){
  DB.coupons.forEach(c=>{
    if(c.status==="active" && isExpired(c.expiry)){
      c.status = "expired";
    }
  });
  saveDB();
}

/* ---------------- AUTH ---------------- */
function handleSignup(e){
  e.preventDefault();
  const name = document.getElementById("suName").value.trim();
  const email = document.getElementById("suEmail").value.trim().toLowerCase();
  const phone = document.getElementById("suPhone").value.trim();
  const upi = document.getElementById("suUpi").value.trim();
  const password = document.getElementById("suPassword").value;
  const errBox = document.getElementById("signupError");

  if(DB.users[email]){
    errBox.textContent = "An account with this email already exists.";
    errBox.classList.remove("d-none");
    return false;
  }
  DB.users[email] = { name, email, phone, upi, password, wallet: 0, createdAt: Date.now() };
  saveDB();
  errBox.classList.add("d-none");
  currentUser = email;
  afterLogin();
  return false;
}

function handleLogin(e){
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const errBox = document.getElementById("loginError");
  const user = DB.users[email];

  if(!user || user.password !== password){
    errBox.textContent = "Incorrect email or password.";
    errBox.classList.remove("d-none");
    return false;
  }
  errBox.classList.add("d-none");
  currentUser = email;
  afterLogin();
  return false;
}

function afterLogin(){
  refreshExpiries();
  document.getElementById("navLinksAuthed").style.display = "flex";
  document.getElementById("walletChip").style.display = "inline-block";
  document.getElementById("navLoginBtn").style.display = "none";
  document.getElementById("navSignupBtn").style.display = "none";
  document.getElementById("navUserMenu").style.display = "inline-flex";
  document.getElementById("userPillName").textContent = "Hi, " + DB.users[currentUser].name.split(" ")[0];
  updateWalletChip();
  buildAdStrip();
  showPage("marketplace");
  chatBoot();
}

function logout(){
  currentUser = null;
  document.getElementById("navLinksAuthed").style.display = "none";
  document.getElementById("walletChip").style.display = "none";
  document.getElementById("navLoginBtn").style.display = "inline-block";
  document.getElementById("navSignupBtn").style.display = "inline-block";
  document.getElementById("navUserMenu").style.display = "none";
  showPage("login");
}

function updateWalletChip(){
  const bal = DB.users[currentUser].wallet.toFixed(0);
  document.getElementById("navWalletBalance").textContent = bal;
}

/* ---------------- AD STRIP ---------------- */
function buildAdStrip(){
  const items = [
    "🔥 New: Zomato coupons up to 40% off resale value",
    "💸 Earn 2% cashback on every coupon you buy",
    "🎟️ Sell your unused coupons in under a minute",
    "✅ Every coupon auto-checked for validity before listing",
    "🛍️ Fashion, Travel, Electronics & more — browse now"
  ];
  const track = document.getElementById("adStripTrack");
  const html = items.concat(items).map(t=>`<span>${t}</span>`).join("");
  track.innerHTML = html;
}

/* ---------------- MARKETPLACE ---------------- */
function renderMarketplace(){
  refreshExpiries();
  const grid = document.getElementById("marketplaceGrid");
  const filter = document.getElementById("categoryFilter").value;
  const list = DB.coupons.filter(c => c.status !== "removed" && c.status !== "sold" && (!filter || c.category===filter));

  if(list.length===0){
    grid.innerHTML = `<div class="col-12"><p class="text-muted">No coupons in this category yet.</p></div>`;
    return;
  }

  grid.innerHTML = list.map(c=>couponCardHTML(c, "market")).join("");
}

function couponCardHTML(c, context){
  const expired = c.status === "expired";
  const mine = c.seller === currentUser;
  const statusBadge = expired
    ? `<span class="badge-expired">Expired</span>`
    : `<span class="badge-active">Valid</span>`;

  let actionBtn = "";
  if(context === "market"){
    if(expired){
      actionBtn = `<button class="btn btn-sm btn-secondary w-100 mt-2" disabled>Expired — not available</button>`;
    } else if(mine){
      actionBtn = `<button class="btn btn-sm btn-outline-secondary w-100 mt-2" disabled>Your listing</button>`;
    } else {
      actionBtn = `<button class="btn btn-sm btn-brand w-100 mt-2" onclick="openCheckout('${c.id}')">Buy for ₹${c.price}</button>`;
    }
  } else if(context === "listed"){
    actionBtn = expired
      ? `<button class="btn btn-sm btn-outline-secondary w-100 mt-2" onclick="removeCoupon('${c.id}')">Remove expired listing</button>`
      : `<span class="small text-muted d-block mt-2">Listed · awaiting buyer</span>`;
  } else if(context === "purchased"){
    actionBtn = `<button class="btn btn-sm btn-outline-dark w-100 mt-2" onclick="viewPurchasedCode('${c.id}')">View coupon code</button>`;
  }

  return `
  <div class="col-sm-6 col-lg-4">
    <div class="coupon-card">
      <div class="coupon-top">
        <div class="d-flex justify-content-between align-items-start">
          <span class="coupon-cat">${c.category}</span>
          ${statusBadge}
        </div>
        <div class="coupon-store">${c.store}</div>
        <div class="coupon-meta">${c.desc || ""}</div>
      </div>
      <div class="coupon-divider"></div>
      <div class="coupon-bottom">
        <div class="coupon-discount">${c.discount}</div>
        <div class="coupon-meta">Valid till ${formatDate(c.expiry)}</div>
        <div class="coupon-price-row">
          <span class="coupon-meta">Worth ₹${c.original}</span>
          <span class="coupon-price">₹${c.price}</span>
        </div>
        ${actionBtn}
      </div>
    </div>
  </div>`;
}

function formatDate(d){
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", {day:"numeric", month:"short", year:"numeric"});
}

/* ---------------- SELL A COUPON ---------------- */
function handleSellCoupon(e){
  e.preventDefault();
  const store = document.getElementById("cStore").value.trim();
  const category = document.getElementById("cCategory").value;
  const code = document.getElementById("cCode").value.trim().toUpperCase();
  const discount = document.getElementById("cDiscount").value.trim();
  const original = parseFloat(document.getElementById("cOriginal").value);
  const price = parseFloat(document.getElementById("cPrice").value);
  const expiry = document.getElementById("cExpiry").value;
  const desc = document.getElementById("cDesc").value.trim();

  const errBox = document.getElementById("sellError");
  const okBox = document.getElementById("sellSuccess");
  errBox.classList.add("d-none"); okBox.classList.add("d-none");

  if(isExpired(expiry)){
    errBox.textContent = "This coupon's expiry date has already passed — expired coupons can't be listed.";
    errBox.classList.remove("d-none");
    return false;
  }
  if(price > original){
    errBox.textContent = "Asking price can't be higher than the coupon's original value.";
    errBox.classList.remove("d-none");
    return false;
  }

  const id = "C" + Math.floor(1000 + Math.random()*9000) + Date.now().toString().slice(-3);
  DB.coupons.push({
    id, seller: currentUser, store, category, code, desc, discount,
    original, price, expiry, status:"active"
  });
  saveDB();

  okBox.textContent = "Coupon submitted and listed! It will automatically be marked expired on " + formatDate(expiry) + " if unsold.";
  okBox.classList.remove("d-none");
  document.getElementById("sellForm").reset();
}

/* ---------------- MY COUPONS ---------------- */
function switchMyCouponsTab(tab){
  myCouponsTab = tab;
  document.querySelectorAll("#myCouponsTabs .nav-link").forEach(b=>b.classList.remove("active"));
  document.querySelector(`#myCouponsTabs [data-tab="${tab}"]`).classList.add("active");
  renderMyCoupons();
}

function renderMyCoupons(){
  refreshExpiries();
  const grid = document.getElementById("myCouponsGrid");
  let list;
  if(myCouponsTab === "listed"){
    list = DB.coupons.filter(c=>c.seller===currentUser && c.status!=="removed");
  } else {
    list = DB.transactions.filter(t=>t.buyer===currentUser).map(t=>DB.coupons.find(c=>c.id===t.couponId)).filter(Boolean);
  }
  if(list.length===0){
    grid.innerHTML = `<div class="col-12"><p class="text-muted">Nothing here yet.</p></div>`;
    return;
  }
  grid.innerHTML = list.map(c=>couponCardHTML(c, myCouponsTab)).join("");
}

function removeCoupon(id){
  const c = DB.coupons.find(c=>c.id===id);
  if(c){ c.status = "removed"; saveDB(); renderMyCoupons(); }
}

function viewPurchasedCode(id){
  const c = DB.coupons.find(c=>c.id===id);
  const txn = DB.transactions.find(t=>t.couponId===id && t.buyer===currentUser);
  showReveal(c, txn);
}

/* ---------------- CHECKOUT / SIMULATED UPI ---------------- */
let pendingCouponId = null;
function openCheckout(id){
  pendingCouponId = id;
  const c = DB.coupons.find(c=>c.id===id);
  const cashback = Math.round(c.price * 0.02);
  document.getElementById("checkoutBody").innerHTML = `
    <div class="d-flex justify-content-between mb-2"><span>Store</span><strong>${c.store}</strong></div>
    <div class="d-flex justify-content-between mb-2"><span>Coupon value</span><strong>₹${c.original}</strong></div>
    <div class="d-flex justify-content-between mb-2"><span>Price</span><strong>₹${c.price}</strong></div>
    <div class="d-flex justify-content-between mb-3 text-success"><span>Cashback you'll earn</span><strong>+₹${cashback}</strong></div>
    <hr>
    <label class="form-label">Pay using UPI ID</label>
    <input type="text" class="form-control mb-2" id="checkoutUpi" placeholder="yourname@okbank" value="${DB.users[currentUser].upi || ''}">
    <div class="form-check mb-3">
      <input class="form-check-input" type="radio" name="payMethod" id="payWallet" checked>
      <label class="form-check-label small" for="payWallet">Pay from wallet (₹${DB.users[currentUser].wallet.toFixed(0)} available)</label>
    </div>
    <div class="form-check mb-3">
      <input class="form-check-input" type="radio" name="payMethod" id="payUpiDirect">
      <label class="form-check-label small" for="payUpiDirect">Pay directly via UPI (simulated)</label>
    </div>
    <div id="checkoutStatus"></div>
    <button class="btn btn-brand w-100 mt-2" onclick="confirmPurchase()">Confirm &amp; Pay ₹${c.price}</button>
    <p class="small text-muted mt-2 mb-0">This is a simulated payment for demo purposes. No real money is transferred.</p>
  `;
  new bootstrap.Modal(document.getElementById("checkoutModal")).show();
}

function confirmPurchase(){
  const c = DB.coupons.find(c=>c.id===pendingCouponId);
  const usingWallet = document.getElementById("payWallet").checked;
  const statusEl = document.getElementById("checkoutStatus");
  const buyer = DB.users[currentUser];

  if(usingWallet && buyer.wallet < c.price){
    statusEl.innerHTML = `<div class="alert alert-danger py-2">Insufficient wallet balance. Try "Pay directly via UPI" or top up your wallet.</div>`;
    return;
  }
  if(!usingWallet){
    const upi = document.getElementById("checkoutUpi").value.trim();
    if(!upi.includes("@")){
      statusEl.innerHTML = `<div class="alert alert-danger py-2">Enter a valid UPI ID (e.g. name@okbank).</div>`;
      return;
    }
  }

  statusEl.innerHTML = `<div class="alert alert-info py-2">Processing payment…</div>`;

  setTimeout(()=>{
    const cashback = Math.round(c.price * 0.02);
    const refId = generateUpiRef();

    if(usingWallet){
      buyer.wallet -= c.price;
    }
    buyer.wallet += cashback; // cashback credited regardless of payment path
    // seller gets paid into their wallet (minus nothing extra for demo)
    const seller = DB.users[c.seller];
    if(seller && seller !== buyer){ seller.wallet += c.price; }

    c.status = "sold";
    DB.transactions.push({
      id: "TXN"+Date.now(),
      couponId: c.id, buyer: currentUser, seller: c.seller,
      amount: c.price, cashback, method: usingWallet ? "Wallet" : "UPI",
      upiRef: refId, timestamp: Date.now()
    });
    saveDB();
    updateWalletChip();

    bootstrap.Modal.getInstance(document.getElementById("checkoutModal")).hide();
    showReveal(c, DB.transactions[DB.transactions.length-1]);
    renderMarketplace();
  }, 1000);
}

function generateUpiRef(){
  return "UPI" + Math.floor(100000000000 + Math.random()*899999999999);
}

function showReveal(c, txn){
  document.getElementById("revealBody").innerHTML = `
    <p>Here's your coupon code — copy it and use it directly at ${c.store}.</p>
    <div class="d-flex align-items-center justify-content-between border rounded p-3 mb-3" style="background:#FAF8F2;">
      <code style="font-size:1.2rem;font-weight:700;">${c.code}</code>
      <button class="btn btn-sm btn-outline-dark" onclick="navigator.clipboard.writeText('${c.code}')">Copy</button>
    </div>
    <div class="small text-muted">
      <div>Transaction ref: ${txn.upiRef || txn.upiRef}</div>
      <div>Cashback credited: ₹${txn.cashback}</div>
      <div>Valid till: ${formatDate(c.expiry)}</div>
    </div>
  `;
  new bootstrap.Modal(document.getElementById("revealModal")).show();
}

/* ---------------- WALLET ---------------- */
function renderWallet(){
  document.getElementById("walletBalanceBig").textContent = DB.users[currentUser].wallet.toFixed(0);
  const list = DB.transactions.filter(t=>t.buyer===currentUser || t.seller===currentUser)
    .sort((a,b)=>b.timestamp-a.timestamp);
  const box = document.getElementById("txnHistory");
  if(list.length===0){
    box.innerHTML = `<p class="text-muted small mb-0">No transactions yet.</p>`;
    return;
  }
  box.innerHTML = list.map(t=>{
    const c = DB.coupons.find(cc=>cc.id===t.couponId);
    const isBuyer = t.buyer === currentUser;
    return `<div class="txn-row">
      <div>
        <div>${isBuyer ? "Bought" : "Sold"} — ${c ? c.store : "Coupon"}</div>
        <div class="text-muted" style="font-size:.75rem;">${new Date(t.timestamp).toLocaleString("en-IN")}</div>
      </div>
      <div class="text-end">
        <div class="${isBuyer ? 'txn-amt-neg' : 'txn-amt-pos'}">${isBuyer ? '-' : '+'}₹${t.amount}</div>
        ${isBuyer ? `<div class="small txn-amt-pos">+₹${t.cashback} cashback</div>` : ""}
      </div>
    </div>`;
  }).join("");
}

function openTopupModal(){
  document.getElementById("topupStatus").innerHTML = "";
  new bootstrap.Modal(document.getElementById("topupModal")).show();
}

function processTopup(){
  const amt = parseFloat(document.getElementById("topupAmount").value);
  const upi = document.getElementById("topupUpi").value.trim();
  const statusEl = document.getElementById("topupStatus");
  if(!amt || amt < 10){
    statusEl.innerHTML = `<div class="alert alert-danger py-2">Enter an amount of at least ₹10.</div>`;
    return;
  }
  if(!upi.includes("@")){
    statusEl.innerHTML = `<div class="alert alert-danger py-2">Enter a valid UPI ID.</div>`;
    return;
  }
  statusEl.innerHTML = `<div class="alert alert-info py-2">Processing UPI payment…</div>`;
  setTimeout(()=>{
    DB.users[currentUser].wallet += amt;
    saveDB();
    updateWalletChip();
    statusEl.innerHTML = `<div class="alert alert-success py-2">₹${amt} added successfully. Ref: ${generateUpiRef()}</div>`;
    renderWallet();
  }, 900);
}

/* ---------------- LEGAL TABS ---------------- */
function switchLegalTab(tab){
  document.querySelectorAll("[data-legal]").forEach(b=>b.classList.remove("active"));
  document.querySelector(`[data-legal="${tab}"]`).classList.add("active");
  document.getElementById("legal-terms").classList.toggle("d-none", tab!=="terms");
  document.getElementById("legal-privacy").classList.toggle("d-none", tab!=="privacy");
}

/* ---------------- CHAT / HELP WIDGET ---------------- */
const CHAT_FAQ = [
  { q: ["expire", "expiry", "valid"], a: "Every coupon shows its validity date on the card. Once that date passes, we automatically mark it 'Expired' and it can no longer be bought." },
  { q: ["cashback"], a: "You earn 2% cashback (credited to your Wallet) every time you buy a coupon, whether you pay from your wallet or via UPI." },
  { q: ["sell", "list"], a: "Go to 'Sell a Coupon', fill in the store, code, discount, and expiry date. We check the expiry automatically — expired coupons can't be listed." },
  { q: ["upi", "payment", "pay"], a: "You can pay from your in-app Wallet or directly via UPI ID at checkout. This demo simulates the UPI flow — no real money moves." },
  { q: ["refund", "dispute", "invalid"], a: "If a purchased coupon doesn't work at the store, raise a dispute within 48 hours here in chat and our team will review it for a wallet refund." },
  { q: ["wallet", "balance", "top"], a: "Open the Wallet page and click 'Add money via UPI' to top up your balance." },
  { q: ["account", "password", "login"], a: "Use the Sign up page to create an account with your email and a password (min. 6 characters). Log in anytime from the top navigation." }
];
function chatBoot(){
  const body = document.getElementById("chatBody");
  if(body.childElementCount===0){
    addChatMsg("bot", "Hi " + DB.users[currentUser].name.split(" ")[0] + "! I'm the CoupEx help bot. Ask me about buying, selling, cashback, or expiry rules.");
  }
  document.getElementById("chatQuick").innerHTML = ["How does cashback work?","How do I sell a coupon?","How do I pay with UPI?"]
    .map(q=>`<button onclick="quickChat('${q.replace(/'/g,"")}')">${q}</button>`).join("");
}
function toggleChat(){
  const win = document.getElementById("chatWindow");
  win.classList.toggle("d-none");
}
function quickChat(text){
  document.getElementById("chatInput").value = text;
  sendChat(new Event("submit"));
}
function sendChat(e){
  if(e && e.preventDefault) e.preventDefault();
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if(!text) return false;
  addChatMsg("user", text);
  input.value = "";
  setTimeout(()=>{
    const lower = text.toLowerCase();
    const hit = CHAT_FAQ.find(f => f.q.some(k=>lower.includes(k)));
    addChatMsg("bot", hit ? hit.a : "I'm not totally sure about that — for account-specific issues, this demo would hand off to a human support agent. Try asking about expiry, cashback, selling, or UPI payments.");
  }, 400);
  return false;
}
function addChatMsg(sender, text){
  const body = document.getElementById("chatBody");
  const div = document.createElement("div");
  div.className = "chat-msg " + sender;
  div.textContent = text;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", ()=>{
  refreshExpiries();
  document.getElementById("categoryFilter").addEventListener("change", renderMarketplace);
  showPage("login");
});
