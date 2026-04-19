/* ══════════════════════════════════════════════════
   AKASH YATI — main.js
══════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── Cursor — both dot and ring lerp ───────
     dot:  faster  (0.18)  — feels snappy but smooth
     ring: slower  (0.08)  — lags nicely behind      */
  const curDot  = document.getElementById('cur');
  const curRing = document.getElementById('cur-ring');

  let mx = -500, my = -500;   // raw mouse position
  let dx = -500, dy = -500;   // dot  (lerped)
  let rx = -500, ry = -500;   // ring (lerped)

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  // Shrink cursor on interactive elements
  document.querySelectorAll('a, button, .witem, .skill-row, .thumb, .crow').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cur-sm'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cur-sm'));
  });

  /* ─── Loader ─────────────────────────────── */
  const loader = document.getElementById('loader');
  const ldFill = document.getElementById('ld-fill');
  const ldPct  = document.getElementById('ld-pct');
  let p = 0;

  const ldTimer = setInterval(() => {
    p += Math.random() * 13 + 2;
    if (p >= 100) {
      p = 100;
      clearInterval(ldTimer);
      ldFill.style.transform = 'scaleX(1)';
      ldPct.textContent = '100%';
      setTimeout(() => {
        loader.classList.add('out');
        document.body.classList.remove('lock');
        kickHeroAnims();
      }, 550);
      return;
    }
    ldFill.style.transform = `scaleX(${p / 100})`;
    ldPct.textContent = Math.floor(p) + '%';
  }, 60);

  function kickHeroAnims() {
    setTimeout(() => {
      document.querySelectorAll('#hero-scene .hero-sub').forEach(el => el.classList.add('revealed'));
    }, 100);
    setTimeout(() => {
      document.querySelectorAll('#hero-scene .hero-lines').forEach(el => el.classList.add('revealed'));
    }, 250);
    // Also reveal the .rv scroll elements in hero
    document.querySelectorAll('#hero-scene .rv').forEach((el, i) =>
      setTimeout(() => el.classList.add('on'), i * 80)
    );
  }

  /* ═══════════════════════════════════════════════
     CIRCLE REVEAL
     • Hero:    triggers ONLY when cursor is over .hero-inner (the text block)
                and expands to fill the full viewport
     • Others:  300px spotlight that follows cursor within the section
     • Skills:  excluded entirely
  ═══════════════════════════════════════════════ */

  const HERO_ID   = 'hero-scene';
  const SKIP_IDS  = new Set(['skills-scene']);   // no circle effect here
  const CONTENT_R = 300;

  const scenes = [];

  document.querySelectorAll('.s-scene').forEach(scene => {
    if (SKIP_IDS.has(scene.id)) return;

    const orange = scene.querySelector('.sl-o');
    if (!orange) return;

    const isHero = scene.id === HERO_ID;

    const state = {
      el:      scene,
      orange,
      isHero,
      inside:  false,
      lx:      0,
      ly:      0,
      radius:  0,
      targetR: 0,
      maxR:    isHero ? Math.hypot(window.innerWidth, window.innerHeight) : CONTENT_R,
    };

    // ── HERO: only trigger on the text block, not the whole scene ──
    if (isHero) {
      const textBlock = scene.querySelector('.hero-text-block');

      if (textBlock) {
        textBlock.addEventListener('mouseenter', () => {
          state.inside  = true;
          state.targetR = state.maxR;
        });
        textBlock.addEventListener('mouseleave', e => {
          // only collapse if leaving toward outside the text block
          state.inside  = false;
          state.targetR = 0;
        });
      }

      // Track position relative to the scene (not the text block)
      scene.addEventListener('mousemove', e => {
        const rect = scene.getBoundingClientRect();
        state.lx = e.clientX - rect.left;
        state.ly = e.clientY - rect.top;
      });

      // Also close if cursor leaves the scene entirely
      scene.addEventListener('mouseleave', () => {
        state.inside  = false;
        state.targetR = 0;
      });

    } else {
      // ── OTHER SECTIONS: full section trigger ──
      scene.addEventListener('mouseenter', () => {
        state.inside  = true;
        state.targetR = state.maxR;
      });
      scene.addEventListener('mouseleave', () => {
        state.inside  = false;
        state.targetR = 0;
      });
      scene.addEventListener('mousemove', e => {
        const rect = scene.getBoundingClientRect();
        state.lx = e.clientX - rect.left;
        state.ly = e.clientY - rect.top;
      });
    }

    scenes.push(state);
  });

  /* ─── Logo tilt target ──────────────────────── */
  const logoCircle = document.querySelector('.logo-circle');

  /* ─── Single rAF: cursor + logo tilt + all circle scenes ── */
  function rafLoop() {
    /* Cursor dot — fast lerp */
    dx += (mx - dx) * 0.18;
    dy += (my - dy) * 0.18;
    curDot.style.left = dx + 'px';
    curDot.style.top  = dy + 'px';

    /* Cursor ring — slow lerp */
    if (curRing) {
      rx += (mx - rx) * 0.08;
      ry += (my - ry) * 0.08;
      curRing.style.left = rx + 'px';
      curRing.style.top  = ry + 'px';
    }

    /* Logo tilt toward cursor */
    if (logoCircle) {
      const rect  = logoCircle.getBoundingClientRect();
      const cx    = rect.left + rect.width  / 2;
      const cy    = rect.top  + rect.height / 2;
      const angle = Math.atan2(my - cy, mx - cx);
      const dist  = Math.min(Math.hypot(mx - cx, my - cy), 400);
      const pull  = (dist / 400) * 7;   // max 7px offset
      const tx    = Math.cos(angle) * pull;
      const ty    = Math.sin(angle) * pull;
      logoCircle.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
    }

    /* Circle clip per scene */
    scenes.forEach(s => {
      s.radius += (s.targetR - s.radius) * 0.09;
      const r = s.radius < 0.5 ? 0 : s.radius;
      s.orange.style.clipPath =
        `circle(${r.toFixed(1)}px at ${s.lx.toFixed(1)}px ${s.ly.toFixed(1)}px)`;
    });

    requestAnimationFrame(rafLoop);
  }
  rafLoop();

  /* Recalc hero maxR on resize */
  window.addEventListener('resize', () => {
    const hero = scenes.find(s => s.isHero);
    if (hero) {
      hero.maxR = Math.hypot(window.innerWidth, window.innerHeight);
      if (hero.inside) hero.targetR = hero.maxR;
    }
  });

  /* ═══════════════════════════════════════════════
     SKILLS — original website hover behaviour
     Hovering a row:
       • that row turns full red/orange background
       • description fades in on the right
     No circle reveal involved.
  ═══════════════════════════════════════════════ */
  document.querySelectorAll('.skill-row').forEach(row => {
    row.addEventListener('mouseenter', () => {
      // deactivate all first
      document.querySelectorAll('.skill-row').forEach(r => r.classList.remove('active'));
      row.classList.add('active');
    });
    row.addEventListener('mouseleave', () => {
      row.classList.remove('active');
    });
  });

  /* ─── Testimonials carousel ─────────────── */
  const testiData = [
    {
      quote: 'I\'m a CS student who hasn\'t broken production yet. I call that growth.',
      name: 'Akash Yati', role: 'Student', co: 'United University',
    },
    {
      quote: 'Pixel-perfect? Not always. But I aim for it every single time.',
      name: 'Akash Yati', role: 'Developer', co: 'United University',
    },
    {
      quote: 'I write CSS at 2am and wonder why it works. That\'s the craft.',
      name: 'Akash Yati', role: 'Designer', co: 'United University',
    },
  ];

  let activeThumb = 0;

  function renderTesti(idx) {
    const d = testiData[idx];
    document.querySelectorAll('.testi-text').forEach(el => el.textContent = d.quote);
    document.querySelectorAll('.testi-attr-name').forEach(el => el.textContent = d.name);
    document.querySelectorAll('.testi-attr-role').forEach(el => el.textContent = d.role);
    document.querySelectorAll('.testi-attr-co').forEach(el => el.textContent = d.co);
    document.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
  }

  document.querySelectorAll('.thumb').forEach((thumb, i) => {
    thumb.addEventListener('click', () => { activeThumb = i; renderTesti(i); });
  });
  document.querySelectorAll('.thumb-arr').forEach(btn => {
    btn.addEventListener('click', () => {
      activeThumb = (activeThumb + 1) % testiData.length;
      renderTesti(activeThumb);
    });
  });
  renderTesti(0);

  /* ─── Work modals ────────────────────────── */
  document.querySelectorAll('.witem').forEach(item => {
    item.addEventListener('click', () => {
      const m = document.getElementById(item.dataset.modal);
      if (m) { m.classList.add('open'); document.body.classList.add('lock'); }
    });
  });
  document.querySelectorAll('.modal-x').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.close).classList.remove('open');
      document.body.classList.remove('lock');
    });
  });
  document.querySelectorAll('.modal-bg').forEach(bg => {
    bg.addEventListener('click', e => {
      if (e.target === bg) { bg.classList.remove('open'); document.body.classList.remove('lock'); }
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-bg.open').forEach(m => {
        m.classList.remove('open'); document.body.classList.remove('lock');
      });
    }
  });

  /* ─── Scroll reveal ──────────────────────── */
  const rvObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const sec  = entry.target.closest('.s-scene, #skills-scene');
      const list = sec
        ? Array.from(sec.querySelectorAll('.rv:not(.on)'))
        : [entry.target];
      const idx  = list.indexOf(entry.target);
      setTimeout(() => entry.target.classList.add('on'), Math.max(0, idx) * 80);
      rvObs.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.rv').forEach(el => rvObs.observe(el));


})();
