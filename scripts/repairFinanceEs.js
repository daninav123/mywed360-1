#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const esFinancePath = path.resolve('src/i18n/locales/es/finance.json');
const enCommonPath = path.resolve('src/i18n/locales/en/common.json');
const frCommonPath = path.resolve('src/i18n/locales/fr/common.json');

function loadJson(p){
  const raw = fs.readFileSync(p,'utf8');
  return JSON.parse(raw);
}
function saveJson(p,obj){
  fs.writeFileSync(p, JSON.stringify(obj,null,2)+'\n','utf8');
}

function walk(obj, fn){
  if (Array.isArray(obj)) return obj.map(v=>walk(v,fn));
  if (obj && typeof obj === 'object'){
    const out = {};
    for (const [k,v] of Object.entries(obj)) out[k] = walk(v, fn);
    return out;
  }
  if (typeof obj === 'string') return fn(obj);
  return obj;
}

function fixEs(s){
  let t = s;
  const reps = [
    [/\?sltima/gi,'Última'],
    [/\?sltimos/gi,'Últimos'],
    [/sincronizaci\?\?n/gi,'sincronización'],
    [/conexi\?\?n/gi,'conexión'],
    [/categor\?\?a/gi,'categoría'],
    [/categor\?\?as/gi,'categorías'],
    [/transacci\?\?n/gi,'transacción'],
    [/Transacci\?\?n/gi,'Transacción'],
    [/Descripci\?\?n/gi,'Descripción'],
    [/d\?\?as/gi,'días'],
    [/Pa\?\?s/gi,'País'],
    [/Espa\?\?a/gi,'España'],
    [/Cr\?\?tico/gi,'Crítico'],
    [/Anolisis/gi,'Análisis'],
    [/Mos Eficiente/gi,'Más Eficiente'],
    [/Distribuci\?\?n/gi,'Distribución'],
    [/Vinculaci\?\?n/gi,'Vinculación'],
    [/selecci\?\?n/gi,'selección'],
    [/opci\?\?n/gi,'opción'],
    [/\(\?\?Presupuesto excedido!\)/g,'(! Presupuesto excedido!)'],
  ];
  for (const [re,to] of reps) t = t.replace(re,to);
  t = t.replace(/\?\?/g,'');
  return t;
}

function fixArrows(s){
  return s.replace(/Ã¢â€ â€™/g,'›');
}

if (fs.existsSync(esFinancePath)){
  const json = loadJson(esFinancePath);
  const cleaned = walk(json, fixEs);
  saveJson(esFinancePath, cleaned);
  console.log('Patched', esFinancePath);
}
if (fs.existsSync(enCommonPath)){
  const j = loadJson(enCommonPath);
  const c = walk(j, fixArrows);
  saveJson(enCommonPath, c);
  console.log('Patched', enCommonPath);
}
if (fs.existsSync(frCommonPath)){
  const j = loadJson(frCommonPath);
  const c = walk(j, fixArrows);
  saveJson(frCommonPath, c);
  console.log('Patched', frCommonPath);
}
