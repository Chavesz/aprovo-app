# Remove cabeçalhos/rodapés de página dos cadernos da Cebraspe que vazaram para o comando (ex.: "UnB/CESPE – MPU Cargo 11: ... – 7 –").
import json, re, pathlib
p = pathlib.Path(__file__).resolve().parent.parent / "public/data/cebraspe.json"
d = json.loads(p.read_text(encoding="utf-8"))
CAB = re.compile(r"UnB/CESPE\s*–[^\n]{0,160}?–\s?\d+\s?–|^[^\n]{0,160}?(?:Caderno|Cargo)[^\n]{0,80}?–\s?\d+\s?–|Caderno \w+ ?–\s?\d+\s?–|UnB/CESPE\s*–[^\n]{0,60}")
n = 0
for q in d:
    cmd, sep, item = q["comando"].partition("**Item:**")
    novo = re.sub(r"[ \t]{2,}", " ", CAB.sub("", cmd)).strip()
    if novo != cmd.strip():
        n += 1
        q["comando"] = (novo + "\n\n" + sep + item) if sep else novo
p.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
print(n, "comandos limpos")
