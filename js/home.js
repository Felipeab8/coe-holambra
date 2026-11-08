/* COE Holambra · comportamento da Home (somente leitura/visual)
   - Revelação suave das seções ao rolar
   - Parallax leve da imagem do herói
   - Ajuste do espaço da barra superior do painel
   Não altera rotas, dados nem outras páginas. */
(function () {
  'use strict';
  var root = document.getElementById('p-inicio-objetivo-do-coe');
  if (!root) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero = root.querySelector('.hm-hero');

  /* 1. Revelação ao rolar ------------------------------------------------ */
  var items = [].slice.call(root.querySelectorAll('.hm-rv'));
  if (!reduce && 'IntersectionObserver' in window) {
    root.classList.add('hm-js');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* 3. O cabeçalho é compartilhado com as páginas internas. */
  var bar = document.querySelector('.barra-topo');
  function align() {
    if (bar) root.style.setProperty('--hm-nav', Math.ceil(bar.getBoundingClientRect().height + 24) + 'px');
  }
  if (bar && 'ResizeObserver' in window) new ResizeObserver(align).observe(bar);
  align();

  /* 4. Parallax leve da imagem ------------------------------------------- */
  if (!reduce && hero) {
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var r = hero.getBoundingClientRect();
        if (root.hidden || r.bottom < 0 || r.height === 0) return;
        var p = Math.min(Math.max(-r.top / r.height, 0), 1);
        hero.style.setProperty('--hm-py', (p * 46).toFixed(1) + 'px');
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  }
})();
