# Gera páginas estáticas de venda e SEO: public/aprovo.html (landing), public/concursos/*.html, sitemap.xml e robots.txt.
# Rode de novo sempre que entrar questão nova: python scripts/gerar-paginas.py
import json, pathlib, html, re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PUB = RAIZ / "public"
SITE = "https://aprovoapp.netlify.app"
qs = []
for f in ["ace-cuite", "comuns", "estilo", "cebraspe", "fgv", "consulplan", "educa-ace", "educa-site", "oab", "questoes"]:
    p = PUB / "data" / f"{f}.json"
    if p.exists():
        qs += json.loads(p.read_text(encoding="utf-8"))

CSS = """:root{--bg:#f8f8fa;--sup:#fff;--raised:#f0eff4;--tinta:#2a1f3d;--tinta2:#5c5370;--linha:#dddbe5;--marca:#4a2f7a;--acao:#ffd43b;--acaot:#2a1f3d;--ia:#efe9fa;--ok:#1b6e3c;--okbg:#e5f3ea;--nok:#b42318;--nokbg:#fdeceb}
@media (prefers-color-scheme:dark){:root{--bg:#141218;--sup:#1c1a22;--raised:#25222d;--tinta:#ece9f1;--tinta2:#cfc6dd;--linha:#36323f;--marca:#c4a8f5;--ia:#2a2140;--ok:#6fd59a;--okbg:#13301f;--nok:#ff8f85;--nokbg:#3b1715}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tinta);font:17px/1.6 Archivo,system-ui,sans-serif}
main{max-width:1080px;margin:0 auto;padding:20px 16px 64px}h1,h2,h3{line-height:1.1;letter-spacing:-.025em}
h1{font-size:clamp(2.3rem,7vw,4rem);font-weight:800;margin:.25em 0 .35em}h2{font-size:clamp(1.6rem,4.5vw,2.4rem);font-weight:800;margin:0 0 .5em}
a{color:var(--marca)}a.cta{display:inline-flex;align-items:center;justify-content:center;min-height:52px;background:var(--acao);color:var(--acaot);padding:0 26px;border-radius:10px;text-decoration:none;font-weight:700}a.cta:hover{filter:brightness(.96)}
a.sec{display:inline-flex;align-items:center;min-height:52px;margin-left:16px;color:var(--tinta);font-weight:600}
.grifo{background:linear-gradient(transparent 58%,var(--acao) 58%,var(--acao) 90%,transparent 90%);padding:0 .08em}@media (prefers-color-scheme:dark){.grifo{background:none;color:var(--acao)}}
.grade{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}.caixa{background:var(--sup);border:1px solid var(--linha);border-radius:14px;padding:20px}
nav{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-bottom:24px}nav a{color:var(--tinta);text-decoration:none;font-weight:600}nav .marca{display:flex;align-items:center;gap:10px;font-size:1.3rem;font-weight:800;margin-right:auto;color:var(--marca)}nav .entrar{border:1.5px solid var(--linha);padding:7px 16px;border-radius:999px}
.selo{font-size:.92rem;color:var(--tinta2);margin-top:12px}.lead{font-size:1.15rem;color:var(--tinta2);max-width:36em}
section{padding:56px 0;border-top:1px solid var(--linha)}.kicker{font-size:.8rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--marca);margin:0 0 8px}
.grifo{background-repeat:no-repeat;background-size:100% 100%}.hero{position:relative;isolation:isolate;display:grid;gap:36px;align-items:center;padding:20px 0 48px}@media (min-width:880px){.hero{grid-template-columns:1.1fr .9fr}}
.hero-fundo{position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none}.demo{background:var(--sup);border:1px solid var(--linha);border-radius:18px;padding:20px;box-shadow:0 24px 48px -32px rgba(42,31,61,.45)}.demo .meta{font-size:.82rem;color:var(--tinta2);margin:0 0 8px}.demo .cmd{font-family:'Source Serif 4',Georgia,serif;font-size:1.02rem;margin:0 0 14px}
.alt{display:flex;gap:10px;align-items:center;border:1.5px solid var(--linha);border-radius:10px;padding:10px 12px;margin:8px 0;font-size:.95rem}.alt b{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--raised);font-size:.85rem}
.alt.ok{border:2px solid var(--ok);background:var(--okbg)}.alt.ok b{background:var(--ok);color:var(--sup)}.alt.nok{border:2px solid var(--nok);background:var(--nokbg)}.alt.nok b{background:var(--nok);color:var(--sup)}.alt small{margin-left:auto;font-weight:700;white-space:nowrap}.alt.ok small{color:var(--ok)}.alt.nok small{color:var(--nok)}
.mentor-bal{background:var(--ia);border-radius:12px;padding:12px 14px;margin-top:12px;font-size:.92rem}.mentor-bal strong{color:var(--marca)}
.faixa-provas{padding:28px 0}.faixa-provas ul{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}@media (min-width:720px){.faixa-provas ul{grid-template-columns:repeat(6,1fr)}}.faixa-provas li{background:var(--sup);border:1px solid var(--linha);border-radius:12px;padding:12px 14px}.faixa-provas li strong{display:block;font-size:1.05rem;font-weight:800;color:var(--marca)}.faixa-provas li span{font-size:.82rem;color:var(--tinta2)}
.numeros{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}@media (min-width:720px){.numeros{grid-template-columns:repeat(4,1fr)}}.numeros div{background:var(--sup);border:1px solid var(--linha);border-radius:14px;padding:18px}.numeros strong{display:block;font-size:2rem;font-weight:800;color:var(--marca);line-height:1.1}
.bancas{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.bancas span{border:1px solid var(--linha);background:var(--sup);border-radius:999px;padding:6px 12px;font-size:.88rem;font-weight:600}
.passos{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));counter-reset:p;list-style:none;padding:0}.passos li{background:var(--sup);border:1px solid var(--linha);border-radius:14px;padding:20px;counter-increment:p}.passos li::before{content:counter(p);display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--acao);color:var(--acaot);font-weight:800;margin-bottom:10px}
.ia-bloco{display:grid;gap:28px;align-items:center}@media (min-width:880px){.ia-bloco{grid-template-columns:1fr 1fr}}.chat{background:var(--sup);border:1px solid var(--linha);border-radius:18px;padding:16px;display:grid;gap:10px}.chat p{margin:0;padding:10px 14px;border-radius:12px;max-width:88%;font-size:.94rem}.chat .eu{justify-self:end;background:var(--marca);color:var(--sup)}.chat .ia{background:var(--ia)}
.check{list-style:none;padding:0}.check li{padding-left:28px;position:relative;margin:.45em 0}.check li::before{content:"✓";position:absolute;left:0;color:var(--ok);font-weight:800}
.planos{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}.plano{background:var(--sup);border:1px solid var(--linha);border-radius:18px;padding:24px;display:flex;flex-direction:column}.plano.pro{border:2px solid var(--marca)}.plano h3{margin:0;font-size:1.3rem}.preco{font-size:2.4rem;font-weight:800;margin:6px 0 2px}.preco small{font-size:1rem;font-weight:600;color:var(--tinta2)}.plano .check{flex:1}.plano a.cta{width:100%}.planos-um{grid-template-columns:minmax(0,420px);justify-content:center}.plano a.cta.contorno{background:transparent;border:2px solid var(--tinta);color:var(--tinta)}.selos{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:10px 0 0;font-size:.85rem}.selos span{border:1px solid var(--linha);border-radius:999px;padding:3px 10px}.etq{display:inline-block;background:var(--ia);color:var(--marca);font-weight:700;font-size:.78rem;border-radius:999px;padding:3px 10px;margin-left:8px;vertical-align:middle}
details{border-top:1px solid var(--linha);padding:6px 0}summary{cursor:pointer;font-weight:700;min-height:48px;display:flex;align-items:center}details p{margin:0 0 12px;color:var(--tinta2)}
.final{text-align:center;background:var(--marca);color:#fff;border-radius:22px;padding:44px 20px;border:0;margin-top:24px}.final h2{color:#fff}.final p{color:#e9e2f7}@media (prefers-color-scheme:dark){.final{background:var(--ia)}.final h2{color:var(--tinta)}.final p{color:var(--tinta2)}}
.cta-fixa{display:none}.cta-fixa[hidden]{display:none!important}@media (max-width:640px){.cta-fixa{display:block;position:fixed;left:0;right:0;bottom:0;padding:10px 16px;background:var(--bg);border-top:1px solid var(--linha)}.cta-fixa .cta{display:flex;width:100%}main{padding-bottom:96px}a.sec{margin-left:8px}}
footer{color:var(--tinta2);font-size:.88rem;padding-top:28px}
.q{border-top:1px solid var(--linha);padding:14px 0}.q ol{padding-left:1.4rem}.fonte{font-size:.85rem;color:var(--tinta2)}"""

def juntar_linhas(t):
    """Junta as quebras de linha que vieram do PDF no meio da frase; parágrafo (linha em branco) fica."""
    return re.sub(r"([^.:;?!\n])\n(?=[a-zà-ú(\"“])", r"\1 ", t)

def comando_limpo(c):
    """Cebraspe: o comando traz o fim do texto associado antes de **Item:**; na amostra fica só o item."""
    c = juntar_linhas(c)
    if "**Item:**" in c:
        c = "Julgue o item. " + c.split("**Item:**", 1)[1].strip()
    return re.sub(r"\s+", " ", c).strip()

def texto_ok(c):
    """Fora da amostra: comando que começa no meio da frase ou com negrito sem fechar."""
    return bool(c) and not c[0].islower() and c.count("**") % 2 == 0

def markdown_simples(c):
    return re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", html.escape(c))

def pagina(caminho, titulo, desc, corpo):
    (PUB / caminho).parent.mkdir(parents=True, exist_ok=True)
    (PUB / caminho).write_text(f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(titulo)}</title><meta name="description" content="{html.escape(desc)}"><link rel="canonical" href="{SITE}/{caminho.replace('.html','')}">
<meta name="theme-color" content="#4a2f7a"><meta property="og:type" content="website"><meta property="og:locale" content="pt_BR"><meta property="og:site_name" content="Aprovô"><meta property="og:url" content="{SITE}/{caminho.replace('index.html','').replace('.html','')}"><meta property="og:title" content="{html.escape(titulo)}"><meta property="og:description" content="{html.escape(desc)}"><meta property="og:image" content="{SITE}/img/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{SITE}/img/og.png">
<link rel="icon" href="/icons/icone.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=Source+Serif+4:opsz,wght@8..60,400&display=optional" rel="stylesheet" media="print" onload="this.media='all'"><noscript><link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=Source+Serif+4:opsz,wght@8..60,400&display=optional" rel="stylesheet"></noscript><style>{CSS}{CSS_LANDING}</style></head><body><main>
<nav><a class="marca" href="/aprovo"><img src="/icons/icone.svg" alt="" width="34" height="34">Aprovô</a><a href="/concursos/">Questões</a><a class="entrar" href="/?entrar=1">Entrar</a></nav>{corpo}<footer>Aprovô · questões oficiais com fonte e gabarito definitivo. Questões marcadas como estilo são autorais.<nav class="rodape" aria-label="Rodapé"><a href="/aprovo#planos">Preço</a><a href="/termos">Termos de uso</a><a href="/privacidade">Privacidade</a><a href="/concursos/">Questões por concurso</a></nav></footer></main></body></html>""", encoding="utf-8")
    return caminho

def amostra(filtro, n=5):
    sel = [q for q in qs if filtro(q) and q.get("comando") and not q.get("enunciado") and texto_ok(comando_limpo(q["comando"]))][:n]
    out = ""
    for q in sel:
        alts = "".join(f"<li>{html.escape(re.sub('<[^>]+>', '', a['texto']))}</li>" for a in q["alternativas"])
        out += f"""<div class="q"><p><strong>{html.escape(q['disciplina'])}</strong> · {html.escape(q['banca'])} {q['ano']}</p>
<p>{markdown_simples(comando_limpo(q['comando']))}</p><ol type="A">{alts}</ol><p class="fonte">Gabarito e comentário no app. Fonte: {html.escape(q['prova'])}</p></div>"""
    return out

NQ = f"{len(qs):,}".replace(",", ".")
PROVAS = sorted({("OAB (FGV)" if q["prova"].startswith("OAB") else "ENEM (INEP)" if q["banca"] == "INEP" else re.sub(r" ·.*| \(.*", "", q["prova"])) for q in qs if q["banca"] in ("Cebraspe", "FGV", "INEP", "Consulplan")})
CTA = '<p><a class="cta" href="/?teste=1">Fazer 5 questões grátis</a><a class="sec" href="/?entrar=1">Já tenho conta</a></p><p class="selo">Sem cartão. Sem cadastro para testar.</p>'
paginas = []

def _orgao(q):
    pr = q["prova"]
    if pr.startswith("OAB"): return "OAB"
    if q["banca"] == "INEP": return "ENEM"
    return re.split(r" \d{4}| ·| \(", pr)[0].strip()
_cont = {}
for q in qs:
    if q["banca"] in ("Cebraspe", "FGV", "INEP", "Consulplan"):
        _cont[_orgao(q)] = _cont.get(_orgao(q), 0) + 1
TOPO = sorted(_cont.items(), key=lambda x: -x[1])[:12]
FAIXA = "".join(f'<li><strong>{html.escape(o)}</strong><span>{n:,} questões</span></li>'.replace(",", ".") for o, n in TOPO)
BANCAS = sorted({q["banca"] for q in qs if not re.search(r"aprov|autoral|estilo|elaborad", q["banca"], re.I)})
NCOM = f"{sum(1 for q in qs if q.get('comentario')):,}".replace(",", ".")
# Preço do Pro (mensal, recorrente). O botão "Assinar" passa por /api/assinar?ir=1, que manda para o
# checkout configurado na Netlify (Cakto, Mercado Pago ou link pronto) ou para a criação de conta.
PRO_PRECO = "50"

CSS_LANDING = """.rodape{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:8px}.rodape a{color:var(--tinta2)}.legal h2{font-size:1.2rem;margin-top:28px}.legal p,.legal li{color:var(--tinta2)}
.lp{--serif:'Source Serif 4',Georgia,serif;--ease:cubic-bezier(.22,1,.36,1)}
.lp h1,.lp h2{font-family:var(--serif);font-weight:400;letter-spacing:-.02em}
.lp h1{font-size:clamp(2.6rem,9vw,4.6rem);line-height:1;margin:.2em 0 .35em}.lp h1 em{font-style:italic;color:var(--marca)}
.lp h2{font-size:clamp(2rem,6vw,3rem);line-height:1.05;margin:0 0 .4em}
.lp .rotulo{font-size:.75rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--tinta2);margin:0 0 14px;display:flex;gap:10px;align-items:center}.lp .rotulo b{color:var(--marca)}
.lp section{padding:72px 0}@media (min-width:880px){.lp section{padding:104px 0}}
.lp .lead{font-size:1.15rem;max-width:34em}.lp p{font-size:1rem}.lp small{font-size:.8125rem}.lp .selo,.lp figcaption{font-size:.95rem}
.lp a.cta{min-height:54px;font-size:1.02rem;border-radius:12px;padding:0 28px;box-shadow:0 1px 0 rgba(0,0,0,.08),inset 0 -2px 0 rgba(0,0,0,.08);transition:transform .25s var(--ease)}.lp a.cta:hover{transform:translateY(-1px)}
.lp-hero{display:grid;gap:40px;padding:16px 0 56px;align-items:center}@media (min-width:900px){.lp-hero{grid-template-columns:1.05fr .95fr;gap:56px;padding:40px 0 88px}}
.lp-acoes{display:flex;flex-wrap:wrap;align-items:center;gap:8px 4px;margin:26px 0 0}.lp-acoes a.sec{margin-left:12px}@media (max-width:520px){.lp-acoes a.cta{width:100%}.lp-acoes a.sec{margin:0 auto}}
.lp .selo{display:flex;flex-wrap:wrap;gap:4px 16px}.lp .selo span::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--ok);margin-right:7px;vertical-align:middle}
.tel{background:var(--sup);border:1px solid var(--linha);border-radius:26px;padding:14px;box-shadow:0 40px 80px -48px rgba(42,31,61,.55);max-width:430px;width:100%;justify-self:center}
.tel-topo{display:flex;align-items:center;gap:10px;padding:4px 6px 12px;border-bottom:1px solid var(--linha);margin-bottom:12px}.tel-topo img{width:30px;height:30px}.tel-topo strong{font-size:.95rem;display:block;line-height:1.2}.tel-topo small{color:var(--ok);font-size:.78rem;font-weight:600}
.bal{display:grid;gap:8px}.bal p{margin:0;padding:10px 14px;border-radius:16px;font-size:.93rem;line-height:1.45;max-width:86%}.bal .ia{background:var(--ia);border-bottom-left-radius:4px}.bal .eu{justify-self:end;background:var(--marca);color:#fff;border-bottom-right-radius:4px}
@media (prefers-color-scheme:dark){.bal .eu{background:#5b3d91}.tel{box-shadow:0 40px 80px -40px #000}}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 4px}.chips span{border:1px solid var(--linha);border-radius:999px;padding:5px 11px;font-size:.82rem;font-weight:600;background:var(--bg)}
.lp-prova{display:grid;grid-template-columns:repeat(2,1fr);border-top:1px solid var(--linha);border-bottom:1px solid var(--linha)}@media (min-width:760px){.lp-prova{grid-template-columns:repeat(4,1fr)}}
.lp-prova div{padding:20px 16px 20px 0}.lp-prova div+div{padding-left:16px;border-left:1px solid var(--linha)}@media (max-width:759px){.lp-prova div:nth-child(3){padding-left:0;border-left:0}.lp-prova div:nth-child(n+3){border-top:1px solid var(--linha)}}
.lp-prova strong{display:block;font-family:var(--serif);font-weight:400;font-size:clamp(1.6rem,4.5vw,2.2rem);line-height:1.1}.lp-prova span{font-size:.95rem;color:var(--tinta2)}
.passo{display:grid;gap:24px;padding:40px 0;border-top:1px solid var(--linha);align-items:center}@media (min-width:880px){.passo{grid-template-columns:5fr 6fr;gap:64px}.passo:nth-of-type(even) .passo-txt{order:2}}
.passo-n{font-family:var(--serif);font-size:3.4rem;line-height:1;color:var(--marca);display:block;margin-bottom:6px}.passo h3{font-size:1.45rem;margin:0 0 .4em}.passo-txt p{color:var(--tinta2);margin:0;max-width:30em}
.cartao{background:var(--sup);border:1px solid var(--linha);border-radius:20px;padding:18px}
.abertos{list-style:none;margin:0;padding:0}.abertos li{display:flex;justify-content:space-between;gap:12px;align-items:baseline;padding:12px 2px;border-bottom:1px solid var(--linha);font-size:.94rem}.abertos li:last-child{border:0}.abertos small{color:var(--tinta2);display:block;font-size:.8rem}.abertos em{font-style:normal;font-size:.76rem;font-weight:700;color:var(--ok);background:var(--okbg);border-radius:999px;padding:3px 9px;white-space:nowrap}
.diag{display:grid;grid-template-columns:repeat(10,1fr);gap:5px;margin:4px 0 14px}.diag i{aspect-ratio:1;border-radius:6px;background:var(--okbg);border:1.5px solid var(--ok)}.diag i.x{background:var(--nokbg);border-color:var(--nok)}
.barra{display:grid;grid-template-columns:7.5em 1fr 2.6em;gap:10px;align-items:center;font-size:.88rem;margin:8px 0}.barra span:nth-child(2){height:8px;border-radius:9px;background:var(--raised);overflow:hidden}.barra span:nth-child(2) i{display:block;height:100%;background:var(--marca);border-radius:9px}.barra b{text-align:right}
.plano-dia{list-style:none;margin:0;padding:0}.plano-dia li{display:grid;grid-template-columns:3.6em 1fr;gap:12px;padding:11px 0;border-bottom:1px solid var(--linha);font-size:.93rem}.plano-dia li:last-child{border:0}.plano-dia b{font-variant-numeric:tabular-nums;color:var(--marca)}.plano-dia small{display:block;color:var(--tinta2)}
.cab-cartao{display:flex;justify-content:space-between;font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--tinta2);margin-bottom:8px}
.recursos{list-style:none;margin:32px 0 0;padding:0;display:grid;gap:0}@media (min-width:880px){.recursos{grid-template-columns:1fr 1fr;column-gap:56px}}
.recursos li{padding:22px 0;border-top:1px solid var(--linha);display:grid;grid-template-columns:2.4em 1fr;gap:4px 14px}.recursos li>span{font-size:.78rem;font-weight:700;color:var(--tinta2);padding-top:4px}.recursos strong{font-size:1.1rem}.recursos p{grid-column:2;margin:0;color:var(--tinta2)}
.marca-q{display:inline-block;font-size:.72rem;font-weight:700;border-radius:6px;padding:2px 7px;margin-left:6px;vertical-align:2px;border:1px solid var(--linha)}
.prints{display:grid;grid-auto-flow:column;grid-auto-columns:min(70%,250px);gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding:8px 2px 14px;margin-top:28px}@media (min-width:880px){.prints{grid-auto-flow:row;grid-template-columns:repeat(3,1fr);gap:32px}.prints figure:nth-child(2){transform:translateY(32px)}}
.prints figure{margin:0;scroll-snap-align:start}.prints img{width:100%;height:auto;aspect-ratio:375/812;border-radius:24px;border:1px solid var(--linha);box-shadow:0 24px 48px -32px rgba(42,31,61,.55);background:var(--sup)}.prints figcaption{font-size:.9rem;color:var(--tinta2);margin-top:10px}
.lp-preco{display:grid;gap:32px;align-items:start}@media (min-width:880px){.lp-preco{grid-template-columns:1fr 1fr;gap:64px}}
.preco-bloco{background:var(--sup);border:2px solid var(--marca);border-radius:24px;padding:28px 22px}.preco-bloco h3{margin:0;font-size:1.05rem;letter-spacing:.06em;text-transform:uppercase;color:var(--marca)}.preco-bloco .preco{font-family:var(--serif);font-weight:400;font-size:4rem;line-height:1;margin:12px 0 4px}.preco-bloco .preco small{font-family:Archivo,system-ui,sans-serif;font-size:1rem}.preco-bloco .dia{margin:0;color:var(--tinta2);font-size:.92rem}.preco-bloco .check{margin:20px 0}.preco-bloco .cta{width:100%}
.cancele{margin:12px 0 0;font-weight:600;text-align:center;font-size:.93rem}.gratis{margin:18px 0 0;padding-top:16px;border-top:1px solid var(--linha);font-size:.93rem;color:var(--tinta2)}.gratis a{font-weight:700;color:var(--marca)}
.faq details{padding:4px 0}.faq summary{font-size:1.05rem;justify-content:space-between;gap:16px;list-style:none}.faq summary::-webkit-details-marker{display:none}.faq summary::after{content:"+";font-size:1.4rem;font-weight:400;color:var(--marca);transition:transform .3s var(--ease)}.faq details[open] summary::after{transform:rotate(45deg)}.faq details p{max-width:40em}
.lp-final{border-top:1px solid var(--linha);text-align:left}.lp-final h2{max-width:14em}
@media (prefers-reduced-motion:reduce){.lp *{transition:none!important}}
.lp .num{font-variant-numeric:lining-nums tabular-nums}
.lp-faixa{overflow:hidden;border-bottom:1px solid var(--linha);height:52px;display:flex;align-items:center;position:relative}
.lp-faixa[hidden]{display:none}.lp-faixa-trilho{display:flex;width:max-content;padding-left:150px}.lp-faixa ul{display:flex;list-style:none;margin:0;padding:0}
.lp-faixa li a{display:flex;align-items:center;gap:8px;padding:0 22px;white-space:nowrap;font-size:.9rem;color:var(--tinta);text-decoration:none;line-height:52px}.lp-faixa li a:hover{color:var(--marca);text-decoration:underline}
.lp-faixa li a b{font-size:.7rem;font-weight:700;letter-spacing:.08em;color:var(--ok);background:var(--okbg);border-radius:999px;padding:2px 8px;line-height:1.4}
.lp-faixa-rot{position:absolute;left:0;top:0;bottom:0;z-index:1;display:flex;align-items:center;gap:7px;padding:0 16px 0 0;background:var(--bg);box-shadow:12px 0 12px -4px var(--bg);font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--tinta2)}
.lp-faixa-rot::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ok)}
.tel .bal{position:relative}
.dig{position:absolute;left:0;top:0;display:flex;gap:4px;padding:14px 16px;background:var(--ia);border-radius:16px;border-bottom-left-radius:4px;opacity:0;pointer-events:none}.dig i{width:6px;height:6px;border-radius:50%;background:var(--tinta2)}
.lp-hero a.cta{position:relative;overflow:hidden;isolation:isolate}
@media (prefers-reduced-motion:no-preference){
.mov .lp-faixa-trilho{animation:lp-faixa var(--faixa-dur,60s) linear infinite}.mov .lp-faixa:hover .lp-faixa-trilho,.mov .lp-faixa:focus-within .lp-faixa-trilho{animation-play-state:paused}
@keyframes lp-faixa{to{transform:translateX(-50%)}}
.mov .tel .bal>*{opacity:0;transform:translateY(8px);transition:opacity .4s var(--ease),transform .4s var(--ease)}.mov .tel .bal>.ve{opacity:1;transform:none}
.mov .tel .bal>.dig{transform:none;transition:opacity .2s}.mov .dig i{animation:lp-dig 1s infinite}.mov .dig i:nth-child(2){animation-delay:.15s}.mov .dig i:nth-child(3){animation-delay:.3s}
@keyframes lp-dig{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-3px);opacity:1}}
.mov .rev{opacity:0;transform:translateY(14px);transition:opacity .6s var(--ease),transform .6s var(--ease);transition-delay:var(--d,0s)}.mov .rev.ve{opacity:1;transform:none}
.mov .barra i{transform:scaleX(0);transform-origin:left;transition:transform .9s var(--ease);transition-delay:var(--d,0s)}.mov .barra.ve i{transform:none}
.mov .diag i{opacity:0;transform:scale(.85);transition:opacity .3s,transform .3s var(--ease);transition-delay:var(--d,0s)}.mov .diag.ve i{opacity:1;transform:none}
.mov .lp-hero a.cta::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.6) 50%,transparent 65%);transform:translateX(-120%);animation:lp-brilho 7s var(--ease) 2.5s infinite}
@keyframes lp-brilho{0%{transform:translateX(-120%)}14%,100%{transform:translateX(120%)}}
}"""

JS_LANDING = "<script>(function(){var R=matchMedia('(prefers-reduced-motion: reduce)').matches,d=document,io='IntersectionObserver' in window;\nvar F=d.querySelector('.lp-faixa');if(F){fetch('/api/concursos-abertos').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){var l=(j&&j.lista||[]).filter(function(c){return c&&c.titulo&&/^https?:/.test(c.link||'')}).slice(0,24);if(l.length<2)throw 0;var u=d.createElement('ul');l.forEach(function(c){var li=d.createElement('li'),a=d.createElement('a');a.href=c.link;a.target='_blank';a.rel='noopener';if(c.uf){var b=d.createElement('b');b.textContent=c.uf;a.appendChild(b)}a.appendChild(d.createTextNode(c.titulo));li.appendChild(a);u.appendChild(li)});var t=F.querySelector('.lp-faixa-trilho');t.appendChild(u);if(!R){var c=u.cloneNode(true);c.setAttribute('aria-hidden','true');c.querySelectorAll('a').forEach(function(a){a.tabIndex=-1});t.appendChild(c);F.style.setProperty('--faixa-dur',Math.max(30,l.length*5)+'s')}else{F.style.overflowX='auto'}F.hidden=false}).catch(function(){F.remove()})}\nif(R||!io)return;d.documentElement.classList.add('mov');\nfunction ver(els,fn,m){var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){o.unobserve(e.target);fn(e.target)}})},{rootMargin:m||'0px 0px -10% 0px'});[].forEach.call(els,function(e){o.observe(e)})}\nd.querySelectorAll('.lp section').forEach(function(s){var k=s.querySelectorAll('.rotulo,h2,.lead,.passo-txt,.cartao,.recursos li,.prints figure,.preco-bloco,details,.lp-acoes,.selo');[].forEach.call(k,function(e,i){e.classList.add('rev');e.style.setProperty('--d',(e.classList.contains('cartao')?.12:e.closest('.passo,.recursos,.prints')?0:Math.min(i,3)*.08)+'s')});ver(k,function(e){e.classList.add('ve')})});\nd.querySelectorAll('.barra').forEach(function(b,i){b.style.setProperty('--d',(i%3*.12+.25)+'s')});ver(d.querySelectorAll('.barra'),function(e){e.classList.add('ve')});\nd.querySelectorAll('.diag i').forEach(function(x,i){x.style.setProperty('--d',i*.05+'s')});ver(d.querySelectorAll('.diag'),function(e){e.classList.add('ve')});\nver(d.querySelectorAll('.lp-prova .num'),function(e){var f=+e.dataset.n,t0=performance.now();function p(t){var k=Math.min(1,(t-t0)/1400),v=Math.round(f*(1-Math.pow(1-k,3)));e.textContent=v.toLocaleString('pt-BR');if(k<1)requestAnimationFrame(p)}e.textContent='0';requestAnimationFrame(p)},'0px');\nvar B=d.querySelector('.tel .bal');if(B){var ms=[].slice.call(B.children),dg=d.createElement('div');dg.className='dig';dg.setAttribute('aria-hidden','true');dg.innerHTML='<i></i><i></i><i></i>';B.appendChild(dg);\nfunction passo(i){if(i>=ms.length)return;var m=ms[i];if(m.classList.contains('ia')){dg.style.transform='translateY('+m.offsetTop+'px)';dg.classList.add('ve');setTimeout(function(){dg.classList.remove('ve');m.classList.add('ve');setTimeout(function(){passo(i+1)},900)},Math.min(1500,500+m.textContent.length*10))}else{m.classList.add('ve');setTimeout(function(){passo(i+1)},m.classList.contains('eu')?800:0)}}\nver([B],function(){setTimeout(function(){passo(0)},300)},'0px')}})()</script>"

def bloco_preco():
    return f"""<div class="preco-bloco"><h3>Aprovô Pro</h3><p class="preco">R$ {PRO_PRECO}<small>/mês</small></p><p class="dia">Menos de R$ 1,70 por dia. Sem fidelidade.</p>
<ul class="check"><li>Mentor com IA: entrevista, diagnóstico e plano até a prova</li><li>Concursos com inscrição aberta, filtrados para você</li><li>Simulados com questões reais da banca e autorais no estilo dela</li><li>Ranking no Brasil, no cargo e no estado</li><li>Revisão dos erros em 1, 3, 7 e 30 dias</li><li>Banco com {NQ} questões e "Por que errei?" em todas</li></ul>
<a class="cta" href="/api/assinar?ir=1">Assinar o Pro · R$ {PRO_PRECO}/mês</a><p class="cancele">Cancele quando quiser. Pix ou cartão. 7 dias para desistir com o dinheiro de volta.</p>
<p class="gratis">Quer conhecer antes? <a href="/?comecar=1">Monte seu plano grátis</a>: conversa com o mentor, diagnóstico e 15 mensagens por dia.</p></div>"""

paginas.append(pagina("aprovo.html", "Aprovô: mentor com IA, simulados e questões de concurso",
  f"Um mentor com IA que entende o seu concurso, aplica um diagnóstico e monta o plano até a prova. {NQ} questões com fonte, simulados da banca e revisão dos erros. Pro R$ {PRO_PRECO}/mês.",
  f"""<div class="lp"><div class="lp-hero"><div><p class="rotulo"><b>Mentor com IA</b> para concursos públicos</p>
<h1>Um plano até a prova, feito <em>para o seu concurso</em>.</h1>
<p class="lead">Você conta qual concurso, a banca e quanto tempo tem. O mentor faz um diagnóstico de 10 questões e devolve o que estudar em cada dia, em minutos.</p>
<div class="lp-acoes"><a class="cta" href="/?comecar=1">Montar meu plano grátis</a><a class="sec" href="/api/assinar?ir=1">Assinar o Pro · R$ {PRO_PRECO}/mês</a></div>
<p class="selo"><span>Cancele quando quiser</span><span>Grátis para começar, sem cartão</span></p></div>
<div class="tel" aria-label="Exemplo de conversa com o mentor"><div class="tel-topo"><img src="/icons/icone.svg" alt="" width="30" height="30"><div><strong>Mentor Aprovô</strong><small>online</small></div></div>
<div class="bal"><p class="ia">Oi! Para qual concurso você está estudando?</p><p class="eu">INSS, técnico. Banca Cebraspe.</p><p class="ia">O edital já saiu ou você está se adiantando? E quantas horas por dia consegue estudar?</p><p class="eu">Ainda não saiu. Tenho 2h por dia.</p><p class="ia">Perfeito. Antes do plano, vamos a um diagnóstico rápido de 10 questões para eu ver seus pontos fortes.</p>
<div class="chips"><span>Começar diagnóstico</span><span>Ver concursos abertos</span></div></div></div></div>
<div class="lp-prova"><div><strong class="num" data-n="{len(qs)}">{NQ}</strong><span>questões com gabarito</span></div><div><strong>Cebraspe, FGV</strong><span>Consulplan, EDUCA e outras bancas</span></div><div><strong><span class="num" data-n="10">10</span> min</strong><span>para o plano ficar pronto</span></div><div><strong>Sem fidelidade</strong><span>Pix ou cartão, cancele quando quiser</span></div></div><div class="lp-faixa" hidden aria-label="Concursos com inscrição aberta agora"><span class="lp-faixa-rot">Abertos agora</span><div class="lp-faixa-trilho"></div></div>

<section id="como"><p class="rotulo"><b>01</b> Como funciona</p><h2>Dez minutos de conversa. Um plano até o dia da prova.</h2>
<div class="passo"><div class="passo-txt"><span class="passo-n">1</span><h3>O mentor conhece você</h3><p>Concurso, banca, se o edital saiu, data da prova, seu nível, horas por dia e as matérias que você domina ou trava. Sem formulário: é uma conversa.</p></div>
<div class="cartao bal"><p class="ia">Quais matérias você sente mais dificuldade?</p><p class="eu">Raciocínio lógico e Direito Previdenciário. Português eu vou bem.</p><p class="ia">Anotado. Vou dar mais peso a essas duas no seu plano.</p></div></div>
<div class="passo"><div class="passo-txt"><span class="passo-n">2</span><h3>Mostra quem está com inscrição aberta</h3><p>Se você ainda não escolheu, o mentor lista os concursos com inscrições abertas agora, com prazo e banca, para você decidir com informação.</p></div>
<div class="cartao"><div class="cab-cartao"><span>Inscrições abertas</span><span>exemplo</span></div><ul class="abertos"><li><div>Técnico Administrativo<small>Tribunal estadual · FGV</small></div><em>aberta</em></li><li><div>Agente Administrativo<small>Prefeitura · Cebraspe</small></div><em>aberta</em></li><li><div>Analista Judiciário<small>Tribunal federal · FCC</small></div><em>aberta</em></li></ul></div></div>
<div class="passo"><div class="passo-txt"><span class="passo-n">3</span><h3>Aplica um diagnóstico de 10 questões</h3><p>Questões no estilo da sua banca para medir onde você está de verdade, não onde acha que está.</p></div>
<div class="cartao"><div class="cab-cartao"><span>Diagnóstico</span><span>7 de 10</span></div><div class="diag" aria-label="7 acertos e 3 erros"><i></i><i></i><i class="x"></i><i></i><i></i><i class="x"></i><i></i><i></i><i class="x"></i><i></i></div>
<div class="barra"><span>Português</span><span><i style="width:90%"></i></span><b>90%</b></div><div class="barra"><span>Previdenciário</span><span><i style="width:55%"></i></span><b>55%</b></div><div class="barra"><span>Rac. lógico</span><span><i style="width:40%"></i></span><b>40%</b></div></div></div>
<div class="passo"><div class="passo-txt"><span class="passo-n">4</span><h3>Monta o plano até a prova</h3><p>Cada dia dividido em minutos, pelo peso da matéria no edital e pelo que você errou. O plano se ajusta conforme você avança.</p></div>
<div class="cartao"><div class="cab-cartao"><span>Hoje · 2h</span><span>plano</span></div><ul class="plano-dia"><li><b>40 min</b><div>Raciocínio lógico<small>Proposições e equivalências</small></div></li><li><b>35 min</b><div>Direito Previdenciário<small>Segurados obrigatórios</small></div></li><li><b>30 min</b><div>Simulado curto Cebraspe<small>15 itens Certo/Errado</small></div></li><li><b>15 min</b><div>Revisão dos erros<small>4 questões vencendo hoje</small></div></li></ul></div></div></section>

<section><p class="rotulo"><b>02</b> Treino</p><h2>Treine com a prova que você vai fazer.</h2>
<ul class="recursos"><li><span>A</span><strong>Simulado do seu concurso</strong><p>Com questões reais da banca, cada uma com a fonte <span class="marca-q">Cebraspe 2022</span>, ou autorais escritas pela IA no estilo dela <span class="marca-q">estilo</span>.</p></li>
<li><span>B</span><strong>Ranking de verdade</strong><p>Veja sua posição no Brasil, entre quem disputa o mesmo cargo e no seu estado.</p></li>
<li><span>C</span><strong>Revisão espaçada dos erros</strong><p>Cada questão errada volta em 1, 3, 7 e 30 dias, até virar acerto.</p></li>
<li><span>D</span><strong>"Por que errei?"</strong><p>Em qualquer questão, o mentor explica o raciocínio da banca e a pegadinha.</p></li></ul></section>

<section><p class="rotulo"><b>03</b> Por dentro do app</p><h2>É assim no seu celular.</h2><div class="prints">
<figure><img src="/img/print-mentor.jpg" width="375" height="812" loading="lazy" alt="Plano de estudos do Mentor com as matérias por prioridade"><figcaption>O plano do mentor, pelo peso de cada matéria.</figcaption></figure>
<figure><img src="/img/print-simulado.jpg" width="375" height="812" loading="lazy" alt="Simulado com cronômetro, mapa de questões e item oficial da Cebraspe"><figcaption>Simulado cronometrado, no formato da banca.</figcaption></figure>
<figure><img src="/img/print-questao.jpg" width="375" height="812" loading="lazy" alt="Questão respondida com o gabarito e o botão Por que errei? Perguntar ao Mentor"><figcaption>Errou? O mentor explica o porquê.</figcaption></figure></div></section>

<section id="planos"><div class="lp-preco"><div><p class="rotulo"><b>04</b> Preço</p><h2>Um plano só. Tudo incluído.</h2><p class="lead">Menos que uma apostila, com um mentor que acompanha você todo dia. Não prometemos aprovação: prometemos método, constância e treino no formato certo.</p></div>{bloco_preco()}</div></section>

<section class="faq"><p class="rotulo"><b>05</b> Dúvidas</p><h2>Perguntas frequentes</h2>
<details open><summary>O Aprovô garante a aprovação?</summary><p>Não. Ninguém pode garantir. O Aprovô organiza o seu estudo: o que estudar, quanto treinar e o que revisar. A constância é sua.</p></details>
<details><summary>Meu edital ainda não saiu. Vale a pena?</summary><p>Vale. O mentor monta o plano pelo último edital e pela banca provável, e ajusta quando o novo sair.</p></details>
<details><summary>De onde vêm as questões?</summary><p>De provas oficiais e públicas, com a fonte em cada questão, e de questões autorais escritas pela IA, sempre marcadas como "estilo". Nada copiado de material pago.</p></details>
<details><summary>Dá para confiar nas explicações da IA?</summary><p>As explicações partem do gabarito oficial e citam a lei quando cabe. A IA pode errar: confira com a lei e o edital, e reporte com um toque no comentário da questão.</p></details>
<details><summary>Como cancelo?</summary><p>No app, em Mentor → Planos → Cancelar assinatura. Sem multa nem fidelidade: você segue Pro até o fim do mês já pago.</p></details>
<details><summary>Dá para usar de graça?</summary><p>Dá. Com conta grátis você conversa com o mentor, faz o diagnóstico, treina questões e tem 15 mensagens por dia com a IA.</p></details>
<details><summary>Funciona no celular?</summary><p>Funciona. Dá para instalar como app pela tela inicial do navegador.</p></details></section>
<section class="lp-final"><h2>Comece a conversa hoje. O plano sai em minutos.</h2><div class="lp-acoes"><a class="cta" href="/?comecar=1">Montar meu plano grátis</a><a class="sec" href="/api/assinar?ir=1">Assinar o Pro · R$ {PRO_PRECO}/mês</a></div><p class="selo"><span>Cancele quando quiser</span><span>Pix ou cartão</span></p></section></div>
<div class="cta-fixa" hidden><a class="cta" href="/?comecar=1">Montar meu plano grátis</a></div>
{JS_LANDING}<script>(function(){{var b=document.querySelector('.cta-fixa'),h=document.querySelector('a.cta');if(!b||!h)return;function f(){{b.hidden=h.getBoundingClientRect().bottom>0}}addEventListener('scroll',f,{{passive:true}});f()}})()</script>"""))

paginas.append(pagina("termos.html", "Termos de uso | Aprovô", "Termos de uso do Aprovô: plano grátis, plano Pro mensal, cancelamento e regras de uso.",
  f"""<article class="legal"><h1>Termos de uso</h1><p>Atualizado em 05/11/2026.</p>
<h2>1. O que é o Aprovô</h2><p>Um app de estudo para concursos públicos: questões com gabarito, simulados, revisão e um mentor com inteligência artificial. O Aprovô ajuda a organizar o estudo; não garante aprovação em nenhum concurso.</p>
<h2>2. Conta</h2><p>Você cria a conta com usuário e senha e é responsável por guardá-los. Uma conta é pessoal: não compartilhe.</p>
<h2>3. Plano grátis e plano Pro</h2><p>O plano grátis tem limites, como o número de mensagens diárias com o Mentor. O plano Pro custa R$ {PRO_PRECO} por mês, cobrado por Pix ou cartão pelo meio de pagamento indicado no checkout, e amplia esses limites.</p>
<h2>4. Renovação e cancelamento</h2><p>O Pro renova todo mês até você cancelar. Cancele quando quiser no app (Mentor → Planos) ou pelo próprio meio de pagamento. Não há multa nem fidelidade: o acesso continua até o fim do mês já pago. Pelo Código de Defesa do Consumidor, você pode desistir em até 7 dias da primeira contratação e receber o valor de volta.</p>
<h2>5. Conteúdo</h2><p>Questões de provas oficiais trazem a fonte. Questões autorais aparecem como "estilo" da banca. As respostas do Mentor são geradas por IA e podem conter erros: confira sempre com a lei e o edital.</p>
<h2>6. Uso correto</h2><p>Não é permitido copiar o banco de questões em massa, revender o acesso ou tentar burlar os limites do plano. Contas que fizerem isso podem ser suspensas.</p>
<h2>7. Mudanças</h2><p>Podemos atualizar estes termos. Mudança de preço é avisada antes da próxima cobrança.</p>
<p><a href="/privacidade">Política de privacidade</a></p></article>"""))

paginas.append(pagina("privacidade.html", "Política de privacidade | Aprovô", "Quais dados o Aprovô guarda, para quê e como pedir a exclusão.",
  """<article class="legal"><h1>Política de privacidade</h1><p>Atualizado em 05/11/2026.</p>
<h2>O que guardamos</h2><ul><li>Conta: usuário, nome e senha (guardada só como hash, nunca em texto).</li><li>E-mail, se você informar: para recibos, lembretes de revisão e avisos de concurso.</li><li>Seu estudo: respostas, simulados, anotações, plano do Mentor e mensagens enviadas ao Mentor.</li><li>Assinatura: situação do plano e identificador do pagamento. Dados de cartão ficam só com o meio de pagamento (Cakto); o Aprovô não vê nem guarda o número do cartão.</li></ul>
<h2>Para que usamos</h2><p>Para o app funcionar (salvar o progresso e sincronizar aparelhos), montar o seu plano, mostrar estatísticas e ranking (com seu nome de exibição) e cobrar o plano Pro. Não vendemos seus dados.</p>
<h2>Com quem compartilhamos</h2><p>Só com os serviços que fazem o app funcionar: hospedagem (Netlify), banco de dados (Supabase), inteligência artificial (Anthropic, para responder ao Mentor), e-mail (Resend) e pagamento (Cakto). Cada um recebe só o necessário.</p>
<h2>Seus direitos (LGPD)</h2><p>Você pode pedir acesso, correção ou exclusão dos seus dados e cancelar e-mails a qualquer momento pelo link no rodapé de cada e-mail. Para excluir a conta, fale com o suporte pelo app.</p>
<p><a href="/termos">Termos de uso</a></p></article>"""))


GRUPOS = [
  ("ace-cuite-de-mamanguape", "Concurso ACE Cuité de Mamanguape (EDUCA PB): questões e simulado", lambda q: q["id"].startswith(("educa", "ace-")) or "Cuité" in q.get("assunto", "")),
  ("questoes-educa-pb", "Questões da banca EDUCA PB com gabarito", lambda q: "educa" in q["banca"].lower()),
  ("questoes-cebraspe", "Questões da Cebraspe (MPU, FUB, CAIXA, UERN e SEMAD São Luís) com gabarito oficial", lambda q: q["banca"] == "Cebraspe"),
  ("questoes-mpu-cebraspe", "Questões do MPU 2010 (Cebraspe) com gabarito oficial", lambda q: q["id"].startswith("cebraspe-mpu")),
  ("questoes-fub-cebraspe", "Questões da FUB 2009 (UnB, Cebraspe) com gabarito oficial", lambda q: q["id"].startswith("cebraspe-fub")),
  ("questoes-seduc-am-cebraspe", "Questões da SEDUC AM 2011 (professores, Cebraspe) com gabarito oficial", lambda q: "seduc-am" in q["id"]),
  ("questoes-pm-sp-fgv", "Questões da PM SP (Cabo 2022, FGV) com gabarito oficial", lambda q: q["id"].startswith("fgv-pmesp")),
  ("questoes-cbmerj-fgv", "Questões do CBMERJ (Cadete 2022, FGV) com gabarito oficial", lambda q: q["id"].startswith("fgv-cbmerj")),
  ("questoes-inss-cebraspe", "Questões do INSS 2022 (Técnico do Seguro Social, Cebraspe) com gabarito oficial", lambda q: "inss-2022" in q["id"]),
  ("questoes-prf-cebraspe", "Questões da PRF 2021 (Policial Rodoviário Federal, Cebraspe) com gabarito oficial", lambda q: "prf-2021" in q["id"]),
  ("questoes-tj-ce-cebraspe", "Questões do TJ CE 2023 (Técnico Judiciário, Cebraspe) com gabarito oficial", lambda q: "tjce-2023" in q["id"]),
  ("questoes-tj-ce-juiz-leigo-consulplan", "Questões do TJ CE 2019 (Juiz Leigo, Consulplan) com gabarito oficial", lambda q: q["id"].startswith("consulplan-tjce")),
  ("questoes-pf-cebraspe", "Questões da PF 2021 (Agente de Polícia Federal, Cebraspe) com gabarito oficial", lambda q: "pf-2021" in q["id"]),
  ("questoes-stj-cebraspe", "Questões do STJ 2018 (Técnico Judiciário, Cebraspe) com gabarito oficial", lambda q: "stj-2018" in q["id"]),
  ("questoes-pc-pb-cebraspe", "Questões da PC PB 2021 (Agente de Investigação, Cebraspe) com gabarito oficial", lambda q: "pcpb-2021" in q["id"]),
  ("questoes-oab-fgv", "Questões da OAB (Exame de Ordem, FGV) com gabarito oficial", lambda q: q["prova"].startswith("OAB")),
  ("questoes-enem", "Questões do ENEM com gabarito oficial (INEP)", lambda q: q["banca"] == "INEP"),
  ("portugues-para-concurso", "Questões de Português para concurso comentadas", lambda q: q["disciplina"] == "Português"),
  ("raciocinio-logico-para-concurso", "Questões de Raciocínio Lógico para concurso", lambda q: q["disciplina"] == "Raciocínio Lógico"),
  ("informatica-para-concurso", "Questões de Informática para concurso", lambda q: q["disciplina"] == "Informática"),
  ("direito-constitucional-para-concurso", "Questões de Direito Constitucional para concurso", lambda q: q["disciplina"] == "Direito Constitucional"),
  ("direito-administrativo-para-concurso", "Questões de Direito Administrativo para concurso", lambda q: q["disciplina"] == "Direito Administrativo"),
  ("agente-comunitario-de-saude-acs", "Questões para Agente Comunitário de Saúde (ACS)", lambda q: q["disciplina"] in ("Específicos ACS", "Saúde Pública")),
  ("agente-de-combate-as-endemias-ace", "Questões para Agente de Combate às Endemias (ACE)", lambda q: q["disciplina"] == "Específicos ACE"),
]
links = []
for slug, titulo, f in GRUPOS:
    total = sum(1 for q in qs if f(q))
    if not total:
        continue
    paginas.append(pagina(f"concursos/{slug}.html", titulo, f"{total} questões com gabarito, comentário e simulado grátis no Aprovô.",
      f"<h1>{html.escape(titulo)}</h1><p>{total} questões no Aprovô, com gabarito, comentário, simulado e revisão espaçada.</p>{CTA}{amostra(f)}{CTA}"))
    links.append(f'<li><a href="/concursos/{slug}">{html.escape(titulo)}</a> ({total})</li>')

paginas.append(pagina("concursos/index.html", "Questões de concurso por cargo, banca e matéria | Aprovô",
  "Escolha o concurso, a banca ou a matéria e treine com questões comentadas.", f"<h1>Questões por concurso</h1><ul>{''.join(links)}</ul>{CTA}"))

urls = "".join(f"<url><loc>{SITE}/{p.replace('index.html','').replace('.html','')}</loc></url>" for p in paginas)
(PUB / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{SITE}/</loc></url>{urls}</urlset>', encoding="utf-8")
(PUB / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8")
print(len(paginas), "páginas")
