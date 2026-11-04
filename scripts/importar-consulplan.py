# Importa uma prova OFICIAL da Consulplan (texto via pdftotext -enc UTF-8, sem -layout) com o gabarito pós-recurso.
# Uso: python importar-consulplan.py prova.txt GABARITO slug "nome da prova" orgao fonte ano
# GABARITO: uma letra por questão, "#" = anulada. Questões anuladas e que dependem de figura ficam de fora.
import json, re, sys, pathlib
txt, GAB, SLUG, PROVA, ORGAO, FONTE, ANO = sys.argv[1:8]
bruto = open(txt, encoding="utf8", errors="replace").read().replace("\f", "\n")
# Tira cabeçalho e rodapé de página.
bruto = re.sub(r"SELEÇÃO PÚBLICA PARA DESIGNAÇÕES[^\n]*|Tipo \d+ – \w+\s*\n\s*\d+\s*\n", "\n", bruto)
DEP = re.compile(r"figura|imagem|gráfico|tabela abaixo|quadro abaixo|charge|tirinha", re.I)
MAT = {"DIREITO CIVIL E DIREITO PROCESSUAL CIVIL": "Direito Civil e Processual Civil"}
# Matéria vigente: cabeçalhos em maiúsculas antes de cada bloco.
partes = re.split(r"\n?Questão (\d{2})\s*", bruto)
materia, qs = "Direito", {}
for i in range(1, len(partes) - 1, 2):
    n, corpo = int(partes[i]), partes[i + 1]
    # Um cabeçalho de matéria no fim do bloco vale para as próximas questões.
    cab = re.findall(r"\n([A-ZÀ-Ú ,]{12,})\n", corpo)
    corpo = re.sub(r"\n[A-ZÀ-Ú ,]{12,}\n", "\n", corpo)
    corpo = re.sub(r"\s+", " ", corpo).strip()
    m = re.split(r"(?:^|\s)([A-D])\) ", corpo)
    if len(m) == 9 and n not in qs:
        qs[n] = {"comando": m[0].strip(), "alternativas": [{"letra": m[k], "texto": re.sub(r"(\w)- (\w)", r"\1\2", m[k + 1]).strip()} for k in range(1, 9, 2)], "materia": materia}
    if cab:
        materia = cab[-1].strip()
dest = pathlib.Path(__file__).resolve().parent.parent / "public/data/consulplan.json"
out = [q for q in (json.loads(dest.read_text(encoding="utf-8")) if dest.exists() else []) if not q["id"].startswith(f"consulplan-{SLUG}-")]
novos = 0
for k, q in sorted(qs.items()):
    g = GAB[k - 1] if k <= len(GAB) else "#"
    if g not in "ABCD" or DEP.search(q["comando"]) or "�" in q["comando"] + str(q["alternativas"]):
        continue
    d = MAT.get(q["materia"], q["materia"].title().replace(" E ", " e ").replace(" Do ", " do ").replace(" Da ", " da ").replace(" De ", " de "))
    out.append({"id": f"consulplan-{SLUG}-{k}", "banca": "Consulplan", "orgao": ORGAO, "prova": PROVA, "ano": int(ANO), "numero": k,
        "disciplina": d, "assunto": d, "enunciado": "", "comando": q["comando"], "alternativas": q["alternativas"], "gabarito": g,
        "comentario": f"Gabarito oficial pós-recurso da Consulplan ({PROVA}). Fonte: {FONTE}. Leis e súmulas podem ter mudado desde {ANO}."})
    novos += 1
dest.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
print(novos, "questões de", len(qs), "lidas")
# Nota: na prova TJ CE 2019 as matérias foram atribuídas pelo número (1–15 Civil/Processual Civil; 16–40 Juizados Especiais e Consumidor).
