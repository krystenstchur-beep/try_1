from pathlib import Path
from PIL import Image, ImageDraw
w = Path(__file__).parent
sheet = Image.new('RGB', (1260, 1800), '#e9ece9')
d = ImageDraw.Draw(sheet)
for j, n in enumerate([55, 56]):
    im = Image.open(w / f'renders/page-{n:02}.png').convert('RGB')
    im.thumbnail((400, 560))
    x = j * 420 + (420 - im.width) // 2
    sheet.paste(im, (x, 25))
    d.text((x, 5), f'Page {n}', fill='black')
sheet.save(w / 'contact-7.jpg', quality=90)
