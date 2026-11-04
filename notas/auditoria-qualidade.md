# Auditoria de desempenho e de questões (03/11/2026)

## Desempenho em produção (celular)
- Lighthouse 12 não roda aqui (Node 14 na máquina); a medição foi feita com curl e com o navegador em modo celular.
- Tela de entrada: JS 259 KB (84 KB comprimido), CSS 33 KB, carregamento em ~1 s; sem layout shift (CLS 0).
- Bancos de questões (brotli, cache de 1 dia): OAB 727 KB, Cebraspe 673 KB, ENEM 370 KB, FGV 34 KB.
- **Corrigido**: OAB e ENEM também passam a carregar depois que o app abre (antes só a Cebraspe). A primeira tela agora depende só dos bancos pequenos (ACE, comuns, FGV, estilo).
- Pendente do Kauã: o selo "Powered by Netlify" (`hud?variant=public`, 35 KB) carrega em toda página.

## Questões (`scripts/auditar-questoes.py`)
Conferidas 10.207 → 10.132 depois da limpeza (75 removidas):
- 61 do ENEM com alternativas vazias/repetidas (alternativas eram imagens).
- 11 duplicadas na Cebraspe (mesmo item em cadernos diferentes).
- 2 da OAB com enunciado vazio; 1 da FGV com gabarito "E" sem a alternativa E extraída.
- 35 comandos com cabeçalho de página ("CEBRASPE – INSS – Edital: 2022") limpos por `scripts/limpar-cabecalhos.py`.
- Restam 9 da OAB com marcação de página no fim do texto (não atrapalha a leitura).

Rode `python scripts/auditar-questoes.py --corrigir` depois de cada importação.
