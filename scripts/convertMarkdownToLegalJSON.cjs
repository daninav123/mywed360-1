#!/usr/bin/env node
/**
 * Script para convertir archivos markdown de requisitos legales a JSON
 * Lee los 195 archivos markdown de docs/requisitos-legales/ y genera JSON
 */

const fs = require('fs').promises;
const path = require('path');

const BASE_DIR = path.join(__dirname, '../docs/requisitos-legales');
const OUTPUT_FILE = path.join(__dirname, '../apps/main-app/src/data/legalRequirementsComplete.json');

// Mapeo de códigos ISO a nombres de países
const COUNTRY_CODES = {
  // Europa
  'ES': 'España', 'FR': 'Francia', 'DE': 'Alemania', 'IT': 'Italia', 'PT': 'Portugal',
  'BE': 'Bélgica', 'NL': 'Países Bajos', 'LU': 'Luxemburgo', 'AT': 'Austria', 'IE': 'Irlanda',
  'DK': 'Dinamarca', 'SE': 'Suecia', 'FI': 'Finlandia', 'NO': 'Noruega', 'IS': 'Islandia',
  'GB': 'Reino Unido', 'GR': 'Grecia', 'CY': 'Chipre', 'MT': 'Malta', 'PL': 'Polonia',
  'CZ': 'República Checa', 'SK': 'Eslovaquia', 'HU': 'Hungría', 'RO': 'Rumanía', 'BG': 'Bulgaria',
  'HR': 'Croacia', 'SI': 'Eslovenia', 'EE': 'Estonia', 'LV': 'Letonia', 'LT': 'Lituania',
  'RU': 'Rusia', 'UA': 'Ucrania', 'BY': 'Bielorrusia', 'MD': 'Moldavia', 'RS': 'Serbia',
  'BA': 'Bosnia y Herzegovina', 'AL': 'Albania', 'MK': 'Macedonia del Norte', 'ME': 'Montenegro',
  'GE': 'Georgia', 'AZ': 'Azerbaiyán', 'CH': 'Suiza', 'LI': 'Liechtenstein', 'MC': 'Mónaco',
  'AD': 'Andorra', 'SM': 'San Marino', 'VA': 'Ciudad del Vaticano', 'XK': 'Kosovo',
  'FO': 'Islas Feroe', 'GL': 'Groenlandia', 'SJ': 'Svalbard y Jan Mayen',
  
  // América
  'US': 'Estados Unidos', 'CA': 'Canadá', 'MX': 'México', 'BR': 'Brasil', 'AR': 'Argentina',
  'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Perú', 'VE': 'Venezuela', 'EC': 'Ecuador',
  'BO': 'Bolivia', 'PY': 'Paraguay', 'UY': 'Uruguay', 'CU': 'Cuba', 'DO': 'República Dominicana',
  'PR': 'Puerto Rico', 'PA': 'Panamá', 'CR': 'Costa Rica', 'NI': 'Nicaragua', 'HN': 'Honduras',
  'SV': 'El Salvador', 'GT': 'Guatemala', 'BZ': 'Belice', 'HT': 'Haití', 'JM': 'Jamaica',
  'TT': 'Trinidad y Tobago', 'BB': 'Barbados', 'BS': 'Bahamas', 'GY': 'Guyana', 'SR': 'Surinam',
  'GD': 'Granada', 'LC': 'Santa Lucía', 'VC': 'San Vicente y las Granadinas', 'AG': 'Antigua y Barbuda',
  'KN': 'San Cristóbal y Nieves', 'DM': 'Dominica',
  
  // Asia
  'CN': 'China', 'IN': 'India', 'JP': 'Japón', 'KR': 'Corea del Sur', 'KP': 'Corea del Norte',
  'TH': 'Tailandia', 'VN': 'Vietnam', 'PH': 'Filipinas', 'ID': 'Indonesia', 'MY': 'Malasia',
  'SG': 'Singapur', 'MM': 'Myanmar', 'LA': 'Laos', 'KH': 'Camboya', 'BN': 'Brunéi',
  'TL': 'Timor Oriental', 'TW': 'Taiwán', 'HK': 'Hong Kong', 'MO': 'Macao', 'MN': 'Mongolia',
  'KZ': 'Kazajistán', 'UZ': 'Uzbekistán', 'TM': 'Turkmenistán', 'TJ': 'Tayikistán', 'KG': 'Kirguistán',
  'AF': 'Afganistán', 'PK': 'Pakistán', 'BD': 'Bangladés', 'LK': 'Sri Lanka', 'NP': 'Nepal',
  'BT': 'Bután', 'MV': 'Maldivas', 'IQ': 'Irak', 'SY': 'Siria', 'JO': 'Jordania',
  'LB': 'Líbano', 'IL': 'Israel', 'PS': 'Palestina', 'YE': 'Yemen', 'OM': 'Omán',
  'AE': 'Emiratos Árabes Unidos', 'SA': 'Arabia Saudita', 'QA': 'Qatar', 'BH': 'Bahréin',
  'KW': 'Kuwait', 'TR': 'Turquía', 'AM': 'Armenia',
  
  // África
  'EG': 'Egipto', 'MA': 'Marruecos', 'DZ': 'Argelia', 'TN': 'Túnez', 'LY': 'Libia',
  'ZA': 'Sudáfrica', 'NG': 'Nigeria', 'KE': 'Kenia', 'ET': 'Etiopía', 'GH': 'Ghana',
  'TZ': 'Tanzania', 'UG': 'Uganda', 'SD': 'Sudán', 'SS': 'Sudán del Sur', 'SO': 'Somalia',
  'DJ': 'Yibuti', 'ER': 'Eritrea', 'MR': 'Mauritania', 'ML': 'Malí', 'NE': 'Níger',
  'TD': 'Chad', 'SN': 'Senegal', 'GM': 'Gambia', 'GW': 'Guinea-Bissau', 'GN': 'Guinea',
  'SL': 'Sierra Leona', 'LR': 'Liberia', 'CI': 'Costa de Marfil', 'BF': 'Burkina Faso',
  'BJ': 'Benín', 'TG': 'Togo', 'CM': 'Camerún', 'CF': 'República Centroafricana',
  'GQ': 'Guinea Ecuatorial', 'GA': 'Gabón', 'CG': 'Congo', 'CD': 'RD Congo',
  'AO': 'Angola', 'ZM': 'Zambia', 'ZW': 'Zimbabue', 'MW': 'Malaui', 'MZ': 'Mozambique',
  'BW': 'Botsuana', 'NA': 'Namibia', 'LS': 'Lesoto', 'SZ': 'Esuatini', 'MU': 'Mauricio',
  'SC': 'Seychelles', 'KM': 'Comoras', 'MG': 'Madagascar', 'RW': 'Ruanda', 'BI': 'Burundi',
  'CV': 'Cabo Verde', 'ST': 'Santo Tomé y Príncipe', 'RE': 'Reunión', 'YT': 'Mayotte',
  
  // Oceanía
  'AU': 'Australia', 'NZ': 'Nueva Zelanda', 'PG': 'Papúa Nueva Guinea', 'FJ': 'Fiji',
  'SB': 'Islas Salomón', 'VU': 'Vanuatu', 'NC': 'Nueva Caledonia', 'PF': 'Polinesia Francesa',
  'WS': 'Samoa', 'TO': 'Tonga', 'KI': 'Kiribati', 'FM': 'Micronesia', 'MH': 'Islas Marshall',
  'PW': 'Palaos', 'NR': 'Nauru', 'TV': 'Tuvalu', 'AS': 'Samoa Americana',
  'GU': 'Guam', 'MP': 'Islas Marianas del Norte', 'CK': 'Islas Cook', 'NU': 'Niue',
  'VI': 'Islas Vírgenes de EE.UU.'
};

async function readMarkdownFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error leyendo ${filePath}:`, error.message);
    return null;
  }
}

function extractMarriageEquality(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('MATRIMONIO IGUALITARIO')) {
      const nextLines = lines.slice(lines.indexOf(line), lines.indexOf(line) + 10).join('\n');
      if (nextLines.includes('✅') && nextLines.includes('LEGAL')) {
        return 'legal';
      }
      if (nextLines.includes('❌') && nextLines.includes('NO legal')) {
        return 'not_legal';
      }
    }
  }
  return 'unknown';
}

function extractAuthority(content) {
  const match = content.match(/\*\*Autoridad competente\*\*:\s*(.+)/);
  if (match) {
    return match[1].replace(/⚠️ PENDIENTE|⚠️/g, '').trim();
  }
  return 'Registro Civil';
}

function extractVerificationLevel(content) {
  if (content.includes('**ALTO**')) return 'high';
  if (content.includes('**MEDIO')) return 'medium';
  if (content.includes('**BAJO**')) return 'low';
  return 'low';
}

function extractSourceUrl(content) {
  const match = content.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (match && match[2] && !match[2].includes('PENDIENTE')) {
    return { label: match[1], url: match[2] };
  }
  return null;
}

async function processMarkdownFiles() {
  const countries = {};
  const continents = ['europa', 'america', 'asia', 'africa', 'oceania'];
  
  let processedCount = 0;
  
  for (const continent of continents) {
    const continentPath = path.join(BASE_DIR, continent);
    
    try {
      const files = await fs.readdir(continentPath);
      
      for (const file of files) {
        if (!file.endsWith('-VERIFICADO.md')) continue;
        
        const match = file.match(/^([A-Z]{2})-(.+)-VERIFICADO\.md$/);
        if (!match) continue;
        
        const code = match[1];
        const filePath = path.join(continentPath, file);
        const content = await readMarkdownFile(filePath);
        
        if (!content) continue;
        
        const countryName = COUNTRY_CODES[code] || match[2].replace(/-/g, ' ');
        const authority = extractAuthority(content);
        const verificationLevel = extractVerificationLevel(content);
        const marriageEquality = extractMarriageEquality(content);
        const source = extractSourceUrl(content);
        
        countries[code] = {
          name: countryName,
          metadata: {
            verificationLevel,
            sourceLabel: source?.label || 'Pendiente de verificación',
            sourceUrl: source?.url || null,
            notes: content.includes('PENDIENTE DE VERIFICAR') 
              ? ['Información pendiente de verificación completa']
              : []
          },
          ceremonyTypes: {
            civil: {
              requirements: [{
                id: 'civil-core',
                displayName: 'Requisitos matrimonio civil',
                description: `Requisitos para contraer matrimonio civil en ${countryName}.`,
                authority,
                authorityRef: authority.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                documentation: content.includes('PENDIENTE DE VERIFICAR')
                  ? ['Documentación pendiente de verificación']
                  : ['DNI/Pasaporte', 'Certificado de nacimiento', 'Certificado de soltería'],
                steps: [{
                  id: 'collect_documents',
                  title: 'Reunir documentación',
                  description: 'Consultar autoridad local para requisitos específicos'
                }],
                leadTimeDays: null,
                costEstimate: null,
                requiresAppointment: false,
                digitalAvailability: 'in_person',
                translationsNeeded: false,
                relatedCertificates: [],
                evidences: [],
                links: source ? [{ type: 'reference', ...source }] : []
              }]
            }
          },
          marriageEquality
        };
        
        processedCount++;
        if (processedCount % 20 === 0) {
          console.log(`Procesados ${processedCount} países...`);
        }
      }
    } catch (error) {
      console.error(`Error procesando ${continent}:`, error.message);
    }
  }
  
  return countries;
}

async function main() {
  console.log('🔄 Convirtiendo archivos markdown a JSON...\n');
  
  const countries = await processMarkdownFiles();
  
  const output = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    source: 'docs/requisitos-legales/ (195 países)',
    totalCountries: Object.keys(countries).length,
    countries
  };
  
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`\n✅ Completado!`);
  console.log(`   - Países procesados: ${output.totalCountries}`);
  console.log(`   - Archivo generado: ${OUTPUT_FILE}`);
  console.log(`\n📝 Próximo paso: El componente DocumentosLegales.jsx ya está configurado`);
  console.log(`   para usar este archivo automáticamente.\n`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
