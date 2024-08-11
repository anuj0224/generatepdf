const fs = require('fs');

class PDFDocument {
  constructor() {
    this.objects = [];
    this.pages = [];
    this.fonts = [];
  }

  addPage() {
    const page = new PDFPage(this.pages.length + 1);
    this.pages.push(page);
    return page;
  }

  render() {
    let content = "%PDF-1.4\n";
    let offset = content.length;
    const xref = [];
    
    // Add Catalog
    const catalog = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
    xref.push(offset);
    content += catalog;
    offset += catalog.length;

    // Add Pages Object
    const pagesObj = `2 0 obj\n<< /Type /Pages /Kids [${this.pages.map((_, i) => (i + 3) + " 0 R").join(' ')}] /Count ${this.pages.length} >>\nendobj\n`;
    xref.push(offset);
    content += pagesObj;
    offset += pagesObj.length;

    // Add each Page
    this.pages.forEach((page, index) => {
      const pageContent = page.render();
      xref.push(offset);
      content += `${index + 3} 0 obj\n<< /Type /Page /Parent 2 0 R /Contents ${index + 3 + this.pages.length} 0 R /MediaBox [0 0 612 792] >>\nendobj\n`;
      offset += pageContent.length + 63; // Adjusted for the additional Page object data
      xref.push(offset);
      content += `${index + 3 + this.pages.length} 0 obj\n<< /Length ${pageContent.length} >>\nstream\n${pageContent}\nendstream\nendobj\n`;
      offset += pageContent.length + 26; // Adjusted for stream and object closing tags
    });

    // Build XRef Table
    const startxref = offset;
    content += `xref\n0 ${xref.length + 1}\n0000000000 65535 f \n`;
    xref.forEach(o => {
      content += `${String(o).padStart(10, '0')} 00000 n \n`;
    });

    // Add Trailer
    content += `trailer\n<< /Size ${xref.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;

    return content;
  }
}

class PDFPage {
  constructor(pageNumber) {
    this.contents = [];
    this.pageNumber = pageNumber;
  }

  addText(text, x, y, fontSize = 12) {
    this.contents.push(`BT /F1 ${fontSize} Tf ${x} ${y} Td (${text}) Tj ET`);
  }

  render() {
    return this.contents.join("\n");
  }
}

// Usage
const doc = new PDFDocument();
const page = doc.addPage();
page.addText("Hello, World!", 100, 700);
const pdfContent = doc.render();

// Write to file
fs.writeFileSync('output.pdf', pdfContent);
console.log('PDF file has been generated.');
