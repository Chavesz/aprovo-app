# Importa uma prova OFICIAL de múltipla escolha da FGV (texto via pdftotext -enc UTF-8) com o gabarito definitivo.
# Uso: python importar-fgv.py prova.txt GABARITO slug "nome da prova" orgao fonte ano "Matéria1,Matéria2,..."
# Questões anuladas (*) e que dependem de figura/tabela ficam de fora. Se a questão cita "o texto", o texto vai no enunciado.
import json, re, sys, pathlib
txt, GAB, SLUG, PROVA, ORGAO, FONTE, ANO, MATS = sys.argv[1:9]
MATERIAS = MATS.split(",")
NOME = {"Língua Portuguesa": "Português", "Conhecimentos Específicos": "Específicos PM SP"}
bruto = open(txt, encoding="utf8", errors="replace").read().replace("\f", "\n")
# Às vezes o PDF junta duas questões na mesma linha: "... (E) 20m. 32 A figura..." vira duas linhas.
bruto = re.sub(r"(\([DE]\)[^()\n]*?[.?!])\s+(?=\d{1,3} [A-ZÀ-Ú“\"])", "\\1\n", bruto)
linhas = [l.strip() for l in bruto.split("\n")]
DEP = re.compile(r"figura|esquema|imagem|foto|esboço|desenh|gráfico|tabela|quadro|charge|tirinha|mapa|ilustra", re.I)
qs, n, materia, texto, buf, atual = {}, 0, MATERIAS[0], [], [], None
def fecha():
    global atual
    if atual:
        corpo = " ".join(atual["linhas"])
        m = re.split(r"\(([A-E])\)\s*", corpo)
        if len(m) >= 9:
            alts = [{"letra": m[i], "texto": re.split(r"|\s+(?:CORPO DE BOMBEIROS|CONCURSO P|Realização)", m[i + 1])[0].strip()} for i in range(1, len(m) - 1, 2)]
            qs[atual["n"]] = {"comando": m[0].strip(), "alternativas": alts, "materia": atual["materia"], "texto": atual["texto"]}
    atual = None
for l in linhas:
    if l in MATERIAS:
        fecha(); materia = l; texto = []; buf = []; continue
    mn = re.fullmatch(r"(\d{1,3})(?: (.+))?", l)
    if mn and n < int(mn.group(1)) <= n + 3 and (mn.group(2) is None or re.match(r"[A-ZÀ-Ú“\"]", mn.group(2))):
        fecha(); n = int(mn.group(1))
        if buf: texto = buf; buf = []
        atual = {"n": n, "linhas": [mn.group(2)] if mn.group(2) else [], "materia": materia, "texto": " ".join(texto)}; continue
    if re.match(r"^(Cabo PM|Tipo .*Página \d+|CONCURSO PARA.*|FGV|Cadete BM.*)$", l) or not l:
        continue
    if atual and not re.match(r"^Atenção", l) and not (atual["linhas"] and re.search(r"\([A-E]\).*\(D\)", " ".join(atual["linhas"])) and re.match(r"^[“\"A-Z]", l) and len(l) > 120):
        atual["linhas"].append(l); continue
    fecha(); buf.append(l)
fecha()
dest = pathlib.Path(__file__).resolve().parent.parent / "public/data/fgv.json"
out = [q for q in (json.loads(dest.read_text(encoding="utf-8")) if dest.exists() else []) if not q["id"].startswith(f"fgv-{SLUG}-")]
novos = 0
for k, q in sorted(qs.items()):
    g = GAB[k - 1] if k <= len(GAB) else "*"
    if g not in "ABCDE" or DEP.search(q["comando"]) or "�" in q["comando"] + str(q["alternativas"]): continue
    usa_texto = re.search(r"\btexto\b", q["comando"], re.I) and q["texto"]
    d = NOME.get(q["materia"], q["materia"])
    out.append({"id": f"fgv-{SLUG}-{k}", "banca": "FGV", "orgao": ORGAO, "prova": PROVA, "ano": int(ANO), "numero": k,
        "disciplina": d, "assunto": d, "enunciado": q["texto"] if usa_texto else "", "comando": q["comando"], "alternativas": q["alternativas"], "gabarito": g,
        "comentario": f"Gabarito oficial definitivo da FGV ({PROVA}). Fonte: {FONTE}. Leis e fatos podem ter mudado desde {ANO}."})
    novos += 1
dest.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
print(novos, "questões de", n)
