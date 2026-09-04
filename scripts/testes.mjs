#!/usr/bin/env node
// Bateria de comportamento da Rotina do Danilo.
//
// A conferencia de fumaca (scripts/conferir.mjs) prova que os arquivos abrem.
// Nao prova conta nenhuma -- e' o buraco declarado la' dentro. Esta bateria
// fecha a parte dele que ja' quebrou de verdade: as contas do relatorio
// semanal e a regua do que se chama "planejado".
//
// O caso que deu origem a ela: uma unica atividade concluida aparecia como
// "1,0h - 100% - cumprido 120%". Os tres numeros sairiam IGUAIS em dois
// cenarios opostos -- o de quem estourou o tempo e o de quem cumpriu a risca
// um plano que o proprio app tinha comprimido. Toda conta de "planejado"
// passou a usar `duracaoPlanejada` (a duracao que o Danilo escolheu), nunca
// `t.duracao` (a que o recalculo reescreve).
//
// O que ela NAO cobre (buraco declarado, nao esquecido): tela, service worker,
// localStorage e notificacao. Nada aqui abre o navegador -- so' as funcoes
// puras de js/agenda.js e js/relatorio.js.
//
// Uso:  node scripts/testes.mjs
//       node scripts/testes.mjs --autoteste   (prova que ela reprova de verdade)

import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import { join, dirname, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..");

// Import dinamico de proposito: modulo que nao carrega estoura ANTES de
// qualquer codigo daqui rodar, e a bateria some em vez de reprovar -- sem
// contagem, sem frase, so' um rastro de pilha que ninguem liga ao produto.
// Aqui ela morre falando: codigo 2, "nem chegou a rodar".
let duracaoPlanejada, duracaoReal, minutosContados, planejarRestante,
    inicioSemana, paraMin, paraHora, formatarDuracao, relatorioSemana;
try {
  ({ duracaoPlanejada, duracaoReal, minutosContados, planejarRestante,
     inicioSemana, paraMin, paraHora, formatarDuracao } = await import("../js/agenda.js"));
  ({ relatorioSemana } = await import("../js/relatorio.js"));
} catch (e) {
  console.log("A BATERIA NEM CHEGOU A RODAR: os modulos do app nao carregaram.\n  " + e.message);
  console.log("Isso nao e' 'esta tudo bem' -- e' 'nao consegui conferir nada'.");
  process.exit(2);
}
for (const [nome, fn] of Object.entries({
  duracaoPlanejada, duracaoReal, minutosContados, planejarRestante,
  inicioSemana, paraMin, paraHora, formatarDuracao, relatorioSemana
})) {
  if (typeof fn !== "function") {
    console.log(`A BATERIA NEM CHEGOU A RODAR: "${nome}" nao veio dos modulos do app.`);
    process.exit(2);
  }
}

// --------------------------------------------------------------- a contagem
// Contar o que EXECUTOU, nao so' as falhas: bateria que conta so' falha nao
// distingue "todos passaram" de "quase nenhum chegou a rodar".
// Mudou o numero de proposito? Atualize aqui E no CLAUDE.md.
const CASOS_ESPERADOS = 18;
let casos = 0;
const falhas = [];

process.on("exit", (codigo) => {
  if (codigo === 2) return;                       // 2 = nem chegou a rodar
  if (casos === CASOS_ESPERADOS) return;
  console.log(
    `\nCONTAGEM NAO FECHA: ${casos} caso(s) executado(s), ${CASOS_ESPERADOS} esperado(s). ` +
    (casos < CASOS_ESPERADOS
      ? "Caso(s) deixaram de rodar -- a bateria NAO provou o que diz provar."
      : "Caso(s) novo(s) entraram -- atualize CASOS_ESPERADOS e o CLAUDE.md.")
  );
  if (codigo === 0) process.exitCode = 1;
});

function caso(nome, fn) {
  casos++;
  try {
    fn();
  } catch (e) {
    falhas.push(`${nome}\n      ${e.message}`);
  }
}

function igual(obtido, esperado, oque) {
  if (obtido !== esperado) throw new Error(`${oque}: esperado ${esperado}, veio ${obtido}`);
}

// --------------------------------------------------------------- os cenarios
const SEGUNDA = inicioSemana("2026-09-04");       // sexta-feira 04/09/2026

// Uma atividade como o estado.js a normaliza, com o que o teste quiser por cima.
function tarefa(extra = {}) {
  return {
    id: "t" + casos, data: "2026-09-04", titulo: "Estudar", categoria: "Estudos",
    inicio: "08:00", duracao: 60, inicioOriginal: "08:00", duracaoOriginal: 60,
    inicioReal: null, fimReal: null, status: "planejada", ajustada: false,
    origem: "planejada", serie: null, obs: "", criadaEm: 1,
    avisos: { pre: false, inicio: false, preFim: false, fim: false, ultimoLembrete: 0 }
  };
}

const rel = (ts) => relatorioSemana(ts, SEGUNDA);
const ativ = (ts) => rel(ts).porAtividade[0];

// ---- 1. o caso que originou a bateria ------------------------------------

caso("o recalculo comprimiu o dia e ele cumpriu a risca: 100% do planejado", () => {
  // Plano de 1h; o dia atrasou e o app comprimiu para 50min; ele fez a 1h inteira.
  const t = tarefa({});
  t.duracao = 50; t.ajustada = true; t.duracaoOriginal = 60;
  t.status = "concluida"; t.inicioReal = "08:10"; t.fimReal = "09:10";
  const a = ativ([t]);
  igual(a.realizado, 60, "tempo real");
  igual(a.planejado, 60, "planejado (tem de ser o que ele marcou, nao o comprimido)");
  igual(Math.round(a.pctCumprido), 100, "% do planejado");
});

caso("estourou o tempo de verdade: 120% do planejado", () => {
  const t = tarefa({});
  t.duracao = 50; t.duracaoOriginal = 50;
  t.status = "concluida"; t.inicioReal = "08:00"; t.fimReal = "09:00";
  const a = ativ([t]);
  igual(a.realizado, 60, "tempo real");
  igual(a.planejado, 50, "planejado");
  igual(Math.round(a.pctCumprido), 120, "% do planejado");
});

caso("os dois cenarios acima nao podem dar o mesmo relatorio", () => {
  const comprimido = tarefa({});
  comprimido.duracao = 50; comprimido.duracaoOriginal = 60;
  comprimido.status = "concluida"; comprimido.inicioReal = "08:10"; comprimido.fimReal = "09:10";

  const estourou = tarefa({});
  estourou.duracao = 50; estourou.duracaoOriginal = 50;
  estourou.status = "concluida"; estourou.inicioReal = "08:00"; estourou.fimReal = "09:00";

  const a = ativ([comprimido]), b = ativ([estourou]);
  if (Math.round(a.pctCumprido) === Math.round(b.pctCumprido))
    throw new Error(`os dois saem como ${Math.round(a.pctCumprido)}% -- o relatorio nao distingue quem cumpriu de quem estourou`);
});

caso("o +15 min nao vira plano novo", () => {
  // "Ainda estou fazendo (+15 min)" aumenta t.duracao; o plano continua 60.
  const t = tarefa({});
  t.duracao = 75; t.duracaoOriginal = 60;
  t.status = "concluida"; t.inicioReal = "08:00"; t.fimReal = "09:15";
  const a = ativ([t]);
  igual(a.planejado, 60, "planejado");
  igual(Math.round(a.pctCumprido), 125, "% do planejado");
});

caso("compressao de verdade (planejarRestante) nao muda o planejado do relatorio", () => {
  // Fim a fim: tres atividades que nao cabem, o app comprime, ele cumpre o
  // horario comprimido. O relatorio tem de medir contra o plano original.
  const lista = [
    Object.assign(tarefa({}), { id: "a", inicio: "21:00", duracao: 60, duracaoOriginal: 60 }),
    Object.assign(tarefa({}), { id: "b", inicio: "22:00", duracao: 60, duracaoOriginal: 60, titulo: "Ler" }),
    Object.assign(tarefa({}), { id: "c", inicio: "23:00", duracao: 60, duracaoOriginal: 60, titulo: "Arrumar" })
  ];
  const r = planejarRestante(lista, paraMin("21:00"), paraMin("23:00"), 5);
  if (!r.comprimido) throw new Error("o cenario nao chegou a comprimir -- o teste nao testa nada");

  // o app aplica o plano exatamente assim (recalcularAPartirDe)
  r.plano.forEach(p => { p.tarefa.inicio = paraHora(p.inicio); p.tarefa.duracao = p.duracao; p.tarefa.ajustada = true; });

  const t = lista[0];
  t.status = "concluida"; t.inicioReal = t.inicio; t.fimReal = paraHora(paraMin(t.inicio) + t.duracao);
  igual(duracaoPlanejada(t), 60, "planejado depois da compressao");
  if (t.duracao >= 60) throw new Error("a compressao nao encurtou a atividade -- cenario invalido");
  igual(rel(lista).porDia[4].planejado, 180, "planejado do dia (3 x 1h)");
});

// ---- 2. a regua do planejado ---------------------------------------------

caso("duracaoPlanejada cai para a duracao atual quando nao ha original", () => {
  igual(duracaoPlanejada({ duracao: 40 }), 40, "sem duracaoOriginal");
  igual(duracaoPlanejada({ duracao: 40, duracaoOriginal: 0 }), 40, "duracaoOriginal zerada");
  igual(duracaoPlanejada({ duracao: 40, duracaoOriginal: "x" }), 40, "duracaoOriginal invalida");
  igual(duracaoPlanejada({ duracao: 40, duracaoOriginal: 90 }), 90, "duracaoOriginal valida");
});

caso("concluida sem check-in nem check-out conta o planejado, e nao inventa desvio", () => {
  const t = tarefa({});
  t.duracao = 50; t.duracaoOriginal = 60; t.status = "concluida";
  igual(minutosContados(t), 60, "minutos contados");
  const r = rel([t]);
  igual(Math.round(r.porAtividade[0].pctCumprido), 100, "% do planejado");
  igual(r.desvioMedio, null, "desvio medio (sem horario real nao ha desvio a medir)");
});

caso("totalPlanejado da semana usa o plano original", () => {
  const t = tarefa({});
  t.duracao = 30; t.duracaoOriginal = 60;
  igual(rel([t]).totalPlanejado, 60, "total planejado");
});

// ---- 3. contas gerais do relatorio ---------------------------------------

caso("atividade fora da semana nao entra", () => {
  const dentro = tarefa({});
  const fora = Object.assign(tarefa({}), { data: "2026-09-14", titulo: "Outra" });
  const r = rel([dentro, fora]);
  igual(r.qtdTotal, 1, "quantidade de atividades da semana");
  igual(r.porAtividade.length, 1, "linhas por atividade");
});

caso("nao realizada entra no planejado e fica fora do realizado", () => {
  const t = tarefa({});
  t.status = "nao_realizada";
  const r = rel([t]);
  igual(r.totalRealizado, 0, "realizado");
  igual(r.totalPlanejado, 60, "planejado");
  igual(r.qtdNaoRealizadas, 1, "quantidade de nao realizadas");
  igual(Math.round(r.aderencia), 0, "% do planejado");
});

caso("em aberto conta como em aberto, nao como concluida", () => {
  const emAndamento = Object.assign(tarefa({}), { status: "em_andamento", inicioReal: "08:00" });
  const aguardando = Object.assign(tarefa({}), { status: "aguardando_checkout", titulo: "Ler" });
  const r = rel([emAndamento, aguardando]);
  igual(r.qtdEmAberto, 2, "em aberto");
  igual(r.qtdConcluidas, 0, "concluidas");
  igual(r.totalRealizado, 0, "realizado");
});

caso("as fatias por atividade somam 100% do tempo", () => {
  const a = Object.assign(tarefa({}), { status: "concluida", inicioReal: "08:00", fimReal: "09:00" });
  const b = Object.assign(tarefa({}), { titulo: "Ler", status: "concluida", inicioReal: "10:00", fimReal: "11:00" });
  const soma = rel([a, b]).porAtividade.reduce((s, x) => s + x.pctDoTotal, 0);
  igual(Math.round(soma), 100, "soma das fatias");
});

caso("semana vazia nao divide por zero", () => {
  const r = rel([]);
  igual(r.totalRealizado, 0, "realizado");
  igual(r.aderencia, 0, "% do planejado");
  igual(r.atrasoMedio, null, "atraso medio");
  igual(r.desvioMedio, null, "desvio medio");
  igual(r.porDia.length, 7, "dias da semana");
});

caso("porDia poe cada atividade no seu dia", () => {
  const sexta = Object.assign(tarefa({}), { data: "2026-09-04", status: "concluida", inicioReal: "08:00", fimReal: "09:00" });
  const domingo = Object.assign(tarefa({}), { data: "2026-09-06", titulo: "Ler" });
  const r = rel([sexta, domingo]);
  igual(r.porDia[4].realizado, 60, "sexta realizada");
  igual(r.porDia[4].concluidas, 1, "sexta concluidas");
  igual(r.porDia[6].realizado, 0, "domingo realizado");
  igual(r.porDia[6].planejado, 60, "domingo planejado");
});

// ---- 4. medidas de tempo --------------------------------------------------

caso("atividade que atravessa a meia-noite nao tem duracao negativa", () => {
  const t = tarefa({});
  t.inicio = "23:30"; t.duracao = 60; t.duracaoOriginal = 60;
  t.status = "concluida"; t.inicioReal = "23:30"; t.fimReal = "00:30";
  igual(duracaoReal(t), 60, "duracao real");
  igual(ativ([t]).realizado, 60, "tempo no relatorio");
});

caso("desvio medio compara com o plano original, nao com o comprimido", () => {
  const t = tarefa({});
  t.duracao = 50; t.duracaoOriginal = 60;
  t.status = "concluida"; t.inicioReal = "08:00"; t.fimReal = "09:00";
  igual(rel([t]).desvioMedio, 0, "desvio medio");
});

caso("atraso medio compara com o horario originalmente marcado", () => {
  const t = tarefa({});
  t.inicio = "09:00"; t.inicioOriginal = "08:00"; t.ajustada = true;
  t.status = "concluida"; t.inicioReal = "09:00"; t.fimReal = "10:00";
  igual(rel([t]).atrasoMedio, 60, "atraso medio");
});

caso("formatarDuracao nao arredonda a diferenca para longe", () => {
  // "1,0h" escondia 50min e 63min no mesmo texto -- foi metade da confusao.
  igual(formatarDuracao(50), "50min", "50 minutos");
  igual(formatarDuracao(60), "1h", "60 minutos");
  igual(formatarDuracao(63), "1h 3min", "63 minutos");
});

// ------------------------------------------------------------------ autoteste
// Passar nao prova que detecta falha (regra 8d): aqui a bateria e' obrigada a
// REPROVAR copias sabotadas -- e a reprovar PELO CASO CERTO, nao por qualquer
// motivo. Cada sabotagem e' a versao ANTIGA de um trecho: a bateria tem de
// reprovar o codigo de antes da correcao, senao nao prova nada.
if (process.argv[2] === "--autoteste") {
  const sabotagens = [
    ["js/agenda.js",
      (t) => t.replace("return Number.isFinite(d) && d > 0 ? d : t.duracao;", "return t.duracao;"),
      "o recalculo comprimiu o dia",
      "regua do planejado voltando a ser a duracao comprimida"],
    ["js/relatorio.js",
      (t) => t.replace("atual.planejado += duracaoPlanejada(t);", "atual.planejado += t.duracao;"),
      "o recalculo comprimiu o dia",
      "agrupamento somando a duracao comprimida"],
    ["js/agenda.js",
      (t) => t.replace("return real != null ? real : duracaoPlanejada(t);", "return real != null ? real : t.duracao;"),
      "concluida sem check-in",
      "concluida sem horario real contando a duracao comprimida"],
    ["js/relatorio.js",
      (t) => t.replace("r == null ? null : r - duracaoPlanejada(t)", "r == null ? null : r - t.duracao"),
      "desvio medio compara com o plano original",
      "desvio medido contra o plano comprimido"],
    ["js/agenda.js",
      (t) => t.replace("if (d < 0) d += MIN_DIA; // atravessou a meia-noite", ""),
      "atravessa a meia-noite",
      "duracao negativa na virada do dia"],
  ];

  let quebradas = 0;
  for (const [alvo, sabotar, casoEsperado, descricao] of sabotagens) {
    const caixa = mkdtempSync(join(tmpdir(), "testes-"));
    try {
      cpSync(RAIZ, caixa, { recursive: true, filter: (s) => !s.includes(`${sep}.git${sep}`) });
      const arquivo = join(caixa, alvo);
      const antes = readFileSync(arquivo, "utf8");
      const depois = sabotar(antes);
      if (antes === depois) {
        console.log(`  X ${descricao}: a sabotagem nao encontrou o trecho -- o codigo mudou de forma e este caso deixou de existir`);
        quebradas++;
        continue;
      }
      writeFileSync(arquivo, depois);
      const r = spawnSync(process.execPath, [join(caixa, "scripts", "testes.mjs")], { encoding: "utf8" });
      const saida = (r.stdout || "") + (r.stderr || "");
      // Exigir a MENSAGEM, nunca so' o codigo de saida: reprovar pelo motivo
      // errado fica verde parecendo cobertura.
      if (r.status === 0) {
        console.log(`  X ${descricao}: a bateria PASSOU na copia sabotada`);
        quebradas++;
      } else if (!saida.includes(casoEsperado)) {
        console.log(`  X ${descricao}: reprovou, mas nao pelo caso "${casoEsperado}" -- vermelho pelo motivo errado`);
        quebradas++;
      } else {
        console.log(`  ok ${descricao}: reprovado no caso certo`);
      }
    } finally {
      rmSync(caixa, { recursive: true, force: true });
    }
  }
  if (quebradas) {
    console.log(`\nAUTOTESTE REPROVADO: ${quebradas} sabotagem(ns) nao foram pegas como deviam. A bateria nao prova o que diz provar.`);
    process.exit(1);
  }
  console.log(`\nAutoteste: as ${sabotagens.length} sabotagens foram todas pegas, cada uma no caso certo.`);
}

// -------------------------------------------------------------- o resultado
if (falhas.length) {
  console.log("A bateria reprovou:\n");
  for (const f of falhas) console.log("  - " + f);
  console.log(`\n${falhas.length} de ${casos} caso(s) reprovaram. Nada disso pode ir ao ar.`);
  process.exit(1);
}

// A frase de sucesso pleno so' pode sair quando a contagem fecha: imprimir
// "passou" e reprovar logo abaixo e' sinal que mente (regra 12e).
if (casos !== CASOS_ESPERADOS) process.exit(1);

console.log(`Bateria de comportamento passou: ${casos} caso(s) do relatorio semanal e das contas de tempo.`);
