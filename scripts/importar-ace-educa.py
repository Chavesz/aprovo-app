"""Importa as provas de ACE da EDUCA (PDFs + arquivo de gabaritos oficiais) para uso pessoal.

Saída: public/data/privado/educa-ace.json (fora do Git, como o educa.json).
Uso: python scripts/importar-ace-educa.py "<pasta provas-reais>"
Requer pdftotext e pdfinfo (poppler) no PATH.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / 'public' / 'data' / 'privado' / 'educa-ace.json'

# começo do nome do arquivo -> (nome da prova, órgão, ano)
PROVAS = {
    'Prova 1': ('ACE Ibiara 2025', 'Prefeitura de Ibiara (PB)', 2025),
    'Prova 2': ('ACE Brejo do Cruz 2025', 'Prefeitura de Brejo do Cruz (PB)', 2025),
    'Prova 3': ('ACE Alhandra 2024', 'Prefeitura de Alhandra (PB)', 2024),
    'Prova 4': ('ACE Juripiranga 2024', 'Prefeitura de Juripiranga (PB)', 2024),
    'Prova 5': ('ACE Santa Cecília 2025', 'Prefeitura de Santa Cecília (PB)', 2025),
    'Prova 6': ('ACE São Bento 2024', 'Prefeitura de São Bento (PB)', 2024),
    'Prova 7': ('ACE Alhandra PS 2025', 'Prefeitura de Alhandra (PB)', 2025),
    'Prova 8': ('Nível médio Umbuzeiro 2025', 'Prefeitura de Umbuzeiro (PB)', 2025),
}

DISCIPLINAS = [
    (r'portugu', 'Português'),
    (r'inform', 'Informática'),
    (r'gera', 'Conhecimentos Gerais'),
    (r'espec', 'Específicos ACE'),
]

LIXO = re.compile(r'ESTADO DA PARA[IÍ]BA|PREFEITURA MUNICIPAL|CONCURSO P[UÚ]BLICO|PROCESSO SELETIVO|EDITAL N|^\d{1,3}$')
ALT = re.compile(r'(?:^|\s)([A-E])[.)]\s+')
QUESTAO = re.compile(r'(?m)^(\d{1,2})\.\s')
TEXTO_BASE = re.compile(r'(?m)^(Leia o texto|Leia a |Leia os|Leia o |TEXTO [IVX]+)')


def gabaritos(texto):
    """{'Prova 1': {numero: (letra ou None se anulada, disciplina)}}."""
    res = {}
    for b in re.split(r'\n(?=PROVA \d+ - )', texto.split('=== PROVA MONTADA')[0]):
        m = re.match(r'PROVA (\d+) - ', b)
        if not m:
            continue
        g = {}
        for linha in b.splitlines()[1:]:
            disc = next((d for pad, d in DISCIPLINAS if re.match(pad, linha.strip().lower())), None)
            if not disc:
                continue
            corpo = re.sub(r'\(.*?\)', '', linha)
            corpo = corpo.split(':', 1)[1] if ':' in corpo else corpo
            for n, letra in re.findall(r'\b(\d{1,2})\s*(NULA|ANULADA|[A-E])\b', corpo):
                g[int(n)] = (None if 'NULA' in letra else letra, disc)
        res[f'Prova {m.group(1)}'] = g
    return res


def texto_pdf(pdf):
    """Texto lido coluna por coluna (as provas da EDUCA são em duas colunas)."""
    # Lê com -layout e corta cada página na "calha" entre as colunas: a posição, perto do meio,
    # em que quase todas as linhas têm espaço.
    cru = subprocess.run(['pdftotext', '-enc', 'UTF-8', '-layout', '-f', '2', str(pdf), '-'], capture_output=True)
    partes = []
    for pagina in cru.stdout.decode('utf8', 'replace').split('\f'):
        linhas = pagina.splitlines()
        largura = max((len(l) for l in linhas), default=0)
        if largura < 60:
            partes.append(pagina)
            continue
        longas = [l.ljust(largura) for l in linhas if len(l.strip()) > 0]
        melhor, corte = -1, largura // 2
        for c in range(int(largura * 0.35), int(largura * 0.65)):
            livres = sum(1 for l in longas if l[c] == ' ' and l[c - 1] == ' ')
            if livres > melhor:
                melhor, corte = livres, c
        esq = [l[:corte].rstrip() for l in linhas]
        dir_ = [l[corte:].strip() for l in linhas]
        partes.append('\n'.join(esq) + '\n' + '\n'.join(dir_))
    return '\n'.join(partes)


def limpar(t):
    return re.sub(r'\s+', ' ', t).strip()


def questoes(texto):
    linhas = [l.strip() for l in texto.replace('\f', '\n').splitlines() if l.strip() and not LIXO.search(l.strip())]
    corpo = '\n'.join(linhas)
    marcas, prox = [], 1
    for m in QUESTAO.finditer(corpo):
        # Aceita pular até 2 números (questão que o leitor não achou), sempre em ordem crescente.
        if prox <= int(m.group(1)) <= prox + 2:
            marcas.append((int(m.group(1)), m.start(), m.end()))
            prox = int(m.group(1)) + 1
    qs, base_atual = {}, ''
    # Texto-base antes da questão 1.
    mb = TEXTO_BASE.search(corpo[: marcas[0][1]] if marcas else '')
    if mb:
        base_atual = corpo[mb.start(): marcas[0][1]]
    for i, (n, _, fim_cab) in enumerate(marcas):
        fim = marcas[i + 1][1] if i + 1 < len(marcas) else len(corpo)
        bloco = corpo[fim_cab:fim]
        proxima_base = None
        mb = TEXTO_BASE.search(bloco)
        if mb:
            proxima_base, bloco = bloco[mb.start():], bloco[: mb.start()]
        seq, esperado = [], 'A'
        for m in ALT.finditer(bloco):
            l = m.group(1)
            if l == esperado:
                seq.append((l, m.start(), m.end()))
                esperado = chr(ord(esperado) + 1)
            elif l == 'A':
                seq, esperado = [(l, m.start(), m.end())], 'B'
        if len(seq) >= 4:
            alts = [[l, bloco[b: (seq[j + 1][1] if j + 1 < len(seq) else len(bloco))]] for j, (l, a, b) in enumerate(seq)]
            qs[n] = {'cmd': bloco[: seq[0][1]], 'alt': alts, 'base': base_atual}
        if proxima_base is not None:
            base_atual = proxima_base
    return qs


def main(pasta):
    pasta = Path(pasta)
    gab = gabaritos((pasta / 'GABARITOS - so abrir depois de fazer a prova.txt').read_text(encoding='utf8'))
    saida, falhas = [], []
    for pdf in sorted(pasta.glob('Prova *.pdf')):
        chave = ' '.join(pdf.stem.split()[:2])
        nome, orgao, ano = PROVAS[chave]
        qs = questoes(texto_pdf(pdf))
        for n, (letra, disc) in sorted(gab.get(chave, {}).items()):
            q = qs.get(n)
            # Descarta leitura embaralhada: letra de alternativa colada no texto, linha de separação ou texto vazio.
            suspeita = q and (re.search(r'\s[A-E]\.\s', q['cmd'] + ' '.join(t for _, t in q['alt']))
                              or '____' in ' '.join(t for _, t in q['alt'])
                              or any(len(limpar(t)) < 1 for _, t in q['alt']) or len(limpar(q['cmd'])) < 15)
            if not letra or not q or suspeita or letra not in [x[0] for x in q['alt']]:
                falhas.append(f'{nome} Q{n}')
                continue
            saida.append({
                'id': f"educa-ace-{chave.split()[1]}-{n}",
                'banca': 'Educa',
                'orgao': orgao,
                'prova': nome,
                'ano': ano,
                'numero': n,
                'disciplina': disc,
                'assunto': 'Prova real EDUCA',
                'enunciado': q['base'].strip() if disc == 'Português' else '',
                'comando': limpar(q['cmd']),
                'alternativas': [{'letra': l, 'texto': limpar(t)} for l, t in q['alt']],
                'gabarito': letra,
                'comentario': f'Gabarito oficial da EDUCA: {letra}. Fonte: prova de {nome}, {orgao}.',
            })
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False), encoding='utf8')
    print(f'{len(saida)} questões importadas; {len(falhas)} puladas: {", ".join(falhas)}')


if __name__ == '__main__':
    main(sys.argv[1])
