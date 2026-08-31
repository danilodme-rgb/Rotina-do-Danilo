/* ===== Compromissos: hora marcada, sem check-in e sem recálculo =====
 *
 * Um compromisso é um encontro com hora marcada por terceiros — reunião,
 * consulta, exame, aula. Diferente das atividades da rotina, ele:
 *   - nunca é movido pela reprogramação proporcional (a hora é fixa);
 *   - não exige check-in nem check-out, e por isso não fica "cobrando";
 *   - não entra nas contas de aderência do relatório semanal.
 * O app só avisa na hora certa e mostra quando ele colide com o plano do dia.
 */

import { paraMin } from './agenda.js';

export const TIPOS_SUGERIDOS = [
  'Reunião', 'Consulta', 'Exame', 'Aula', 'Entrevista', 'Viagem', 'Aniversário', 'Outro'
];

export const SITUACOES = {
  marcado: 'Marcado',
  realizado: 'Aconteceu',
  cancelado: 'Cancelado'
};

export function fimCompromisso(c) { return paraMin(c.inicio) + c.duracao; }

export function ordenarCompromissos(lista) {
  return [...lista].sort((a, b) => paraMin(a.inicio) - paraMin(b.inicio) || a.criadaEm - b.criadaEm);
}

/* Atividades da rotina que se sobrepõem ao compromisso.
   O que já foi concluído ou descartado é história, não conflito. */
export function conflitos(c, tarefasDoDia) {
  if (c.situacao === 'cancelado') return [];
  const ini = paraMin(c.inicio);
  const fim = ini + c.duracao;
  return tarefasDoDia.filter(t => {
    if (t.status === 'concluida' || t.status === 'nao_realizada') return false;
    const ti = t.inicioReal != null ? paraMin(t.inicioReal) : paraMin(t.inicio);
    return ti < fim && ti + t.duracao > ini;
  });
}

/* Compromisso acontecendo neste minuto */
export function acontecendoAgora(lista, agoraMin) {
  return ordenarCompromissos(lista).find(c =>
    c.situacao === 'marcado' && paraMin(c.inicio) <= agoraMin && fimCompromisso(c) > agoraMin) || null;
}

/* Próximo compromisso ainda por vir no dia */
export function proximoCompromisso(lista, agoraMin) {
  return ordenarCompromissos(lista).find(c =>
    c.situacao === 'marcado' && paraMin(c.inicio) > agoraMin) || null;
}

/* Quanto tempo os compromissos ocupam, por tipo */
export function resumoPorTipo(lista) {
  const mapa = new Map();
  lista.filter(c => c.situacao !== 'cancelado').forEach(c => {
    const atual = mapa.get(c.tipo) || { nome: c.tipo, minutos: 0, quantidade: 0 };
    atual.minutos += c.duracao;
    atual.quantidade += 1;
    mapa.set(c.tipo, atual);
  });
  return [...mapa.values()].sort((a, b) => b.minutos - a.minutos);
}
