import sys,re,xml.etree.ElementTree as ET
want=set(sys.argv[2:])
def strip(t): return t.split('}')[-1]
for f in sys.argv[1].split(','):
    root=ET.parse(f).getroot()
    for st in root:
        crs=next((e.text for e in st.iter() if strip(e.tag)=='CrsCode'),None)
        if crs not in want: continue
        name=next((e.text for e in st.iter() if strip(e.tag)=='Name'),None)
        print('=====',crs,name)
        def walk(e,path):
            p=path+[strip(e.tag)]
            txt=(e.text or '').strip()
            if txt and re.search(r'platform|bridge|subway|underpass|step|lift|ramp',txt,re.I):
                print('/'.join(p[1:]),':',re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',txt))[:900])
            for c in e: walk(c,p)
        walk(st,[])
