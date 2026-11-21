import sys,xml.etree.ElementTree as ET
for f in sys.argv[1:]:
    r=ET.parse(f).getroot()
    plats=[];links={}
    for e in list(r.iter('way'))+list(r.iter('relation')):
        t={x.get('k'):x.get('v') for x in e.findall('tag')}
        if t.get('railway')=='platform' or (t.get('public_transport')=='platform' and t.get('train')=='yes'):
            plats.append((e.tag,t.get('ref'),t.get('name'),t.get('local_ref')))
        hw=t.get('highway')
        if hw in('footway','steps','corridor','path','pedestrian','elevator') or t.get('railway')=='subway_entrance':
            kind='bridge' if t.get('bridge') and t.get('bridge')!='no' else 'tunnel' if t.get('tunnel') and t.get('tunnel')!='no' else None
            if kind or hw in('steps','elevator'):
                k=(hw,kind); links[k]=links.get(k,0)+1
    lifts=sum(1 for n in r.iter('node') if any(x.get('k')=='highway' and x.get('v')=='elevator' for x in n.findall('tag')))
    print(f.split('.')[0],'\n  platforms:',sorted(set((p[1] or '?')+('' if p[0]=='way' else ' (rel)') for p in plats)),'\n  links:',links,'lift nodes',lifts)
