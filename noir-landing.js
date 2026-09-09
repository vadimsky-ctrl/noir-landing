/* Noir VPN landing. Interactions: nav state, mobile drawer, FAQ accordion, scroll reveal */
(function () {
  'use strict';

  // ---- sticky nav shadow on scroll ----
  var nav = document.getElementById('nav');
  var onScroll = function () {
    if (window.scrollY > 12) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- mobile drawer ----
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  var scrim = document.getElementById('scrim');
  var setDrawer = function (open) {
    burger.classList.toggle('open', open);
    drawer.classList.toggle('open', open);
    scrim.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var m = document.getElementById('mcta'); if (m) m.classList.remove('show'); }
    else { toggleMcta(); }
  };
  burger.addEventListener('click', function () {
    setDrawer(!drawer.classList.contains('open'));
  });
  scrim.addEventListener('click', function () { setDrawer(false); });
  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setDrawer(false); });
  });

  // ---- sticky mobile CTA bar ----
  var mcta = document.getElementById('mcta');
  var heroEl = document.querySelector('.hero');
  var footerEl = document.querySelector('.footer');
  function toggleMcta() {
    if (!mcta) return;
    if (drawer.classList.contains('open')) { mcta.classList.remove('show'); return; }
    var y = window.scrollY;
    var heroH = heroEl ? heroEl.offsetHeight : 420;
    var nearFoot = footerEl && (y + window.innerHeight > footerEl.offsetTop + 90);
    mcta.classList.toggle('show', y > heroH * 0.62 && !nearFoot);
  }
  toggleMcta();
  window.addEventListener('scroll', toggleMcta, { passive: true });
  window.addEventListener('resize', toggleMcta);

  // ---- выбор пути под единственным CTA ----
  // Кнопок «Попробовать VPN» на странице несколько (шапка, герой, тариф,
  // финал, плавающая), но ведут они в одно место: шторку с двумя дверями.
  var pick = document.getElementById('pick');
  var pickScrim = document.getElementById('pick-scrim');
  var pickClose = document.getElementById('pick-close');
  function setPick(open) {
    if (!pick || !pickScrim) return;
    if (open) {
      pick.hidden = false;
      pickScrim.hidden = false;
      // Кадр на применение hidden: без него анимация не проигрывается.
      requestAnimationFrame(function () {
        pick.classList.add('open');
        pickScrim.classList.add('open');
      });
      document.body.style.overflow = 'hidden';
      if (drawer.classList.contains('open')) setDrawer(false);
    } else {
      pick.classList.remove('open');
      pickScrim.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () {
        if (!pick.classList.contains('open')) { pick.hidden = true; pickScrim.hidden = true; }
      }, 240);
    }
  }
  document.querySelectorAll('[data-cta]').forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      setPick(true);
    });
  });
  if (pickScrim) pickScrim.addEventListener('click', function () { setPick(false); });
  if (pickClose) pickClose.addEventListener('click', function () { setPick(false); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && pick && pick.classList.contains('open')) setPick(false);
  });

  // ---- FAQ accordion ----
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      // close siblings
      document.querySelectorAll('.faq-item.open').forEach(function (other) {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-a').style.height = '0px';
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        a.style.height = '0px';
      } else {
        item.classList.add('open');
        a.style.height = a.firstElementChild.offsetHeight + 'px';
      }
    });
  });
  // keep open FAQ height correct on resize
  window.addEventListener('resize', function () {
    var open = document.querySelector('.faq-item.open');
    if (open) {
      var a = open.querySelector('.faq-a');
      a.style.height = a.firstElementChild.offsetHeight + 'px';
    }
  });

  // ---- scroll reveal ----
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    // failsafe: never leave content hidden if the observer misbehaves
    setTimeout(function () {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }, 1600);
  }
})();

/* ============================================================
   ЯЗЫК: предложение, но никогда не редирект.
   Правило жёсткое: человек, пришедший на русскую страницу, не должен
   оказаться на английской без своего клика. Поэтому здесь только
   плашка с предложением; выбор запоминается и больше не переспрашивается.
   ============================================================ */
(function () {
  var KEY = 'noir_lang';
  var here = (document.documentElement.getAttribute('lang') || 'ru').slice(0, 2);
  var other = here === 'ru' ? 'en' : 'ru';

  function remember(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }
  function chosen() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  /* клик по переключателю в хедере или в меню — это осознанный выбор */
  document.querySelectorAll('[data-lang-to]').forEach(function (a) {
    a.addEventListener('click', function () { remember(a.getAttribute('data-lang-to')); });
  });

  if (chosen()) return;

  /* чего хочет браузер: берём первый языковой тег из списка предпочтений */
  var prefs = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ''];
  var wants = String(prefs[0] || '').slice(0, 2).toLowerCase();
  if (!wants || wants === here) return;
  /* предлагаем только противоположную версию: третьего языка у нас нет */
  if (here === 'ru' && wants === 'ru') return;
  if (here === 'en' && wants !== 'ru') return;

  var COPY = {
    en: {
      title: 'This page is available in English',
      sub: 'Same site, English copy.',
      go: 'Read in English',
      close: 'Dismiss',
      href: '/en/'
    },
    ru: {
      title: 'Есть русская версия',
      sub: 'Тот же сайт, русский текст.',
      go: 'Читать по-русски',
      close: 'Закрыть',
      href: '/'
    }
  }[other];

  /* адрес берём у переключателя в шапке: на статье он ведёт на статью,
     а не на главную. Константа увела бы читателя не туда. */
  var pair = document.querySelector('[data-lang-to="' + other + '"]');
  if (pair && pair.getAttribute('href')) COPY.href = pair.getAttribute('href');

  var bar = document.createElement('div');
  bar.className = 'langbar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', COPY.title);
  bar.innerHTML =
    '<div class="langbar-tx"><b></b><i></i>' +
    '<a class="langbar-go" href="' + COPY.href + '" hreflang="' + other + '" data-lang-to="' + other + '"></a></div>' +
    '<button class="langbar-x" type="button"></button>';
  bar.querySelector('b').textContent = COPY.title;
  bar.querySelector('i').textContent = COPY.sub;
  bar.querySelector('.langbar-go').textContent = COPY.go;
  var x = bar.querySelector('.langbar-x');
  x.textContent = '×';
  x.setAttribute('aria-label', COPY.close);

  document.body.appendChild(bar);
  bar.querySelector('.langbar-go').addEventListener('click', function () { remember(other); });
  x.addEventListener('click', function () {
    remember(here);              /* «остаюсь тут» — тоже выбор, больше не спрашиваем */
    bar.classList.remove('in');
    setTimeout(function () { bar.remove(); }, 280);
  });

  setTimeout(function () {
    bar.classList.add('show');
    requestAnimationFrame(function () { bar.classList.add('in'); });
  }, 900);
})();
