# Baixa e importa os cadernos do MPU 2010 (Cebraspe), itens Certo/Errado com gabarito definitivo.
mkdir -p "$TEMP/mpu"; cd "$TEMP/mpu"
B=https://cdn.cebraspe.org.br/concursos/MPU2010/arquivos
R="/c/Users/Kaua Chaves/Desktop/projetos-freelancer/concurso-questoes"
for f in $(curl -sL -m 40 https://cdn.cebraspe.org.br/concursos/MPU2010 | grep -oE 'MPU10_0[0-9]{2}_[0-9]+\.pdf' | sort -u); do
  k=${f#MPU10_}; k=${k%.pdf}
  [ -f "c_$k.txt" ] || { curl -sL -m 60 -o "c_$k.pdf" "$B/$f"; curl -sL -m 60 -o "g_$k.pdf" "$B/Gab_definitivo_MPU10_$k.PDF"; pdftotext -raw -enc UTF-8 "c_$k.pdf" "c_$k.txt" 2>/dev/null; pdftotext -raw "g_$k.pdf" "g_$k.txt" 2>/dev/null; }
  G=$(python -I "$R/scripts/gabarito-cebraspe.py" "g_$k.txt")
  C=$(grep -A4 -m1 "^CARGO" "c_$k.txt" | tail -4 | tr '
' ' ' | sed -E 's/Provas Objetivas.*//; s/^ *[0-9]+ *//; s/ +$//; s/\/ */\/ /g' | cut -c1-70)
  F=$(awk '/^CONHECIMENTOS ESPEC/{print n; exit} /^[0-9]{1,3} [A-ZÀ-Ú]/{n=$1}' "c_$k.txt")
  [ ${#G} -ge 100 ] && [ -n "$C" ] || { echo "pula $k"; continue; }
  echo -n "$k $C: "
  python -I "$R/scripts/importar-cebraspe-ce.py" "c_$k.txt" "$G" "mpu-2010-$k" "MPU 2010 · $C (Cebraspe)" cdn.cebraspe.org.br/concursos/MPU2010 "${F:-50}:Conhecimentos Básicos,200:$C" 2010
done
python -I "$R/scripts/ajustar-mpu-2010.py"
python -I "$R/scripts/limpar-cabecalhos.py"
