import sys,math,xml.etree.ElementTree as ET
def seg(p,q,a,b):
    def o(a,b,c): return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
    return o(p,q,a)*o(p,q,b)<0 and o(a,b,p)*o(a,b,q)<0
for f in sys.argv[1:]:
    r=ET.parse(f).getroot()
    N={n.get('id'):(float(n.get('lon')),float(n.get('lat'))) for n in r.iter('node')}
    W={w.get('id'):w for w in r.iter('way')}
    def pts(w): return [N[x.get('ref')] for x in w.findall('nd') if x.get('ref') in N]
    plats={};rails=[]
    for w in W.values():
        t={x.get('k'):x.get('v') for x in w.findall('tag')}
        if t.get('railway')=='platform' and t.get('ref'):
            for ref in t['ref'].split(';'): plats.setdefault(ref.strip(),[]).extend(pts(w))
        if t.get('railway') in('rail','light_rail') and t.get('service')not in('siding','yard'): rails.append(pts(w))
    for rel in r.iter('relation'):
        t={x.get('k'):x.get('v') for x in rel.findall('tag')}
        if t.get('railway')=='platform' and t.get('ref'):
            for m in rel.findall('member'):
                if m.get('type')=='way' and m.get('ref') in W:
                    for ref in t['ref'].split(';'): plats.setdefault(ref.strip(),[]).extend(pts(W[m.get('ref')]))
    cen={k:(sum(p[0] for p in v)/len(v),sum(p[1] for p in v)/len(v)) for k,v in plats.items() if v}
    def crossings(a,b):
        return sum(1 for rw in rails if any(seg(cen[a],cen[b],rw[i],rw[i+1]) for i in range(len(rw)-1)))
    key=lambda s:(int(''.join(c for c in s if c.isdigit()) or 0),s)
    ks=sorted(cen,key=key)
    groups=[]
    for k in ks:
        for g in groups:
            if all(crossings(k,x)==0 for x in g): g.append(k); break
        else: groups.append([k])
    print(f.split('.')[0],'islands by map:',' | '.join('/'.join(g) for g in groups))
