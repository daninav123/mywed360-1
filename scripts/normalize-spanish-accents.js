const fs = require('fs');
const files = [
  'src/pages/ProveedoresNuevo.jsx',
  'src/pages/GestionProveedores.jsx',
  'src/components/proveedores/ReservationModal.jsx',
  'src/components/proveedores/ProviderEmailModal.jsx',
  'src/components/proveedores/ai/AIEmailModal.jsx',
  'src/components/proveedores/ai/AIResultList.jsx',
  'src/components/proveedores/WantedServicesModal.jsx',
  'src/components/proveedores/ProveedorList.jsx',
  'src/components/proveedores/ProveedorDetail.jsx',
  'src/components/proveedores/ProveedorCard.jsx',
].filter(f => fs.existsSync(f));

const regexReplacements = [
  [/Gesti.?n de Proveedores/g, 'Gestión de Proveedores'],
  [/B.?squeda IA/g, 'Búsqueda IA'],
  [/Puntuaci.?n IA/g, 'Puntuación IA'],
  [/A.?n no hay proveedor confirmado/g, 'Aún no hay proveedor confirmado'],
  [/M.?todo de contacto/g, 'Método de contacto'],
  [/Tel.?fono/g, 'Teléfono'],
  [/Informaci.?n/g, 'Información'],
  [/Ubicaci.?n/g, 'Ubicación'],
  [/Reuni.?n/g, 'Reunión'],
  [/Se.?al/g, 'Señal'],
  [/M.?sica/g, 'Música'],
  [/Fotograf.?a/g, 'Fotografía'],
  [/im.?genes/g, 'imágenes'],
  [/iluminaci.?n/g, 'iluminación'],
  [/a.?os/g, 'años'],
  [/Espa.?a/g, 'España'],
  [/m.?s/g, 'más'],
  [/pr.?ximo/g, 'próximo'],
  [/Aqu.?/g, 'Aquí'],
  [/direcci.?n/g, 'dirección'],
];

const changed = [];
for (const f of files) {
  try {
    let txt = fs.readFileSync(f, 'utf8');
    const orig = txt;
    for (const [re, good] of regexReplacements) {
      txt = txt.replace(re, good);
    }
    // Clean malformed currency symbols in demo data
    txt = txt.replace(/\d+�+\s*/g, (m) => m.replace(/�+/g, ''));
    txt = txt.replace(/�+/g, '');
    if (txt !== orig) {
      fs.writeFileSync(f, txt, 'utf8');
      changed.push(f);
    }
  } catch {}
}
console.log('Regex-normalized files:', changed);
