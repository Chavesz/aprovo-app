# INSS 2022 (Cebraspe), Técnico do Seguro Social: provas e gabaritos definitivos oficiais (versões 760 e 787).
# Links tirados de https://www.cebraspe.org.br/concursos/INSS_22 (a pasta do CDN não lista os arquivos).
mkdir -p "$TEMP/inss"; cd "$TEMP/inss"
B=https://cdn.cebraspe.org.br/concursos/INSS_22/arquivos
R="/c/Users/Kaua Chaves/Desktop/projetos-freelancer/concurso-questoes"
for k in 760_INSS_CB1_01 787_INSS_CB1_01 760_INSS_001_01 787_INSS_001_01; do
  curl -sL -m 60 -o c_$k.pdf $B/$k.PDF; curl -sL -m 60 -o g_$k.pdf $B/GAB_DEFINITIVO_$k.PDF
  pdftotext -raw -enc UTF-8 c_$k.pdf c_$k.txt; pdftotext -raw g_$k.pdf g_$k.txt
  G=$(python -I "$R/scripts/gabarito-cebraspe.py" g_$k.txt)
  case $k in *CB1*) I=1; F="50:Conhecimentos Básicos";; *) I=51; F="120:Seguridade Social e Previdência";; esac
  INICIO=$I python -I "$R/scripts/importar-cebraspe-ce.py" c_$k.txt "$G" "inss-2022-$k" "INSS 2022 · Técnico do Seguro Social (Cebraspe)" cebraspe.org.br/concursos/INSS_22 "$F" 2022
done
python -I "$R/scripts/limpar-cabecalhos.py"
# Tira itens que dependem do texto da prova (não vem junto).
python -I -c "
import json,re;p='$R/public/data/cebraspe.json';d=json.load(open(p,encoding='utf8'))
d=[q for q in d if not ('inss-2022' in q['id'] and re.search(r'\btexto\b|parágrafo|período do',q['comando'],re.I))]
json.dump(d,open(p,'w',encoding='utf8'),ensure_ascii=False)"
