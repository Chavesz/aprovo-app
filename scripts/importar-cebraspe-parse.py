import re,sys,json
t=open(sys.argv[1],encoding='utf8').read()
partes=re.split(r'\n(QUESTÃO \d+)\n',t)
out=[]
for i in range(1,len(partes),2):
    n=int(partes[i].split()[1])
    c=re.split(r'\n\n|\nRASCUNHO|\nTexto para|\nCONHECIMENTOS',partes[i+1].strip())[0]
    ms=[m for m in re.finditer(r'(?:(?<=\n)|(?<=\. )|(?<=\.\n))([A-E]) ',c)]
    seq=[];want='A'
    for m in ms:
        if m.group(1)==want and (want!='A' or m.start()==0 or c[m.start()-1]==chr(10)): seq.append(m); want=chr(ord(want)+1)
        if want=='F': break
    if len(seq)!=5: continue
    cmd=' '.join(c[:seq[0].start()].split())
    alts=[' '.join(c[seq[k].end():(seq[k+1].start() if k<4 else len(c))].split()) for k in range(5)]
    if re.search(r'\btexto\b|figura|R\.\s?\d|acima|abaixo|tabela|janela|ilustra|gráfico',cmd+' '.join(alts),re.I): continue
    if any(len(a)>400 or not a for a in alts): continue
    out.append({'n':n,'cmd':cmd,'alts':alts})
json.dump(out,open(sys.argv[2],'w',encoding='utf8'),ensure_ascii=False)
for q in out: print(q['n'],q['cmd'][:70],'|',q['alts'][4][:40])
