#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const exts=new Set(['.js','.jsx']);
const roots=['src','backend','functions'];

const replPairs=[
  [/MÃ‡Â­s/g,'MÃƒÂ¡s'],[/MÃ¯Â¿Â½Ã¯Â¿Â½s/g,'MÃƒÂ¡s'],[/Mas/g,'MÃƒÂ¡s'],
  [/ConfiguraciÃ¯Â¿Â½Ã¯Â¿Â½n/g,'ConfiguraciÃƒÂ³n'],[/ConfiguraciÃƒÆ’Ã‚Â³n/g,'ConfiguraciÃƒÂ³n'],
  [/DiseÃ¯Â¿Â½Ã¯Â¿Â½os/g,'DiseÃƒÂ±os'],[/Disenos/g,'DiseÃƒÂ±os'],[/DiseÃƒÆ’Ã‚Â±os/g,'DiseÃƒÂ±os'],
  [/SesiÃ¯Â¿Â½Ã¯Â¿Â½n/g,'SesiÃƒÂ³n'],[/SesiÃƒÆ’Ã‚Â³n/g,'SesiÃƒÂ³n'],
  [/Iniciar SesiÃ¯Â¿Â½Ã¯Â¿Â½n/g,'Iniciar SesiÃƒÂ³n'],[/Cerrar SesiÃ¯Â¿Â½Ã¯Â¿Â½n/g,'Cerrar SesiÃƒÂ³n'],
  [/AÃ¯Â¿Â½Ã¯Â¿Â½adir/g,'AÃƒÂ±adir'],[/AÃ¯Â¿Â½adir/g,'AÃƒÂ±adir'],[/AÃƒÆ’Ã‚Â±adir/g,'AÃƒÂ±adir'],
  [/SÃ¯Â¿Â½Ã¯Â¿Â½/g,'SÃƒÂ­'],[/SÃƒÆ’Ã‚Â­/g,'SÃƒÂ­'],
  [/Correo ElectrÃ¯Â¿Â½Ã¯Â¿Â½nico/g,'Correo ElectrÃƒÂ³nico'],
  [/TelÃ¯Â¿Â½Ã¯Â¿Â½fono/g,'TelÃƒÂ©fono'],[/DirecciÃ¯Â¿Â½Ã¯Â¿Â½n/g,'DirecciÃƒÂ³n'],
  [/MaÃ¯Â¿Â½Ã¯Â¿Â½ana/g,'MaÃƒÂ±ana'],[/PrÃ¯Â¿Â½Ã¯Â¿Â½ximo/g,'PrÃƒÂ³ximo'],[/PrÃ¯Â¿Â½Ã¯Â¿Â½xima/g,'PrÃƒÂ³xima'],
  // Generic double-encoded UTF-8
  [/ÃƒÆ’Ã‚Â¡/g,'ÃƒÂ¡'],[/ÃƒÆ’ÃƒÂ©|ÃƒÆ’Ã‚Â©/g,'ÃƒÂ©'],[/ÃƒÆ’ÃƒÂ­|ÃƒÆ’Ã‚Â­/g,'ÃƒÂ­'],[/ÃƒÆ’Ã‚Â³/g,'ÃƒÂ³'],[/ÃƒÆ’Ã‚Âº/g,'ÃƒÂº'],[/ÃƒÆ’ÃƒÂ±|ÃƒÆ’Ã‚Â±/g,'ÃƒÂ±'],[/ÃƒÆ’Ã¢â‚¬Â°/g,'Ãƒâ€°'],
  // FR common
  [/ParamÃ¯Â¿Â½Ã¯Â¿Â½tres/g,'ParamÃƒÂ¨tres'],[/ParamÃƒÆ’Ã‚Â¨tres/g,'ParamÃƒÂ¨tres'],
  [/DÃ¯Â¿Â½Ã¯Â¿Â½connexion/g,'DÃƒÂ©connexion'],[/DÃƒÆ’Ã‚Â©connexion/g,'DÃƒÂ©connexion'],
  [/TÃ¯Â¿Â½Ã¯Â¿Â½ches/g,'TÃƒÂ¢ches'],[/CrÃ¯Â¿Â½Ã¯Â¿Â½er/g,'CrÃƒÂ©er'],[/RÃ¯Â¿Â½Ã¯Â¿Â½initialiser/g,'RÃƒÂ©initialiser'],
  [/TÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©phone/g,'TÃƒÂ©lÃƒÂ©phone']
];

function eachFile(dir,fn){ if(!fs.existsSync(dir)) return; for(const e of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,e.name); if(e.isDirectory()) eachFile(p,fn); else if(exts.has(path.extname(e.name))) fn(p); } }

let changed=0, scanned=0;
function fixFile(p){
  let txt=fs.readFileSync(p,'utf8');
  const orig=txt;
  // Remove stray replacement char
  txt=txt.replace(/Ã¯Â¿Â½+/g,'');
  for(const [re,to] of replPairs){ txt=txt.replace(re,to); }
  if(txt!==orig){ fs.writeFileSync(p,txt,'utf8'); changed++; }
  scanned++;
}

for(const r of roots) eachFile(path.resolve(r),fixFile);
console.log(`Scanned ${scanned} files. Fixed ${changed}.`);

