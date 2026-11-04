# Gera páginas estáticas de venda e SEO: public/aprovo.html (landing), public/concursos/*.html, sitemap.xml e robots.txt.
# Rode de novo sempre que entrar questão nova: python scripts/gerar-paginas.py
import json, pathlib, html, re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PUB = RAIZ / "public"
SITE = "https://aprovoapp.netlify.app"
qs = []
for f in ["ace-cuite", "comuns", "cebraspe", "educa-ace", "educa-site", "oab", "questoes"]:
    p = PUB / "data" / f"{f}.json"
    if p.exists():
        qs += json.loads(p.read_text(encoding="utf-8"))

CSS = """:root{--papel:#f4efe6;--tinta:#1d1a16;--acento:#173f35;--linha:#d9d0c1}
@media (prefers-color-scheme:dark){:root{--papel:#151412;--tinta:#efe9dd;--acento:#7fc8a9;--linha:#34302a}}
*{box-sizing:border-box}body{margin:0;background:var(--papel);color:var(--tinta);font:17px/1.6 'IBM Plex Sans',system-ui,sans-serif}
main{max-width:760px;margin:0 auto;padding:32px 16px 64px}h1,h2{font-family:Fraunces,Georgia,serif;line-height:1.15}
h1{font-size:clamp(2rem,6vw,3.2rem);margin:.2em 0}a.cta{display:inline-block;background:var(--acento);color:var(--papel);padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:600}
.grade{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}.caixa{border:1px solid var(--linha);border-radius:12px;padding:16px}
nav{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:28px}nav a{color:inherit;text-decoration:none;font-weight:500}nav .marca{font-family:Fraunces,Georgia,serif;font-size:1.3rem;font-weight:650;margin-right:auto}nav .entrar{border:1px solid var(--linha);padding:6px 14px;border-radius:999px}
a.sec{display:inline-block;margin-left:14px;color:inherit}.selo{font-size:.9rem;opacity:.8;margin-top:10px}
.numeros{text-align:center;margin:28px 0}.numeros strong{font-family:Fraunces,Georgia,serif;font-size:2rem;color:var(--acento)}
.passos{padding-left:1.3rem}.passos li{margin:.5em 0}.lista-provas{opacity:.85}
details{border-top:1px solid var(--linha);padding:12px 0}summary{cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center}
.cta-fixa{display:none}@media (max-width:640px){.cta-fixa{display:block;position:fixed;left:0;right:0;bottom:0;padding:10px 16px;background:var(--papel);border-top:1px solid var(--linha)}.cta-fixa .cta{display:block;text-align:center}main{padding-bottom:96px}}
.q{border-top:1px solid var(--linha);padding:14px 0}.q ol{padding-left:1.4rem}.fonte{font-size:.85rem;opacity:.75}"""

def pagina(caminho, titulo, desc, corpo):
    (PUB / caminho).parent.mkdir(parents=True, exist_ok=True)
    (PUB / caminho).write_text(f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(titulo)}</title><meta name="description" content="{html.escape(desc)}"><link rel="canonical" href="{SITE}/{caminho.replace('.html','')}">
<meta property="og:title" content="{html.escape(titulo)}"><meta property="og:description" content="{html.escape(desc)}">
<link rel="icon" href="/icons/icone.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,650&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet"><style>{CSS}</style></head><body><main>
<nav><a class="marca" href="/aprovo">Aprovô</a><a href="/concursos/">Questões</a><a class="entrar" href="/">Entrar</a></nav>{corpo}</main></body></html>""", encoding="utf-8")
    return caminho

def amostra(filtro, n=5):
    sel = [q for q in qs if filtro(q) and q.get("comando") and not q.get("enunciado")][:n]
    out = ""
    for q in sel:
        alts = "".join(f"<li>{html.escape(re.sub('<[^>]+>', '', a['texto']))}</li>" for a in q["alternativas"])
        out += f"""<div class="q"><p><strong>{html.escape(q['disciplina'])}</strong> · {html.escape(q['banca'])} {q['ano']}</p>
<p>{html.escape(q['comando'])}</p><ol type="A">{alts}</ol><p class="fonte">Gabarito e comentário no app. Fonte: {html.escape(q['prova'])}</p></div>"""
    return out

NQ = f"{len(qs):,}".replace(",", ".")
PROVAS = sorted({("OAB (FGV)" if q["prova"].startswith("OAB") else "ENEM (INEP)" if q["banca"] == "INEP" else re.sub(r" ·.*| \(.*", "", q["prova"])) for q in qs if q["banca"] in ("Cebraspe", "FGV", "INEP")})
CTA = '<p><a class="cta" href="/?teste=1">Fazer 5 questões grátis</a><a class="sec" href="/">Já tenho conta</a></p><p class="selo">Sem cartão. Sem cadastro para testar.</p>'
paginas = []

paginas.append(pagina("aprovo.html", "Aprovô: o mentor que te ajuda a passar no concurso",
  "Questões oficiais com fonte, simulado no estilo da banca, plano de estudos com IA, revisão espaçada e radar de concursos abertos.",
  f"""<h1>Estude o que cai. Passe no concurso.</h1>
<p>O Aprovô monta seu plano de estudos a partir do edital, treina você com <strong>{NQ} questões com gabarito</strong> e revisa o que você erra até virar acerto.</p>{CTA}
<h2>Como funciona</h2><ol class="passos">
<li><strong>Escolha o seu concurso.</strong> Cole o edital ou comece por um modelo pronto (ACS, ACE, técnico, prefeitura, enfermagem).</li>
<li><strong>Receba o plano do dia.</strong> O Mentor diz o que estudar hoje, por quanto tempo, e ajusta pelo que você erra.</li>
<li><strong>Treine e revise.</strong> Questões da banca, simulado da semana com ranking e revisão em 1, 7 e 30 dias.</li></ol>
<div class="grade numeros"><div><strong>{len(qs)}</strong><br>questões com gabarito</div><div><strong>{len({q['banca'] for q in qs})}</strong><br>bancas</div><div><strong>{len({q['disciplina'] for q in qs})}</strong><br>matérias</div><div><strong>{sum(1 for q in qs if q.get('comentario'))}</strong><br>comentadas</div></div>
<h2>Por que funciona</h2><div class="grade">
<div class="caixa"><strong>Mentor com IA</strong><br>Lê o edital, monta o plano da semana e tira dúvidas com base nos seus erros.</div>
<div class="caixa"><strong>Questões oficiais</strong><br>Provas reais e públicas das bancas, sempre com a fonte, mais questões comentadas.</div>
<div class="caixa"><strong>Simulado da semana</strong><br>Mesma prova para todos, ranking e nota de corte estimada.</div>
<div class="caixa"><strong>Revisão espaçada</strong><br>A questão errada volta em 1, 7 e 30 dias. Você não esquece mais.</div>
<div class="caixa"><strong>Concursos abertos</strong><br>Busca editais nos diários oficiais da sua cidade e do seu estado.</div>
<div class="caixa"><strong>Funciona no celular</strong><br>Instale como app e estude até sem internet.</div></div>
<h2>Provas oficiais no banco</h2><p class="lista-provas">{" · ".join(PROVAS)} e outras, sempre com a fonte e o gabarito definitivo.</p>
<h2>Planos</h2><div class="grade">
<div class="caixa"><strong>Grátis</strong><br>Questões, simulados, estatísticas e 15 mensagens por dia com o Mentor.</div>
<div class="caixa"><strong>Pro (em breve)</strong><br>300 mensagens por dia, resumos em PDF ilimitados e plano completo.</div></div>
<h2>Veja como são as questões</h2>{amostra(lambda q: q.get('comentario'), 3)}
<h2>Perguntas frequentes</h2>
<details><summary>É grátis mesmo?</summary><p>Sim. Questões, simulados, estatísticas, revisão e 15 mensagens por dia com o Mentor não custam nada e não pedem cartão.</p></details>
<details><summary>De onde vêm as questões?</summary><p>De provas oficiais e públicas das bancas (com a fonte em cada questão) e de questões autorais escritas a partir da lei. Nada copiado de material pago.</p></details>
<details><summary>Funciona no celular?</summary><p>Funciona. Dá para instalar como app pela tela inicial e estudar até sem internet com as questões já baixadas.</p></details>
<details><summary>Meu concurso não está na lista. Serve para mim?</summary><p>Serve. Cole o edital no Mentor e ele monta o plano com as matérias e pesos do seu concurso. As matérias comuns (Português, RLM, Informática, Direito) caem em quase todos.</p></details>
{CTA}<div class="cta-fixa"><a class="cta" href="/?teste=1">Fazer 5 questões grátis</a></div>"""))

GRUPOS = [
  ("ace-cuite-de-mamanguape", "Concurso ACE Cuité de Mamanguape (EDUCA PB): questões e simulado", lambda q: q["id"].startswith(("educa", "ace-")) or "Cuité" in q.get("assunto", "")),
  ("questoes-educa-pb", "Questões da banca EDUCA PB com gabarito", lambda q: "educa" in q["banca"].lower()),
  ("questoes-cebraspe", "Questões da Cebraspe (MPU, FUB, CAIXA, UERN e SEMAD São Luís) com gabarito oficial", lambda q: q["banca"] == "Cebraspe"),
  ("questoes-mpu-cebraspe", "Questões do MPU 2010 (Cebraspe) com gabarito oficial", lambda q: q["id"].startswith("cebraspe-mpu")),
  ("questoes-fub-cebraspe", "Questões da FUB 2009 (UnB, Cebraspe) com gabarito oficial", lambda q: q["id"].startswith("cebraspe-fub")),
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
