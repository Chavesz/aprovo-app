# Pós-processa os itens do MPU 2010: matéria legível e remove itens que dependem de figura (ex.: "de 4 para 5").
import json, re, pathlib, sys
PREF = "cebraspe-" + (sys.argv[1] if len(sys.argv) > 1 else "mpu")
p = pathlib.Path(__file__).resolve().parent.parent / "public/data/cebraspe.json"
d = json.loads(p.read_text(encoding="utf-8"))
FIG = re.compile(r"\bde \d para \d|\bponto [A-Z0-9]\b|\bestado \d\b|\bcurva\b|\bdiagrama|\bcircuito\b", re.I)
PEQ = {"De", "Do", "Da", "Dos", "Das", "E"}
def nome(c):
    c = re.sub(r"^(ANALISTA|TÉCNICO)( -)? (DE )?(ESPECIALIDADE: )?", "", c).replace("/ PERITO", "")
    c = c.split("/")[-1].strip() or c
    return " ".join(w.lower() if w.title() in PEQ else w.title() for w in c.split())
out = []
for q in d:
    if q["id"].startswith(PREF):
        if FIG.search(q["comando"].split("**Item:**")[-1]): continue
        if q["disciplina"] != "Conhecimentos Básicos": q["disciplina"] = q["assunto"] = nome(q["disciplina"])
    out.append(q)
p.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
print(len(out))
