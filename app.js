/* ── AUDIO ── */
let soundOn = true;
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;

function getCtx() {
  if (!actx) actx = new AudioCtx();
  return actx;
}

function playBlip(freq = 520, dur = 0.06, vol = 0.08) {
  if (!soundOn) return;
  try {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch(e) {}
}

function playNav()    { playBlip(440, 0.05, 0.07); }
function playSelect() { playBlip(660, 0.08, 0.09); setTimeout(() => playBlip(880, 0.06, 0.07), 70); }
function playBoot()   { [220,330,440,660].forEach((f,i) => setTimeout(() => playBlip(f, 0.1, 0.1), i*80)); }
function playToast()  { playBlip(880, 0.05, 0.08); setTimeout(() => playBlip(1100, 0.1, 0.08), 60); }

function toggleSound() {
  soundOn = !soundOn;
  document.getElementById('soundWave1').style.display = soundOn ? '' : 'none';
  document.getElementById('soundWave2').style.display = soundOn ? '' : 'none';
  document.getElementById('soundMute').style.display  = soundOn ? 'none' : '';
  if (soundOn) playSelect();
}

/* ── TYPEWRITER ── */
function typeTitle(el, text, cb) {
  el.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'title-cursor';
  el.appendChild(cursor);
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      el.insertBefore(document.createTextNode(text[i]), cursor);
      i++;
    } else {
      clearInterval(interval);
      setTimeout(() => { cursor.remove(); if (cb) cb(); }, 400);
    }
  }, 38);
}

/* ── WIPE TRANSITION ── */
function wipeTransition(cb) {
  const wipe = document.getElementById('wipe');
  wipe.classList.remove('out');
  wipe.classList.add('go');
  setTimeout(() => {
    cb();
    wipe.classList.remove('go');
    wipe.classList.add('out');
    setTimeout(() => { wipe.classList.remove('out'); }, 300);
  }, 240);
}

/* ── ACHIEVEMENTS ── */
const visited = new Set();
const achievements = {
  skills:     'Skills Inspected',
  experience: 'Career Reviewed',
  hobbies:    'True Self Revealed',
  contact:    'Ready to Connect',
  all:        'Full Profile Viewed'
};
let toastTimer = null;
let allUnlocked = false;

function showToast(title) {
  playToast();
  const toast = document.getElementById('toast');
  document.getElementById('toastTitle').textContent = title;
  toast.classList.remove('show', 'hide');
  void toast.offsetWidth;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
  }, 3200);
}

function checkAchievement(panelId) {
  if (panelId === 'about') return;
  if (!visited.has(panelId)) {
    visited.add(panelId);
    setTimeout(() => {
      if (achievements[panelId]) showToast(achievements[panelId]);
      if (visited.size === 4 && !allUnlocked) {
        allUnlocked = true;
        setTimeout(() => showToast(achievements.all), 3600);
      }
    }, 900);
  }
}

/* ── IDLE ANIMATION ── */
let idleTimer  = null;
let idleActive = false;
const jbMark   = document.getElementById('jbMark');

function startIdle() {
  if (idleActive) return;
  idleActive = true;
  jbMark.classList.add('idle');
}

function resetIdle() {
  idleActive = false;
  jbMark.classList.remove('idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(startIdle, 9000);
}

['mousemove','keydown','click','touchstart'].forEach(e =>
  document.addEventListener(e, resetIdle, { passive: true })
);

/* ── REVEAL ── */
function revealPanel(panelId) {
  const section = document.getElementById('panel-' + panelId);
  if (!section) return;
  const items = Array.from(section.querySelectorAll('.reveal, .reveal-up'));
  requestAnimationFrame(() => {
    items.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('in');
        const bar = el.querySelector('.xp-bar-fill');
        if (bar) setTimeout(() => { bar.style.width = bar.dataset.w + '%'; }, 150);
      }, 80 + i * 140);
    });
    setTimeout(() => {
      items.forEach(el => el.classList.add('in'));
    }, 80 + items.length * 140 + 800);
  });
}

/* ── BURGER MENU ── */
let burgerOpen = false;

function toggleBurger() {
  burgerOpen = !burgerOpen;
  const btn     = document.getElementById('burgerBtn');
  const overlay = document.getElementById('burgerOverlay');
  btn.classList.toggle('open', burgerOpen);
  overlay.classList.toggle('open', burgerOpen);

  if (burgerOpen) {
    // Stagger items in
    overlay.querySelectorAll('.burger-item').forEach((item, i) => {
      item.style.opacity   = '0';
      item.style.transform = 'translateX(-20px)';
      item.style.transition = 'none';
      setTimeout(() => {
        item.style.transition = 'opacity 0.35s ease, transform 0.4s cubic-bezier(.34,1.2,.64,1), border-color 0.2s, background 0.2s';
        item.style.opacity   = '1';
        item.style.transform = 'translateX(0)';
      }, 60 + i * 80);
    });
    // Sync active state
    overlay.querySelectorAll('.burger-item').forEach(item => {
      item.classList.toggle('active', item.dataset.panel === panels[currentIndex]);
    });
  }
}

function burgerSel(el) {
  const p = el.dataset.panel;

  // Close overlay
  burgerOpen = false;
  document.getElementById('burgerBtn').classList.remove('open');
  document.getElementById('burgerOverlay').classList.remove('open');

  // Same panel — just close the menu, don't reload anything
  if (panels[currentIndex] === p) return;

  playSelect();
  currentIndex = panels.indexOf(p);
  checkAchievement(p);

  wipeTransition(() => {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`.menu-item[data-panel="${p}"]`).classList.add('active');
    document.querySelectorAll('.panel-section').forEach(s => s.classList.remove('visible'));
    const section = document.getElementById('panel-' + p);
    section.querySelectorAll('.reveal, .reveal-up').forEach(r => r.classList.remove('in'));
    section.classList.add('visible');
    document.getElementById('pNum').textContent = panelNums[p];
    const titleEl = document.querySelector('#panel-' + p + ' .panel-title');
    typeTitle(titleEl, el.querySelector('.burger-label').textContent, () => revealPanel(p));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Close burger on outside tap
document.addEventListener('click', e => {
  if (burgerOpen && !e.target.closest('#burgerOverlay') && !e.target.closest('#burgerBtn')) {
    toggleBurger();
  }
});

/* ── HELPERS ── */
const ease = (el, props, dur, delay) => {
  el.style.transition = `opacity ${dur}ms cubic-bezier(.4,0,.2,1) ${delay}ms, transform ${dur}ms cubic-bezier(.34,1.28,.64,1) ${delay}ms`;
  requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(el.style, props)));
};

/* ── BOOT ── */
const panels    = ['about','skills','experience','hobbies','contact'];
const panelNums = { about:'01', skills:'02', experience:'03', hobbies:'04', contact:'05' };
let currentIndex = 0;
let booted       = false;

function runBoot() {
  const overlay   = document.getElementById('bootOverlay');
  const topBar    = document.getElementById('topBar');
  const divider   = document.getElementById('divider');
  const menuItems = document.querySelectorAll('.menu-item');
  const panel     = document.getElementById('panel');
  const bottom    = document.getElementById('bottomBar');
  const scan      = document.getElementById('scanline');

  const isMobile = window.innerWidth <= 680;

  if (isMobile) {
    overlay.style.display = 'none';
    typeTitle(document.querySelector('#panel-about .panel-title'), 'Profile', () => revealPanel('about'));
    booted = true;
    resetIdle();
    return;
  }

  // Desktop — set initial hidden states
  topBar.style.opacity  = '0'; topBar.style.transform  = 'translateY(-18px)';
  divider.style.opacity = '0'; divider.style.transform = 'scaleX(0)';
  panel.style.opacity   = '0'; panel.style.transform   = 'translateY(20px)';
  bottom.style.opacity  = '0';
  menuItems.forEach(item => item.classList.add('anim-hidden'));

  const go = () => {
    if (booted) return;
    booted = true;
    playBoot();

    overlay.style.transition = 'opacity 0.6s ease';
    overlay.style.opacity    = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 600);

    scan.style.animation = 'scan 0.55s linear forwards';

    setTimeout(() => { ease(topBar, { opacity:'1', transform:'translateY(0)' }, 700, 0); }, 100);

    setTimeout(() => {
      divider.style.opacity    = '1';
      divider.style.transition = 'transform 0.7s cubic-bezier(.4,0,.2,1)';
      requestAnimationFrame(() => requestAnimationFrame(() => { divider.style.transform = 'scaleX(1)'; }));
    }, 550);

    menuItems.forEach((item, i) => {
      setTimeout(() => {
        item.classList.remove('anim-hidden');
        item.style.transition = 'opacity 0.55s cubic-bezier(.4,0,.2,1), transform 0.6s cubic-bezier(.34,1.22,.64,1), background 0.25s ease, border-color 0.25s ease';
      }, 750 + i * 110);
    });

    setTimeout(() => {
      ease(panel, { opacity:'1', transform:'translateY(0)' }, 700, 0);
      typeTitle(document.querySelector('#panel-about .panel-title'), 'Profile', () => revealPanel('about'));
    }, 1200);

    setTimeout(() => { ease(bottom, { opacity:'1', transform:'translateY(0)' }, 600, 0); }, 1600);
    setTimeout(() => resetIdle(), 2000);
  };

  document.addEventListener('keydown', go, { once: true });
  setTimeout(go, 2700);
}

/* ── SELECT ── */
function sel(el) {
  const p = el.dataset.panel;
  if (panels[currentIndex] === p) return;
  playSelect();
  currentIndex = panels.indexOf(p);
  checkAchievement(p);

  const doSwitch = () => {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.panel-section').forEach(s => s.classList.remove('visible'));
    const section = document.getElementById('panel-' + p);
    section.querySelectorAll('.reveal, .reveal-up').forEach(r => r.classList.remove('in'));
    section.classList.add('visible');
    document.getElementById('pNum').textContent = panelNums[p];
    typeTitle(
      document.querySelector('#panel-' + p + ' .panel-title'),
      el.querySelector('.item-label').textContent,
      () => revealPanel(p)
    );
  };

  if (window.innerWidth <= 680) doSwitch();
  else wipeTransition(doSwitch);
}

/* ── KEYBOARD NAVIGATION ── */
document.addEventListener('keydown', e => {
  if (!booted) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    playNav();
    if (e.key === 'ArrowDown') currentIndex = Math.min(currentIndex + 1, panels.length - 1);
    if (e.key === 'ArrowUp')   currentIndex = Math.max(currentIndex - 1, 0);
    const menuItem = document.querySelector(`.menu-item[data-panel="${panels[currentIndex]}"]`);
    if (menuItem) sel(menuItem);
  }
});

runBoot();
