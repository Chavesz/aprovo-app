# Converte questões da prova OFICIAL e pública CAIXA 2010 nível médio (Cebraspe, caderno ALFA) para o formato do app.
# Fonte: https://cdn.cebraspe.org.br/concursos/caixanm12010 (caderno e gabarito definitivo).
# Uso: pdftotext -enc UTF-8 cad.pdf cad.txt; python importar-cebraspe-parse.py cad.txt q.json; python importar-cebraspe.py q.json
import json, sys, pathlib
GAB = "BACDBEDEBAECAEDDCECBADABDABECCBABDAXCEACBCCBADEBCDABDEADXEED"
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
out = []
for q in json.load(open(sys.argv[1], encoding="utf8")):
    g = GAB[q["n"] - 1]
    if g == "X": continue  # anulada
    out.append({
        "id": f"cebraspe-caixa-2010-{q['n']}", "banca": "Cebraspe", "orgao": "CAIXA", "prova": "CAIXA 2010 · Técnico Bancário (nível médio) · caderno ALFA",
        "ano": 2010, "numero": q["n"], "disciplina": disc(q["n"]), "assunto": disc(q["n"]),
        "enunciado": "", "comando": q["cmd"],
        "alternativas": [{"letra": "ABCDE"[k], "texto": t} for k, t in enumerate(q["alts"])],
        "gabarito": g,
        "comentario": "Gabarito oficial definitivo da Cebraspe (CAIXA 2010). Fonte: cdn.cebraspe.org.br/concursos/caixanm12010. Atenção: a legislação pode ter mudado desde 2010.",
    })
pathlib.Path(__file__).resolve().parent.parent.joinpath("public/data/cebraspe.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
print(len(out))
