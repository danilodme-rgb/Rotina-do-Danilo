/* ===== Notificações do sistema + som ===== */

let audio = null;

export function permissao() {
  return ('Notification' in window) ? Notification.permission : 'indisponivel';
}

export async function pedirPermissao() {
  if (!('Notification' in window)) return 'indisponivel';
  if (Notification.permission === 'granted') return 'granted';
  try { return await Notification.requestPermission(); }
  catch { return Notification.permission; }
}

export async function notificar(titulo, corpo, { tag = 'rotina', persistente = false } = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  const opcoes = {
    body: corpo,
    tag,
    renotify: true,
    requireInteraction: persistente,
    icon: 'icone.svg',
    badge: 'icone.svg',
    silent: false
  };
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) { await reg.showNotification(titulo, opcoes); return true; }
    }
    new Notification(titulo, opcoes);
    return true;
  } catch (e) {
    console.warn('Notificação falhou:', e);
    return false;
  }
}

/* Bipe curto, sem depender de arquivo de áudio */
export function tocar(tipo = 'aviso') {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const notas = tipo === 'inicio' ? [660, 880] : tipo === 'fim' ? [880, 560] : [740];
    notas.forEach((freq, i) => {
      const osc = audio.createOscillator();
      const vol = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      vol.gain.setValueAtTime(0.0001, audio.currentTime);
      vol.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.03 + i * 0.22);
      vol.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.30 + i * 0.22);
      osc.connect(vol).connect(audio.destination);
      osc.start(audio.currentTime + i * 0.22);
      osc.stop(audio.currentTime + 0.34 + i * 0.22);
    });
  } catch { /* som é opcional */ }
}

/* Título da aba piscando enquanto houver pendência */
let tituloOriginal = document.title;
let intervaloTitulo = null;

export function piscarTitulo(texto) {
  if (intervaloTitulo) return;
  let alterna = false;
  intervaloTitulo = setInterval(() => {
    document.title = (alterna = !alterna) ? texto : tituloOriginal;
  }, 1200);
}

export function pararTitulo() {
  if (!intervaloTitulo) return;
  clearInterval(intervaloTitulo);
  intervaloTitulo = null;
  document.title = tituloOriginal;
}
