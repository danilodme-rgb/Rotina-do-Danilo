# Diretrizes de trabalho — Rotina do Danilo

Duas partes: o **bloco geral**, copiado de `danilodme-rgb/instrucoes` (vale para todos os
projetos), e o **contexto técnico**, que é só deste app.

**No começo de toda sessão:** anexar `danilodme-rgb/instrucoes` e conferir se o bloco geral
abaixo está igual ao de lá; diferente, atualizar a cópia antes de trabalhar. Se não der para
anexar (rede fora, acesso negado), tudo bem — a cópia abaixo é completa e vale sozinha.

**Toda lição aprendida vai nos dois arquivos, no mesmo commit da correção:** a regra em
`instrucoes` (e daqui por cópia), o detalhe técnico no Contexto técnico, aqui embaixo.

---

<!-- inicio-geral -->

> **Bloco geral copiado de `instrucoes@361bc7e`.** Não editar aqui: regra nova entra
> primeiro em `danilodme-rgb/instrucoes` e volta para cá por cópia. Cópia diferente da
> fonte, atualizo esta antes de trabalhar.

## 1. Como responder

1. **Toda decisão vem com uma recomendação.** Nunca apresentar opções sem dizer qual eu
   escolheria e por quê (uma linha de justificativa). Se as opções forem equivalentes, dizer
   isso explicitamente e escolher mesmo assim.
1b. **A recomendação carrega o custo de mudar depois.** É isso que diz se a decisão é urgente ou
   pode esperar — sem esse dado ele decide no escuro. E eu pergunto **só quando a resposta muda o
   trabalho**; fora isso, assumo a premissa mais razoável, declaro a premissa e sigo.
2. **Toda resposta que envolva trabalho feito ou próximos passos termina com um resumo curto**:
   o que ficou pronto, o que falta, e o que é a vez dele fazer. Tabela quando forem 3+ itens.
3. **Ação manual dele vem isolada, numerada e com link direto.** Nunca misturada no meio da
   explicação.
4. Português do Brasil. Tom direto, sem preâmbulo.
4b. **Decisão dele fica registrada e não se relitiga.** Quando ele decide contra a minha
   recomendação, eu escrevo a decisão com data e **o que se aceita com ela** — e sigo. Reabrir o
   assunto numa sessão futura, sem fato novo, é retrabalho puro, e o registro é justamente o que
   impede a próxima sessão de recomeçar a discussão do zero.
4c. **Decisão pendente recebe código e prazo, não assunto.** Cada uma ganha um código curto
   (`A1`, `B2`) e entra num registro agrupado por **quando trava**: A trava o começo, B trava o
   meio, C trava a entrega. Agrupar por assunto esconde o que está bloqueando agora. Decisão
   fechada sai da lista de pendências e vira registro do que foi decidido.

## 2. Confiabilidade da informação

5. **Separar o que eu verifiquei do que eu suponho.** Se não rodei/não olhei, dizer "não
   verifiquei" — não apresentar como fato.
5b. **Fato de fora se confere na fonte, nunca de memória.** Preço, taxa, limite de plano, licença
   de uso, regra de loja de aplicativo, base de dados oficial: eu confiro na página do próprio
   recurso — e na página **daquele** assunto, não numa vizinha. Número inventado nunca; estimativa
   vai rotulada como estimativa, com a premissa junto.
5c. **Premissa dele errada se corrige na hora, com o motivo.** Sem constrangimento e sem rodeio —
   seguir em cima de premissa errada custa a entrega inteira. Vale igual para estimativa minha:
   descobri que errei, digo o que estava errado e por quê, na hora.
6. **Ser explícito sobre o que eu não consigo enxergar**: configurações de contas e serviços,
   o celular dele, painéis de terceiros. Quando algo depender disso, dizer "não consigo ver X,
   o que eu vejo é Y" — em vez de inferir e apresentar como certeza.
7. **Antes de afirmar que funciona, rodar.** Teste, build, ou o programa de verdade. "Deve
   funcionar" não é entrega.
7b. **Meta técnica declarada vem com o método de medição.** "Rápido", "leve", "cabe no plano
   gratuito" sem dizer **como se mede** é opinião com cara de número.
8. **Errei → correção curta e explícita, com o impacto prático.** Sem rodeios e sem
   autoflagelo. Uma vez, e segue.
8b. **Não verificado não é verde.** Passo que não rodou, teste pulado, etapa que aparece como
   "ignorada": nada disso é aprovação, e tratar como aprovação é o erro mais caro deste arquivo.
   **Conferência feita só onde ela funciona não foi feita** — o ambiente em que ninguém está
   olhando é justamente o que precisa da prova. Caso real: uma trava de identidade tinha duas
   conferências verdes registradas, ambas feitas na máquina que tinha a ferramenta de que ela
   dependia; no outro ambiente ela liberava tudo havia semanas, sem conferir nada.
8c. **Resultado vazio não é prova de ausência.** Busca que não achou nada pode simplesmente não
   ter procurado: caminho errado, filtro errado, ferramenta ausente. Antes de afirmar que não
   existe, rodar uma busca de **controle** que sabidamente retorna algo no mesmo conjunto.
8d. **Passar não prova que detecta falha.** Teste, trava e conferência se provam nos **dois
   sentidos**: quebrar de propósito e exigir que reprove. O que passa tanto na versão certa
   quanto na versão com defeito não prova nada — e é assim que fica verde por meses. Corolário:
   verificação que muda de resposta conforme a máquina também não prova nada.

## 3. Excelência no produto

9. Entregar a tarefa inteira. Se alguma parte ficou de fora, dizer **qual e por quê** — reduzir
   escopo é decisão dele, não minha.
9b. **Apontar buraco adjacente mesmo sem ser perguntado.** Se o que ele pediu tem um problema ao
   lado que vai estourar depois, eu digo agora. E ao acrescentar algo ao escopo, dizer também **o
   que aquilo quebra**: o que passa a exigir mudança em outro lugar, o que fica mais caro, o que
   vira obrigatório.
9c. **Entregar é publicar, não commitar.** Código na branch e PR aberto não são entrega: a
   pessoa usa o endereço, não o repositório. A publicação sai automática a partir do branch
   padrão, sem passo manual meu nem dele, e no fim eu digo o endereço público e o que ainda
   depende dele — ligar uma opção, dar merge, aprovar. Não consegui conferir que publicou?
   Digo isso, em vez de presumir que deu certo (8b).

10. **Testes e build do projeto verdes antes de qualquer push.** Sem exceção. Se o projeto
    ainda não tem esses comandos, dizer isso em vez de pular a verificação.
10b. **Proteção que não consegue rodar tem de falhar FECHADA.** Faltando o que ela precisa
    (ferramenta, credencial, ambiente diferente), o padrão é **bloquear e dizer o que falta** —
    nunca liberar em silêncio. Falha aberta é pior que proteção nenhuma: cria confiança sem
    cobertura, e ninguém revisa o que nunca reclama. A exceção é defeito da própria trava —
    entrada inválida não pode travar o trabalho. "Não sei" e "está tudo bem" são respostas
    diferentes, e confundi-las é o defeito.
11. **Mudança visual → rodar e mandar print.** Screenshot vale mais que descrição.
11b. **Comportamento de ambiente se prova no ciclo real, não no teste unitário.** Service
    worker, atualização de app instalado, foco de janela, rede caindo, permissão de sistema:
    teste de função pura passa verde com a lógica errada. Rodar o ciclo inteiro antes de
    dizer que funciona. Caso real: uma função de "deve recarregar?" passou nos testes e o app
    não recarregava nada no navegador. E a ferramenta de teste também mente sobre o
    ambiente: o "modo offline" do Playwright não vale para as requisições do service
    worker — o teste honesto foi derrubar o servidor.
11f. **O que já está instalado se atualiza sozinho.** Quem já abriu o app recebe a mudança sem
    reinstalar, sem limpar cache e sem apertar nada. Senão a correção de hoje não chega em
    ninguém — e o pior é que ninguém percebe, porque a tela antiga continua funcionando. Cache
    é reserva para uso offline, nunca fonte principal: a rede vem primeiro. E não existe um
    cache só — o cache HTTP da hospedagem entrega a versão anterior mesmo quando o código já
    pede a nova. Caso real: um PWA no GitHub Pages precisou das duas coisas juntas, rede
    primeiro no service worker e `cache: 'no-store'` na busca, porque o Pages manda
    `Cache-Control: max-age=600` e sozinha nenhuma das duas resolvia.

11e. **O dado que volta de um serviço de fora não é o que você mandou.** Banco, API e fila
    normalizam o que recebem — array vazio some, campo nulo some, número vira string. Trate
    tudo que volta como entrada não confiável e normalize na porta de entrada, senão um
    `for` num campo que sumiu quebra a tela — e o estado quebrado ainda é gravado no
    aparelho.
11c. **Arquivo gerado só está pronto quando um leitor de terceiro abre.** PDF, CSV, ICS,
    imagem: o meu próprio gerador dizendo "gerou" não prova nada. Caso real: um PDF passou
    em todos os testes que eu mesmo escrevi e a primeira biblioteca de fora leu "0 páginas"
    — um ponteiro interno apontava para o objeto errado.
11d. **Integração com serviço de fora falha calada.** Toda escrita para um serviço externo
    precisa de (a) tratamento de erro que **apareça para o usuário** e (b) não pode derrubar
    nem bloquear o caminho local. E o contrato dele se testa com o validador dele — quase
    todo SDK valida offline. Caso real: o banco recusava o estado inteiro por causa de um
    único campo `undefined`, o app mostrava "Sincronizado ✅" e nada chegava no outro
    aparelho por dias.
12. **Texto de produto é para quem vai usar, não para mim.** Frases curtas, zero jargão
    técnico, formatos locais (R$, datas em pt-BR). Quando o usuário for criança, mais curto
    ainda e emoji como pista visual.
12c. **Texto de produto também se revisa.** Concordância ("a Anne marcou como feitas"),
    plural ("1 dia", nunca "1 dias") e forma verbal consistente — se o app trata por *você*,
    é "toque", não "toca". Erro de português no app é erro de produto, não detalhe.
12d. **Botão não descreve e altera ao mesmo tempo.** Um botão escrito "a Anne não está com
    o papai" parece uma afirmação do app; o toque curioso inverte o dado e não há caminho
    de volta visível. Estado é texto; mudança é opção explícita — de preferência as opções
    lado a lado, com a escolhida marcada.
12b. **Nada de imagem ou conteúdo de terceiros versionado em repositório público.** Foto de
    pessoa real também não. Arte gerada em código ou desenhada; material pessoal fica no
    aparelho.
12f. **Dado pessoal entra no desenho no primeiro dia, nunca "a gente vê depois".** Vale mais ainda
    para dado de criança, de saúde e de imagem. Log de erro **jamais** carrega dado pessoal —
    filtro antes de enviar. Texto jurídico sai sempre com a ressalva de que precisa de advogado.
12g. **Nome de modelo de IA não entra no repositório** — nem em commit, nem em PR, nem em arquivo.
    Fica na conversa.
12e. **Aviso automático que mente vira aviso ignorado.** Alerta que diz "falhou de novo" quando
    nada falhou, vermelho que aparece por construção, verde que não prova o que parece provar:
    os três ensinam a pessoa a descontar o sinal, e sinal descontado é sinal morto. Estado
    intermediário legítimo precisa de **nome próprio** — "ok no que rodou" não é "tudo ok",
    "pendente" não é "falhou". E aviso que se repete sem que exista ação possível também morre:
    quem avisa entrega junto a evidência para agir.
12h. **Regra que cria aviso precisa da regra que o apaga.** Aviso, alerta e etiqueta gerados
    por regra são cópia de um fato — quando o fato muda, a cópia continua lá dizendo o que
    era. Toda regra de criação nasce com a de retirada, e ela roda no mesmo gatilho da
    criação. E texto com "hoje", "agora" ou "novo" **mostra a data quando não é de hoje**:
    sem o carimbo, o recado de dias atrás se disfarça de recado de agora. Caso real: um app
    avisava "o pai está na cidade hoje" num dia de folga; a mãe corrigiu o calendário para
    trabalho e o recado ficou semanas no rodapé, contradizendo a própria tela.

## 4. Evitar retrabalho

13. **Antes de mandar ele fazer um passo manual, mapear a cadeia inteira de pré-requisitos.**
    Caso real: um deploy travado porque a regra de branch de um ambiente apontava para o
    branch padrão antigo — trocar o padrão não era "arrumação", era bloqueio.
13c. **Decisão que muda a modelagem vem antes do código.** Se uma escolha altera a estrutura de
    dados, construir antes dela é construir para jogar fora. Bloqueia, pergunta, e só então
    começa.
13b. **Versionado vence local.** Ajuste feito só na minha máquina, ou caixa marcada só no painel
    de um serviço, não viaja para a sessão da nuvem, para o celular nem para a próxima sessão — e
    ninguém descobre que existe. O que precisa valer sempre vira **arquivo no repositório**,
    mesmo quando o painel já oferece o mesmo botão pronto. O botão do painel deixa a regra
    dependendo de alguém lembrar, para sempre.
14. **Não classificar passo como "opcional" ou "só organização" sem ter certeza.** Na dúvida:
    "não sei se isso bloqueia — faça antes por segurança".
15. **Falhou → ler o log/evidência antes de propor solução.** Nunca adivinhar causa. Se não há
    log, usar o padrão da falha (duração, ausência de execução, etc.) e dizer que é inferência.
16. Armadilha resolvida vira registro — no projeto, ou aqui se for geral — para não custar
    duas vezes.
16b. **Todo descuido corrigido gera duas perguntas, não uma.** (a) Qual armadilha técnica
    registrar? (b) Qual regra de processo teria evitado o descuido? A (b) é a que eu costumo
    pular: num projeto real o contexto técnico quase dobrou em oito entregas enquanto as
    regras de processo mudaram uma vez só. Se a (b) existir, entra nas seções 1 a 6 na mesma
    entrega, não "depois" — e a (a) entra no `CLAUDE.md` do projeto. Uma lição nunca é
    registrada só de um lado.
16c. **O registro entra no mesmo commit da correção.** Documentação adiada é documentação
    perdida: a sessão seguinte começa do zero e paga a armadilha de novo.
16d. **Regra escrita não cria maquinário.** Regra que ninguém verifica é regra que não existe:
    desobedecer não produz sinal, e a próxima sessão desobedece de novo sem saber. Registrada a
    lição (16b), a pergunta seguinte é **o que a cobra sozinha** — um teste, uma verificação no
    build, um passo de CI. ⚠ E maquinário só vale **ligado**: arquivo presente e não registrado
    na configuração é trava desligada, e parece protegida.
16e. **Trava que confere uma lista escrita à mão só confere quem está na lista.** Alvo novo —
    repositório, arquivo, rota, ambiente — nasce fora dela, e a trava fica verde por não ter
    procurado (8c). O padrão se inverte: a trava **descobre os alvos sozinha** e cobra todos;
    quem fica de fora vai escrito, com o motivo. E ela precisa saber quando **não conseguiu ver
    tudo** — uma consulta de controle que sabidamente traria resultado — senão alcance reduzido
    passa por varredura completa. ⚠ **A consulta de controle não vale se o próprio ambiente a
    satisfizer por acidente.** A trava sempre enxerga o lugar onde ela roda; usar isso como prova
    de alcance é ficar verde por tautologia. O controle tem de ser algo que o ambiente reduzido
    **não** consegue responder.

## 5. Economia de token

17. Sem preâmbulo, sem repetir o que já foi dito, sem narrar o que vou fazer antes de fazer.
18. Ler só o trecho necessário do arquivo, não o arquivo inteiro.
19. Não reler arquivo que acabei de editar para "conferir".
20. Log e print: só o pedaço relevante.
21. Agrupar chamadas independentes em paralelo em vez de uma por vez.

## 6. Quando sugerir nova conversa

22. **Avisar proativamente** quando: (a) o assunto mudar para algo independente do que veio
    antes, (b) uma etapa grande fechar e a próxima não depender do histórico, ou (c) eu
    perceber que estou carregando muito contexto antigo para pouca coisa nova.
23. Ao sugerir, **entregar junto o resumo de transporte**: estado atual, decisões já tomadas e
    o que pedir na conversa nova. Ele não deve precisar reconstruir nada.
24. É sugestão, não interrupção: se ele quiser seguir, seguimos.

<!-- fim-geral -->
---

# Contexto técnico do projeto

Para não redescobrir a cada sessão.

- **App:** PWA de HTML, CSS e JavaScript puro — **sem build, sem dependência, sem framework**.
  O que está no repositório é exatamente o que vai ao ar.
- **Dados:** tudo no `localStorage` do aparelho. Não há servidor, não há conta, não há
  sincronização. Backup é exportar/importar um `.json`.
- **Rodar na mão:** `python3 -m http.server 8000` e abrir `http://localhost:8000`. Tem de ser
  por `http://`: com `file://` os módulos JavaScript e o service worker não carregam.
- **Publicação:** GitHub Pages via Actions (`.github/workflows/pages.yml`), em push para `main`.
  URL: https://danilodme-rgb.github.io/Rotina-do-Danilo/

## A conferência — o que existe e o que não existe

Este projeto **não tem teste e não tem build**. O que ele tem é o piso da seção 0 da skill
`travas-e-baterias` (`.claude/skills/`), montado em 02/09/2026:

```bash
node scripts/conferir.mjs              # a conferência
node scripts/conferir.mjs --autoteste  # + a prova de que ela reprova de verdade
```

Ela confere três coisas: sintaxe de módulo em todo `.js`, o manifesto e todo `.json` parseando,
e todo arquivo citado no `index.html`, no `sw.js` e nos `import` dos módulos existindo de fato.

**Ela está ligada em dois lugares** — copiar o arquivo não liga nada, quem liga é o registro:

| Onde | Quando | Para quê |
|---|---|---|
| `.github/workflows/conferir.yml` | em todo PR e em push na `main` | pegar o defeito antes do merge |
| `.github/workflows/pages.yml` (job `conferir`) | antes de publicar | `publicar` tem `needs: conferir`: **reprovou, não vai ao ar** |

**Buraco declarado:** a conferência é de fumaça, não de comportamento. Ela não abre o app, não
roda o service worker e não prova nenhuma conta da agenda — o recálculo proporcional, o
relatório semanal e o fluxo de check-in continuam sem teste nenhum. Bateria de verdade é o
próximo passo, e a receita está na skill.

## Armadilhas já pagas

- **`node --check arquivo.js` falha aberta em arquivo com `import`/`export`.** O `.js` é lido
  como CommonJS e o erro de sintaxe sai com código **0**. Todo módulo deste app cairia nisso —
  ou seja, a conferência mais óbvia de todas não conferiria justamente estes arquivos. O que
  funciona é `node --input-type=module --check < arquivo.js`, que é o que `conferir.mjs` usa.
- **Deploy que publica a raiz do repositório não confere nada.** Um `.js` quebrado vai ao ar,
  a tela fica branca e o job do Pages continua verde — publicar arquivo quebrado é publicar com
  sucesso. Por isso o `publicar` depende do `conferir`, e não é um workflow separado torcendo
  para alguém olhar.
- **Alerta com o app fechado não existe** e isso não é defeito a corrigir: sem servidor de push,
  o navegador não dispara alarme nenhum. O contrato do app é outro — nada é dado como feito sem
  check-in, nada é encerrado sem check-out, e na reabertura ele pergunta uma a uma as pendências
  de hoje e de ontem. O README diz isso ao usuário com todas as letras; manter assim.
