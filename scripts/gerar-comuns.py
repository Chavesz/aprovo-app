# Gera public/data/comuns.json: questões AUTORAIS do Aprovô (não copiadas), baseadas na lei e na norma culta.
import json, pathlib
Q = {
 "Português": [
  ("Crase", "Assinale a frase em que o acento grave está CORRETO.", ["Vou à pé para o trabalho.", "Entreguei o relatório à diretora.", "Ele começou à estudar cedo.", "Refiro-me à esta proposta."], "B", "Há crase quando o termo regente pede 'a' e o termo seguinte aceita 'a' (diretora). Não há crase antes de verbo, de palavra masculina nem de pronome demonstrativo 'esta'.", "Troque por masculino: 'ao diretor' → tem crase."),
  ("Concordância verbal", "Assinale a frase de acordo com a norma-padrão.", ["Fazem dois anos que me formei.", "Houveram muitas reclamações.", "Existem candidatos aprovados.", "Haviam vagas abertas."], "C", "'Existir' concorda com o sujeito (candidatos). 'Haver' no sentido de existir e 'fazer' indicando tempo são impessoais e ficam no singular.", "HAVER = existir → sempre singular."),
  ("Pontuação", "Em qual frase a vírgula está empregada INCORRETAMENTE?", ["Os candidatos, aprovaram o recurso.", "Em Cuité, o concurso foi tranquilo.", "Maria, feche a porta.", "Estudei muito, mas não passei."], "A", "Não se separa sujeito do verbo por vírgula. As demais trazem adjunto deslocado, vocativo e oração adversativa.", "Sujeito + verbo: nunca vírgula no meio."),
  ("Regência verbal", "Assinale a regência correta segundo a norma-padrão.", ["Assisti o filme ontem.", "Prefiro estudar do que trabalhar.", "Obedeça o regulamento.", "Aspiro ao cargo de agente."], "D", "'Aspirar' no sentido de desejar pede preposição 'a'. 'Assistir' (ver) pede 'a'; 'preferir' é 'preferir algo a outro'; 'obedecer' pede 'a'.", "Prefiro X A Y (nunca 'do que')."),
  ("Colocação pronominal", "Assinale a frase em que a colocação do pronome está correta.", ["Não diga-me isso.", "Me empresta o livro?", "Nunca se esqueça do edital.", "Tinha falado-lhe antes."], "C", "Palavras negativas (nunca, não) atraem o pronome para antes do verbo (próclise). Não se inicia frase com pronome oblíquo na norma-padrão e não há ênclise a particípio.", "Palavra negativa puxa o pronome."),
  ("Classes de palavras", "Em 'Ele chegou BASTANTE cansado', a palavra destacada é:", ["adjetivo", "advérbio", "pronome", "substantivo"], "B", "'Bastante' modifica o adjetivo 'cansado', funcionando como advérbio de intensidade (invariável). Seria adjetivo/pronome em 'bastantes candidatos'.", "Modifica adjetivo = advérbio = não varia."),
  ("Ortografia", "Assinale a palavra grafada corretamente.", ["excessão", "previlégio", "paralisação", "beneficiente"], "C", "Corretas: exceção, privilégio, paralisação, beneficente.", "Beneficente: sem 'i' extra."),
  ("Interpretação de texto", "'Embora o edital tenha saído tarde, os candidatos se prepararam.' A oração iniciada por 'embora' expressa:", ["causa", "concessão", "condição", "consequência"], "B", "'Embora' é conjunção concessiva: apresenta um obstáculo que não impede o fato principal.", "Embora = apesar de."),
 ],
 "Raciocínio Lógico": [
  ("Lógica proposicional", "A negação de 'Todos os candidatos estudaram' é:", ["Nenhum candidato estudou.", "Algum candidato não estudou.", "Todos os candidatos não estudaram.", "Algum candidato estudou."], "B", "A negação de 'todo A é B' é 'algum A não é B'.", "Nega o TODO com ALGUM... NÃO."),
  ("Lógica proposicional", "A negação de 'Estudo e passo' é:", ["Não estudo e não passo.", "Não estudo ou não passo.", "Estudo ou passo.", "Se estudo, não passo."], "B", "Lei de De Morgan: ~(p ∧ q) ≡ ~p ∨ ~q.", "Nega o E: troca por OU e nega tudo."),
  ("Condicional", "'Se chove, então a rua molha.' Uma proposição equivalente é:", ["Se a rua molha, então chove.", "Se não chove, a rua não molha.", "Se a rua não molha, então não chove.", "Chove e a rua não molha."], "C", "A contrapositiva (~q → ~p) é equivalente à condicional p → q.", "Volta negando: inverte e nega os dois."),
  ("Porcentagem", "Um produto de R$ 200 teve aumento de 10% e depois desconto de 10%. O preço final é:", ["R$ 200", "R$ 198", "R$ 202", "R$ 180"], "B", "200 × 1,10 = 220; 220 × 0,90 = 198.", "Aumento e desconto iguais sempre dão perda."),
  ("Regra de três", "Se 4 agentes visitam 120 casas por dia, quantas casas 6 agentes visitam no mesmo ritmo?", ["150", "160", "180", "200"], "C", "Diretamente proporcional: 120/4 = 30 casas por agente; 30 × 6 = 180.", "Ache quanto vale 1 e multiplique."),
  ("Sequências", "Qual o próximo número da sequência 2, 6, 18, 54, ...?", ["108", "162", "148", "216"], "B", "Progressão geométrica de razão 3: 54 × 3 = 162.", "Divida um termo pelo anterior para achar a razão."),
  ("Probabilidade", "Ao lançar um dado comum, a probabilidade de sair número par é:", ["1/6", "1/3", "1/2", "2/3"], "C", "Pares: 2, 4, 6 → 3 casos em 6 → 1/2.", "Favoráveis ÷ possíveis."),
  ("Análise combinatória", "De quantas formas 3 pessoas podem formar uma fila?", ["3", "6", "9", "12"], "B", "Permutação de 3: 3! = 3 × 2 × 1 = 6.", "Fila = ordem importa = fatorial."),
 ],
 "Informática": [
  ("Segurança da informação", "Mensagem falsa que imita um banco para roubar senhas é chamada de:", ["spam", "phishing", "firewall", "backup"], "B", "Phishing é a fraude que se passa por instituição confiável para capturar dados.", "Phishing = 'pescar' a senha."),
  ("Segurança da informação", "O malware que sequestra arquivos e pede resgate é o:", ["worm", "spyware", "ransomware", "adware"], "C", "Ransomware criptografa os dados e exige pagamento (ransom = resgate).", "Ransom = resgate."),
  ("Planilhas", "No Excel/Calc, a fórmula =MÉDIA(A1:A4) com valores 2, 4, 6 e 8 retorna:", ["4", "5", "6", "20"], "B", "(2+4+6+8)/4 = 20/4 = 5.", "Dois-pontos = intervalo."),
  ("Atalhos", "No Windows, o atalho para copiar é:", ["Ctrl+X", "Ctrl+V", "Ctrl+C", "Ctrl+Z"], "C", "Ctrl+C copia, Ctrl+X recorta, Ctrl+V cola, Ctrl+Z desfaz.", "C de Copiar."),
  ("Internet", "O protocolo que indica conexão segura (criptografada) em sites é:", ["HTTP", "HTTPS", "FTP", "SMTP"], "B", "HTTPS usa TLS para criptografar a comunicação. SMTP envia e-mail; FTP transfere arquivos.", "S de Seguro."),
  ("E-mail", "Ao enviar e-mail, o campo que oculta os destinatários dos demais é:", ["Para", "Cc", "Cco", "Assunto"], "C", "Cco (com cópia oculta) esconde quem recebeu a cópia.", "O 'o' é de oculto."),
  ("Hardware", "A memória volátil, apagada ao desligar o computador, é a:", ["ROM", "RAM", "HD", "SSD"], "B", "RAM é volátil; ROM, HD e SSD guardam dados sem energia.", "RAM = rápida e esquecida."),
  ("Editores de texto", "No Word em português, o atalho Ctrl+N aplica:", ["itálico", "sublinhado", "negrito", "novo documento"], "C", "No Word em português, Ctrl+N = negrito, Ctrl+I = itálico, Ctrl+S = sublinhado.", "N de Negrito."),
 ],
 "Direito Constitucional": [
  ("Fundamentos da República", "Segundo o art. 1º da CF/88, é fundamento da República:", ["a dignidade da pessoa humana", "a erradicação da pobreza", "a independência nacional", "a prevalência dos direitos humanos"], "A", "Art. 1º: soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e da livre iniciativa e pluralismo político. As outras são objetivos (art. 3º) ou princípios das relações internacionais (art. 4º).", "SO-CI-DI-VA-PLU."),
  ("Remédios constitucionais", "O remédio constitucional que protege a liberdade de locomoção é o:", ["mandado de segurança", "habeas data", "habeas corpus", "mandado de injunção"], "C", "Art. 5º, LXVIII: habeas corpus contra violência ou coação na liberdade de ir e vir.", "Corpus = corpo = ir e vir."),
  ("Remédios constitucionais", "Para obter informações pessoais constantes em banco de dados público, cabe:", ["habeas data", "ação popular", "habeas corpus", "mandado de segurança"], "A", "Art. 5º, LXXII: habeas data assegura conhecimento e retificação de informações da própria pessoa.", "Data = dados."),
  ("Saúde na Constituição", "Segundo a CF/88, a saúde é:", ["dever exclusivo dos municípios", "direito de todos e dever do Estado", "serviço privado regulado", "direito só dos contribuintes"], "B", "Art. 196: a saúde é direito de todos e dever do Estado, com acesso universal e igualitário.", "Art. 196 = SUS universal."),
  ("Administração Pública", "Os princípios expressos do art. 37 da CF/88 são:", ["legalidade, impessoalidade, moralidade, publicidade e eficiência", "legalidade, razoabilidade, moralidade e economicidade", "supremacia, indisponibilidade e publicidade", "isonomia, finalidade e eficiência"], "A", "Art. 37, caput: legalidade, impessoalidade, moralidade, publicidade e eficiência.", "LIMPE."),
  ("Administração Pública", "Pela CF/88, a investidura em cargo efetivo depende, em regra, de:", ["indicação política", "concurso público de provas ou de provas e títulos", "entrevista", "processo seletivo simplificado"], "B", "Art. 37, II: concurso público, ressalvados os cargos em comissão de livre nomeação.", "Efetivo = concurso."),
  ("Administração Pública", "O prazo de validade do concurso público é de:", ["até 1 ano, improrrogável", "até 2 anos, prorrogável uma vez por igual período", "até 4 anos", "5 anos"], "B", "Art. 37, III: até 2 anos, prorrogável uma vez por igual período.", "2 + 2 no máximo."),
  ("Direitos sociais", "Segundo o art. 6º da CF/88, NÃO é direito social expresso:", ["educação", "moradia", "transporte", "propriedade intelectual"], "D", "Art. 6º: educação, saúde, alimentação, trabalho, moradia, transporte, lazer, segurança, previdência, proteção à maternidade e à infância e assistência aos desamparados.", "Propriedade fica no art. 5º."),
 ],
 "Direito Administrativo": [
  ("Atos administrativos", "São atributos do ato administrativo:", ["presunção de legitimidade, imperatividade e autoexecutoriedade", "publicidade, moralidade e eficiência", "competência, finalidade e forma", "revogação e anulação"], "A", "Atributos: presunção de legitimidade (e veracidade), imperatividade, autoexecutoriedade e tipicidade. Competência, finalidade, forma, motivo e objeto são elementos.", "PATI = atributos; COFIFOMOB = elementos."),
  ("Atos administrativos", "A retirada de um ato ilegal pela própria Administração chama-se:", ["revogação", "anulação", "cassação", "convalidação"], "B", "Ato ilegal é anulado (efeitos retroativos). Revogação retira ato legal por conveniência e oportunidade (Súmula 473 do STF).", "Ilegal → anula; inconveniente → revoga."),
  ("Poderes administrativos", "A vigilância sanitária que interdita estabelecimento irregular exerce o poder:", ["hierárquico", "disciplinar", "de polícia", "regulamentar"], "C", "Poder de polícia limita a liberdade e a propriedade em favor do interesse público (art. 78 do CTN).", "Polícia = condiciona o particular."),
  ("Poderes administrativos", "Punir um servidor por falta funcional é exercício do poder:", ["de polícia", "disciplinar", "regulamentar", "normativo"], "B", "O poder disciplinar apura infrações e aplica sanções a servidores e a quem tem vínculo especial com a Administração.", "Disciplinar = dentro de casa."),
  ("Organização administrativa", "Autarquias, fundações públicas, empresas públicas e sociedades de economia mista compõem a Administração:", ["direta", "indireta", "concentrada", "privada"], "B", "Decreto-Lei 200/67: essas entidades formam a Administração indireta.", "Indireta = entidades com personalidade própria."),
  ("Improbidade administrativa", "A Lei de Improbidade Administrativa é a:", ["Lei 8.080/1990", "Lei 8.429/1992", "Lei 8.666/1993", "Lei 14.133/2021"], "B", "Lei 8.429/1992, alterada pela Lei 14.230/2021, que passou a exigir dolo. A Lei 14.133/2021 é a nova Lei de Licitações.", "8.429 = improbidade."),
  ("Licitações", "A atual Lei de Licitações e Contratos Administrativos é a:", ["Lei 8.666/1993", "Lei 10.520/2002", "Lei 14.133/2021", "Lei 12.462/2011"], "C", "A Lei 14.133/2021 substituiu as Leis 8.666/93, 10.520/02 e o RDC.", "14.133 = nova lei."),
  ("Agentes públicos", "O servidor efetivo adquire estabilidade após:", ["2 anos de efetivo exercício", "3 anos de efetivo exercício", "1 ano", "5 anos"], "B", "Art. 41 da CF/88: estabilidade após 3 anos de efetivo exercício e avaliação especial de desempenho.", "Estágio = 3 anos."),
 ],
 "Atualidades": [
  ("Meio ambiente", "A COP30, conferência do clima da ONU, foi sediada em 2025 na cidade de:", ["Manaus", "Belém", "Rio de Janeiro", "Brasília"], "B", "A COP30 ocorreu em Belém (PA), em novembro de 2025.", "Belém = porta da Amazônia."),
  ("Saúde pública", "A arbovirose transmitida pelo Aedes aegypti com vacina incorporada ao SUS em 2024 é a:", ["malária", "dengue", "febre amarela", "leishmaniose"], "B", "Em 2024 o SUS passou a oferecer a vacina contra a dengue (Qdenga) para grupos prioritários.", "Aedes: dengue, zika, chikungunya."),
  ("Tecnologia", "O Pix, meio de pagamento instantâneo brasileiro, foi criado pelo(a):", ["Caixa Econômica Federal", "Banco Central do Brasil", "Ministério da Fazenda", "Febraban"], "B", "O Pix foi lançado pelo Banco Central em novembro de 2020.", "BC criou o Pix."),
  ("Economia", "A Reforma Tributária aprovada em 2023 (EC 132) substitui tributos sobre consumo por um IVA dual formado por:", ["IR e CSLL", "CBS e IBS", "ICMS e ISS", "IPI e IOF"], "B", "A EC 132/2023 cria a CBS (federal) e o IBS (estados e municípios), com transição a partir de 2026.", "CBS federal; IBS estados e municípios."),
  ("Tecnologia", "A lei brasileira que trata da proteção de dados pessoais é a:", ["Marco Civil da Internet", "LGPD (Lei 13.709/2018)", "Lei de Acesso à Informação", "Lei Carolina Dieckmann"], "B", "A LGPD é a Lei 13.709/2018, fiscalizada pela ANPD.", "LGPD = dados pessoais."),
  ("Sociedade", "O Censo Demográfico mais recente do IBGE, com resultados divulgados a partir de 2023, foi realizado em:", ["2020", "2021", "2022", "2010"], "C", "O Censo foi adiado pela pandemia e realizado em 2022, com população de cerca de 203 milhões.", "Censo 2022: 203 milhões."),
 ],
}
SIGLA = {"Português": "pt", "Raciocínio Lógico": "rlm", "Informática": "inf", "Direito Constitucional": "dc", "Direito Administrativo": "da", "Atualidades": "atu"}
out = []
for disc, itens in Q.items():
    for i, (assunto, cmd, alts, g, x, m) in enumerate(itens, 1):
        out.append({
            "id": f"aprovo-{SIGLA[disc]}-{i}",
            "banca": "Aprovô (autoral)", "orgao": "Matérias comuns", "prova": "Questões autorais do Aprovô",
            "ano": 2026, "numero": i, "disciplina": disc, "assunto": assunto,
            "enunciado": "", "comando": cmd,
            "alternativas": [{"letra": "ABCD"[k], "texto": t} for k, t in enumerate(alts)],
            "gabarito": g, "comentario": x, "macete": m,
        })
pathlib.Path(__file__).resolve().parent.parent.joinpath("public/data/comuns.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
print(len(out))
