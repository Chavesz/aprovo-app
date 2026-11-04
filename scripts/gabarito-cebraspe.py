import sys,re
L=[l.split() for l in open(sys.argv[1],encoding='latin1').read().split('\n')]
g={}
for a,b in zip(L,L[1:]):
    if a and all(x.isdigit() for x in a) and b and all(x in 'CEX0' for x in b):
        for n,v in zip(a,b): g.setdefault(int(n),v)
print(''.join(g.get(i,'X') for i in range(1,max(g)+1)) if g else '')
