# Converte questões da prova OFICIAL e pública CAIXA 2010 nível médio (Cebraspe, caderno ALFA) para o formato do app.
# Fonte: https://cdn.cebraspe.org.br/concursos/caixanm12010 (caderno e gabarito definitivo).
# Uso: python importar-cebraspe.py q.json GABARITO60 slug "nome da prova" url-da-fonte  (acrescenta em public/data/cebraspe.json)
import json, sys, pathlib
GAB, SLUG, PROVA, FONTE = sys.argv[2:6]
def disc(n):
    if n <= 10: return "Português"
    if n <= 14: return "Matemática Financeira"
    if n <= 18: return "Ética"
    if n <= 22: return "Atendimento e Vendas"
    if n == 30: return "Direito Administrativo"
    if n == 32: return "Direito Civil"
    if n <= 29: return "Conhecimentos da CAIXA"
    if n >= 50: return "Informática"
    return "Conhecimentos Bancários"
dest = pathlib.Path(__file__).resolve().parent.parent / "public/data/cebraspe.json"
out = [q for q in (json.loads(dest.read_text(encoding="utf-8")) if dest.exists() else []) if not q["id"].startswith(f"cebraspe-{SLUG}-")]
for q in json.load(open(sys.argv[1], encoding="utf8")):
    g = GAB[q["n"] - 1]
    if g == "X": continue  # anulada
    out.append({
        "id": f"cebraspe-{SLUG}-{q['n']}", "banca": "Cebraspe", "orgao": "CAIXA", "prova": PROVA,
        "ano": 2010, "numero": q["n"], "disciplina": disc(q["n"]), "assunto": disc(q["n"]),
        "enunciado": "", "comando": q["cmd"],
        "alternativas": [{"letra": "ABCDE"[k], "texto": t} for k, t in enumerate(q["alts"])],
        "gabarito": g,
        "comentario": "Gabarito oficial definitivo da Cebraspe (CAIXA 2010). Fonte: " + FONTE + ". Atenção: a legislação pode ter mudado desde 2010.",
    })
dest.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
print(len(out))
