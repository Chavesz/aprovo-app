# Importa um concurso inteiro da Cebraspe (pasta com cadernos PFX_NNN_M.pdf e gabaritos definitivos).
# Uso: bash importar-cebraspe-lote.sh PASTA PREFIXO_CADERNO SLUG "Nome do concurso" ANO
P=$1; PFX=$2; SLUG=$3; NOME=$4; ANO=$5
mkdir -p "$TEMP/lote-$SLUG"; cd "$TEMP/lote-$SLUG"
U=https://cdn.cebraspe.org.br/concursos/$P; B=$U/arquivos
R="/c/Users/Kaua Chaves/Desktop/projetos-freelancer/concurso-questoes"
PAG=$(curl -sL -m 40 $U)
for f in $(echo "$PAG" | grep -oE "${PFX}_0[0-9]{2}_[0-9]+\.pdf" | sort -u); do
  k=${f#${PFX}_}; k=${k%.pdf}; n=${k%%_*}
  gab=$(echo "$PAG" | grep -oiE "arquivos/[^\"]*Gab_Definitivo[^\"]*_${n}_[0-9]+\.pdf" | head -1)
  [ -n "$gab" ] || { echo "sem gabarito $k"; continue; }
  [ -f "c_$k.txt" ] || { curl -sL -m 60 -o "c_$k.pdf" "$B/$f"; curl -sL -m 60 -o "g_$k.pdf" "$U/$gab"; pdftotext -raw -enc UTF-8 "c_$k.pdf" "c_$k.txt" 2>/dev/null; pdftotext -raw "g_$k.pdf" "g_$k.txt" 2>/dev/null; }
  G=$(python -I "$R/scripts/gabarito-cebraspe.py" "g_$k.txt" 2>/dev/null)
  C=$(grep -A4 -m1 "^CARGO" "c_$k.txt" | tail -4 | tr '\n' ' ' | sed -E 's/Provas? Objetiva.*//; s/LEIA COM.*//; s/^ *[0-9]+ *//; s/ +[0-9]+ *$//; s/ +$//; s/\/ */\/ /g' | cut -c1-70)
  [ -n "$C" ] || C=$(grep -m1 -oE "^Cargo [0-9]+: .*" "c_$k.txt" | sed -E 's/^Cargo [0-9]+: //; s/ *– *[0-9]+ *–.*//' | cut -c1-70)
  [ -n "$C" ] || C=$(echo "$PAG" | grep -B3 -A3 "${PFX}_$k.pdf" | sed 's/<[^>]*>//g' | grep -oE "Caderno de quest&otilde;es - .*" | head -1 | sed -E 's/Caderno de quest&otilde;es - //; s/ - [0-9]+ horas.*//' | python -I -c 'import html,sys;print(html.unescape(sys.stdin.read()).strip())' | cut -c1-70)
  I=$(grep -m1 -oE "^[0-9]{1,3} [A-ZÀ-Ú]" "c_$k.txt" | cut -d' ' -f1)
  F=$(awk '/^CONHECIMENTOS ESPEC/{print n; exit} /^[0-9]{1,3} [A-ZÀ-Ú]/{n=$1}' "c_$k.txt")
  [ ${#G} -ge 50 ] && [ -n "$C" ] || { echo "pula $k"; continue; }
  echo -n "$k $C: "
  INICIO=${I:-1} python -I "$R/scripts/importar-cebraspe-ce.py" "c_$k.txt" "$G" "$SLUG-$k" "$NOME · $C (Cebraspe)" "cdn.cebraspe.org.br/concursos/$P" "${F:-50}:Conhecimentos Básicos,300:$C" $ANO
done
python -I "$R/scripts/ajustar-mpu-2010.py" "$SLUG" >/dev/null
python -I "$R/scripts/limpar-cabecalhos.py"
