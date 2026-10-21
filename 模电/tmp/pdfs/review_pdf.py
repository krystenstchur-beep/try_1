from pathlib import Path
from pypdf import PdfReader
import pypdfium2 as pdfium
from PIL import Image,ImageDraw
p=next(Path('output/pdf').glob('*.pdf'))
r=PdfReader(p)
print('pages',len(r.pages),'outline',len(r.outline))
texts=[p.extract_text() or '' for p in r.pages]
Path('tmp/pdfs/text.txt').write_text('\n\n'.join('PAGE '+str(i+1)+'\n'+t for i,t in enumerate(texts)),encoding='utf-8')
print('page_lengths',[len(t) for t in texts])
print('links',sum(len(p.get('/Annots',[])) for p in r.pages))
doc=pdfium.PdfDocument(str(p))
for batch in range((len(doc)+11)//12):
    sheet=Image.new('RGB',(1200,4*445),(232,235,230));draw=ImageDraw.Draw(sheet)
    for k in range(12):
        i=batch*12+k
        if i>=len(doc):break
        im=doc[i].render(scale=.7).to_pil().convert('RGB')
        im.thumbnail((390,415))
        x=(k%3)*400+(400-im.width)//2;y=(k//3)*445+22
        sheet.paste(im,(x,y));draw.text((x,y-18),f'Page {i+1}',fill='black')
    sheet.save(f'tmp/pdfs/sheet-{batch+1}.jpg',quality=88)
for i in [0,1,2,len(doc)-1]:
    doc[i].render(scale=1.4).to_pil().save(f'tmp/pdfs/page-{i+1}.png')
