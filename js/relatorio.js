/* ===== Relatório semanal ===== */

import { somarDias, minutosContados, duracaoReal, duracaoPlanejada, paraMin } from './agenda.js';

/**
 * Consolida a semana que começa em `isoSegunda` (7 dias).
 * Traz totais em minutos, percentuais por categoria e por atividade,
 * além de aderência ao planejado e pontualidade.
 *
 * Régua do "planejado": `duracaoPlanejada`, nunca `t.duracao` — ver o comentário
 * dela em agenda.js. O relatório mede o dia contra o que foi combinado, não
 * contra o que o recálculo automático deixou no lugar.
 */
export function relatorioSemana(tarefas, isoSegunda) {
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(isoSegunda, i));
  const daSemana = tarefas.filter(t => dias.includes(t.data));

  const concluidas = daSemana.filter(t => t.status === 'concluida');
  const naoRealizadas = daSemana.filter(t => t.status === 'nao_realizada');
  const emAberto = daSemana.filter(t => ['planejada', 'aguardando_checkin', 'em_andamento', 'aguardando_checkout'].includes(t.status));

  const totalRealizado = concluidas.reduce((s, t) => s + minutosContados(t), 0);
  const totalPlanejado = daSemana.reduce((s, t) => s + duracaoPlanejada(t), 0);

  const agrupar = (lista, chave) => {
    const mapa = new Map();
    lista.forEach(t => {
      const k = (typeof chave === 'function' ? chave(t) : t[chave]) || 'Sem categoria';
      const atual = mapa.get(k) || { nome: k, realizado: 0, planejado: 0, sessoes: 0, concluidas: 0 };
      atual.planejado += duracaoPlanejada(t);
      atual.sessoes += 1;
      if (t.status === 'concluida') { atual.realizado += minutosContados(t); atual.concluidas += 1; }
      mapa.set(k, atual);
    });
    return [...mapa.values()]
      .map(x => ({
        ...x,
        pctDoTotal: totalRealizado ? (x.realizado / totalRealizado) * 100 : 0,
        pctCumprido: x.planejado ? (x.realizado / x.planejado) * 100 : 0
      }))
      .sort((a, b) => b.realizado - a.realizado || b.planejado - a.planejado);
  };

  const porCategoria = agrupar(daSemana, 'categoria');
  const porAtividade = agrupar(daSemana, 'titulo');

  const porDia = dias.map(iso => {
    const doDia = daSemana.filter(t => t.data === iso);
    const feito = doDia.filter(t => t.status === 'concluida');
    return {
      data: iso,
      planejado: doDia.reduce((s, t) => s + duracaoPlanejada(t), 0),
      realizado: feito.reduce((s, t) => s + minutosContados(t), 0),
      total: doDia.length,
      concluidas: feito.length
    };
  });

  // Pontualidade: diferença entre check-in real e horário planejado
  const atrasos = concluidas
    .filter(t => t.inicioReal != null)
    .map(t => paraMin(t.inicioReal) - paraMin(t.inicioOriginal || t.inicio));
  const atrasoMedio = atrasos.length ? atrasos.reduce((s, v) => s + v, 0) / atrasos.length : null;

  // Precisão da estimativa: real x previsto nas concluídas
  const desvios = concluidas
    .map(t => { const r = duracaoReal(t); return r == null ? null : r - duracaoPlanejada(t); })
    .filter(v => v != null);
  const desvioMedio = desvios.length ? desvios.reduce((s, v) => s + v, 0) / desvios.length : null;

  return {
    dias, porCategoria, porAtividade, porDia,
    totalRealizado, totalPlanejado,
    qtdTotal: daSemana.length,
    qtdConcluidas: concluidas.length,
    qtdNaoRealizadas: naoRealizadas.length,
    qtdEmAberto: emAberto.length,
    aderencia: totalPlanejado ? (totalRealizado / totalPlanejado) * 100 : 0,
    atrasoMedio, desvioMedio
  };
}
