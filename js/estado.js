/* ===== Persistência local (apenas neste aparelho) ===== */

const CHAVE = 'rotina-danilo-v1';

export const CONFIG_PADRAO = {
  antecedencia: 5,        // minutos de aviso antes de iniciar/terminar
  limite: '23:00',        // horário limite do dia
  autoRecalculo: true,    // reprogramar sozinho após check-in/check-out
  som: true,
  insistir: true,         // repetir o aviso a cada 10 min enquanto houver pendência
  duracaoMinima: 5,       // piso da compressão proporcional
  avisoCompromisso: 60    // minutos de antecedência padrão dos compromissos
};

export const estado = {
  versao: 2,
  config: { ...CONFIG_PADRAO },
  tarefas: [],
  compromissos: []
};

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return;
    const dados = JSON.parse(bruto);
    estado.config = { ...CONFIG_PADRAO, ...(dados.config || {}) };
    estado.tarefas = Array.isArray(dados.tarefas) ? dados.tarefas.map(normalizar) : [];
    // backups da versão 1 não têm compromissos
    estado.compromissos = Array.isArray(dados.compromissos) ? dados.compromissos.map(normalizarCompromisso) : [];
  } catch (e) {
    console.warn('Não consegui ler os dados salvos:', e);
  }
}

export function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({
      versao: estado.versao, config: estado.config,
      tarefas: estado.tarefas, compromissos: estado.compromissos
    }));
    return true;
  } catch (e) {
    console.error('Falha ao salvar:', e);
    return false;
  }
}

function normalizar(t) {
  return {
    id: t.id || uid(),
    data: t.data,
    titulo: t.titulo || 'Sem título',
    categoria: t.categoria || 'Geral',
    inicio: t.inicio || '08:00',
    duracao: Number(t.duracao) || 30,
    inicioReal: t.inicioReal ?? null,
    fimReal: t.fimReal ?? null,
    status: t.status || 'planejada',
    serie: t.serie ?? null,
    obs: t.obs || '',
    origem: t.origem || 'planejada',
    ajustada: !!t.ajustada,
    inicioOriginal: t.inicioOriginal || t.inicio || '08:00',
    duracaoOriginal: Number(t.duracaoOriginal) || Number(t.duracao) || 30,
    criadaEm: t.criadaEm || Date.now(),
    avisos: { pre: false, inicio: false, preFim: false, fim: false, ultimoLembrete: 0, ...(t.avisos || {}) }
  };
}

export function criarTarefa(dados) {
  const t = normalizar({ ...dados, id: uid(), criadaEm: Date.now() });
  estado.tarefas.push(t);
  return t;
}

export function acharTarefa(id) { return estado.tarefas.find(t => t.id === id) || null; }

export function tarefasDoDia(iso) { return estado.tarefas.filter(t => t.data === iso); }

export function removerTarefa(id) {
  const i = estado.tarefas.findIndex(t => t.id === id);
  if (i >= 0) estado.tarefas.splice(i, 1);
}

export function removerSerie(serie, apartirDe) {
  estado.tarefas = estado.tarefas.filter(
    t => !(t.serie === serie && t.data >= apartirDe && t.status === 'planejada')
  );
}

export function categorias() {
  return [...new Set(estado.tarefas.map(t => t.categoria).filter(Boolean))].sort();
}

export function zerarAvisos(t) {
  t.avisos = { pre: false, inicio: false, preFim: false, fim: false, ultimoLembrete: 0 };
}

/* ===== Compromissos (hora marcada, fora do recálculo) ===== */

const SITUACOES_VALIDAS = ['marcado', 'realizado', 'cancelado'];

function normalizarCompromisso(c) {
  const avisar = Number(c.avisar);
  return {
    id: c.id || uid(),
    data: c.data,
    titulo: c.titulo || 'Compromisso',
    tipo: c.tipo || 'Compromisso',
    inicio: c.inicio || '09:00',
    duracao: Math.max(5, Number(c.duracao) || 60),
    local: c.local || '',
    com: c.com || '',
    obs: c.obs || '',
    avisar: Number.isFinite(avisar) ? Math.max(0, Math.round(avisar)) : CONFIG_PADRAO.avisoCompromisso,
    situacao: SITUACOES_VALIDAS.includes(c.situacao) ? c.situacao : 'marcado',
    serie: c.serie ?? null,
    criadaEm: c.criadaEm || Date.now(),
    avisos: { pre: false, inicio: false, ...(c.avisos || {}) }
  };
}

export function criarCompromisso(dados) {
  const c = normalizarCompromisso({ ...dados, id: uid(), criadaEm: Date.now() });
  estado.compromissos.push(c);
  return c;
}

export function acharCompromisso(id) { return estado.compromissos.find(c => c.id === id) || null; }

export function compromissosDoDia(iso) { return estado.compromissos.filter(c => c.data === iso); }

export function removerCompromisso(id) {
  const i = estado.compromissos.findIndex(c => c.id === id);
  if (i >= 0) estado.compromissos.splice(i, 1);
}

export function removerSerieCompromissos(serie, apartirDe) {
  estado.compromissos = estado.compromissos.filter(
    c => !(c.serie === serie && c.data >= apartirDe && c.situacao === 'marcado')
  );
}

export function tiposDeCompromisso() {
  return [...new Set(estado.compromissos.map(c => c.tipo).filter(Boolean))].sort();
}

export function zerarAvisosCompromisso(c) {
  c.avisos = { pre: false, inicio: false };
}

export function exportar() {
  return JSON.stringify({
    versao: estado.versao, config: estado.config,
    tarefas: estado.tarefas, compromissos: estado.compromissos
  }, null, 2);
}

export function importar(texto) {
  const dados = JSON.parse(texto);
  if (!dados || !Array.isArray(dados.tarefas)) throw new Error('Arquivo inválido');
  estado.config = { ...CONFIG_PADRAO, ...(dados.config || {}) };
  estado.tarefas = dados.tarefas.map(normalizar);
  estado.compromissos = Array.isArray(dados.compromissos) ? dados.compromissos.map(normalizarCompromisso) : [];
  salvar();
}

export function apagarTudo() {
  estado.tarefas = [];
  estado.compromissos = [];
  estado.config = { ...CONFIG_PADRAO };
  localStorage.removeItem(CHAVE);
}
