/* ===== Componentes de interface: modal e avisos na tela ===== */

const caixaModais = () => document.getElementById('modais');
const caixaToasts = () => document.getElementById('toasts');

let pilha = [];

/**
 * abrirModal({ titulo, subtitulo, corpo, acoes, fechavel })
 * acoes: [{ texto, tipo:'primario'|'perigo'|'', aoClicar(modal) }]
 * Devolve o elemento .modal (para ler campos internos).
 */
export function abrirModal({ titulo, subtitulo = '', corpo = '', acoes = [], fechavel = true }) {
  const caixa = caixaModais();
  const fundo = document.createElement('div');
  fundo.className = 'fundo-modal';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <h2>${titulo}</h2>
    ${subtitulo ? `<p class="subtitulo">${subtitulo}</p>` : ''}
    <div class="corpo-modal">${corpo}</div>
    <div class="acoes-modal"></div>
  `;

  const areaAcoes = modal.querySelector('.acoes-modal');
  acoes.forEach(a => {
    const b = document.createElement('button');
    b.className = 'btn' + (a.tipo === 'primario' ? ' btn-primario' : a.tipo === 'perigo' ? ' btn-perigo' : a.tipo === 'fantasma' ? ' btn-fantasma' : '');
    b.textContent = a.texto;
    b.addEventListener('click', () => a.aoClicar ? a.aoClicar(modal) : fecharModal());
    areaAcoes.appendChild(b);
  });

  if (fechavel) fundo.addEventListener('click', fecharModal);

  caixa.innerHTML = '';
  caixa.appendChild(fundo);
  caixa.appendChild(modal);
  caixa.scrollTop = 0;
  caixa.classList.add('aberto');
  document.body.classList.add('travado');
  pilha.push(modal);

  const primeiro = modal.querySelector('input, select, textarea, button');
  if (primeiro) setTimeout(() => primeiro.focus(), 60);
  return modal;
}

export function fecharModal() {
  const caixa = caixaModais();
  caixa.innerHTML = '';
  caixa.classList.remove('aberto');
  document.body.classList.remove('travado');
  pilha = [];
}

export function modalAberto() { return caixaModais().classList.contains('aberto'); }

export function aviso(texto, ms = 4200) {
  const caixa = caixaToasts();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = texto;
  caixa.appendChild(el);
  while (caixa.children.length > 3) caixa.firstElementChild.remove();
  setTimeout(() => el.remove(), ms);
}

export function escapar(txt = '') {
  return String(txt).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalAberto()) fecharModal();
});
