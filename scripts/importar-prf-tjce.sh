# PRF 2021 (Certo/Errado) e TJ CE 2023 Técnico Judiciário (múltipla escolha), ambos Cebraspe, com gabarito definitivo.
R="/c/Users/Kaua Chaves/Desktop/projetos-freelancer/concurso-questoes"
bash "$R/scripts/importar-cebraspe-site.sh" PRF_21 578_PRF_001_01.PDF GAB_DEFINITIVO_578_PRF_001_01.PDF prf-2021 "PRF 2021 · Policial Rodoviário Federal (Cebraspe)" 9 "54:Conhecimentos Gerais PRF,84:Legislação de Trânsito,120:Direito (PRF)" 2021
mkdir -p "$TEMP/tjce"; cd "$TEMP/tjce"
B=https://cdn.cebraspe.org.br/concursos/TJ_CE_23_SERVIDOR/arquivos
for k in "CG1_01:Conhecimentos Gerais (TJ CE)" "001_01:Técnico Judiciário – Área Judiciária" "002_01:Técnico Judiciário – Área Técnico-Administrativa"; do
  c=${k%%:*}; m=${k#*:}
  curl -sL -m 60 -o c$c.pdf $B/820_TJCE_SERVIDOR_$c.PDF; curl -sL -m 60 -o g$c.pdf $B/GAB_DEFINITIVO_820_TJCE_SERVIDOR_$c.PDF
  pdftotext -raw -enc UTF-8 c$c.pdf c$c.txt; pdftotext -raw -enc UTF-8 g$c.pdf g$c.txt
  G=$(python -I "$R/scripts/gabarito-cebraspe.py" g$c.txt)
  python -I "$R/scripts/importar-cebraspe-questao.py" c$c.txt "$G" "tjce-2023-$c" "TJ CE 2023 · Técnico Judiciário (Cebraspe)" "TJ CE" cebraspe.org.br/concursos/TJ_CE_23_SERVIDOR 2023 "$m"
done
