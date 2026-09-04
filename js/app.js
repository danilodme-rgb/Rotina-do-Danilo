/* ===== Rotina do Danilo — aplicação principal ===== */

import {
  paraMin, paraHora, minutosAgora, hojeIso, isoDe, dataDeIso, somarDias,
  dataExtenso, dataCurta, nomeMes, nomeDia, inicioSemana, formatarDuracao,
  fimPrevisto, duracaoReal, minutosContados, duracaoPlanejada, ordenarPorInicio, planejarRestante, pad2
} from './agenda.js';

import {
  estado, carregar, salvar, criarTarefa, acharTarefa, tarefasDoDia, removerTarefa,
  removerSerie, categorias, zerarAvisos, exportar, importar, apagarTudo, uid, CONFIG_PADRAO
} from './estado.js';

import { abrirModal, fecharModal, modalAberto, aviso, escapar } from './interface.js';
import { permissao, pedirPermissao, notificar, tocar, piscarTitulo, pararTitulo } from './notificacoes.js';
import { relatorioSemana } from './relatorio.js';

/* ---------- estado da tela ---------- */
let dataSelecionada = hojeIso();
let mesVisivel = { ano: new Date().getFullYear(), mes: new Date().getMonth() };
let semanaSelecionada = inicioSemana(hojeIso());
let filaPendencias = [];
let processandoFila = false;

const ROTULOS = {
  planejada: 'Planejada',
  aguardando_checkin: 'Aguardando check-in',
  em_andamento: 'Em andamento',
  aguardando_checkout: 'Aguardando check-out',
  concluida: 'Concluída',
  nao_realizada: 'Não realizada'
};

const $ = s => document.querySelector(s);
const limiteMin = () => paraMin(estado.config.limite || '23:00');
/* dias já encerrados não recebem programação nova */
const ehPassado = iso => iso < hojeIso();
const maiorData = (a, b) => (a > b ? a : b);

/* ================= INÍCIO ================= */

function iniciar() {
  carregar();
  ligarEventos();
  abrirPendenciasAntigas();
  tique(true);
  renderTudo();
  processarFila();
  setInterval(() => tique(), 10000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      tique(true);
      renderTudo();
      montarFilaPendencias();
      processarFila();
    }
  });
}

function ligarEventos() {
  document.getElementById('abas').addEventListener('click', e => {
    const b = e.target.closest('.aba');
    if (!b) return;
    trocarAba(b.dataset.aba);
  });

  $('#diaAnterior').addEventListener('click', () => { dataSelecionada = somarDias(dataSelecionada, -1); renderDia(); renderCalendario(); });
  $('#diaSeguinte').addEventListener('click', () => { dataSelecionada = somarDias(dataSelecionada, 1); renderDia(); renderCalendario(); });
  $('#btnNova').addEventListener('click', () => formularioTarefa(null));
  $('#btnImprevisto').addEventListener('click', () => fluxoImprevisto());
  $('#btnRecalcular').addEventListener('click', () => recalcularManual());
  $('#btnCopiarDia').addEventListener('click', () => fluxoCopiarDia());
  $('#listaTarefas').addEventListener('click', aoClicarNaLista);

  $('#mesAnterior').addEventListener('click', () => { mudarMes(-1); });
  $('#mesSeguinte').addEventListener('click', () => { mudarMes(1); });
  $('#gradeMes').addEventListener('click', e => {
    const c = e.target.closest('.celula:not(.fora)');
    if (!c) return;
    dataSelecionada = c.dataset.data;
    trocarAba('dia');
  });

  $('#semanaAnterior').addEventListener('click', () => { semanaSelecionada = somarDias(semanaSelecionada, -7); renderRelatorio(); });
  $('#semanaSeguinte').addEventListener('click', () => { semanaSelecionada = somarDias(semanaSelecionada, 7); renderRelatorio(); });

  $('#btnPermissao').addEventListener('click', async () => {
    const r = await pedirPermissao();
    if (r === 'granted') { aviso('Alertas ativados.'); notificar('Rotina do Danilo', 'Alertas ativados. Vou te avisar na hora certa.'); }
    else aviso('O navegador não liberou as notificações.');
    renderAjustes(); atualizarBotaoPermissao();
  });

  // ajustes
  $('#cfgAntecedencia').addEventListener('change', e => { estado.config.antecedencia = Math.max(1, Number(e.target.value) || 5); salvar(); renderDia(); });
  $('#cfgSom').addEventListener('change', e => { estado.config.som = e.target.checked; salvar(); if (e.target.checked) tocar('aviso'); });
  $('#cfgRepetir').addEventListener('change', e => { estado.config.insistir = e.target.checked; salvar(); });
  $('#cfgLimite').addEventListener('change', e => { estado.config.limite = e.target.value || '23:00'; salvar(); renderDia(); });
  $('#cfgAutoRecalculo').addEventListener('change', e => { estado.config.autoRecalculo = e.target.checked; salvar(); });
  $('#cfgDuracaoMinima').addEventListener('change', e => { estado.config.duracaoMinima = Math.max(1, Number(e.target.value) || 5); salvar(); });

  $('#btnExportar').addEventListener('click', exportarBackup);
  $('#btnImportar').addEventListener('click', () => $('#arquivoImportar').click());
  $('#arquivoImportar').addEventListener('change', importarBackup);
  $('#btnLimpar').addEventListener('click', confirmarLimpeza);
}

function trocarAba(nome) {
  document.querySelectorAll('.aba').forEach(b => b.classList.toggle('ativa', b.dataset.aba === nome));
  document.querySelectorAll('.secao').forEach(s => s.classList.toggle('ativa', s.id === 'aba-' + nome));
  if (nome === 'dia') renderDia();
  if (nome === 'calendario') renderCalendario();
  if (nome === 'relatorio') renderRelatorio();
  if (nome === 'ajustes') renderAjustes();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderTudo() {
  renderDia();
  renderCalendario();
  renderRelatorio();
  renderAjustes();
  renderAgora();
  atualizarBotaoPermissao();
}

/* ================= DIA ================= */

function renderDia() {
  const iso = dataSelecionada;
  const hoje = hojeIso();
  $('#tituloDia').textContent = iso === hoje ? 'Hoje' : iso === somarDias(hoje, 1) ? 'Amanhã' : iso === somarDias(hoje, -1) ? 'Ontem' : nomeDia(iso);
  $('#subtituloDia').textContent = dataExtenso(iso);

  const passado = ehPassado(iso);
  $('#btnNova').disabled = passado;
  $('#btnImprevisto').disabled = passado;
  $('#btnRecalcular').disabled = passado;
  $('#avisoPassado').hidden = !passado;

  const lista = ordenarPorInicio(tarefasDoDia(iso));
  const planejado = lista.reduce((s, t) => s + duracaoPlanejada(t), 0);
  const feito = lista.filter(t => t.status === 'concluida');
  const realizado = feito.reduce((s, t) => s + minutosContados(t), 0);
  const pct = planejado ? Math.round((realizado / planejado) * 100) : 0;

  $('#resumoDia').innerHTML = `
    <div class="bloco-resumo"><b>${feito.length}/${lista.length}</b><span>Concluídas</span></div>
    <div class="bloco-resumo"><b>${formatarDuracao(realizado)}</b><span>Realizado</span></div>
    <div class="bloco-resumo"><b>${pct}%</b><span>do planejado</span></div>`;

  const ul = $('#listaTarefas');
  if (!lista.length) {
    ul.innerHTML = passado
      ? `<li class="vazio">Nenhuma atividade foi programada neste dia.</li>`
      : `<li class="vazio">Nenhuma atividade neste dia.<br><span class="fraco">Toque em “+ Nova atividade” para programar.</span></li>`;
    return;
  }

  const agora = minutosAgora();
  ul.innerHTML = lista.map(t => cartaoTarefa(t, iso === hoje, agora)).join('');
}

function cartaoTarefa(t, ehHoje, agora) {
  const ini = t.inicioReal ?? t.inicio;
  const fim = paraHora(fimPrevisto(t));
  const real = duracaoReal(t);

  const chips = [`<span class="chip">${escapar(t.categoria)}</span>`];
  const st = t.status;
  if (st === 'em_andamento') {
    const restam = fimPrevisto(t) - agora;
    chips.push(`<span class="chip chip-destaque">Em andamento${ehHoje ? ` · ${restam >= 0 ? 'faltam ' + formatarDuracao(restam) : 'passou ' + formatarDuracao(-restam)}` : ''}</span>`);
  } else if (st === 'aguardando_checkin') chips.push('<span class="chip chip-alerta">Check-in pendente</span>');
  else if (st === 'aguardando_checkout') chips.push('<span class="chip chip-alerta">Check-out pendente</span>');
  else chips.push(`<span class="chip">${ROTULOS[st]}</span>`);

  if (t.ajustada) chips.push(`<span class="chip">reprogramada · previsto ${t.inicioOriginal}</span>`);
  if (t.origem === 'imprevisto') chips.push('<span class="chip">imprevisto</span>');
  if (t.serie) chips.push('<span class="chip">série</span>');

  let realTexto = '';
  if (t.inicioReal) realTexto = `real: ${t.inicioReal}${t.fimReal ? ' → ' + t.fimReal : ' → ...'}${real != null ? ' · ' + formatarDuracao(real) : ''}`;

  const botoes = [];
  if (st === 'planejada' || st === 'aguardando_checkin') {
    botoes.push(`<button class="btn btn-primario" data-acao="checkin" data-id="${t.id}">Check-in</button>`);
    botoes.push(`<button class="btn" data-acao="naoFiz" data-id="${t.id}">Não vou fazer</button>`);
  }
  if (st === 'em_andamento' || st === 'aguardando_checkout') {
    botoes.push(`<button class="btn btn-primario" data-acao="checkout" data-id="${t.id}">Check-out</button>`);
    botoes.push(`<button class="btn" data-acao="mais" data-id="${t.id}">+15 min</button>`);
  }
  if (st === 'concluida' || st === 'nao_realizada') {
    botoes.push(`<button class="btn" data-acao="reabrir" data-id="${t.id}">Reabrir</button>`);
  }
  botoes.push(`<button class="btn btn-fantasma" data-acao="editar" data-id="${t.id}">Editar</button>`);
  botoes.push(`<button class="btn btn-fantasma" data-acao="excluir" data-id="${t.id}">Excluir</button>`);

  return `
    <li class="tarefa" data-status="${st}" data-id="${t.id}">
      <div class="horario">
        <strong>${ini}</strong>
        <span>→ ${fim}</span>
        <em>${formatarDuracao(t.duracao)}</em>
      </div>
      <div class="info">
        <h3>${escapar(t.titulo)}</h3>
        <p class="meta">${chips.join('')}</p>
        ${realTexto ? `<p class="meta">${realTexto}</p>` : ''}
        ${t.obs ? `<p class="meta">${escapar(t.obs)}</p>` : ''}
      </div>
      <div class="acoes-tarefa">${botoes.join('')}</div>
    </li>`;
}

function aoClicarNaLista(e) {
  const b = e.target.closest('button[data-acao]');
  if (!b) return;
  const t = acharTarefa(b.dataset.id);
  if (!t) return;
  const acoes = {
    checkin: () => modalCheckin(t),
    checkout: () => modalCheckout(t),
    mais: () => esticar(t, 15),
    naoFiz: () => marcarNaoRealizada(t),
    reabrir: () => reabrir(t),
    editar: () => formularioTarefa(t),
    excluir: () => confirmarExclusao(t)
  };
  (acoes[b.dataset.acao] || (() => {}))();
}

/* ================= CHECK-IN / CHECK-OUT ================= */

function modalCheckin(t, dePendencia = false) {
  const sugerido = t.data === hojeIso() ? paraHora(minutosAgora()) : t.inicio;
  const modal = abrirModal({
    titulo: 'Check-in',
    subtitulo: `${escapar(t.titulo)} · previsto para ${t.inicio} (${formatarDuracao(t.duracao)})`,
    fechavel: !dePendencia,
    corpo: `
      <label class="campo">
        <span>A que horas você começou (ou está começando)?</span>
        <input type="time" id="horaCheckin" value="${sugerido}">
      </label>
      <p class="fraco">As atividades seguintes do dia serão recalculadas proporcionalmente até ${estado.config.limite}.</p>`,
    acoes: [
      { texto: 'Confirmar check-in', tipo: 'primario', aoClicar: m => { fazerCheckin(t, m.querySelector('#horaCheckin').value || sugerido); fecharModal(); seguirFila(); } },
      { texto: 'Ainda não iniciei', aoClicar: () => { adiarPendencia(t); fecharModal(); seguirFila(); } },
      { texto: 'Não vou fazer', tipo: 'perigo', aoClicar: () => { marcarNaoRealizada(t, true); fecharModal(); seguirFila(); } }
    ]
  });
  return modal;
}

function fazerCheckin(t, hora) {
  t.inicioReal = hora;
  t.status = 'em_andamento';
  zerarAvisos(t);
  t.avisos.pre = true;
  t.avisos.inicio = true;
  salvar();

  const atraso = paraMin(hora) - paraMin(t.inicio);
  recalcularAPartirDe(t.data, paraMin(hora) + t.duracao,
    atraso === 0 ? 'check-in no horário' : `check-in ${atraso > 0 ? formatarDuracao(atraso) + ' depois' : formatarDuracao(-atraso) + ' antes'} do previsto`);

  aviso(`Check-in às ${hora} — bom trabalho em “${t.titulo}”.`);
  renderTudo();
}

function modalCheckout(t, dePendencia = false) {
  const sugerido = t.data === hojeIso() ? paraHora(minutosAgora()) : paraHora(fimPrevisto(t));
  abrirModal({
    titulo: 'Check-out',
    subtitulo: `${escapar(t.titulo)} · começou ${t.inicioReal || t.inicio} · previsão de término ${paraHora(fimPrevisto(t))}`,
    fechavel: !dePendencia,
    corpo: `
      <label class="campo">
        <span>A que horas você terminou?</span>
        <input type="time" id="horaCheckout" value="${sugerido}">
      </label>
      <label class="campo">
        <span>Observação (opcional)</span>
        <input type="text" id="obsCheckout" placeholder="Como foi?" value="${escapar(t.obs || '')}">
      </label>`,
    acoes: [
      { texto: 'Concluir', tipo: 'primario', aoClicar: m => { fazerCheckout(t, m.querySelector('#horaCheckout').value || sugerido, m.querySelector('#obsCheckout').value); fecharModal(); seguirFila(); } },
      { texto: 'Ainda estou fazendo (+15 min)', aoClicar: () => { esticar(t, 15); fecharModal(); seguirFila(); } },
      { texto: 'Não concluí', tipo: 'perigo', aoClicar: () => { marcarNaoRealizada(t, true); fecharModal(); seguirFila(); } }
    ]
  });
}

function fazerCheckout(t, hora, obs) {
  t.fimReal = hora;
  t.status = 'concluida';
  if (obs != null) t.obs = obs;
  t.avisos.fim = true;
  salvar();

  const real = duracaoReal(t);
  recalcularAPartirDe(t.data, paraMin(hora), `check-out de “${t.titulo}”`);
  aviso(`Concluída às ${hora}${real != null ? ` · ${formatarDuracao(real)} (previsto ${formatarDuracao(t.duracao)})` : ''}.`);
  renderTudo();
}

function esticar(t, minutos) {
  t.duracao += minutos;
  if (t.status === 'aguardando_checkout') { t.status = 'em_andamento'; t.avisos.preFim = false; t.avisos.fim = false; }
  salvar();
  const base = t.inicioReal != null ? paraMin(t.inicioReal) : paraMin(t.inicio);
  recalcularAPartirDe(t.data, base + t.duracao, `+${minutos} min em “${t.titulo}”`, [t.id]);
  aviso(`Mais ${minutos} minutos para “${t.titulo}”.`);
  renderTudo();
}

function marcarNaoRealizada(t, silencioso = false) {
  t.status = 'nao_realizada';
  salvar();
  const base = t.inicioReal != null ? paraMin(t.inicioReal) : paraMin(t.inicio);
  recalcularAPartirDe(t.data, Math.max(base, t.data === hojeIso() ? minutosAgora() : base), `“${t.titulo}” não realizada`);
  if (!silencioso) aviso(`“${t.titulo}” marcada como não realizada.`);
  renderTudo();
}

function reabrir(t) {
  t.status = t.inicioReal ? 'em_andamento' : 'planejada';
  t.fimReal = null;
  zerarAvisos(t);
  salvar();
  renderTudo();
}

function adiarPendencia(t) {
  t.status = 'aguardando_checkin';
  t.avisos.ultimoLembrete = Date.now();
  salvar();
  aviso(`“${t.titulo}” continua em aberto, esperando o seu check-in.`);
  renderTudo();
}

/* ================= RECÁLCULO ================= */

function recalcularAPartirDe(data, deMin, motivo, ignorarIds = [], forcado = false) {
  if (!estado.config.autoRecalculo && !forcado) return null;
  if (data < hojeIso()) return null;

  const lista = tarefasDoDia(data).filter(t => !ignorarIds.includes(t.id));
  const r = planejarRestante(lista, deMin, limiteMin(), estado.config.duracaoMinima);
  if (!r.mudancas.length) return r;

  r.plano.forEach(p => {
    const novoInicio = paraHora(p.inicio);
    if (p.tarefa.inicio !== novoInicio || p.tarefa.duracao !== p.duracao) {
      p.tarefa.inicio = novoInicio;
      p.tarefa.duracao = p.duracao;
      p.tarefa.ajustada = true;
      zerarAvisos(p.tarefa);
    }
  });
  salvar();

  const compressao = r.comprimido ? ` · durações comprimidas para ${Math.round(r.fator * 100)}%` : '';
  aviso(`${r.mudancas.length} atividade(s) reprogramada(s) — ${motivo}${compressao}.`);
  if (r.estouro) {
    aviso(`Mesmo comprimindo não cabe tudo até ${estado.config.limite}. Vale remover ou adiar alguma atividade.`, 7000);
  }
  return r;
}

function recalcularManual() {
  const data = dataSelecionada;
  const de = data === hojeIso() ? minutosAgora() : paraMin('00:00');
  const emAndamento = tarefasDoDia(data).find(t => ['em_andamento', 'aguardando_checkout'].includes(t.status));
  const partida = emAndamento ? Math.max(de, fimPrevisto(emAndamento)) : de;
  const r = recalcularAPartirDe(data, partida, 'recálculo manual', [], true);
  if (!r || !r.mudancas.length) aviso('Nada a reprogramar: o dia já cabe no horário limite.');
  renderTudo();
}

/* ================= FORMULÁRIO DE ATIVIDADE ================= */

function formularioTarefa(tarefa) {
  const novo = !tarefa;
  if (novo && ehPassado(dataSelecionada)) {
    aviso('Este dia já passou — programe a partir de hoje.');
    return;
  }
  const base = tarefa || {
    data: dataSelecionada,
    titulo: '',
    categoria: '',
    inicio: dataSelecionada > hojeIso()
      ? '08:00'
      : paraHora(Math.min(limiteMin() - 30, Math.ceil((minutosAgora() + 10) / 5) * 5)),
    duracao: 30,
    obs: ''
  };
  const listaCat = categorias().map(c => `<option value="${escapar(c)}"></option>`).join('');
  const diasBotoes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    .map((d, i) => `<span class="dia-semana" data-dia="${i}">${d}</span>`).join('');

  abrirModal({
    titulo: novo ? 'Nova atividade' : 'Editar atividade',
    subtitulo: dataExtenso(base.data),
    corpo: `
      <label class="campo">
        <span>O que você vai fazer</span>
        <input type="text" id="fTitulo" value="${escapar(base.titulo)}" placeholder="Ex.: Estudar edital" autocomplete="off">
      </label>
      <label class="campo">
        <span>Categoria</span>
        <input type="text" id="fCategoria" list="listaCategorias" value="${escapar(base.categoria)}" placeholder="Ex.: Estudos" autocomplete="off">
        <datalist id="listaCategorias">${listaCat}</datalist>
      </label>
      <div class="duplo">
        <label class="campo"><span>Início previsto</span><input type="time" id="fInicio" value="${base.inicio}"></label>
        <label class="campo"><span>Duração (min)</span><input type="number" id="fDuracao" min="5" step="5" value="${base.duracao}"></label>
      </div>
      <label class="campo">
        <span>Observação (opcional)</span>
        <input type="text" id="fObs" value="${escapar(base.obs || '')}">
      </label>
      ${novo ? `
      <div class="campo">
        <span>Repetir nos dias da semana</span>
        <div class="dias-semana" id="fDias">${diasBotoes}</div>
      </div>
      <label class="campo"><span>Repetir até</span><input type="date" id="fAte" min="${base.data}" value="${somarDias(base.data, 28)}"></label>
      <p class="fraco">Sem nenhum dia marcado, a atividade fica só em ${dataCurta(base.data)}.</p>` : ''}
      ${!novo && tarefa.serie ? `
      <label class="linha-opcao"><input type="checkbox" id="fSerie"><span>Aplicar também aos próximos dias desta série</span></label>` : ''}
    `,
    acoes: [
      { texto: novo ? 'Programar' : 'Salvar', tipo: 'primario', aoClicar: m => salvarFormulario(m, tarefa) },
      { texto: 'Cancelar', aoClicar: () => fecharModal() }
    ]
  });

  const caixaDias = document.getElementById('fDias');
  if (caixaDias) {
    caixaDias.addEventListener('click', e => {
      const d = e.target.closest('.dia-semana');
      if (d) d.classList.toggle('marcado');
    });
  }
}

function salvarFormulario(m, tarefa) {
  const titulo = m.querySelector('#fTitulo').value.trim();
  const categoria = m.querySelector('#fCategoria').value.trim() || 'Geral';
  const inicio = m.querySelector('#fInicio').value || '08:00';
  const duracao = Math.max(5, Number(m.querySelector('#fDuracao').value) || 30);
  const obs = m.querySelector('#fObs').value.trim();

  if (!titulo) { aviso('Dê um nome para a atividade.'); return; }

  if (tarefa) {
    const aplicarSerie = m.querySelector('#fSerie')?.checked;
    const antes = { inicio: tarefa.inicio, duracao: tarefa.duracao };
    Object.assign(tarefa, { titulo, categoria, inicio, duracao, obs });
    if (tarefa.status === 'planejada' || tarefa.status === 'aguardando_checkin') {
      tarefa.inicioOriginal = inicio;
      tarefa.duracaoOriginal = duracao;
      tarefa.ajustada = false;
      zerarAvisos(tarefa);
    }
    if (aplicarSerie && tarefa.serie) {
      estado.tarefas
        .filter(t => t.serie === tarefa.serie && t.data > tarefa.data && t.status === 'planejada')
        .forEach(t => {
          Object.assign(t, { titulo, categoria, inicio, duracao, obs, inicioOriginal: inicio, duracaoOriginal: duracao, ajustada: false });
          zerarAvisos(t);
        });
    }
    salvar();
    aviso(antes.inicio !== inicio || antes.duracao !== duracao ? 'Atividade atualizada e horário ajustado.' : 'Atividade atualizada.');
  } else {
    const marcados = [...m.querySelectorAll('.dia-semana.marcado')].map(d => Number(d.dataset.dia));
    const ate = m.querySelector('#fAte').value;
    const datas = gerarDatas(dataSelecionada, marcados, ate);
    const serie = datas.length > 1 ? uid() : null;
    datas.forEach(data => criarTarefa({
      data, titulo, categoria, inicio, duracao, obs, serie,
      inicioOriginal: inicio, duracaoOriginal: duracao
    }));
    salvar();
    aviso(datas.length > 1 ? `Programada em ${datas.length} dias.` : 'Atividade programada.');
  }

  fecharModal();
  renderTudo();
}

function gerarDatas(dataBase, diasSemana, ate) {
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

function confirmarExclusao(t) {
  const acoes = [{ texto: 'Excluir só este dia', tipo: 'perigo', aoClicar: () => { removerTarefa(t.id); salvar(); fecharModal(); renderTudo(); aviso('Atividade excluída.'); } }];
  if (t.serie) acoes.push({ texto: 'Excluir esta e as próximas da série', tipo: 'perigo', aoClicar: () => { removerSerie(t.serie, t.data); salvar(); fecharModal(); renderTudo(); aviso('Série excluída a partir deste dia.'); } });
  acoes.push({ texto: 'Cancelar', aoClicar: () => fecharModal() });
  abrirModal({ titulo: 'Excluir atividade', subtitulo: escapar(t.titulo), corpo: '<p class="fraco">Isso não pode ser desfeito.</p>', acoes });
}

/* ================= IMPREVISTO ================= */

function fluxoImprevisto() {
  if (ehPassado(dataSelecionada)) {
    aviso('Este dia já passou — imprevistos só valem de hoje em diante.');
    return;
  }
  const abertas = ordenarPorInicio(tarefasDoDia(dataSelecionada).filter(t => ['planejada', 'aguardando_checkin'].includes(t.status)));
  const opcoes = abertas.map(t => `<option value="${t.id}">${escapar(t.titulo)} (${t.inicio} · ${formatarDuracao(t.duracao)})</option>`).join('');

  abrirModal({
    titulo: 'Imprevisto',
    subtitulo: 'O que mudou na sua rotina agora?',
    corpo: `
      <label class="campo">
        <span>Tipo</span>
        <select id="iTipo">
          <option value="nova">Encaixar uma atividade que não estava prevista</option>
          <option value="trocar" ${abertas.length ? '' : 'disabled'}>Trocar a ordem: puxar uma atividade já programada</option>
        </select>
      </label>
      <div id="iNova">
        <label class="campo"><span>O que você vai fazer</span><input type="text" id="iTitulo" placeholder="Ex.: Levar o carro na oficina"></label>
        <label class="campo"><span>Categoria</span><input type="text" id="iCategoria" list="listaCategorias" placeholder="Ex.: Pessoal">
          <datalist id="listaCategorias">${categorias().map(c => `<option value="${escapar(c)}"></option>`).join('')}</datalist>
        </label>
      </div>
      <div id="iTrocar" hidden>
        <label class="campo"><span>Qual atividade vai acontecer agora</span><select id="iTarefa">${opcoes}</select></label>
      </div>
      <div class="duplo">
        <label class="campo"><span>Horário de início</span><input type="time" id="iInicio" value="${paraHora(minutosAgora())}"></label>
        <label class="campo"><span>Previsão de duração (min)</span><input type="number" id="iDuracao" min="5" step="5" value="30"></label>
      </div>
      <p class="fraco">O restante do dia é reorganizado proporcionalmente até ${estado.config.limite}.</p>`,
    acoes: [
      { texto: 'Aplicar', tipo: 'primario', aoClicar: aplicarImprevisto },
      { texto: 'Cancelar', aoClicar: () => fecharModal() }
    ]
  });

  const sel = document.getElementById('iTipo');
  sel.addEventListener('change', () => {
    const trocar = sel.value === 'trocar';
    document.getElementById('iNova').hidden = trocar;
    document.getElementById('iTrocar').hidden = !trocar;
    const alvo = acharTarefa(document.getElementById('iTarefa')?.value);
    if (trocar && alvo) document.getElementById('iDuracao').value = alvo.duracao;
  });
}

function aplicarImprevisto(m) {
  const tipo = m.querySelector('#iTipo').value;
  const inicio = m.querySelector('#iInicio').value || paraHora(minutosAgora());
  const duracao = Math.max(5, Number(m.querySelector('#iDuracao').value) || 30);

  let alvo;
  if (tipo === 'trocar') {
    alvo = acharTarefa(m.querySelector('#iTarefa').value);
    if (!alvo) { aviso('Escolha uma atividade.'); return; }
    alvo.inicio = inicio;
    alvo.duracao = duracao;
    alvo.ajustada = true;
    zerarAvisos(alvo);
  } else {
    const titulo = m.querySelector('#iTitulo').value.trim();
    if (!titulo) { aviso('Diga o que você vai fazer.'); return; }
    alvo = criarTarefa({
      data: dataSelecionada, titulo,
      categoria: m.querySelector('#iCategoria').value.trim() || 'Imprevisto',
      inicio, duracao, origem: 'imprevisto',
      inicioOriginal: inicio, duracaoOriginal: duracao
    });
  }
  salvar();

  recalcularAPartirDe(dataSelecionada, paraMin(inicio) + duracao, `imprevisto: “${alvo.titulo}”`, [alvo.id], true);
  fecharModal();
  renderTudo();
  aviso(`“${alvo.titulo}” encaixada às ${inicio}.`);
}

/* ================= COPIAR DIA ================= */

function fluxoCopiarDia() {
  const lista = tarefasDoDia(dataSelecionada);
  if (!lista.length) { aviso('Este dia não tem atividades para copiar.'); return; }
  const diasBotoes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    .map((d, i) => `<span class="dia-semana" data-dia="${i}">${d}</span>`).join('');

  abrirModal({
    titulo: 'Copiar o dia',
    subtitulo: `${lista.length} atividade(s) de ${dataCurta(dataSelecionada)}`,
    corpo: `
      <div class="campo"><span>Para quais dias da semana</span><div class="dias-semana" id="cDias">${diasBotoes}</div></div>
      <label class="campo"><span>Até a data</span><input type="date" id="cAte" min="${hojeIso()}" value="${somarDias(maiorData(dataSelecionada, hojeIso()), 7)}"></label>
      <label class="linha-opcao"><input type="checkbox" id="cLimpar"><span>Substituir o que já existir nesses dias</span></label>`,
    acoes: [
      {
        texto: 'Copiar', tipo: 'primario', aoClicar: m => {
          const dias = [...m.querySelectorAll('.dia-semana.marcado')].map(d => Number(d.dataset.dia));
          const ate = m.querySelector('#cAte').value;
          const limpar = m.querySelector('#cLimpar').checked;
          if (!dias.length) { aviso('Marque pelo menos um dia da semana.'); return; }
          const destinos = gerarDatas(dataSelecionada, dias, ate)
            .filter(d => d !== dataSelecionada && !ehPassado(d));
          if (!destinos.length) { aviso('Nenhum dia de destino de hoje em diante nesse período.'); return; }
          const serie = uid();
          destinos.forEach(data => {
            if (limpar) estado.tarefas = estado.tarefas.filter(t => !(t.data === data && t.status === 'planejada'));
            lista.forEach(t => criarTarefa({
              data, titulo: t.titulo, categoria: t.categoria,
              inicio: t.inicioOriginal || t.inicio, duracao: t.duracaoOriginal || t.duracao,
              obs: t.obs, serie,
              inicioOriginal: t.inicioOriginal || t.inicio, duracaoOriginal: t.duracaoOriginal || t.duracao
            }));
          });
          salvar(); fecharModal(); renderTudo();
          aviso(`Copiado para ${destinos.length} dia(s).`);
        }
      },
      { texto: 'Cancelar', aoClicar: () => fecharModal() }
    ]
  });

  document.getElementById('cDias').addEventListener('click', e => {
    const d = e.target.closest('.dia-semana');
    if (d) d.classList.toggle('marcado');
  });
}

/* ================= CALENDÁRIO ================= */

function mudarMes(delta) {
  const d = new Date(mesVisivel.ano, mesVisivel.mes + delta, 1);
  mesVisivel = { ano: d.getFullYear(), mes: d.getMonth() };
  renderCalendario();
}

function renderCalendario() {
  $('#tituloMes').textContent = `${nomeMes(mesVisivel.mes)} de ${mesVisivel.ano}`;
  const primeiro = new Date(mesVisivel.ano, mesVisivel.mes, 1);
  const inicioGrade = new Date(primeiro);
  inicioGrade.setDate(1 - primeiro.getDay());

  const hoje = hojeIso();
  let html = '';
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicioGrade);
    d.setDate(inicioGrade.getDate() + i);
    const iso = isoDe(d);
    const fora = d.getMonth() !== mesVisivel.mes;
    const lista = tarefasDoDia(iso);
    const feitas = lista.filter(t => t.status === 'concluida').length;
    const classe = ['celula'];
    if (fora) classe.push('fora');
    if (iso === hoje) classe.push('hoje');
    if (iso === dataSelecionada) classe.push('selecionada');

    let marcador = '';
    if (lista.length) {
      const tipo = feitas === lista.length ? 'ponto-cheio' : feitas > 0 ? 'ponto-parcial' : 'ponto-vazio';
      marcador = `<span class="ponto ${tipo}"></span><span class="mini">${feitas}/${lista.length}</span>`;
    }
    html += `<div class="${classe.join(' ')}" data-data="${iso}"><b>${d.getDate()}</b><div class="pontos">${marcador}</div></div>`;
  }
  $('#gradeMes').innerHTML = html;
}

/* ================= RELATÓRIO ================= */

function renderRelatorio() {
  const r = relatorioSemana(estado.tarefas, semanaSelecionada);
  const fim = somarDias(semanaSelecionada, 6);
  $('#tituloSemana').textContent = `${dataCurta(semanaSelecionada)} a ${dataCurta(fim)}`;

  const linha = (x, total) => `
    <div class="linha-barra">
      <div class="linha-barra-topo">
        <b>${escapar(x.nome)}</b>
        <span>${formatarDuracao(x.realizado)} · ${x.pctDoTotal.toFixed(1).replace('.', ',')}% do tempo</span>
      </div>
      <div class="barra"><i style="width:${total ? Math.max(2, (x.realizado / total) * 100) : 0}%"></i></div>
      <div class="linha-barra-topo" style="margin-top:4px">
        <span class="fraco">planejado ${formatarDuracao(x.planejado)} · ${Math.round(x.pctCumprido)}% do planejado</span>
        <span class="fraco">${x.concluidas}/${x.sessoes} atividades</span>
      </div>
    </div>`;

  const maior = Math.max(1, ...r.porCategoria.map(c => c.realizado));

  const html = `
    <div class="cartao">
      <h2>Resumo da semana</h2>
      <div class="grade-numeros">
        <div class="bloco-resumo"><b>${formatarDuracao(r.totalRealizado)}</b><span>Realizado</span></div>
        <div class="bloco-resumo"><b>${formatarDuracao(r.totalPlanejado)}</b><span>Planejado</span></div>
        <div class="bloco-resumo"><b>${Math.round(r.aderencia)}%</b><span>Do planejado</span></div>
        <div class="bloco-resumo"><b>${r.qtdConcluidas}/${r.qtdTotal}</b><span>Concluídas</span></div>
      </div>
      <p class="fraco" style="margin-top:10px">
        ${r.qtdNaoRealizadas} não realizada(s) · ${r.qtdEmAberto} em aberto
        ${r.atrasoMedio != null ? ` · check-in médio ${r.atrasoMedio >= 0 ? formatarDuracao(r.atrasoMedio) + ' depois' : formatarDuracao(-r.atrasoMedio) + ' antes'} do previsto` : ''}
        ${r.desvioMedio != null ? ` · duração real ${r.desvioMedio >= 0 ? formatarDuracao(r.desvioMedio) + ' acima' : formatarDuracao(-r.desvioMedio) + ' abaixo'} da estimativa` : ''}
      </p>
    </div>

    <div class="cartao">
      <h2>Por categoria</h2>
      ${r.porCategoria.length ? r.porCategoria.map(c => linha(c, maior)).join('') : '<p class="fraco">Sem dados nesta semana.</p>'}
    </div>

    <div class="cartao">
      <h2>Por atividade</h2>
      ${r.porAtividade.length ? `
      <table>
        <thead><tr><th>Atividade</th><th class="num">Tempo · planejado</th><th class="num">Do tempo</th><th class="num">Do planejado</th></tr></thead>
        <tbody>
          ${r.porAtividade.map(a => `
            <tr>
              <td>${escapar(a.nome)}</td>
              <td class="num">${formatarDuracao(a.realizado)} <span class="fraco">· ${formatarDuracao(a.planejado)}</span></td>
              <td class="num">${a.pctDoTotal.toFixed(1).replace('.', ',')}%</td>
              <td class="num">${Math.round(a.pctCumprido)}%</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <p class="fraco" style="margin-top:8px">
        <b>Tempo</b> é o que você gastou de verdade, do check-in ao check-out.
        <b>Do tempo</b> é a fatia dessa atividade na semana.
        <b>Do planejado</b> compara o tempo gasto com o que você tinha marcado — acima de 100% é
        porque durou mais do que o combinado.
      </p>` : '<p class="fraco">Sem dados nesta semana.</p>'}
    </div>

    <div class="cartao">
      <h2>Dia a dia</h2>
      <table>
        <thead><tr><th>Dia</th><th class="num">Realizado</th><th class="num">Planejado</th><th class="num">Feitas</th></tr></thead>
        <tbody>
          ${r.porDia.map(d => `
            <tr>
              <td>${nomeDia(d.data).slice(0, 3)} ${dataCurta(d.data)}</td>
              <td class="num">${formatarDuracao(d.realizado)}</td>
              <td class="num">${formatarDuracao(d.planejado)}</td>
              <td class="num">${d.concluidas}/${d.total}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  $('#conteudoRelatorio').innerHTML = html;
}

/* ================= AJUSTES ================= */

function renderAjustes() {
  const c = estado.config;
  $('#cfgAntecedencia').value = c.antecedencia;
  $('#cfgSom').checked = c.som;
  $('#cfgRepetir').checked = c.insistir;
  $('#cfgLimite').value = c.limite;
  $('#cfgAutoRecalculo').checked = c.autoRecalculo;
  $('#cfgDuracaoMinima').value = c.duracaoMinima;

  const p = permissao();
  $('#estadoPermissao').textContent =
    p === 'granted' ? 'Notificações do sistema: liberadas.' :
    p === 'denied' ? 'Notificações bloqueadas no navegador — libere nas permissões do site.' :
    p === 'indisponivel' ? 'Este navegador não oferece notificações; os avisos aparecem dentro do app.' :
    'Notificações ainda não autorizadas — toque em “Ativar alertas”.';

  const total = estado.tarefas.length;
  const dias = new Set(estado.tarefas.map(t => t.data)).size;
  $('#infoArmazenamento').textContent = `${total} atividade(s) em ${dias} dia(s) guardadas neste aparelho.`;
}

function atualizarBotaoPermissao() {
  const p = permissao();
  $('#btnPermissao').hidden = (p === 'granted' || p === 'indisponivel');
}

function exportarBackup() {
  const blob = new Blob([exportar()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rotina-danilo-${hojeIso()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  aviso('Backup gerado.');
}

function importarBackup(e) {
  const arquivo = e.target.files?.[0];
  if (!arquivo) return;
  const leitor = new FileReader();
  leitor.onload = () => {
    try { importar(leitor.result); renderTudo(); aviso('Backup importado.'); }
    catch { aviso('Não consegui ler esse arquivo.'); }
  };
  leitor.readAsText(arquivo);
  e.target.value = '';
}

function confirmarLimpeza() {
  abrirModal({
    titulo: 'Apagar tudo',
    subtitulo: 'Todas as atividades e ajustes serão removidos deste aparelho.',
    corpo: '<p class="fraco">Exporte um backup antes, se quiser guardar o histórico.</p>',
    acoes: [
      { texto: 'Apagar mesmo assim', tipo: 'perigo', aoClicar: () => { apagarTudo(); fecharModal(); renderTudo(); aviso('Tudo apagado.'); } },
      { texto: 'Cancelar', aoClicar: () => fecharModal() }
    ]
  });
}

/* ================= ALERTAS E PENDÊNCIAS ================= */

function tique(inicial = false) {
  const agora = new Date();
  $('#relogio').textContent = `${pad2(agora.getHours())}:${pad2(agora.getMinutes())} · ${dataCurta(hojeIso())}`;

  const mudou = verificarAlertas(agora);
  renderAgora();
  if (mudou && !inicial) { renderDia(); renderCalendario(); }
}

function verificarAlertas(agoraData) {
  const hoje = hojeIso();
  const agora = minutosAgora(agoraData);
  const lead = estado.config.antecedencia;
  const som = estado.config.som;
  let mudou = false;

  for (const t of ordenarPorInicio(tarefasDoDia(hoje))) {
    const ini = paraMin(t.inicio);

    if (t.status === 'planejada') {
      if (!t.avisos.pre && agora >= ini - lead && agora < ini) {
        t.avisos.pre = true; mudou = true;
        disparar(`Faltam ${lead} min`, `${t.titulo} começa às ${t.inicio}.`, 'pre-' + t.id, som && 'aviso');
      }
      if (agora >= ini) {
        t.status = 'aguardando_checkin';
        t.avisos.pre = true; t.avisos.inicio = true; t.avisos.ultimoLembrete = Date.now();
        mudou = true;
        disparar('Hora de começar', `${t.titulo} — faça o check-in para iniciar.`, 'ini-' + t.id, som && 'inicio', true);
        pedirAcao(t, 'checkin');
      }
    } else if (t.status === 'em_andamento') {
      const fim = fimPrevisto(t);
      if (!t.avisos.preFim && agora >= fim - lead && agora < fim) {
        t.avisos.preFim = true; mudou = true;
        disparar(`Faltam ${lead} min`, `${t.titulo} termina às ${paraHora(fim)}.`, 'prefim-' + t.id, som && 'aviso');
      }
      if (agora >= fim) {
        t.status = 'aguardando_checkout';
        t.avisos.fim = true; t.avisos.ultimoLembrete = Date.now();
        mudou = true;
        disparar('Hora de encerrar', `${t.titulo} — faça o check-out.`, 'fim-' + t.id, som && 'fim', true);
        pedirAcao(t, 'checkout');
      }
    }

    if (t.status === 'aguardando_checkin' || t.status === 'aguardando_checkout') {
      if (estado.config.insistir && Date.now() - (t.avisos.ultimoLembrete || 0) > 600000) {
        t.avisos.ultimoLembrete = Date.now(); mudou = true;
        const eCheckin = t.status === 'aguardando_checkin';
        disparar(eCheckin ? 'Check-in pendente' : 'Check-out pendente',
          `${t.titulo} continua em aberto${eCheckin ? ` (previsto ${t.inicio})` : ''}.`,
          'lembrete-' + t.id, som && 'aviso', true);
      }
    }
  }

  const pendentes = pendenciasAbertas();
  if (pendentes.length) piscarTitulo(`(${pendentes.length}) Pendência — Rotina`);
  else pararTitulo();

  if (mudou) salvar();
  return mudou;
}

function disparar(titulo, corpo, tag, somTipo, persistente = false) {
  notificar(titulo, corpo, { tag, persistente });
  if (somTipo) tocar(somTipo);
  if (document.visibilityState === 'visible') aviso(`${titulo}: ${corpo}`);
}

function pendenciasAbertas() {
  return estado.tarefas
    .filter(t => ['aguardando_checkin', 'aguardando_checkout'].includes(t.status))
    .sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio));
}

/* Ao abrir o app: atividades de dias anteriores que ficaram sem resposta */
function abrirPendenciasAntigas() {
  const hoje = hojeIso();
  let mudou = false;
  estado.tarefas.forEach(t => {
    if (t.data < hoje && t.status === 'planejada') { t.status = 'aguardando_checkin'; mudou = true; }
    if (t.data < hoje && t.status === 'em_andamento') { t.status = 'aguardando_checkout'; mudou = true; }
  });
  if (mudou) salvar();
  montarFilaPendencias();
}

/* Só pergunta sobre hoje e ontem; o resto fica visível na lista do dia */
function montarFilaPendencias() {
  const limiteData = somarDias(hojeIso(), -1);
  const novas = pendenciasAbertas().filter(t => t.data >= limiteData);
  const jaNaFila = new Set(filaPendencias.map(t => t.id));
  novas.forEach(t => { if (!jaNaFila.has(t.id)) filaPendencias.push(t); });
}

function processarFila() {
  if (processandoFila || modalAberto()) return;
  const t = filaPendencias.shift();
  if (!t) { processandoFila = false; return; }
  if (!['aguardando_checkin', 'aguardando_checkout'].includes(t.status)) return processarFila();

  processandoFila = true;
  const restantes = filaPendencias.length;
  const sufixo = restantes ? ` · mais ${restantes} pendência(s)` : '';

  if (t.status === 'aguardando_checkin') {
    abrirModal({
      titulo: 'Você iniciou esta atividade?',
      subtitulo: `${escapar(t.titulo)} · ${dataCurta(t.data)} às ${t.inicio}${sufixo}`,
      fechavel: false,
      corpo: `
        <label class="campo">
          <span>Se já começou, informe o horário do check-in</span>
          <input type="time" id="pHora" value="${t.data === hojeIso() ? paraHora(minutosAgora()) : t.inicio}">
        </label>
        <p class="fraco">Se não iniciou, a atividade continua em aberto esperando você.</p>`,
      acoes: [
        { texto: 'Sim, iniciei', tipo: 'primario', aoClicar: m => { fazerCheckin(t, m.querySelector('#pHora').value || t.inicio); fecharModal(); seguirFila(); } },
        { texto: 'Ainda não', aoClicar: () => { adiarPendencia(t); fecharModal(); seguirFila(); } },
        { texto: 'Não fiz', tipo: 'perigo', aoClicar: () => { marcarNaoRealizada(t, true); fecharModal(); seguirFila(); } }
      ]
    });
  } else {
    abrirModal({
      titulo: 'Você concluiu esta atividade?',
      subtitulo: `${escapar(t.titulo)} · começou ${t.inicioReal || t.inicio}${sufixo}`,
      fechavel: false,
      corpo: `
        <label class="campo">
          <span>Horário do check-out</span>
          <input type="time" id="pHora" value="${t.data === hojeIso() ? paraHora(minutosAgora()) : paraHora(fimPrevisto(t))}">
        </label>
        <p class="fraco">Sem check-out, a atividade fica em aberto e continua te cobrando.</p>`,
      acoes: [
        { texto: 'Concluí', tipo: 'primario', aoClicar: m => { fazerCheckout(t, m.querySelector('#pHora').value || paraHora(fimPrevisto(t))); fecharModal(); seguirFila(); } },
        { texto: 'Ainda estou fazendo', aoClicar: () => { t.status = 'em_andamento'; t.avisos.fim = false; t.avisos.preFim = false; salvar(); fecharModal(); renderTudo(); seguirFila(); } },
        { texto: 'Não concluí', tipo: 'perigo', aoClicar: () => { marcarNaoRealizada(t, true); fecharModal(); seguirFila(); } }
      ]
    });
  }
}

function seguirFila() {
  processandoFila = false;
  setTimeout(processarFila, 250);
}

/* Pede check-in/check-out na hora, se o app estiver aberto e livre */
function pedirAcao(t, tipo) {
  if (document.visibilityState !== 'visible') {
    if (!filaPendencias.some(p => p.id === t.id)) filaPendencias.push(t);
    return;
  }
  if (modalAberto()) {
    if (!filaPendencias.some(p => p.id === t.id)) filaPendencias.push(t);
    return;
  }
  processandoFila = true;
  if (tipo === 'checkin') modalCheckin(t, true); else modalCheckout(t, true);
}

/* ================= PAINEL "AGORA" ================= */

function renderAgora() {
  const hoje = hojeIso();
  const agora = minutosAgora();
  const lista = ordenarPorInicio(tarefasDoDia(hoje));
  const painel = $('#painelAgora');
  const texto = $('#agoraTexto');

  const pendente = lista.find(t => ['aguardando_checkin', 'aguardando_checkout'].includes(t.status))
    || pendenciasAbertas()[0];
  const rodando = lista.find(t => t.status === 'em_andamento');

  if (pendente) {
    texto.textContent = pendente.status === 'aguardando_checkin'
      ? `Check-in pendente: ${pendente.titulo} (previsto ${pendente.inicio}${pendente.data !== hoje ? ' · ' + dataCurta(pendente.data) : ''})`
      : `Check-out pendente: ${pendente.titulo}`;
    painel.classList.add('pulsando');
  } else if (rodando) {
    const restam = fimPrevisto(rodando) - agora;
    texto.textContent = restam >= 0
      ? `${rodando.titulo} · termina ${paraHora(fimPrevisto(rodando))} (faltam ${formatarDuracao(restam)})`
      : `${rodando.titulo} · passou ${formatarDuracao(-restam)} do previsto`;
    painel.classList.add('pulsando');
  } else {
    const proxima = lista.find(t => t.status === 'planejada' && paraMin(t.inicio) >= agora);
    texto.textContent = proxima
      ? `Próxima: ${proxima.titulo} às ${proxima.inicio} (em ${formatarDuracao(paraMin(proxima.inicio) - agora)})`
      : lista.length ? 'Dia encerrado — nada pendente.' : 'Nenhuma atividade programada para hoje.';
    painel.classList.remove('pulsando');
  }
}

/* ================= GO ================= */
iniciar();
