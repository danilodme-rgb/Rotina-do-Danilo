# Rotina do Danilo

Aplicativo pessoal para planejar o dia, executar com check-in/check-out e medir
quanto tempo foi dedicado a cada coisa. Tema em preto e cinza, feito para o
celular, funciona offline e **guarda tudo apenas no seu aparelho** — nada é
enviado para servidor nenhum.

## O que ele faz

- **Calendário mensal** com o quanto foi concluído em cada dia.
- **Programação do dia**: título, categoria, horário de início e duração prevista.
- **Compromissos** com hora marcada (reunião, consulta, exame, aula): local, com quem, aviso próprio e repetição — tudo centralizado aqui, sem depender de outro app.
- **Repetição**: a mesma atividade em vários dias da semana até a data que você escolher, ou copiar o dia inteiro para outros dias.
- **Alertas**: 5 minutos antes de começar, na hora de começar, 5 minutos antes de terminar e na hora de terminar (o intervalo de 5 min é configurável).
- **Check-in obrigatório** para iniciar e **check-out obrigatório** para encerrar. Enquanto você não responde, a atividade fica em aberto, aparece no topo da tela, o título da aba pisca e o aviso se repete a cada 10 minutos.
- **App fechado**: ao reabrir, ele pergunta uma a uma se você iniciou / concluiu as atividades pendentes de hoje e de ontem — com o horário que você informar. As mais antigas continuam listadas como "em aberto" no dia delas.
- **Recálculo proporcional**: sempre que você faz check-in ou check-out fora do horário previsto, o restante do dia é reprogramado tendo **23:00** como limite (configurável).
- **Imprevistos**: encaixar uma atividade nova ou puxar uma já programada para agora — o app pergunta o **horário de início** e a **previsão de duração** e reorganiza o resto.
- **Relatório semanal** em horas e em porcentagem, por categoria e por atividade, com aderência ao planejado, atraso médio de check-in e desvio das estimativas — mais um resumo à parte dos compromissos da semana.
- **Backup**: exportar/importar um arquivo `.json` (atividades e compromissos juntos; backups antigos, sem compromissos, continuam sendo aceitos).

## Compromissos x atividades da rotina

As duas coisas convivem na mesma linha do tempo do dia, mas seguem regras diferentes:

| | Atividade da rotina | Compromisso |
| --- | --- | --- |
| Quem marca a hora | você | outra pessoa (médico, cliente, professor) |
| Horário | o app reprograma quando o dia atrasa | **fixo**, nunca é movido |
| Check-in / check-out | obrigatórios, o app cobra até você responder | não pede nada |
| Aviso | 5 min antes (configurável) | antecedência própria de cada compromisso, padrão 1h |
| Relatório | entra na aderência e nas horas por categoria | fica num quadro separado, fora da aderência |
| Situação | planejada → em andamento → concluída | marcado → aconteceu / cancelado, tudo na mão |

Quando um compromisso cai em cima de uma atividade ainda não concluída, o cartão
mostra **“choca com …”**. O app só avisa: quem decide o que fazer com a rotina é
você (dá para editar a atividade, usar o **Imprevisto** ou tocar em **Recalcular**).

Compromissos podem ser lançados em dias que já passaram — servem também como
registro do que aconteceu. Atividades da rotina, não.

## Como o recálculo funciona

Ao terminar (ou começar) algo fora do horário, o app reprograma só o que ainda
não foi iniciado, nesta ordem:

1. **Mantém o plano** quando ele ainda cabe: nada é puxado para antes do horário previsto, e a folga entre as atividades é preservada.
2. **Encurta as folgas na proporção de cada uma**, se o dia passou das 23:00 mas as durações ainda cabem.
3. **Comprime as durações pelo mesmo fator** quando nem assim cabe — as proporções entre as atividades são mantidas (ex.: fator 0,85 encurta todas em 15%), respeitando uma duração mínima e blocos de 5 minutos.
4. Se nem comprimindo couber, ele avisa que é preciso adiar ou remover algo.

O recálculo automático pode ser desligado em **Ajustes**; aí ele só acontece
quando você toca em **Recalcular**.

## Como usar

O app é um site estático (HTML/CSS/JavaScript puro), sem instalação de
dependências e sem build.

### No computador

```bash
python3 -m http.server 8000
```

Depois abra `http://localhost:8000`.

### No celular (recomendado)

Publique a pasta em qualquer hospedagem estática — o GitHub Pages já resolve:
em **Settings → Pages**, escolha a branch e a pasta raiz. Abra o endereço no
celular, toque em **Ativar alertas** e use **Adicionar à tela de início** para
instalar como aplicativo.

> É preciso servir por `http://` ou `https://` (não abrir o arquivo direto pelo
> `file://`), porque o app usa módulos JavaScript e service worker.

O repositório traz o workflow `.github/workflows/pages.yml`, que republica o
site a cada push na `main`. Para usá-lo, deixe **Settings → Pages → Source**
como **GitHub Actions**. Se preferir o modo simples, escolha **Deploy from a
branch** (`main` / `root`) e apague o workflow — os dois caminhos publicam o
mesmo site.

## Estrutura

| Arquivo | Para que serve |
| --- | --- |
| `index.html` | Telas: Dia, Calendário, Relatório e Ajustes |
| `css/estilo.css` | Tema preto e cinza |
| `js/app.js` | Fluxos: check-in/check-out, imprevistos, alertas, telas |
| `js/agenda.js` | Contas de horário e o recálculo proporcional |
| `js/estado.js` | Dados salvos no aparelho (localStorage) |
| `js/compromissos.js` | Compromissos: hora fixa, conflitos com a rotina, resumos |
| `js/relatorio.js` | Consolidação semanal |
| `js/notificacoes.js` | Notificações do sistema e som |
| `js/interface.js` | Modais e avisos na tela |
| `sw.js` | Funcionamento offline e clique na notificação |

## Limitação honesta sobre notificações

Enquanto o app estiver aberto (inclusive em segundo plano), os alertas chegam
como notificação do sistema. **Com o app totalmente fechado, o navegador não
dispara alarmes** — isso exigiria um servidor de push. Por isso existe a
checagem de pendências na abertura: nenhuma atividade é dada como feita sem o
seu check-in, e nenhuma é encerrada sem o seu check-out.
