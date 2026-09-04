# Lições pendentes

Lição que apareceu no meio do produto e **ainda não virou regra geral** (regra 16f).

Mexer no bloco geral obriga a propagar em todos os projetos — caro, e no meio de outra
tarefa. Então anota-se aqui, no mesmo commit da correção (16c), e a atualização das regras
acontece na sua própria conversa.

A varredura diária lista o que está aberto, em todos os projetos. Isso **não reprova**: é
estado normal, não falha. O que ela impede é a lição sumir sem ninguém ver.

## Como usar

- Item aberto: `- [ ] texto da lição`
- Virou regra no `danilodme-rgb/instrucoes`: marque `- [x]` e ele sai da lista

## Abertas

- [ ] **Número que a pessoa lê declara a régua — e a régua nunca é um campo que outra rotina
  reescreve.** O app comprimia sozinho a duração planejada e o relatório media contra o campo
  comprimido: quem cumpriu exatamente o combinado aparecia como "120% do planejado", com o
  número idêntico ao de quem de fato estourou. Métrica tirada de campo mutável mede a última
  mutação, não o combinado. O que a pessoa escolheu precisa de campo próprio, e é ele a régua —
  vale para prazo, meta, orçamento e qualquer "planejado x realizado". (04/09/2026)
- [ ] **Campo que nasce preenchido é uma resposta que o app deu no lugar da pessoa.** Valor
  padrão em campo **opcional** vira um combinado que ela não fez e não percebeu — e o padrão
  costuma contradizer o que o app realmente faz quando ela não mexe ali. Opcional nasce vazio;
  padrão só onde o campo é obrigatório e a resposta certa é óbvia. Corolário: campo que pode
  receber valor precisa de **caminho de volta visível**, e ele se confere no aparelho — controle
  nativo tem botão de limpar que um `appearance:none` no CSS apaga sem avisar. (04/09/2026)
- [ ] **Números lado a lado têm de fechar entre si na tela, não só na conta.** "1,0h" e "120%"
  na mesma linha pareciam contradição porque cada um arredondava de um jeito — a conta estava
  certa e a tela dizia que não. Onde dois números se dividem um pelo outro à vista da pessoa,
  a precisão mostrada tem de permitir refazer a divisão. E toda coluna de número diz **de que**
  é a porcentagem: "%" e "Cumprido" não dizem. (04/09/2026)
