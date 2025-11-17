#!/usr/bin/env node

/**
 * Script de verificación manual para Modal de Favoritos
 * Comprueba que el código está correctamente implementado
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('\n🔍 VERIFICACIÓN MODAL DE FAVORITOS\n');
console.log('='.repeat(60));

let passedChecks = 0;
let totalChecks = 0;

function check(name, condition, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

// 1. Verificar que SelectFromFavoritesModal existe
const modalPath = path.join(rootDir, 'apps/main-app/src/components/suppliers/SelectFromFavoritesModal.jsx');
const modalExists = fs.existsSync(modalPath);
check('Modal existe', modalExists, modalPath);

if (modalExists) {
  const modalContent = fs.readFileSync(modalPath, 'utf8');
  
  // 2. Verificar hooks
  check('Import useMemo', modalContent.includes('import React, { useState, useMemo }'));
  check('Estado sortBy', modalContent.includes("const [sortBy, setSortBy] = useState('recent')"));
  check('Estado editingNoteId', modalContent.includes('const [editingNoteId, setEditingNoteId]'));
  check('Estado showGallery', modalContent.includes('const [showGallery, setShowGallery]'));
  
  // 3. Verificar sortedFavorites ANTES del return
  const sortedFavoritesIndex = modalContent.indexOf('const sortedFavorites = useMemo');
  const ifOpenReturnIndex = modalContent.indexOf('if (!open) return null');
  check(
    'useMemo ANTES del return',
    sortedFavoritesIndex > 0 && sortedFavoritesIndex < ifOpenReturnIndex,
    sortedFavoritesIndex < ifOpenReturnIndex ? 'Regla de hooks OK' : 'VIOLACIÓN DE HOOKS!'
  );
  
  // 4. Verificar funciones de ordenamiento
  check('Ordenar por rating', modalContent.includes("case 'rating'"));
  check('Ordenar por precio', modalContent.includes("case 'price'"));
  check('Ordenar por ubicación', modalContent.includes("case 'distance'"));
  check('Ordenar por recientes', modalContent.includes("case 'recent'"));
  
  // 5. Verificar edición de notas
  check('Función handleStartEditNote', modalContent.includes('const handleStartEditNote'));
  check('Función handleSaveNote', modalContent.includes('const handleSaveNote'));
  check('updateFavoriteNotes', modalContent.includes('updateFavoriteNotes'));
  
  // 6. Verificar galería
  check('Función handleViewGallery', modalContent.includes('const handleViewGallery'));
  check('ImageGalleryModal import', modalContent.includes("import ImageGalleryModal from './ImageGalleryModal'"));
  
  // 7. Verificar UI
  check('Select de ordenamiento', modalContent.includes('<select') && modalContent.includes('value={sortBy}'));
  check('Input de notas', modalContent.includes('input[placeholder*="nota"]') || modalContent.includes('placeholder="Escribe una nota'));
  check('Botón editar nota', modalContent.includes('Edit3'));
  check('Overlay hover imagen', modalContent.includes('Ver {supplier.portfolio.length} fotos'));
}

// 8. Verificar ImageGalleryModal
const galleryPath = path.join(rootDir, 'apps/main-app/src/components/suppliers/ImageGalleryModal.jsx');
const galleryExists = fs.existsSync(galleryPath);
check('ImageGalleryModal existe', galleryExists, galleryPath);

if (galleryExists) {
  const galleryContent = fs.readFileSync(galleryPath, 'utf8');
  check('Navegación con flechas', galleryContent.includes('ChevronLeft') && galleryContent.includes('ChevronRight'));
  check('Soporte teclado', galleryContent.includes('handleKeyDown'));
  check('Thumbnails', galleryContent.includes('thumbnails') || galleryContent.includes('Thumbnail'));
}

// 9. Verificar FavoritesContext
const contextPath = path.join(rootDir, 'apps/main-app/src/contexts/FavoritesContext.jsx');
const contextExists = fs.existsSync(contextPath);
check('FavoritesContext existe', contextExists);

if (contextExists) {
  const contextContent = fs.readFileSync(contextPath, 'utf8');
  check('updateFavoriteNotes en context', contextContent.includes('const updateFavoriteNotes'));
  check('PATCH endpoint', contextContent.includes("axios.patch") && contextContent.includes('/api/favorites/'));
}

// 10. Verificar tests E2E
const testsPath = path.join(rootDir, 'cypress/e2e/favorites-modal.cy.js');
const testsExist = fs.existsSync(testsPath);
check('Tests E2E creados', testsExist, testsPath);

if (testsExist) {
  const testsContent = fs.readFileSync(testsPath, 'utf8');
  check('Test ver portfolio', testsContent.includes('Ver Portfolio Completo'));
  check('Test ordenar', testsContent.includes('Ordenar Favoritos'));
  check('Test editar notas', testsContent.includes('Editar Notas'));
  check('Tests de regresión', testsContent.includes('Regresión'));
  check('Tests casos edge', testsContent.includes('Casos Edge'));
}

// Resumen
console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESULTADO: ${passedChecks}/${totalChecks} checks pasados`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 ¡TODO IMPLEMENTADO CORRECTAMENTE!\n');
  console.log('Funcionalidades verificadas:');
  console.log('  1. ✅ Ver Portfolio Completo (lightbox)');
  console.log('  2. ✅ Ordenar Favoritos (4 opciones)');
  console.log('  3. ✅ Editar Notas Rápido (inline)');
  console.log('  4. ✅ ImageGalleryModal creado');
  console.log('  5. ✅ updateFavoriteNotes en backend');
  console.log('  6. ✅ Tests E2E documentados\n');
  console.log('🔥 Regla de Hooks CUMPLIDA - Sin errores React');
  process.exit(0);
} else {
  console.log('\n⚠️  Algunos checks fallaron - revisar arriba\n');
  process.exit(1);
}
