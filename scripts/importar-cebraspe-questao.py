# Importa cadernos NOVOS da Cebraspe de múltipla escolha ("Questão N" + alternativas A a E), texto via pdftotext -raw.
# Uso: python importar-cebraspe-questao.py caderno.txt GABARITO slug "nome da prova" orgao fonte ano "Matéria"
# Anuladas (X) e questões que dependem de texto, figura, tabela ou gráfico ficam de fora.
import json, re, sys, pathlib
txt, GAB, SLUG, PROVA, ORGAO, FONTE, ANO, MATERIA = sys.argv[1:9]
DEP = re.compile(r"\btexto\b|figura|tabela|quadro|gráfico|imagem|ilustra|parágrafo|trecho|período do", re.I)
LIXO = re.compile(r"^(\d{10,}|CEBRASPE –|-- .* --$)")
qs, n, atual = {}, None, None
def fecha():
    if n is None or not atual: return
    cmd, alts = [], {}
    letra = None
    for l in atual:
        m = re.match(r"^([A-E]) (.+)", l)
        if m and (letra is None and m.group(1) == "A" or letra and ord(m.group(1)) == ord(letra) + 1):
            letra = m.group(1); alts[letra] = m.group(2); continue
        if letra: alts[letra] += " " + l
        else: cmd.append(l)
    if len(alts) == 5: qs[n] = (" ".join(cmd).strip(), alts)
for l in (x.strip() for x in open(txt, encoding="utf8", errors="replace").read().replace("\f", "\n").split("\n")):
    m = re.fullmatch(r"Questão (\d{1,3})", l)
    if m: fecha(); n = int(m.group(1)); atual = []; continue
    if atual is not None and l and not LIXO.match(l): atual.append(l)
fecha()
dest = pathlib.Path(__file__).resolve().parent.parent / "public/data/cebraspe.json"
out = [q for q in json.loads(dest.read_text(encoding="utf-8")) if not q["id"].startswith(f"cebraspe-{SLUG}-")]
novos = 0
for k, (cmd, alts) in sorted(qs.items()):
    g = GAB[k - 1] if k <= len(GAB) else "X"
    if g not in "ABCDE" or DEP.search(cmd) or not cmd: continue
    out.append({"id": f"cebraspe-{SLUG}-{k}", "banca": "Cebraspe", "orgao": ORGAO, "prova": PROVA, "ano": int(ANO), "numero": k,
        "disciplina": MATERIA, "assunto": MATERIA, "enunciado": "", "comando": cmd,
        "alternativas": [{"letra": l, "texto": alts[l].strip()} for l in "ABCDE"], "gabarito": g,
        "comentario": f"Gabarito oficial definitivo da Cebraspe ({PROVA}). Fonte: {FONTE}. Leis e fatos podem ter mudado desde {ANO}."})
    novos += 1
dest.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
print(novos, "questões de", len(qs))
