# Remove cabeçalhos/rodapés de página dos cadernos da Cebraspe que vazaram para o texto
# (ex.: "UnB/CESPE – MPU Cargo 11: ... – 7 –", "760CB1_01N100633 CEBRASPE – INSS – Edital: 2022").
import json, re, pathlib
p = pathlib.Path(__file__).resolve().parent.parent / "public/data/cebraspe.json"
d = json.loads(p.read_text(encoding="utf-8"))
CAB = re.compile(
    r"\S*N\d{5,}\s+CEBRASPE\s*–[^\n]{0,80}?Edital: \d{4}"
    r"|\d{10,}\s+CEBRASPE\s*–[^\n]{0,80}?Edital: \d{4}"
    r"|CEBRASPE\s*–\s*[A-Z/ ]{2,30}\s*–\s*Edital: \d{4}"
    r"|"
    r"|UnB/CESPE\s*–[^\n]{0,160}?–\s?\d+\s?–"
    r"|^[^\n]{0,160}?(?:Caderno|Cargo)[^\n]{0,80}?–\s?\d+\s?–"
    r"|Caderno \w+ ?–\s?\d+\s?–"
    r"|UnB/CESPE\s*–[^\n]{0,60}"
)
limpa = lambda t: re.sub(r"[ \t]{2,}", " ", CAB.sub("", t)).strip()
n = 0
for q in d:
    cmd, sep, item = q["comando"].partition("**Item:**")
    novo = (limpa(cmd) + "\n\n" + sep + " " + limpa(item)) if sep else limpa(cmd)
    alts = [{**a, "texto": limpa(a["texto"])} for a in q["alternativas"]]
    if novo != q["comando"] or alts != q["alternativas"]:
        n += 1
        q["comando"], q["alternativas"] = novo, alts
p.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
print(n, "comandos limpos")
