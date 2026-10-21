"""Add printed TOC page numbers from the PDF's actual internal destinations.

Run after export-pdf.cjs. Requires pypdf and reportlab. The document content,
bookmarks, annotations and page count are retained.
"""
from io import BytesIO
from pathlib import Path
import sys

from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas


def finish(path):
    path = Path(path)
    reader = PdfReader(BytesIO(path.read_bytes()))
    if (reader.metadata or {}).get('/TOCPageNumbersAdded') == 'true':
        return
    page = reader.pages[0]
    overlay = BytesIO()
    pen = canvas.Canvas(overlay, pagesize=(float(page.mediabox.width), float(page.mediabox.height)))
    pen.setFont('Helvetica', 10)
    pen.setFillColorRGB(0.19, 0.25, 0.22)
    count = 0
    for ref in page.get('/Annots', []):
        link = ref.get_object()
        target = link.get('/Dest')
        if target not in reader.named_destinations:
            continue
        number = reader.get_destination_page_number(reader.named_destinations[target]) + 1
        left, bottom, right, top = map(float, link['/Rect'])
        pen.drawRightString(right - 2, (bottom + top) / 2 - 3.2, str(number))
        count += 1
    if count != 11:
        raise ValueError(f'Expected 11 TOC destinations, found {count}')
    pen.save()
    writer = PdfWriter(clone_from=reader)
    writer.pages[0].merge_page(PdfReader(overlay).pages[0])
    writer.add_metadata({'/TOCPageNumbersAdded': 'true'})
    temporary = path.with_suffix('.numbered.pdf')
    writer.write(temporary)
    temporary.replace(path)
    print(f'Printed TOC: {count} destinations; {len(reader.pages)} pages')


if __name__ == '__main__':
    finish(sys.argv[1])
