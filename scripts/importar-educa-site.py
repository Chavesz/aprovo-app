"""Importa provas de Agente Comunitário de Saúde publicadas no site oficial da EDUCA (educapb.com.br).

Usa os cadernos de prova e os gabaritos oficiais que a banca publica. Mesmo nível médio e mesmas matérias
(Português, Informática, Gerais e saúde pública) da prova de ACE.

Uso: python scripts/importar-educa-site.py <pasta>
  <pasta>/lista.txt  linhas "AAAA-MM-DD url" (mídias do site, via /wp-json/wp/v2/media)
  <pasta>/cad.txt    URLs dos cadernos baixados em <pasta>/cad/<n>-<arquivo>
  <pasta>/gab/       gabaritos baixados
Saída: public/data/educa-site.json
"""
import importlib.util
import json
import re
import subprocess
import sys
import unicodedata
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / 'public' / 'data' / 'educa-site.json'
spec = importlib.util.spec_from_file_location('ace', RAIZ / 'scripts' / 'importar-ace-educa.py')
ace = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ace)


def sem_acento(t):
    return ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn').upper()


def texto(pdf, *args):
    return subprocess.run(['pdftotext', '-enc', 'UTF-8', *args, str(pdf), '-'], capture_output=True).stdout.decode('utf8', 'replace')


def municipio(t):
    m = re.search(r'MUNICIPAL DE ([A-Z ]{3,30}?)(?:\s+E O\b|\s+CONCURSO|\s+PROCESSO|\s*\n|,)', sem_acento(t))
    return m.group(1).strip() if m else ''


def gabarito_acs(t):
    """Letras do cargo de Agente Comunitário de Saúde no gabarito (-raw). N = questão nula."""
    m = re.search(r'CARGO:\s*AGENTE COMUNITARIO DE SAUDE(.*?)(?=CARGO:|$)', sem_acento(t), re.S)
    if not m:
        return {}
    return {int(n): l for n, l in re.findall(r'\b(\d{1,2}) ([A-EN])\b', m.group(1))}


def disciplina(secao):
    s = sem_acento(secao)
    if 'PORTUG' in s:
        return 'Português'
    if 'INFORM' in s:
        return 'Informática'
    if 'GERA' in s or 'ATUALID' in s:
        return 'Conhecimentos Gerais'
    return 'Específicos ACS'


def main(pasta):
    pasta = Path(pasta)
    linhas = [l.split() for l in (pasta / 'lista.txt').read_text().splitlines()]
    por_url = {u: date.fromisoformat(d) for d, u in linhas}
    datas = {u.rsplit('/', 1)[1]: date.fromisoformat(d) for d, u in linhas}
    # Gabaritos de ACS por município, com a data de publicação e a força (retificação oficial > oficial > preliminar).
    gabs = []
    for g in (pasta / 'gab').glob('*.pdf'):
        t = texto(g, '-raw')
        letras = gabarito_acs(t)
        if len(letras) >= 30:
            forca = 3 if re.search(r'Retifica.*Oficial', g.name, re.I) else 2 if 'Oficial' in g.name else 1
            mun = municipio(t) or ('PILOES' if 'Piloes' in g.name else '')
            gabs.append((mun, datas.get(g.name, date(2000, 1, 1)), forca, letras, g.name))
    saida = []
    for i, url in enumerate((pasta / 'cad.txt').read_text().split(), start=1):
        nome_arq = url.rsplit('/', 1)[1]
        if not re.search(r'Comunit', nome_arq, re.I) or 'NOVO' in nome_arq:
            continue  # ACE já está nas provas do usuário; a prova "NOVO" é uma reaplicação sem gabarito claro
        pdf = pasta / 'cad' / f'{i}-{nome_arq}'
        cab = texto(pdf, '-l', '2')
        mun, quando = municipio(cab) or ('PILOES' if 'PIL' in sem_acento(cab) else ''), por_url[url]
        candidatos = [g for g in gabs if mun and g[0] == mun and -30 <= (g[1] - quando).days <= 400]
        if not candidatos:
            print(f'sem gabarito: {mun} {nome_arq}')
            continue
        _, _, _, letras, fonte = max(candidatos, key=lambda g: (g[2], g[1]))
        seletivo = 'PROCESSO SELETIVO' in sem_acento(cab)
        prova = f"ACS {mun.title()} {quando.year}{' (processo seletivo)' if seletivo else ''}"
        qs = ace.questoes(ace.texto_pdf(pdf))
        ok = 0
        for n, q in sorted(qs.items()):
            letra = letras.get(n)
            juntos = q['cmd'] + ' '.join(t for _, t in q['alt'])
            if (not letra or letra == 'N' or letra not in [x[0] for x in q['alt']]
                    or re.search(r'\s[A-E]\.\s', juntos) or len(ace.limpar(q['cmd'])) < 15):
                continue
            disc = disciplina(q['secao'])
            # O título da seção nem sempre cai na coluna certa: confere pelo assunto da questão.
            if re.search(r'SAUDE|SUS|VIGILANCIA|DOENCA|VACIN|EPIDEMI|ENDEMI|AGENTE COMUNITARIO|ACS|ATENCAO BASICA|HIPERTENS|DIABET|GESTANTE', sem_acento(q['cmd'])):
                disc = 'Específicos ACS'
            elif re.search(r'WINDOWS|EXCEL|WORD|TECLADO|NAVEGADOR|COMPUTADOR|PLANILHA|E-MAIL|HARDWARE|SOFTWARE|INTERNET', sem_acento(q['cmd'])):
                disc = 'Informática'
            saida.append({
                'id': f"educa-site-{sem_acento(mun).lower().replace(' ', '-')}-{quando.year}{'-ps' if seletivo else ''}-{n}",
                'banca': 'Educa',
                'orgao': f'Prefeitura de {mun.title()} (PB)',
                'prova': prova,
                'ano': quando.year,
                'numero': n,
                'disciplina': disc,
                'assunto': 'Prova real EDUCA',
                'enunciado': q['base'].strip() if disc == 'Português' else '',
                'comando': ace.limpar(q['cmd']),
                'alternativas': [{'letra': l, 'texto': ace.limpar(t)} for l, t in q['alt']],
                'gabarito': letra,
                'comentario': f'Gabarito oficial da EDUCA: {letra}. Fonte: caderno e gabarito publicados em educapb.com.br ({prova}; {fonte}).',
            })
            ok += 1
        print(f'{prova}: {ok} questões (gabarito {fonte})')
    saida = [q for q in {q['id']: q for q in saida}.values() if not ace.de_outro_municipio(q)]  # o site às vezes publica o mesmo caderno duas vezes
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False), encoding='utf8')
    print(f'Total: {len(saida)}')


if __name__ == '__main__':
    main(sys.argv[1])
