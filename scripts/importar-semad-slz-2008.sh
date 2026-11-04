# Baixa e importa todos os cadernos da SEMAD São Luís 2008 (Cebraspe).
cd "$TEMP/semad"
B=https://cdn.cebraspe.org.br/concursos/SEMAD_SAOLUIS2008/arquivos
R="/c/Users/Kaua Chaves/Desktop/projetos-freelancer/concurso-questoes"
for f in $(curl -sL -m 40 https://cdn.cebraspe.org.br/concursos/SEMAD_SAOLUIS2008 | grep -oiE 'SEMADMA08_0[0-9]{2}_[0-9]+\.pdf' | sort -u); do
  k=${f#SEMADMA08_}; k=${k%.pdf}
  [ -f "c_$k.txt" ] || { curl -sL -m 60 -o "c_$k.pdf" "$B/$f"; curl -sL -m 60 -o "g_$k.pdf" "$B/SEMADMA08_Gab_definitivo_$k.pdf"; pdftotext -enc UTF-8 "c_$k.pdf" "c_$k.txt" 2>/dev/null; }
  G=$(pdftotext -layout "g_$k.pdf" - 2>/dev/null | grep "^Gabarito" | sed 's/Gabarito//' | tr -d ' \n')
  C=$(grep -m1 -oE "Cargo: .*" "c_$k.txt" | sed -E 's/Cargo: //; s/.*Área de Formação [0-9]+: //; s/.*– //' | sed -E "s/^Especialidade: /Medicina - /" | cut -c1-60)
  [ ${#G} -ge 100 ] && [ -n "$C" ] || { echo "pula $k"; continue; }
  echo -n "$k $C: "
  python -I "$R/scripts/importar-cebraspe-ce.py" "c_$k.txt" "$G" "semad-slz-2008-$k" "SEMAD São Luís 2008 · $C (Cebraspe)" cdn.cebraspe.org.br/concursos/SEMAD_SAOLUIS2008 "50:Conhecimentos Gerais,200:$C" 2008
done
