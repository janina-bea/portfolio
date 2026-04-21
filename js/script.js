/* ============================================================
   Bea Portfolio — script.js
   Contact form → Google Apps Script → Google Sheets
   ============================================================ */

// ── Nav scroll ───────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('topnav').classList.toggle('scrolled', scrollY > 10);
}, { passive: true });

// ── Mobile nav ───────────────────────────────────────────────
const burger = document.getElementById('burger');
const mobNav = document.getElementById('mobNav');
burger.addEventListener('click', () => mobNav.classList.toggle('open'));
mobNav.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => mobNav.classList.remove('open'))
);

// ── Active nav links on scroll ───────────────────────────────
const allLinks = document.querySelectorAll('.nav-links a,.mob-nav a');
const allSecs  = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let cur = '';
  allSecs.forEach(s => { if (scrollY >= s.offsetTop - 90) cur = s.id; });
  allLinks.forEach(a => {
    if (!a.classList.contains('nav-hire'))
      a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
  });
}, { passive: true });

// ── Scroll-in animations ─────────────────────────────────────
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting)
      setTimeout(() => e.target.classList.add('visible'), e.target.dataset.d || 0);
  });
}, { threshold: 0.08 });
document.querySelectorAll('.tl-item,.proj-card,.proj-featured').forEach((el, i) => {
  el.dataset.d = i * 55;
  io.observe(el);
});

// ── Contact Form ─────────────────────────────────────────────

// 🔧 Replace with your deployed Google Apps Script Web App URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw64Fr4bdYLseQD64pnqAuh5ChkipI2irabfUQ801dfpwmnbInkmRTEaNh8wwKKeMAh/exec';

// Client-side rate limiting (server enforces the real caps too)
let sessionSends = 0;
const SESSION_LIMIT = 5;
let lastSendTime = 0;
const CLIENT_COOLDOWN_MS = 30 * 1000; // 30 seconds

document.getElementById('cForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const btn    = this.querySelector('.form-btn');
  const errBox = document.getElementById('fError');

  // ── Honeypot: silent drop for bots ───────────────────────
  if (document.getElementById('hp_url').value.trim() !== '') {
    showSuccess();
    return;
  }

  // ── Client-side rate limit ────────────────────────────────
  const now = Date.now();
  if (sessionSends >= SESSION_LIMIT) {
    showError(errBox, "You've reached the maximum submissions. Please email me directly.");
    return;
  }
  if (now - lastSendTime < CLIENT_COOLDOWN_MS) {
    const wait = Math.ceil((CLIENT_COOLDOWN_MS - (now - lastSendTime)) / 1000);
    showError(errBox, 'Please wait ' + wait + ' seconds before trying again.');
    return;
  }

  // ── Read fields ───────────────────────────────────────────
  const name    = document.getElementById('fname').value.trim();
  const email   = document.getElementById('femail').value.trim();
  const subject = document.getElementById('fsubject').value;
  const message = document.getElementById('fmsg').value.trim();

  // ── Validate ──────────────────────────────────────────────
  hideError(errBox);
  if (!name || !email || !subject || !message) {
    showError(errBox, 'Please fill in all required fields.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    showError(errBox, 'Please enter a valid email address.');
    return;
  }
  if (message.length < 15) {
    showError(errBox, 'Please write a bit more (at least 15 characters).');
    return;
  }

  // ── Submit via no-cors (required for Google Apps Script) ──
  // Google Apps Script redirects POSTs internally which breaks
  // JSON fetch. We use FormData + no-cors mode instead, then
  // assume success if no network error is thrown.
  btn.disabled    = true;
  btn.textContent = 'Sending…';

  try {
    const formData = new FormData();
    formData.append('name',    name);
    formData.append('email',   email);
    formData.append('subject', subject);
    formData.append('message', message);
    formData.append('hp_url',  document.getElementById('hp_url').value);

    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode:   'no-cors',   // ← key fix: avoids CORS preflight on Apps Script
      body:   formData
    });

    // With no-cors we can't read the response — but if we got here
    // without throwing, the request reached Google. Show success.
    sessionSends++;
    lastSendTime = Date.now();
    showSuccess();

  } catch (_) {
    showError(errBox, 'Network error — please check your connection and try again, or email me directly at hernandezjbea@gmail.com.');
    btn.disabled    = false;
    btn.textContent = '🎀 Send Message';
  }
});

function showSuccess() {
  document.getElementById('cForm').style.display = 'none';
  document.getElementById('fSuccess').classList.add('show');
}

function showError(box, msg) {
  box.textContent   = msg;
  box.style.display = 'block';
  box.setAttribute('role', 'alert');
}

function hideError(box) {
  box.textContent   = '';
  box.style.display = 'none';
}
