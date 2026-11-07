/* Uma única cena por tema. O CSS faz o enquadramento sem baixar variantes duplicadas. */
(function () {
  'use strict';
  const img = document.querySelector('#hm-picture img');
  if (!img) return;
  function selecionar() {
    const pagina = document.getElementById('p-inicio-objetivo-do-coe');
    if (pagina.hidden && location.hash && !location.hash.startsWith('#inicio')) return;
    const tema = document.documentElement.dataset.theme === 'dark' ? 'escuro' : 'claro';
    const arquivo = 'img/home/hero-' + tema + '.webp';
    if (img.getAttribute('src') !== arquivo) img.src = arquivo;
  }
  window.addEventListener('coe:pagina', selecionar);
  window.addEventListener('coe:media', selecionar);
  new MutationObserver(selecionar).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  selecionar();
})();
