/* Noir VPN landing — interactions: nav state, mobile drawer, FAQ accordion, scroll reveal */
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
