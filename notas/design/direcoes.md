# Aprovô: 3 direções de identidade

Contraste calculado pela fórmula WCAG 2.x (luminância relativa), script em Python. Meta: texto normal 4.5:1. `accent / bg` mede links, bordas e ícones (3:1 mínimo para UI).

Referências: Prospectar-Clientes/DESIGN.md (Midas V2: navy + dourado, uma família) usado como régua de disciplina (uma cor de marca, ênfase rara). O projeto Gift List não foi encontrado em projetos-freelancer (nenhuma pasta/arquivo com esse nome fora de node_modules); seguiu-se sem ele.

Regra comum: certo/errado nunca só por cor (ícone ✓/✕ + rótulo textual), botão primário com 52px, uma ação primária por tela.


## Direção 1: Gabarito (caneta azul + bolha marcada)

Mockup: `direcao-1.html` / print `direcao-1.png`.

**Racional:** Azul de caneta esferográfica: a cor de quem marca o gabarito. Confiável e enérgico sem cair no azul-marinho de banco; fundo de papel de prova levemente azulado. Bricolage dá personalidade nos títulos; Figtree é muito legível em celular de entrada.

**Fontes (Google Fonts, 2 famílias):** Bricolage Grotesque (títulos, botões, rótulos) + Figtree (corpo, enunciados).

**Logo:** bolha marcada: o círculo do cartão-resposta com o check dentro. Mínimo 16px; versão monocromática = mesmo desenho em currentColor; versão invertida = troca fundo e traço.

```svg
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#1d4ed8"/><circle cx="24" cy="24" r="13" fill="none" stroke="#fff" stroke-width="4"/><path d="M17.5 24.5l4.5 4.5 9-10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

| token | claro | escuro |
|---|---|---|
| --bg | #f6f8fc | #0e1424 |
| --surface | #ffffff | #161e33 |
| --raised | #edf1f8 | #1e2842 |
| --text | #14213d | #e8edf7 |
| --muted | #4a5670 | #a3aec6 |
| --border | #d5dceb | #2e3a58 |
| --accent | #1d4ed8 | #7aa2ff |
| --onaccent | #ffffff | #0b1330 |
| --accentsoft | #e3ebfd | #1c2b55 |
| --ok | #13703f | #5fd394 |
| --okbg | #e6f4ec | #123324 |
| --err | #b3261e | #ff8a80 |
| --errbg | #fbe9e7 | #3a1714 |

**Contraste verificado:**

| par | claro | escuro |
|---|---|---|
| text / bg | 15.02 ok AA | 15.63 ok AA |
| text / surface | 15.97 ok AA | 14.11 ok AA |
| muted / bg | 6.92 ok AA | 8.24 ok AA |
| muted / surface | 7.35 ok AA | 7.44 ok AA |
| onaccent / accent | 6.70 ok AA | 7.34 ok AA |
| ok / okbg | 5.42 ok AA | 7.37 ok AA |
| err / errbg | 5.58 ok AA | 7.01 ok AA |
| accent / bg | 6.30 ok AA | 7.38 ok AA |

**Componentes:** botão primário fundo `--accent`, texto `--onaccent`, raio 12px, 52px, largura total no celular; secundário = contorno 1.5px `--border` + texto `--text`. Card = `--surface`, borda 1px `--border`, sem sombra. Alternativa certa: fundo `--okbg`, borda 2px `--ok`, ✓ + "Correta". Errada: `--errbg`, borda 2px `--err`, ✕ + "Sua resposta". Badges de estado em pílula com o mesmo par.


## Direção 2: Marca-texto (grifo amarelo + tinta berinjela)

Mockup: `direcao-2.html` / print `direcao-2.png`.

**Racional:** O concurseiro vive de resumo grifado. Amarelo marca-texto é o acento de ação (sempre com texto escuro em cima, nunca branco), e a marca é um roxo-berinjela profundo no lugar do preto que o dono rejeitou. Archivo aguenta títulos longos de cargo; Source Serif no corpo dá cara de material de estudo sério.

**Fontes (Google Fonts, 2 famílias):** Archivo (títulos, botões, rótulos) + Source Serif 4 (corpo, enunciados).

**Logo:** A grifado: a letra A sobre uma faixa de marca-texto. Mínimo 16px; versão monocromática = mesmo desenho em currentColor; versão invertida = troca fundo e traço.

```svg
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="10" fill="#4b2e83"/><rect x="8" y="26" width="32" height="10" rx="2" fill="#ffd43b" transform="rotate(-6 24 31)"/><path d="M15 34L24 12l9 22M18.5 26h11" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

| token | claro | escuro |
|---|---|---|
| --bg | #fbfaf6 | #17121f |
| --surface | #ffffff | #211a2c |
| --raised | #f3f0e8 | #2b2338 |
| --text | #2a1f3d | #f1edf7 |
| --muted | #5c5370 | #b6abc8 |
| --border | #e2ddd0 | #3d3350 |
| --accent | #ffd43b | #ffd43b |
| --onaccent | #2a1f3d | #2a1f3d |
| --accentsoft | #fff3bf | #3a3216 |
| --brand | #4b2e83 | #c4a8f5 |
| --ok | #1b6e3c | #6fd59a |
| --okbg | #e5f3ea | #13301f |
| --err | #b42318 | #ff8f85 |
| --errbg | #fdeceb | #3b1715 |

**Contraste verificado:**

| par | claro | escuro |
|---|---|---|
| text / bg | 14.76 ok AA | 15.92 ok AA |
| text / surface | 15.42 ok AA | 14.57 ok AA |
| muted / bg | 6.87 ok AA | 8.44 ok AA |
| muted / surface | 7.18 ok AA | 7.73 ok AA |
| onaccent / accent | 10.82 ok AA | 10.82 ok AA |
| ok / okbg | 5.49 ok AA | 7.93 ok AA |
| err / errbg | 5.75 ok AA | 7.22 ok AA |
| accent / bg | 1.36 (só preenchimento de botão/grifo, nunca texto; links e foco usam --brand) | 12.89 ok AA |
| brand / bg | 9.97 ok AA | 8.98 ok AA |

**Componentes:** botão primário fundo `--accent`, texto `--onaccent`, raio 8px, 52px, largura total no celular; secundário = contorno 1.5px `--border` + texto `--text`. Card = `--surface`, borda 1px `--border`, sem sombra. Alternativa certa: fundo `--okbg`, borda 2px `--ok`, ✓ + "Correta". Errada: `--errbg`, borda 2px `--err`, ✕ + "Sua resposta". Badges de estado em pílula com o mesmo par.


## Direção 3: Ipê (terracota + flor de ipê)

Mockup: `direcao-3.html` / print `direcao-3.png`.

**Racional:** Brasileiro sem clichê verde-amarelo: terracota de telha, creme quente e marrom-café no texto. Acolhedor para quem estuda à noite depois do trabalho; o Mentor de IA soa como professor, não como robô. Sora geométrica nos títulos, Literata para leitura longa de enunciado.

**Fontes (Google Fonts, 2 famílias):** Sora (títulos, botões, rótulos) + Literata (corpo, enunciados).

**Logo:** flor de ipê com check no miolo: aprovação que floresce. Mínimo 16px; versão monocromática = mesmo desenho em currentColor; versão invertida = troca fundo e traço.

```svg
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="24" fill="#c2410c"/><g fill="#fff"><ellipse cx="24" cy="14.5" rx="4.5" ry="7"/><ellipse cx="24" cy="14.5" rx="4.5" ry="7" transform="rotate(72 24 24)"/><ellipse cx="24" cy="14.5" rx="4.5" ry="7" transform="rotate(144 24 24)"/><ellipse cx="24" cy="14.5" rx="4.5" ry="7" transform="rotate(216 24 24)"/><ellipse cx="24" cy="14.5" rx="4.5" ry="7" transform="rotate(288 24 24)"/></g><circle cx="24" cy="24" r="6.5" fill="#c2410c"/><path d="M21 24.3l2.2 2.2 4-4.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

| token | claro | escuro |
|---|---|---|
| --bg | #fff8f0 | #1a120d |
| --surface | #ffffff | #241913 |
| --raised | #f8ece0 | #2f221a |
| --text | #2b1a12 | #f7ece3 |
| --muted | #6a5244 | #c7b1a2 |
| --border | #ead8c7 | #45342a |
| --accent | #c2410c | #fb8a4c |
| --onaccent | #ffffff | #2b1206 |
| --accentsoft | #fde4d3 | #46230f |
| --ok | #166534 | #6dd68f |
| --okbg | #e3f2e7 | #14301d |
| --err | #9f1239 | #ff8fab |
| --errbg | #fbe6ec | #3d1420 |

**Contraste verificado:**

| par | claro | escuro |
|---|---|---|
| text / bg | 15.83 ok AA | 15.90 ok AA |
| text / surface | 16.68 ok AA | 14.76 ok AA |
| muted / bg | 6.87 ok AA | 9.01 ok AA |
| muted / surface | 7.23 ok AA | 8.37 ok AA |
| onaccent / accent | 5.18 ok AA | 7.42 ok AA |
| ok / okbg | 6.15 ok AA | 7.93 ok AA |
| err / errbg | 6.73 ok AA | 7.40 ok AA |
| accent / bg | 4.92 ok AA | 7.78 ok AA |

**Componentes:** botão primário fundo `--accent`, texto `--onaccent`, raio 16px, 52px, largura total no celular; secundário = contorno 1.5px `--border` + texto `--text`. Card = `--surface`, borda 1px `--border`, sem sombra. Alternativa certa: fundo `--okbg`, borda 2px `--ok`, ✓ + "Correta". Errada: `--errbg`, borda 2px `--err`, ✕ + "Sua resposta". Badges de estado em pílula com o mesmo par.
