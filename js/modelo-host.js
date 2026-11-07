/* Contrato de tema/atividade entre o painel e seus modelos locais. */
(function () {
  'use strict';
  window.COE_MODELO_ATIVO = true;
  if (parent !== window) {
    try { document.documentElement.dataset.theme = parent.document.documentElement.dataset.theme || 'light'; } catch (erro) { /* host externo não é autorizado */ }
  }
  addEventListener('message', event => {
    if (event.source !== parent || event.origin !== location.origin) return;
    const message = event.data;
    if (!message || message.tipo !== 'coe:modelo') return;
    if (message.tema === 'light' || message.tema === 'dark') document.documentElement.dataset.theme = message.tema;
    window.COE_MODELO_ATIVO = message.ativo === true;
  });
  function indisponivel() {
    if (document.getElementById('modelo-erro')) return;
    const box = document.createElement('div'); box.id = 'modelo-erro'; box.setAttribute('role', 'alert');
    box.style.cssText = 'position:fixed;inset:auto 16px 16px;z-index:9999;padding:16px;background:#fff4dc;color:#38270b;border:1px solid #a77d2c;border-radius:12px;font:16px/1.5 system-ui';
    box.textContent = 'O modelo 3D não pôde ser carregado. Verifique a conexão com as bibliotecas externas e o suporte a WebGL. ';
    const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Tentar novamente';
    retry.addEventListener('click', () => location.reload()); box.append(retry); document.body.append(box);
  }
  addEventListener('error', event => {
    if ((event.target.tagName === 'SCRIPT' && event.target.src) || /WebGL|THREE is not defined/.test(event.message || '')) {
      if (document.body) indisponivel(); else addEventListener('DOMContentLoaded', indisponivel, { once: true });
    }
  }, true);
})();
