"""Trial, November 22nd 2026 (needs pdfplumber). Exits from a Network Rail station map PDF: 'Entrance/exit' labels with their names, and the
platform numbers where they are text, each exit given its nearest platform labels."""
import sys, re, math, pdfplumber
for f in sys.argv[1:]:
    with pdfplumber.open(f) as pdf:
        pg = pdf.pages[0]
        ws = pg.extract_words(extra_attrs=['non_stroking_color', 'size'], keep_blank_chars=False)
        # The key starts at "Services and facilities": leave it out.
        key = min([w['top'] for w in ws if w['text'] == 'Services'] or [pg.height])
        ws = [w for w in ws if w['top'] < key - 5]
        exits = []
        for w in ws:
            if w['text'].lower() == 'entrance/exit':
                col = w['non_stroking_color']
                name = [v for v in ws if v is not w and v['non_stroking_color'] == col and 0 < v['top'] - w['top'] < 30
                        and abs((v['x0'] + v['x1']) / 2 - (w['x0'] + w['x1']) / 2) < 120]
                nm = ' '.join(v['text'] for v in sorted(name, key=lambda v: v['x0']))
                exits.append((nm or '?', (w['x0'] + w['x1']) / 2, w['top']))
        plats = [w for w in ws if re.fullmatch(r'\d{1,2}[A-Z]?', w['text']) and w['size'] >= 18]
        print(f"== {f.split('--')[0]}: {len(exits)} exits, {len(plats)} platform labels as text")
        for nm, x, y in exits:
            near = sorted(plats, key=lambda p: math.hypot((p['x0'] + p['x1']) / 2 - x, p['top'] - y))[:3]
            print(f"   {nm:22} nearest labels: {', '.join(str(int(p['text'])) for p in near) or '–'}")
