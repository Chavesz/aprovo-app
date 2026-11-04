# Aprovô: crítica das 3 direções de identidade

Base: direcoes.md e os prints direcao-1/2/3.png (celular, 390px). A estrutura das três é idêntica (hero, CTA, questão do dia, Mentor, estados), então a comparação abaixo trata só de identidade: cor, tipografia e logo.

## Direção 1: Gabarito (azul caneta)

- **Confiança/venda:** é a mais "segura". Azul passa seriedade e o CTA (#1d4ed8, 6.7:1) é bem forte.
- **Uso longo:** Figtree no enunciado é limpa, mas um enunciado longo de prova em sans fica com cara de app genérico e cansa mais que uma serifa de leitura. O fundo azulado frio é confortável.
- **Diferenciação (P1):** é a mais fraca. QConcursos, Gran e Estratégia já vivem no azul. Nas lojas de apps vira mais um ícone azul com check. Passa no teste de "poderia ter sido gerado por um agente padrão" só por pouco.
- **Risco:** baixo de execução, alto de ficar invisível no mercado.
- **Escuro:** bem resolvido (#7aa2ff com 7.4:1, superfícies azul-noite). É o melhor dos três.

## Direção 2: Marca-texto (amarelo + berinjela)

- **Confiança/venda:** o amarelo de grifo é o gesto mais reconhecível do concurseiro e o CTA salta da tela (10.8:1 com tinta escura). O berinjela dá peso de marca premium sem voltar ao preto. Vende bem em anúncio e na loja.
- **Uso longo:** é a melhor. Source Serif 4 no enunciado lembra material de estudo e cansa menos em sessões de 1h ou mais. Archivo segura títulos longos de cargo.
- **Diferenciação:** é a mais alta. Ninguém do setor tem grifo amarelo como sistema. O logo "A grifado" é próprio e funciona a 16px.
- **Risco (P1):** o amarelo aparece demais: CTA, grifo do hero, botão "Próxima" e o badge "Mentor". O acento deixa de apontar para algo. Além disso, `--bg #fbfaf6` e `--raised #f3f0e8` são creme/bege, e o dono rejeitou bege. Roxo com amarelo pode lembrar fintech se o roxo for saturado demais. #4b2e83 está no limite.
- **Escuro:** amarelo no escuro funciona muito bem (12.9:1). As superfícies roxas (#17121f) ficam ok, mas o tom violeta em 100% das superfícies pesa à noite.

## Direção 3: Ipê (terracota)

- **Confiança/venda:** é calorosa e brasileira, mas terracota em CTA lê como "alerta/promoção" e passa menos rigor do que um produto pago de aprovação pede.
- **Uso longo:** Literata é excelente para leitura.
- **Diferenciação:** boa, mas o creme quente com marrom-café está a um passo da paleta bege que foi rejeitada. É o maior risco de o dono rejeitar de novo.
- **Risco (P1):** o acento #c2410c e o erro #9f1239 são vizinhos de matiz. Num app em que errado/certo é o centro da experiência, o botão "Próxima" laranja-avermelhado ao lado do card de erro vinho confunde, mesmo com ✕ e rótulo. O acento sobre o fundo dá 4.92:1, no limite.
- **Escuro:** marrom-escuro funciona, mas fica "quarto escuro de café".

## Escolha: Direção 2 (Marca-texto), com ajustes

É a única que tem uma ideia própria do domínio (o grifo), a melhor leitura longa e o CTA mais forte. Os problemas dela se corrigem com disciplina de cor, sem trocar a direção.

### Ajustes concretos

1. **Tirar o bege.** Neutros claros passam a ser frios/neutros: `--bg #f8f8fa`, `--raised #f0eff4`, `--border #dddbe5` (um leve violeta, da família da marca). Isso afasta de vez a paleta rejeitada.
2. **Amarelo só para ação + grifo.** Uma ação primária amarela por tela, mais o grifo do hero e os destaques de texto. O badge e o bloco "Mentor" passam a usar a família da marca: `--brandsoft #efe9fa` (claro) / `#2a2140` (escuro), com rótulo em `--brand`. O Mentor ganha identidade própria (roxo = a IA), separada da ação (amarelo).
3. **Botão secundário em par.** "Pular" fica com contorno neutro, como está. Só "Próxima" é amarelo. Isso está correto, mas não pode ser replicado em listas e cards.
4. **Roxo menos saturado** para evitar a leitura de fintech: `--brand #4a2f7a` no claro. Antes de fechar, conferir de novo o contraste com o fundo (o alvo é 9:1 ou mais).
5. **Foco e links sempre em `--brand`,** nunca em amarelo (1.36:1 no claro). Anel de foco de 2px `--brand` com offset de 2px.
6. **Modo escuro neutralizado:** `--bg #141218`, `--surface #1c1a22`, `--raised #25222d`, `--border #36323f` (violeta só como tinta leve). O amarelo #ffd43b fica igual. O texto do enunciado passa para `#ece9f1` para reduzir o brilho em leitura noturna.
7. **Logo:** manter o "A grifado". Testar a 16px em fundo amarelo e em fundo escuro, e definir a versão sem o quadrado para a barra do app.
8. **Recalcular a tabela de contraste** com os novos tokens antes de implementar (texto/bg, muted/raised, brand/brandsoft, ok/okbg, err/errbg nos dois modos).

### O que aproveitar das outras

- Da Direção 1: a estrutura de superfícies do modo escuro (3 níveis bem separados).
- Da Direção 3: nada de cor. Literata seria a alternativa se a Source Serif 4 render mal em Android de entrada.
