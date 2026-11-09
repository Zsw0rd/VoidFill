/** Small fictional text PDF for an explicitly selected inference probe. No user input. */
export function syntheticResumePdf(marker) {
  if (typeof marker !== "string" || !/^[a-zA-Z0-9-]{1,90}$/.test(marker)) throw new Error("Invalid synthetic fixture marker.");
  const lines = ["Fictional Probe Learner", "probe@example.invalid", "Summary",
    "Built fictional event signup reports with Python and SQL.",
    `Synthetic performance case ${marker}; no real person or employer.`,
    "Skills", "Python, SQL, Git", "Projects", "Checked duplicate records and compared daily totals.",
    "Education", "Fictional practice programme; this is a test document."];
  const stream = "BT /F1 12 Tf 45 790 Td " + lines.map(line => `(${line}) Tj 0 -22 Td`).join(" ") + " ET";
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  for (let index=0;index<objects.length;index++) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index+1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += "xref\n0 6\n0000000000 65535 f \n" + offsets.map(offset => `${String(offset).padStart(10,"0")} 00000 n \n`).join("");
  return Buffer.from(pdf + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`, "ascii");
}
