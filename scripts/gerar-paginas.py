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
@media (prefers-color-scheme:dark){:root{--bg:#141218;--sup:#1c1a22;--raised:#25222d;--tinta:#ece9f1;--tinta2:#b6abc8;--linha:#36323f;--marca:#c4a8f5;--ia:#2a2140;--ok:#6fd59a;--okbg:#13301f;--nok:#ff8f85;--nokbg:#3b1715}}
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
<nav><a class="marca" href="/aprovo"><img src="/icons/icone.svg" alt="" width="34" height="34">Aprovô</a><a href="/concursos/">Questões</a><a class="entrar" href="/">Entrar</a></nav>{corpo}<footer>Aprovô · questões oficiais com fonte e gabarito definitivo. Questões marcadas como estilo são autorais.<nav class="rodape" aria-label="Rodapé"><a href="/aprovo#planos">Preço</a><a href="/termos">Termos de uso</a><a href="/privacidade">Privacidade</a><a href="/concursos/">Questões por concurso</a></nav></footer></main></body></html>""", encoding="utf-8")
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
CTA = '<p><a class="cta" href="/?teste=1">Fazer 5 questões grátis</a><a class="sec" href="/">Já tenho conta</a></p><p class="selo">Sem cartão. Sem cadastro para testar.</p>'
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
# checkout configurado na Netlify (Mercado Pago ou link pronto) ou para a criação de conta.
PRO_PRECO = "50"

CSS_LANDING = """.hero h1{font-size:clamp(2rem,7vw,3.2rem)}.beneficios{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));list-style:none;padding:0;margin:0}.beneficios li{background:var(--sup);border:1px solid var(--linha);border-radius:16px;padding:20px}.beneficios strong{display:block;font-size:1.15rem;margin-bottom:4px}
.prints{display:grid;grid-auto-flow:column;grid-auto-columns:min(72%,260px);gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 2px 12px;margin:0 -2px}@media (min-width:880px){.prints{grid-auto-flow:row;grid-template-columns:repeat(3,1fr)}}.prints figure{margin:0;scroll-snap-align:start}.prints img{width:100%;height:auto;aspect-ratio:375/812;border-radius:22px;border:1px solid var(--linha);box-shadow:0 18px 40px -28px rgba(42,31,61,.5);background:var(--sup)}.prints figcaption{font-size:.9rem;color:var(--tinta2);margin-top:8px}
.preco-bloco{max-width:440px;margin:0 auto;background:var(--sup);border:2px solid var(--marca);border-radius:22px;padding:28px 22px;text-align:center}.preco-bloco h3{margin:0;font-size:1.3rem}.preco-bloco .preco{font-size:3rem;margin:8px 0 0}.preco-bloco .check{text-align:left;margin:18px 0}.preco-bloco .cta{width:100%}.cancele{margin:10px 0 0;font-weight:600}.gratis{margin:18px 0 0;padding-top:16px;border-top:1px solid var(--linha);font-size:.95rem;color:var(--tinta2)}.gratis a{font-weight:700;color:var(--marca)}
.rodape{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:8px}.rodape a{color:var(--tinta2)}.legal h2{font-size:1.2rem;margin-top:28px}.legal p,.legal li{color:var(--tinta2)}"""

def bloco_preco():
    return f"""<div class="preco-bloco"><h3>Plano Pro</h3><p class="preco">R$ {PRO_PRECO}<small>/mês</small></p>
<ul class="check"><li>Banco com {NQ} questões e simulados no estilo da banca</li><li>Mentor com IA: 300 mensagens por dia e "Por que errei?" em toda questão</li><li>Plano de estudos até o dia da prova, revisado toda semana</li><li>Resumo do assunto em PDF</li></ul>
<a class="cta" href="/api/assinar?ir=1">Assinar</a><p class="cancele">Cancele quando quiser. Pix ou cartão.</p>
<p class="gratis">Quer testar antes? <a href="/?teste=1">Comece grátis</a>: 5 questões sem cadastro e, com conta, 15 mensagens por dia com o Mentor.</p></div>"""

paginas.append(pagina("aprovo.html", "Aprovô: questões de concurso, simulados e mentor com IA",
  f"Estude para concurso com {NQ} questões com gabarito, simulados no estilo da banca e um mentor com IA que monta o seu plano. Plano Pro R$ {PRO_PRECO}/mês, cancele quando quiser.",
  f"""<div class="hero"><div><p class="kicker">Estudo para concurso, do edital à prova</p>
<h1>Estude o que <span class="grifo">cai na sua prova</span>, todo dia.</h1>
<p class="lead">Questões com gabarito, simulados no estilo da banca e um mentor com IA que monta o seu plano e explica cada erro. Você estuda com método; o resto é com você.</p>
<p><a class="cta" href="/api/assinar?ir=1">Assinar o Pro · R$ {PRO_PRECO}/mês</a><a class="sec" href="/?teste=1">Testar grátis</a></p><p class="selo">Cancele quando quiser. Teste 5 questões sem cadastro.</p></div>
<div class="demo" aria-hidden="true"><p class="meta">Direito Administrativo · Certo ou Errado</p>
<p class="cmd">A administração pública pode anular os próprios atos quando eivados de vício de legalidade.</p>
<div class="alt nok"><b>E</b>Errado<small>✕ Sua resposta</small></div><div class="alt ok"><b>C</b>Certo<small>✓ Correta</small></div>
<div class="mentor-bal"><strong>Mentor:</strong> é a autotutela (Súmula 473 do STF). Vou trazer essa de volta amanhã.</div></div></div>
<section><p class="kicker">Por que o Aprovô</p><h2>Três coisas, bem feitas.</h2><ul class="beneficios">
<li><strong>{NQ} questões com gabarito</strong>Provas oficiais com fonte e gabarito definitivo (Cebraspe, FGV, Consulplan e outras) e questões autorais marcadas como "estilo".</li>
<li><strong>Simulados no estilo da banca</strong>Cronômetro, Certo/Errado com a nota que desconta o erro, simulado da semana com ranking e revisão do que você errou.</li>
<li><strong>Mentor com IA</strong>Lê o seu edital, monta o plano do dia pelo tempo que você tem e explica por que você errou cada questão.</li></ul></section>
<section><p class="kicker">Por dentro do app</p><h2>É assim no seu celular.</h2><div class="prints">
<figure><img src="/img/print-questao.jpg" width="375" height="812" loading="lazy" alt="Questão respondida com o gabarito e o botão Por que errei? Perguntar ao Mentor"><figcaption>Errou? O Mentor explica o porquê.</figcaption></figure>
<figure><img src="/img/print-simulado.jpg" width="375" height="812" loading="lazy" alt="Simulado com cronômetro, mapa de questões e item oficial da Cebraspe"><figcaption>Simulado cronometrado, no formato da banca.</figcaption></figure>
<figure><img src="/img/print-mentor.jpg" width="375" height="812" loading="lazy" alt="Plano de estudos do Mentor com as matérias por prioridade"><figcaption>Plano pelo peso de cada matéria no edital.</figcaption></figure></div></section>
<section id="planos"><p class="kicker">Preço</p><h2>Um plano só, sem pegadinha.</h2>{bloco_preco()}</section>
<section><p class="kicker">Dúvidas</p><h2>Perguntas frequentes</h2>
<details><summary>O Aprovô garante a aprovação?</summary><p>Não. Ninguém garante. O Aprovô organiza o seu estudo: o que estudar, quanto treinar e o que revisar. A constância é sua.</p></details>
<details><summary>Como cancelo?</summary><p>No app, em Mentor → Planos → Cancelar assinatura. Não há multa nem fidelidade: você segue Pro até o fim do mês já pago e não é cobrado de novo.</p></details>
<details><summary>Dá para usar de graça?</summary><p>Dá. Teste 5 questões sem cadastro. Com conta grátis, você treina questões e simulados e tem 15 mensagens por dia com o Mentor.</p></details>
<details><summary>De onde vêm as questões?</summary><p>De provas oficiais e públicas, com a fonte em cada questão, e de questões autorais marcadas como "estilo". Nada copiado de material pago.</p></details>
<details><summary>Funciona no celular?</summary><p>Funciona. Dá para instalar como app pela tela inicial do navegador.</p></details></section>
<section class="final"><h2>Comece hoje. Amanhã você já revisa o que errou.</h2><p>R$ {PRO_PRECO}/mês · cancele quando quiser</p><p><a class="cta" href="/api/assinar?ir=1">Assinar o Pro</a></p></section>
<div class="cta-fixa" hidden><a class="cta" href="/api/assinar?ir=1">Assinar · R$ {PRO_PRECO}/mês</a></div>
<script>(function(){{var b=document.querySelector('.cta-fixa'),h=document.querySelector('a.cta');if(!b||!h)return;function f(){{b.hidden=h.getBoundingClientRect().bottom>0}}addEventListener('scroll',f,{{passive:true}});f()}})()</script>"""))

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
<h2>O que guardamos</h2><ul><li>Conta: usuário, nome e senha (guardada só como hash, nunca em texto).</li><li>E-mail, se você informar: para recibos, lembretes de revisão e avisos de concurso.</li><li>Seu estudo: respostas, simulados, anotações, plano do Mentor e mensagens enviadas ao Mentor.</li><li>Assinatura: situação do plano e identificador do pagamento. Dados de cartão ficam só com o meio de pagamento (Mercado Pago ou similar); o Aprovô não vê nem guarda o número do cartão.</li></ul>
<h2>Para que usamos</h2><p>Para o app funcionar (salvar o progresso e sincronizar aparelhos), montar o seu plano, mostrar estatísticas e ranking (com seu nome de exibição) e cobrar o plano Pro. Não vendemos seus dados.</p>
<h2>Com quem compartilhamos</h2><p>Só com os serviços que fazem o app funcionar: hospedagem (Netlify), banco de dados (Supabase), inteligência artificial (Anthropic, para responder ao Mentor), e-mail (Resend) e pagamento (Mercado Pago). Cada um recebe só o necessário.</p>
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
