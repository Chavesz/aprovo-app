# Confere o banco de questões: ids repetidos, enunciados duplicados, gabarito fora das alternativas,
# alternativas vazias/repetidas, texto quebrado (caractere inválido, cabeçalho de PDF) e comandos curtos demais.
# Uso: python auditar-questoes.py [--corrigir]  (com --corrigir, remove os casos graves e grava os arquivos)
import json, pathlib, re, sys, collections
DATA = pathlib.Path(__file__).resolve().parent.parent / "public/data"
ARQS = ["ace-cuite", "comuns", "estilo", "cebraspe", "fgv", "consulplan", "oab", "questoes"]
corrigir = "--corrigir" in sys.argv
QUEBRA = re.compile(r"�||UnB/CESPE|CEBRASPE –|Caderno [A-Z] –|–\s?\d+\s?–$")
todas, problemas = {}, collections.Counter()
exemplos = collections.defaultdict(list)
def marca(tipo, q):
    problemas[tipo] += 1
    if len(exemplos[tipo]) < 3: exemplos[tipo].append(q["id"])
vistos_id, vistos_txt = set(), {}
for a in ARQS:
    p = DATA / f"{a}.json"
    if not p.exists(): continue
    qs = json.loads(p.read_text(encoding="utf-8")); ok = []
    for q in qs:
        letras = [x["letra"] for x in q["alternativas"]]
        textos = [x["texto"].strip() for x in q["alternativas"]]
        chave = re.sub(r"\W+", " ", (q.get("enunciado", "") + q["comando"]).lower()).strip()[-400:] + "|" + "|".join(textos).lower()
        grave = False
        if q["id"] in vistos_id: marca("id repetido", q); grave = True
        if q["gabarito"] not in letras: marca("gabarito fora das alternativas", q); grave = True
        if any(not t for t in textos): marca("alternativa vazia", q); grave = True
        if len(set(textos)) < len(textos): marca("alternativas repetidas", q); grave = True
        if len(q["comando"].split("**Item:**")[-1].strip()) < 15 and len(q.get("enunciado", "")) < 30: marca("comando curto demais", q); grave = True
        if chave in vistos_txt and vistos_txt[chave] != q["id"]: marca("questão duplicada (mesmo texto)", q); grave = True
        if QUEBRA.search(q["comando"] + " ".join(textos)): marca("texto com resto de PDF", q)
        vistos_id.add(q["id"]); vistos_txt.setdefault(chave, q["id"])
        if not (grave and corrigir): ok.append(q)
    if corrigir and len(ok) != len(qs):
        p.write_text(json.dumps(ok, ensure_ascii=False), encoding="utf-8"); print(f"{a}: removidas {len(qs) - len(ok)}")
print(f"{len(vistos_id)} questões conferidas")
for t, n in problemas.most_common(): print(f"- {t}: {n} (ex.: {', '.join(exemplos[t])})")
