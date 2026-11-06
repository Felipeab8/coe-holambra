/* Seleciona uma única imagem do herói antes da primeira pintura. Sem dependências. */
(function () {
  'use strict';
  const img = document.querySelector('#hm-picture img');
  if (!img) return;
  const queries = [
    ['(min-width: 1367px) and (min-aspect-ratio: 8/5)', ''],
    ['(min-width: 1000px) and (min-aspect-ratio: 8/5)', '-1600'],
    ['(min-width: 700px)', '-s'],
    ['(max-width: 600px)', '-m-800'],
  ].map(([media, suffix]) => ({ media: matchMedia(media), suffix }));
  function selecionar() {
    const pagina = document.getElementById('p-inicio-objetivo-do-coe');
    if (pagina.hidden && location.hash && !location.hash.startsWith('#inicio')) return;
    const tema = document.documentElement.dataset.theme === 'dark' ? 'escuro' : 'claro';
    const regra = queries.find(query => query.media.matches);
    const arquivo = 'img/home/hero-' + tema + (regra ? regra.suffix : '-m') + '.webp';
    if (img.getAttribute('src') !== arquivo) img.src = arquivo;
  }
  window.addEventListener('coe:pagina', selecionar);
  queries.forEach(query => query.media.addEventListener('change', selecionar));
  new MutationObserver(selecionar).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  selecionar();
})();
