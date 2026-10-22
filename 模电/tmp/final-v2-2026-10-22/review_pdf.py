from pathlib import Path
import re,json,subprocess,hashlib,unicodedata
from urllib.parse import unquote,urlsplit
from pypdf import PdfReader,PdfWriter
import pdfplumber
from PIL import Image,ImageDraw

work=Path(__file__).resolve().parent;base=work.parent.parent
pdfpath=base/'output/pdf/模电第三章_轻量版_v2.pdf';source=base/'模电第三章_轻量版_v2.md'
reader=PdfReader(pdfpath)
writer=PdfWriter(clone_from=reader);writer.add_metadata({'/Title':'模电第三章 · 轻量版 v2','/Subject':'有限修订后的完整阅读版','/SourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest()})
writer.write(work/'metadata.pdf');pdfpath.write_bytes((work/'metadata.pdf').read_bytes());reader=PdfReader(pdfpath)
normal=lambda t:re.sub(r'\s+','',unicodedata.normalize('NFKC',t)).replace('\u200b','').replace('\ufeff','')
full=normal(''.join(p.extract_text() or '' for p in reader.pages))
chunks=json.loads((work/'body-text-chunks.json').read_text(encoding='utf-8'))
missing=[s for s in chunks if normal(s) not in full]
fonts={};links=[];link_errors=[]
for n,p in enumerate(reader.pages,1):
    for fref in p['/Resources'].get('/Font',{}).get_object().values():
        f=fref.get_object();d=f.get('/DescendantFonts',[f])[0].get_object();desc=d.get('/FontDescriptor',{}).get_object() if d.get('/FontDescriptor') else {}
        fonts[str(f.get('/BaseFont'))]={'embedded':any(k in desc for k in ['/FontFile','/FontFile2','/FontFile3']),'unicode':'/ToUnicode' in f}
    for ref in p.get('/Annots',[]):
        a=ref.get_object();uri=a.get('/A',{}).get('/URI');dest=a.get('/Dest')
        if uri:
            links.append({'page':n,'uri':str(uri)})
            if str(uri).startswith('file:'):
                u=urlsplit(str(uri));target=unquote(u.path);target=target[1:] if re.match(r'^/[A-Za-z]:/',target) else target
                if not Path(target).exists():link_errors.append({'page':n,'uri':str(uri)})
        if isinstance(dest,str) and dest not in reader.named_destinations:link_errors.append({'page':n,'dest':dest})
pages=[]
with pdfplumber.open(pdfpath) as pdf:
    for n,p in enumerate(pdf.pages,1):
        chars=p.chars;body=[c for c in chars if 44<c['top']<p.height-40]
        bad=[c for c in chars if c['text'] in ['\ufffd','\x00','\u25a1']]
        outside=[c for c in chars if c['x0']<-1 or c['x1']>p.width+1 or c['top']<-1 or c['bottom']>p.height+1]
        wide=[c for c in body if c['x0']<45 or c['x1']>p.width-45]
        text=p.extract_text() or '';(work/f'page-{n:03}.txt').write_text(text,encoding='utf-8')
        pages.append({'page':n,'characters':len(text),'bad_glyphs':len(bad),'outside_paper':len(outside),'outside_body':len(wide),'outside_samples':[c['text'] for c in wide[:20]],'body_top':min((c['top'] for c in body),default=0),'body_bottom':max((c['bottom'] for c in body),default=0)})
protected=json.loads((work/'protected-hashes.json').read_text(encoding='utf-8'));changed=[name for name,h in protected.items() if not Path(name).exists() or hashlib.sha256(Path(name).read_bytes()).hexdigest()!=h]
def count(items):return sum(count(i) if isinstance(i,list) else 1 for i in items)
report={'page_count':len(reader.pages),'text_chunks':len(chunks),'missing_chunks':missing,'fonts':fonts,'bookmarks':count(reader.outline),'named_destinations':len(reader.named_destinations),'external_links':len(links),'link_errors':link_errors,'pages':pages,'changed_originals':changed}
(work/'pdf-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:report[k] for k in ['page_count','text_chunks','missing_chunks','bookmarks','named_destinations','external_links','link_errors','changed_originals']},ensure_ascii=False))
print(json.dumps({'glyphs':sum(p['bad_glyphs'] for p in pages),'outside_paper':sum(p['outside_paper'] for p in pages),'outside_body':sum(p['outside_body'] for p in pages),'font_count':len(fonts),'unembedded':[k for k,v in fonts.items() if not v['embedded']]},ensure_ascii=False))
poppler=Path('C:/Users/maluteng/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')
render=work/'renders';render.mkdir(exist_ok=True)
subprocess.run([str(poppler/'pdftoppm.exe'),'-r','90','-png',str(pdfpath),str(render/'page')],check=True,capture_output=True)
imgs=sorted((p for p in render.glob('page-*.png') if int(p.stem.split('-')[-1]) <= len(reader.pages)),key=lambda p:int(re.search(r'-(\d+)\.png',p.name)[1]))
for batch in range((len(imgs)+8)//9):
    sheet=Image.new('RGB',(1260,3*600),'#e9ece9');draw=ImageDraw.Draw(sheet)
    for j,p in enumerate(imgs[batch*9:(batch+1)*9]):
        im=Image.open(p).convert('RGB');im.thumbnail((400,560));x=(j%3)*420+(420-im.width)//2;y=(j//3)*600+25
        sheet.paste(im,(x,y));draw.text((x,y-20),f'Page {batch*9+j+1}',fill='black')
    sheet.save(work/f'contact-{batch+1}.jpg',quality=90)
print('Rendered',len(imgs),'PDF pages')
