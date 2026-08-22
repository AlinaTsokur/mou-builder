import re, sys, html

src = open(sys.argv[1], encoding='utf-8').read()
lines = src.split('\n')
out = []
i = 0

def inline(t):
    t = html.escape(t)
    t = re.sub(r'`([^`]+)`', r'<span style="font-family:Consolas,monospace;background:#f2f2f2">\1</span>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<i>\1</i>', t)
    t = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', r'<a href="\2">\1</a>', t)
    return t

while i < len(lines):
    line = lines[i]
    s = line.strip()

    if not s:
        i += 1; continue

    if s.startswith('---') and set(s) <= set('-'):
        out.append('<hr/>'); i += 1; continue

    m = re.match(r'^(#{1,4})\s+(.*)$', s)
    if m:
        lvl = len(m.group(1))
        out.append(f'<h{lvl}>{inline(m.group(2))}</h{lvl}>'); i += 1; continue

    # table
    if s.startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s:\-\|]+\|$', lines[i+1].strip()):
        header = [c.strip() for c in s.strip('|').split('|')]
        i += 2
        rows = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')])
            i += 1
        t = ['<table border="1" cellspacing="0" cellpadding="5" style="border-collapse:collapse;width:100%">']
        t.append('<tr>' + ''.join(f'<td style="background:#e8e8e8"><b>{inline(c)}</b></td>' for c in header) + '</tr>')
        for r in rows:
            t.append('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>')
        t.append('</table>')
        out.append('\n'.join(t)); continue

    # blockquote
    if s.startswith('>'):
        buf = []
        while i < len(lines) and lines[i].strip().startswith('>'):
            buf.append(lines[i].strip().lstrip('>').strip()); i += 1
        out.append('<p style="margin-left:24px;border-left:3px solid #999;padding-left:10px"><i>'
                   + inline(' '.join(buf)) + '</i></p>'); continue

    # bullet list
    if re.match(r'^[-*]\s+', s):
        items = []
        while i < len(lines) and re.match(r'^[-*]\s+', lines[i].strip()):
            items.append(inline(re.sub(r'^[-*]\s+', '', lines[i].strip()))); i += 1
        out.append('<ul>' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'); continue

    # numbered list
    if re.match(r'^\d+\.\s+', s):
        items = []
        while i < len(lines) and re.match(r'^\d+\.\s+', lines[i].strip()):
            items.append(inline(re.sub(r'^\d+\.\s+', '', lines[i].strip()))); i += 1
        out.append('<ol>' + ''.join(f'<li>{x}</li>' for x in items) + '</ol>'); continue

    # paragraph
    buf = []
    while i < len(lines) and lines[i].strip() and not re.match(r'^(#{1,4}\s|[-*]\s|\d+\.\s|\||>)', lines[i].strip()) \
          and not (lines[i].strip().startswith('---') and set(lines[i].strip()) <= set('-')):
        buf.append(lines[i].strip()); i += 1
    if buf:
        out.append('<p>' + inline(' '.join(buf)) + '</p>')

body = '\n'.join(out)
doc = f"""<html><head><meta charset="utf-8"><style>
body {{ font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.4; }}
h1 {{ font-size: 20pt; color:#1a1a1a; }}
h2 {{ font-size: 15pt; color:#1a1a1a; border-bottom:1px solid #ccc; padding-bottom:3px; margin-top:22px; }}
h3 {{ font-size: 12.5pt; color:#333; margin-top:16px; }}
table {{ font-size: 10pt; }}
td {{ vertical-align: top; }}
a {{ color:#1155cc; }}
</style></head><body>
{body}
</body></html>"""
open(sys.argv[2], 'w', encoding='utf-8').write(doc)
print('html written')
