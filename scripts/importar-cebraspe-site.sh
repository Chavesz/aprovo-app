# Importa UM caderno da Cebraspe cujos links vêm do site novo (www.cebraspe.org.br/concursos/PASTA),
# onde a pasta do CDN não lista os arquivos. Pegue os nomes do caderno e do gabarito definitivo na página.
# Uso: bash importar-cebraspe-site.sh PASTA CADERNO.PDF GABARITO.PDF slug "Nome da prova" ITEM_INICIAL "faixas" ano
P=$1; CAD=$2; GAB=$3; SLUG=$4; NOME=$5; INI=$6; FAIX=$7; ANO=$8
mkdir -p "$TEMP/site-$SLUG"; cd "$TEMP/site-$SLUG"
B=https://cdn.cebraspe.org.br/concursos/$P/arquivos
R="/c/Users/Kaua Chaves/Desktop/projetos-freelancer/concurso-questoes"
curl -sL -m 60 -o c.pdf "$B/$CAD"; curl -sL -m 60 -o g.pdf "$B/$GAB"
pdftotext -raw -enc UTF-8 c.pdf c.txt; pdftotext -raw g.pdf g.txt
G=$(python -I "$R/scripts/gabarito-cebraspe.py" g.txt)
INICIO=$INI python -I "$R/scripts/importar-cebraspe-ce.py" c.txt "$G" "$SLUG" "$NOME" "cebraspe.org.br/concursos/$P" "$FAIX" "$ANO"
python -I "$R/scripts/limpar-cabecalhos.py" >/dev/null
# Itens que dependem de texto, figura ou imagem da prova ficam de fora.
python -I -c "
import json,re;p='$R/public/data/cebraspe.json';d=json.load(open(p,encoding='utf8'))
d=[q for q in d if not (q['id'].startswith('cebraspe-$SLUG-') and re.search(r'\btexto\b|parágrafo|período do|figura|imagem',q['comando'],re.I))]
json.dump(d,open(p,'w',encoding='utf8'),ensure_ascii=False)"
