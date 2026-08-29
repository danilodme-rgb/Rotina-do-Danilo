/* ===== Persistência local (apenas neste aparelho) ===== */

const CHAVE = 'rotina-danilo-v1';

export const CONFIG_PADRAO = {
  antecedencia: 5,        // minutos de aviso antes de iniciar/terminar
  limite: '23:00',        // horário limite do dia
  autoRecalculo: true,    // reprogramar sozinho após check-in/check-out
  som: true,
  insistir: true,         // repetir o aviso a cada 10 min enquanto houver pendência
  duracaoMinima: 5        // piso da compressão proporcional
};

export const estado = {
  versao: 1,
  config: { ...CONFIG_PADRAO },
  tarefas: []
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
  } catch (e) {
    console.warn('Não consegui ler os dados salvos:', e);
  }
}

export function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({
      versao: estado.versao, config: estado.config, tarefas: estado.tarefas
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

export function exportar() {
  return JSON.stringify({ versao: estado.versao, config: estado.config, tarefas: estado.tarefas }, null, 2);
}

export function importar(texto) {
  const dados = JSON.parse(texto);
  if (!dados || !Array.isArray(dados.tarefas)) throw new Error('Arquivo inválido');
  estado.config = { ...CONFIG_PADRAO, ...(dados.config || {}) };
  estado.tarefas = dados.tarefas.map(normalizar);
  salvar();
}

export function apagarTudo() {
  estado.tarefas = [];
  estado.config = { ...CONFIG_PADRAO };
  localStorage.removeItem(CHAVE);
}
