# QA dos textos das questões: lista o que parece quebrado para corrigir na fonte.
# Uso: python -I scripts/qa-textos.py   (só lê; não altera nada)
import json, re, glob, collections
achados = collections.Counter(); exemplos = collections.defaultdict(list)
for arq in glob.glob("public/data/*.json"):
    for q in json.load(open(arq, encoding="utf8")):
        c = (q.get("comando") or "").strip()
        regras = {
            "comando começa em minúscula (sem **Item:** para cortar)": bool(c) and c[0].islower() and "**Item:**" not in c,
            "negrito sem fechar (**)": c.count("**") % 2 == 1,
            "crédito de autor na alternativa": any(re.search(r"\.\s*Por [A-ZÁÉÍÓÚ][a-záéíóúãõç]+ [A-ZÁÉÍÓÚ][a-záéíóúãõç]+\s*$", a["texto"]) for a in q.get("alternativas", [])),
            "alternativa vazia": any(not a["texto"].strip() for a in q.get("alternativas", [])),
        }
        for nome, ruim in regras.items():
            if ruim:
                achados[nome] += 1
                if len(exemplos[nome]) < 3: exemplos[nome].append(q["id"])
for nome, n in achados.most_common():
    print(f"{n:5d}  {nome}  ex.: {', '.join(exemplos[nome])}")
