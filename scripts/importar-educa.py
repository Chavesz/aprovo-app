"""Importa provas da banca Educa (PB) a partir dos PDFs de prova e gabarito, para uso pessoal.

As provas não têm licença aberta, então o resultado vai para public/data/privado/ (fora do Git)
e só aparece no app rodando localmente.

Uso: python scripts/importar-educa.py <pasta com os PDFs *-prova.pdf e *-gabarito.pdf>
Requer o pdftotext (poppler) no PATH.
"""
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / 'public' / 'data' / 'privado' / 'educa.json'

SECOES = [
    ('LÍNGUA PORTUGUESA', 'Língua Portuguesa'),
    ('PORTUGUÊS', 'Língua Portuguesa'),
    ('MATEMÁTICA', 'Matemática'),
    ('RACIOCÍNIO LÓGICO', 'Raciocínio Lógico'),
    ('INFORMÁTICA', 'Informática'),
    ('CONHECIMENTOS GERAIS', 'Conhecimentos Gerais'),
    ('ATUALIDADES', 'Conhecimentos Gerais'),
    ('LEGISLAÇÃO', 'Legislação'),
    ('CONHECIMENTOS ESPECÍFICOS', 'Conhecimentos Específicos'),
    ('CONHECIMENTO ESPECÍFICO', 'Conhecimentos Específicos'),
    ('CONHECIMENTOS PEDAGÓGICOS', 'Conhecimentos Pedagógicos'),
]

ASSUNTOS_PT = [
    ('Interpretação de texto', r'texto|autor|ideia|sentido|infere|afirma'),
    ('Concordância', r'concord'),
    ('Regência e crase', r'regência|crase'),
    ('Pontuação', r'pontua|vírgula'),
    ('Ortografia e acentuação', r'ortogra|acentu|grafia'),
    ('Classes de palavras', r'substantivo|adjetivo|verbo|advérbio|pronome|conjunção|preposição'),
    ('Sintaxe', r'sujeito|predicado|oração|período|objeto'),
    ('Semântica', r'sinônim|antônim|significado|polissemia'),
]


def sem_acento(t):
    return ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn').lower()


def texto_pdf(pdf):
    return subprocess.run(['pdftotext', '-enc', 'UTF-8', str(pdf), '-'], capture_output=True).stdout.decode('utf8', 'replace')


def gabaritos(texto):
    """{nome do cargo: 'EBAAB...'} a partir do PDF de gabarito (N ou * = questão nula)."""
    res = {}
    for parte in re.split(r'CARGO:\s*', texto)[1:]:
        nome = re.split(r'\s1\s+2\s+3\b', parte, maxsplit=1)[0].strip()
        letras = ''.join(t for t in parte.split() if re.fullmatch(r'[A-EN*]{5,}', t))
        if letras:
            res[nome] = letras
    return res


def palavras(t):
    return {w.rstrip('s') for w in re.findall(r'[a-z]{3,}', sem_acento(t))} - {'classe', 'psf', 'prefeitura'}


def achar_gabarito(gabs, cargo_slug):
    """Escolhe o cargo do gabarito com mais palavras em comum com o cargo da prova."""
    alvo = palavras(cargo_slug.replace('-', ' '))
    melhor, nota = None, 0.0
    for nome, letras in gabs.items():
        p = palavras(nome)
        n = len(alvo & p) / max(1, len(alvo | p))
        if n > nota:
            melhor, nota = (nome, letras), n
    return melhor if nota >= 0.5 else None


def questoes_da_prova(texto):
    linhas = [l.rstrip() for l in texto.split('\n')]
    disciplina = 'Conhecimentos Gerais'
    atual = None
    esperado = 1
    saida = []
    textos = []  # textos-base: {'de', 'ate', 'linhas'}
    capturando = None
    for linha in linhas:
        cabeca = linha.strip().upper()
        for chave, nome in SECOES:
            if cabeca.startswith(chave) and len(cabeca) < 60:
                disciplina = nome
        marca = re.search(r'quest[õo]es\s+(?:de\s+)?(\d{1,2})\s+(?:a|ao|à|e)\s+(\d{1,2})', linha, re.I)
        if marca and not re.match(r'^\s*\d{1,2}\s*[.)-]', linha):
            capturando = {'de': int(marca.group(1)), 'ate': int(marca.group(2)), 'linhas': [linha[marca.end():]]}
            textos.append(capturando)
            continue
        m = re.match(r'^\s*(\d{1,2})\s*[.)-]\s*(.*)', linha)
        if m and int(m.group(1)) == esperado:
            atual = {'numero': esperado, 'disciplina': disciplina, 'linhas': [m.group(2)]}
            saida.append(atual)
            esperado += 1
            capturando = None
        elif capturando is not None:
            capturando['linhas'].append(linha)
        elif atual is not None:
            atual['linhas'].append(linha)

    por_numero = {q['numero']: q for q in saida}
    for t in textos:
        primeira = por_numero.get(t['de'])
        if primeira:
            # O PDF intercala o texto-base com a 1ª questão: parágrafos longos antes da alternativa A são do texto.
            resto = []
            antes_de_a = True
            for linha in primeira['linhas']:
                if re.search(r'(?:^|\s)A\s?[.)]\s', linha):
                    antes_de_a = False
                if antes_de_a and len(linha.strip()) > 200:
                    t['linhas'].append(linha)
                else:
                    resto.append(linha)
            primeira['linhas'] = resto
        corpo = '\n\n'.join(' '.join(p.split()) for p in '\n'.join(t['linhas']).split('\n\n') if p.strip())
        corpo = re.sub(r'\n\n\d{1,2}\n\n', '\n\n', corpo).replace('\x0c', '').lstrip('.:; ')
        for n in range(t['de'], t['ate'] + 1):
            if n in por_numero and len(corpo) > 80:
                por_numero[n]['texto'] = corpo
    return saida


def montar(q):
    texto = '\n'.join(q['linhas'])
    # Remove quebras de página: número da página e cabeçalho com o cargo.
    texto = re.sub(r'\n\d{1,2}\n+\x0c[^\n]*\n', '\n', texto).replace('\x0c', '\n')
    # As alternativas podem vir na mesma linha ("A. ... B. ..."); procura A, B, C, D e E em sequência.
    cortes, pos = [], 0
    for letra in 'ABCDE':
        m = re.compile(r'(?:^|\s)' + letra + r'\s?[.)]\s', re.M).search(texto, pos)
        if not m:
            return None
        cortes.append((m.start(), m.end()))
        pos = m.end()
    comando = ' '.join(texto[: cortes[0][0]].split())
    alternativas = []
    for i, letra in enumerate('ABCDE'):
        fim = cortes[i + 1][0] if i < 4 else len(texto)
        alternativas.append({'letra': letra, 'texto': ' '.join(texto[cortes[i][1] : fim].split())})
    # A última alternativa pode carregar cabeçalhos ou texto da questão seguinte; corta o excesso.
    ult = alternativas[-1]['texto']
    if len(ult) > 400:
        alternativas[-1]['texto'] = ult[:400].rsplit('.', 1)[0] + '.'
    if not comando or any(not a['texto'] for a in alternativas):
        return None
    return comando, alternativas


def assunto(disciplina, comando):
    if disciplina == 'Língua Portuguesa':
        for nome, re_ in ASSUNTOS_PT:
            if re.search(re_, comando, re.I):
                return nome
    return 'Geral'


def main(pasta):
    pasta = Path(pasta)
    banco = []
    resumo = []
    for prova in sorted(pasta.glob('*-prova.pdf')):
        slug = prova.stem[: -len('-prova')]
        gab_pdf = pasta / f'{slug}-gabarito.pdf'
        if not gab_pdf.exists():
            continue
        m = re.match(r'\d+-educa-(\d{4})-(.+)', slug)
        ano, resto = int(m.group(1)), m.group(2)
        texto = texto_pdf(prova)
        achado = achar_gabarito(gabaritos(texto_pdf(gab_pdf)), re.sub(r'^.*?-pb-', '', resto))
        if not achado:
            resumo.append(f'{slug}: gabarito do cargo não encontrado')
            continue
        cargo, gab = achado[0].title(), achado[1]
        orgao = 'CRQ 19ª Região (PB)' if 'crq' in resto else ('Prefeitura de Maturéia (PB)' if 'matureia' in resto else 'Prefeitura de Taperoá (PB)')
        ok = 0
        for q in questoes_da_prova(texto):
            n = q['numero']
            if n > len(gab) or gab[n - 1] not in 'ABCDE':
                continue
            montado = montar(q)
            if not montado:
                continue
            comando, alternativas = montado
            banco.append({
                'id': f'{slug.split("-", 1)[1]}-{n}',
                'banca': 'Educa',
                'orgao': orgao,
                'prova': f'{cargo} · {orgao.split(" (")[0]} {ano}',
                'ano': ano,
                'numero': n,
                'disciplina': q['disciplina'],
                'assunto': cargo if q['disciplina'] == 'Conhecimentos Específicos' else assunto(q['disciplina'], comando),
                'enunciado': q.get('texto', ''),
                'comando': comando,
                'alternativas': alternativas,
                'gabarito': gab[n - 1],
            })
            ok += 1
        resumo.append(f'{slug}: {ok} questões')
    # Várias provas de cargos diferentes repetem a mesma questão (ex.: Português comum); fica uma de cada.
    vistos, unicos = set(), []
    for q in banco:
        chave = sem_acento(q['comando'] + q['alternativas'][0]['texto'] + q['alternativas'][4]['texto'])[:400]
        if chave not in vistos:
            vistos.add(chave)
            unicos.append(q)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(unicos, ensure_ascii=False), encoding='utf8')
    print('\n'.join(resumo))
    print(f'total: {len(banco)} questões, {len(unicos)} sem repetição -> {SAIDA}')


if __name__ == '__main__':
    main(sys.argv[1])
