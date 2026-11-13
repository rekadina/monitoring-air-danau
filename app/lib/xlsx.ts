/*
 * Pembuat file Excel (.xlsx) sederhana tanpa library tambahan.
 * Angka tersimpan sebagai angka sungguhan dan waktu sebagai tanggal-waktu,
 * jadi hasilnya sama di Excel / Google Sheets / LibreOffice apa pun pengaturan wilayahnya.
 */

export type XlsxCell = string | number | Date | null | undefined;

const enc = new TextEncoder();

// ---- CRC32 (dibutuhkan format ZIP) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ---- ZIP tanpa kompresi ("store") ----
function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  const u16 = (v: number) => new Uint8Array([v & 255, (v >>> 8) & 255]);
  const u32 = (v: number) =>
    new Uint8Array([v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]);
  const concat = (parts: Uint8Array[]) => {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0;
    for (const p of parts) {
      out.set(p, o);
      o += p.length;
    }
    return out;
  };

  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = concat([
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
      u32(crc), u32(f.data.length), u32(f.data.length), u16(name.length), u16(0),
      name, f.data,
    ]);
    chunks.push(local);
    central.push(
      concat([
        u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
        u32(crc), u32(f.data.length), u32(f.data.length), u16(name.length),
        u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name,
      ])
    );
    offset += local.length;
  }

  const centralBlock = concat(central);
  const end = concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(centralBlock.length), u32(offset), u16(0),
  ]);
  return concat([...chunks, centralBlock, end]);
}

// ---- XML ----
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const colName = (i: number) => String.fromCharCode(65 + i); // A..Z (cukup untuk tabel ini)

// Waktu lokal (jam dinding) -> nomor seri tanggal Excel
const excelSerial = (d: Date) =>
  Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()) /
    86400000 +
  25569;

const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const STYLES = `${XML}<styleSheet ${NS}>
<numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy\\-mm\\-dd\\ hh:mm:ss"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDBEAFE"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="3">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

export function buildXlsx(
  header: string[],
  rows: XlsxCell[][],
  widths: number[] = [],
  sheetName = "Report"
): Uint8Array {
  const cols = header
    .map(
      (_, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${widths[i] ?? 18}" customWidth="1"/>`
    )
    .join("");

  const headerRow =
    `<row r="1">` +
    header
      .map((h, i) => `<c r="${colName(i)}1" t="inlineStr" s="1"><is><t>${esc(h)}</t></is></c>`)
      .join("") +
    `</row>`;

  const bodyRows = rows
    .map((row, r) => {
      const rn = r + 2;
      const cells = row
        .map((v, i) => {
          const ref = `${colName(i)}${rn}`;
          if (v === null || v === undefined || v === "") return "";
          if (v instanceof Date) return `<c r="${ref}" s="2"><v>${excelSerial(v)}</v></c>`;
          if (typeof v === "number")
            return Number.isFinite(v) ? `<c r="${ref}"><v>${v}</v></c>` : "";
          return `<c r="${ref}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rn}">${cells}</row>`;
    })
    .join("");

  const sheet = `${XML}<worksheet ${NS}>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${cols}</cols>
<sheetData>${headerRow}${bodyRows}</sheetData>
</worksheet>`;

  const files = [
    {
      name: "[Content_Types].xml",
      data: `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      data: `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      data: `${XML}<workbook ${NS} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    { name: "xl/styles.xml", data: STYLES },
    { name: "xl/worksheets/sheet1.xml", data: sheet },
  ].map((f) => ({ name: f.name, data: enc.encode(f.data) }));

  return zipStore(files);
}
