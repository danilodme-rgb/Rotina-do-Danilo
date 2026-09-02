#!/usr/bin/env node
// Conferencia de fumaca da Rotina do Danilo.
//
// O app nao tem build nem framework: o que esta no repositorio e' exatamente o
// que vai ao ar. Sem esta conferencia, um erro de sintaxe em um .js e' publicado
// com sucesso pelo workflow do Pages e a tela fica branca -- o verde do deploy
// so' diz "publiquei", nunca "funciona".
//
// O que ela cobre:
//   1. todo .js e .mjs passa na checagem de sintaxe de MODULO;
//   2. todo .json e o manifesto parseiam;
//   3. todo arquivo citado no index.html, no sw.js e nos `import` dos modulos existe.
//
// O que ela NAO cobre (buraco declarado, nao esquecido): comportamento. Ela nao
// abre o app, nao roda o service worker e nao prova conta nenhuma da agenda.
// Bateria de teste de verdade e' o proximo passo, e a receita esta na skill
// `travas-e-baterias`, em .claude/skills/.
//
// Uso:  node scripts/conferir.mjs
//       node scripts/conferir.mjs --autoteste   (prova que ela reprova de verdade)

import { readFileSync, readdirSync, existsSync, statSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RAIZ = process.argv[3] ? resolve(process.argv[3])
                             : resolve(dirname(fileURLToPath(import.meta.url)), "..");

const IGNORAR = new Set([".git", "node_modules", ".github"]);

function arquivos(dir = RAIZ, achados = []) {
  for (const nome of readdirSync(dir)) {
    if (IGNORAR.has(nome)) continue;
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) arquivos(caminho, achados);
    else achados.push(caminho);
  }
  return achados;
}

const problemas = [];
const contagem = { sintaxe: 0, json: 0, referencias: 0 };
const rel = (p) => relative(RAIZ, p).split(sep).join("/");
const reprova = (arquivo, motivo) => problemas.push(`${rel(arquivo)}: ${motivo}`);

const TODOS = arquivos();

// ---------------------------------------------------------------- 1. sintaxe
// ATENCAO: `node --check arquivo.js` FALHA ABERTA em arquivo com import/export --
// o .js e' lido como CommonJS e o erro de sintaxe sai com codigo 0. Medido no
// Node v22. A forma que confere de verdade e' a de baixo, pela entrada padrao.
for (const arquivo of TODOS.filter((f) => /\.m?js$/.test(f))) {
  contagem.sintaxe++;
  const r = spawnSync(process.execPath, ["--input-type=module", "--check"], {
    input: readFileSync(arquivo),
    encoding: "utf8",
  });
  if (r.status !== 0) reprova(arquivo, "erro de sintaxe\n    " + (r.stderr || "").trim().split("\n").slice(0, 3).join("\n    "));
}

// ------------------------------------------------------------------- 2. json
for (const arquivo of TODOS.filter((f) => /\.(json|webmanifest)$/.test(f))) {
  contagem.json++;
  try {
    JSON.parse(readFileSync(arquivo, "utf8"));
  } catch (e) {
    reprova(arquivo, "JSON invalido: " + e.message);
  }
}

// ------------------------------------------------------------ 3. referencias
// Externo (http, dados embutidos, ancora) nao e' arquivo deste repositorio.
const externo = (alvo) => /^(https?:|data:|mailto:|tel:|#|\/\/)/.test(alvo);

function conferirAlvo(origem, alvo, base = dirname(origem)) {
  if (externo(alvo)) return;
  const limpo = alvo.split(/[?#]/)[0];
  if (limpo === "" || limpo === "./") return;          // a raiz do site
  contagem.referencias++;
  if (!existsSync(resolve(base, limpo))) reprova(origem, `aponta para "${alvo}", que nao existe`);
}

for (const arquivo of TODOS.filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(arquivo, "utf8");
  for (const m of html.matchAll(/(?:src|href)\s*=\s*"([^"]*)"/g)) conferirAlvo(arquivo, m[1]);
}

for (const arquivo of TODOS.filter((f) => /\.m?js$/.test(f))) {
  const js = readFileSync(arquivo, "utf8");
  for (const m of js.matchAll(/(?:^|[\s(=])(?:import|export)\s[^'"\n]*from\s*['"]([^'"]+)['"]/g)) {
    if (m[1].startsWith(".")) conferirAlvo(arquivo, m[1]);
  }
  // A lista de arquivos que o service worker manda para o cache: caminhos
  // relativos a' raiz do site, nao a' pasta do arquivo.
  const lista = js.match(/const ARQUIVOS\s*=\s*\[([\s\S]*?)\]/);
  if (lista) for (const m of lista[1].matchAll(/['"]([^'"]+)['"]/g)) conferirAlvo(arquivo, m[1], RAIZ);
}

// ------------------------------------------------------------ falha fechada
// Resultado vazio nao e' prova de ausencia (regra 8c): se uma categoria nao
// achou nada, quem falhou foi a conferencia, nao o codigo.
const MINIMO = { sintaxe: 5, json: 1, referencias: 5 };
for (const [nome, minimo] of Object.entries(MINIMO)) {
  if (contagem[nome] < minimo)
    problemas.push(
      `A propria conferencia falhou: so' ${contagem[nome]} caso(s) de "${nome}" executaram, ` +
      `o minimo e' ${minimo}. Arquivo movido ou pasta renomeada? Nada foi conferido.`
    );
}

// ------------------------------------------------------------------ autoteste
// Passar nao prova que detecta falha (regra 8d): aqui a conferencia e' obrigada
// a REPROVAR copias sabotadas de proposito. Roda no CI junto com a conferencia.
if (process.argv[2] === "--autoteste") {
  const sabotagens = [
    ["js/agenda.js", (t) => t + "\nexport const quebrado = (;\n", "erro de sintaxe em modulo"],
    ["manifest.webmanifest", (t) => t.replace("{", "{,"), "JSON invalido"],
    ["index.html", (t) => t.replace('src="js/app.js"', 'src="js/nao-existe.js"'), "arquivo citado que sumiu"],
    ["sw.js", (t) => t.replace("'./js/app.js'", "'./js/tambem-nao-existe.js'"), "arquivo sumido na lista do service worker"],
  ];
  let falhas = 0;
  for (const [alvo, sabotar, descricao] of sabotagens) {
    const caixa = mkdtempSync(join(tmpdir(), "conferir-"));
    try {
      cpSync(RAIZ, caixa, { recursive: true, filter: (s) => !s.includes(`${sep}.git${sep}`) });
      const arquivo = join(caixa, alvo);
      const { writeFileSync } = await import("node:fs");
      writeFileSync(arquivo, sabotar(readFileSync(arquivo, "utf8")));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--conferir", caixa], { encoding: "utf8" });
      if (r.status === 0) {
        console.log(`  X ${descricao}: a conferencia PASSOU numa copia sabotada`);
        falhas++;
      } else {
        console.log(`  ok ${descricao}: reprovado, como tem de ser`);
      }
    } finally {
      rmSync(caixa, { recursive: true, force: true });
    }
  }
  if (falhas) {
    console.log(`\nAUTOTESTE REPROVADO: ${falhas} sabotagem(ns) passaram batido. A conferencia nao confere.`);
    process.exit(1);
  }
  console.log(`\nAutoteste: as ${sabotagens.length} sabotagens foram todas pegas.`);
}

// -------------------------------------------------------------- o resultado
if (problemas.length) {
  console.log("A conferencia reprovou:\n");
  for (const p of problemas) console.log("  - " + p);
  console.log(`\n${problemas.length} problema(s). Nada disso pode ir ao ar.`);
  process.exit(1);
}

console.log(
  `Conferencia de fumaca passou: ${contagem.sintaxe} arquivo(s) de codigo, ` +
  `${contagem.json} de dados, ${contagem.referencias} referencia(s) conferidas.`
);
