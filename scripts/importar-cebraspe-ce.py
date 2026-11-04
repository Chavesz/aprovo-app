# Importa itens Certo/Errado de cadernos OFICIAIS da Cebraspe (texto extraído com pdftotext -enc UTF-8).
# Uso: python importar-cebraspe-ce.py caderno.txt GABARITO slug "nome da prova" fonte "faixas" ano
# Só entram itens com comando "julgue" que não dependem de texto, figura, tabela ou quadro; anulados (X) ficam de fora.
import json, re, sys, pathlib
txt, GAB, SLUG, PROVA, FONTE, FAIX, ANO = sys.argv[1:8]
FAIXAS = [(int(a), b) for a, b in (x.split(":", 1) for x in FAIX.split(","))]
DEP = re.compile(r"\btexto|figura|tabela|quadro|acima|abaixo|gráfico|janela|ilustra|fragmento|trecho|linhas? \d|\(?L\.\s?\d", re.I)
linhas = [l.strip() for l in open(txt, encoding="utf8").read().replace("\f", "\n").split("\n")]
itens, comando, ultimo, ctx, atual = {}, None, 0, [], None
dentro_texto = False
def ctx_texto():
    # Dentro de um texto longo (linhas numeradas 1, 4, 7...) o número da linha não é item.
    return dentro_texto
def fecha():
    global atual
    if atual and comando and not DEP.search(atual[1]) and re.match(r'^[A-ZÀ-Ú“"]', atual[1]) and atual[1].rstrip().endswith(('.', '?', ')')):
        itens[atual[0]] = (comando, atual[1])
    atual = None
for l in linhas:
    m = re.match(r"^(\d{1,3}) (\S.*)$", l)
    if m and int(m.group(1)) == ultimo + 1 and len(m.group(2)) > 15 and not ctx_texto():
        fecha(); ultimo = int(m.group(1)); atual = [ultimo, m.group(2)]; continue
    if not l:
        fecha(); ctx.append(""); continue
    if atual and not re.search(r"julgue|^CONHECIMENTOS|^RASCUNHO", l, re.I):
        atual[1] += " " + l; continue
    fecha()
    if re.search(r"julgue", l, re.I):
        contexto = " ".join(x for x in " ".join(ctx[-12:]).split() )
        frase = l
        comando = None if DEP.search(frase) else (contexto[-700:] + "\n\n" + frase).strip()
        # avança o contador mesmo para blocos rejeitados
        ctx = []
        continue
    if re.search(r"^CONHECIMENTOS|^Texto", l):
        ctx = []
    else:
        ctx.append(l)
fecha()
def disc(n): return next(b for a, b in FAIXAS if n <= a)
dest = pathlib.Path(__file__).resolve().parent.parent / "public/data/cebraspe.json"
out = [q for q in (json.loads(dest.read_text(encoding="utf-8")) if dest.exists() else []) if not q["id"].startswith(f"cebraspe-{SLUG}-")]
novos = 0
vistos = {q['comando'].split('**Item:** ')[-1] for q in out}
for n, (cmd, item) in sorted(itens.items()):
    g = GAB[n - 1] if n <= len(GAB) else "X"
    if g not in "CE" or item in vistos: continue
    vistos.add(item)
    out.append({
        "id": f"cebraspe-{SLUG}-{n}", "banca": "Cebraspe", "orgao": PROVA.split(" ")[0], "prova": PROVA, "ano": int(ANO), "numero": n,
        "disciplina": disc(n), "assunto": disc(n), "enunciado": "", "comando": f"{cmd}\n\n**Item:** {item}",
        "alternativas": [{"letra": "C", "texto": "Certo"}, {"letra": "E", "texto": "Errado"}], "gabarito": g,
        "comentario": f"Gabarito oficial definitivo da Cebraspe ({PROVA}), item de Certo ou Errado. Fonte: {FONTE}. Leis e fatos podem ter mudado desde {ANO}.",
    })
    novos += 1
dest.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
print(novos, "itens de", ultimo)
