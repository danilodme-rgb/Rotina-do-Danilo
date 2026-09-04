/* ===== Utilidades de tempo e reprogramação proporcional ===== */

export const MIN_DIA = 1440;
export const STATUS_ABERTOS = ['planejada', 'aguardando_checkin'];

export function pad2(n) { return String(n).padStart(2, '0'); }

export function paraMin(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function paraHora(min) {
  const v = Math.max(0, Math.min(MIN_DIA - 1, Math.round(min)));
  return pad2(Math.floor(v / 60)) + ':' + pad2(v % 60);
}

export function minutosAgora(d = new Date()) { return d.getHours() * 60 + d.getMinutes(); }

export function isoDe(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

export function dataDeIso(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function hojeIso() { return isoDe(new Date()); }

export function somarDias(iso, n) {
  const d = dataDeIso(iso);
  d.setDate(d.getDate() + n);
  return isoDe(d);
}

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function nomeDia(iso) { return DIAS[dataDeIso(iso).getDay()]; }
export function nomeMes(mes) { return MESES[mes]; }

export function dataExtenso(iso) {
  const d = dataDeIso(iso);
  return `${nomeDia(iso)}, ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

export function dataCurta(iso) {
  const d = dataDeIso(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

/* Segunda-feira da semana de uma data */
export function inicioSemana(iso) {
  const d = dataDeIso(iso);
  const diff = (d.getDay() + 6) % 7; // 0 = segunda
  d.setDate(d.getDate() - diff);
  return isoDe(d);
}

export function formatarDuracao(min) {
  const v = Math.max(0, Math.round(min));
  const h = Math.floor(v / 60), m = v % 60;
  if (h && m) return `${h}h ${m}min`;
  if (h) return `${h}h`;
  return `${m}min`;
}


/* ===== Tarefa ===== */

export function fimPrevisto(t) {
  const base = t.inicioReal != null ? paraMin(t.inicioReal) : paraMin(t.inicio);
  return base + t.duracao;
}

export function duracaoReal(t) {
  if (t.inicioReal == null || t.fimReal == null) return null;
  let d = paraMin(t.fimReal) - paraMin(t.inicioReal);
  if (d < 0) d += MIN_DIA; // atravessou a meia-noite
  return d;
}

/**
 * Quanto a atividade foi PLANEJADA para durar.
 *
 * `t.duracao` não serve: o recálculo proporcional a reescreve quando o dia
 * aperta, e o botão "+15 min" também. Comparar o tempo real com ela é comparar
 * com o que o app decidiu depois — o relatório acusa "120% do planejado" quem
 * fez exatamente a hora que tinha marcado. O que o Danilo escolheu está em
 * `duracaoOriginal`, e é ela a régua de tudo que se chama "planejado".
 */
export function duracaoPlanejada(t) {
  const d = Number(t.duracaoOriginal);
  return Number.isFinite(d) && d > 0 ? d : t.duracao;
}

/* Minutos efetivamente dedicados: real quando existe, senão o planejado */
export function minutosContados(t) {
  const real = duracaoReal(t);
  return real != null ? real : duracaoPlanejada(t);
}

/**
 * Datas de uma repeticao semanal: a data base mais todo dia da semana marcado
 * ate' `ate` (inclusive a propria base). Sem dia marcado, sem `ate`, ou `ate`
 * que nao passa da base, devolve so' a base -- nunca uma lista vazia.
 * Datas ja' passadas ficam de fora: nao se programa para tras.
 */
export function gerarDatas(dataBase, diasSemana, ate) {
  if (!diasSemana.length || !ate || ate <= dataBase) return [dataBase];
  const piso = hojeIso();
  const datas = new Set([dataBase]);
  let cursor = dataBase;
  let guarda = 0;
  while (cursor < ate && guarda++ < 800) {
    cursor = somarDias(cursor, 1);
    if (diasSemana.includes(dataDeIso(cursor).getDay())) datas.add(cursor);
  }
  return [...datas].filter(d => d >= piso).sort();
}

export function ordenarPorInicio(lista) {
  return [...lista].sort((a, b) => {
    const ia = a.inicioReal != null ? paraMin(a.inicioReal) : paraMin(a.inicio);
    const ib = b.inicioReal != null ? paraMin(b.inicioReal) : paraMin(b.inicio);
    return ia - ib || a.criadaEm - b.criadaEm;
  });
}

/**
 * Reprograma as atividades ainda não iniciadas do dia.
 *
 * Regras:
 *  1. Nada começa antes de `deMin` (quando o dia "voltou" ao normal, os
 *     intervalos originais entre atividades são preservados).
 *  2. Se a corrente ultrapassar o horário limite, os intervalos são
 *     eliminados; se ainda assim não couber, todas as durações são
 *     comprimidas proporcionalmente pelo mesmo fator.
 *
 * Devolve o plano e a lista de mudanças, sem alterar as tarefas.
 */
export function planejarRestante(tarefasDoDia, deMin, limiteMin, duracaoMinima = 5, passo = 5) {
  const pendentes = tarefasDoDia
    .filter(t => STATUS_ABERTOS.includes(t.status))
    .sort((a, b) => paraMin(a.inicio) - paraMin(b.inicio) || a.criadaEm - b.criadaEm);

  const vazio = { plano: [], mudancas: [], fator: 1, comprimido: false, estouro: false, fim: deMin };
  if (!pendentes.length) return vazio;

  // 1) encadeamento preservando os intervalos planejados
  let cursor = deMin;
  let plano = pendentes.map(t => {
    const inicio = Math.max(cursor, paraMin(t.inicio));
    cursor = inicio + t.duracao;
    return { tarefa: t, inicio, duracao: t.duracao };
  });

  let fator = 1, comprimido = false, estouro = false;

  if (cursor > limiteMin && deMin >= limiteMin) {
    // já passou do horário limite: não há o que redistribuir, apenas avisa
    return { plano: [], mudancas: [], fator: 1, comprimido: false, estouro: true, fim: cursor };
  }

  if (cursor > limiteMin) {
    const disponivel = Math.max(0, limiteMin - deMin);
    const total = pendentes.reduce((s, t) => s + t.duracao, 0);

    if (disponivel >= total) {
      // 2a) as durações cabem: encurta apenas os intervalos livres,
      //     proporcionalmente, mantendo o máximo possível do plano original
      const folgas = [];
      let c = deMin;
      for (const t of pendentes) {
        const inicio = Math.max(c, paraMin(t.inicio));
        folgas.push(inicio - c);
        c = inicio + t.duracao;
      }
      const totalFolga = folgas.reduce((s, v) => s + v, 0);
      const excesso = c - limiteMin;
      const proporcao = totalFolga > 0 ? Math.max(0, 1 - excesso / totalFolga) : 0;
      const novas = folgas.map(f => Math.floor(f * proporcao));

      const montar = () => {
        let cc = deMin;
        return pendentes.map((t, i) => {
          const inicio = cc + novas[i];
          cc = inicio + t.duracao;
          return { tarefa: t, inicio, duracao: t.duracao };
        });
      };
      plano = montar();
      cursor = plano.length ? plano[plano.length - 1].inicio + plano[plano.length - 1].duracao : deMin;

      // acerta os minutos que sobraram do arredondamento
      let guarda = 0;
      while (cursor > limiteMin && guarda++ < 2000) {
        const maior = novas.reduce((idx, v, i) => (v > novas[idx] ? i : idx), 0);
        if (novas[maior] <= 0) break;
        novas[maior] -= 1;
        plano = montar();
        cursor = plano[plano.length - 1].inicio + plano[plano.length - 1].duracao;
      }
    } else {
      // 2b) compressão proporcional
      fator = total > 0 ? disponivel / total : 1;
      comprimido = true;
      let c = deMin;
      plano = pendentes.map(t => {
        // arredonda para baixo em blocos de `passo` — horários redondos e
        // nunca ultrapassa o limite por causa do arredondamento
        const bruta = t.duracao * fator;
        const duracao = Math.max(duracaoMinima, Math.floor(bruta / passo) * passo || passo);
        const item = { tarefa: t, inicio: c, duracao };
        c += duracao;
        return item;
      });
      cursor = c;
      estouro = cursor > limiteMin;
    }
  }

  const mudancas = plano
    .filter(p => paraHora(p.inicio) !== p.tarefa.inicio || p.duracao !== p.tarefa.duracao)
    .map(p => ({
      id: p.tarefa.id,
      titulo: p.tarefa.titulo,
      deInicio: p.tarefa.inicio,
      paraInicio: paraHora(p.inicio),
      deDuracao: p.tarefa.duracao,
      paraDuracao: p.duracao
    }));

  return { plano, mudancas, fator, comprimido, estouro, fim: cursor };
}
