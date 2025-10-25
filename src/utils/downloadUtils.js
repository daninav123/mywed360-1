import i18n from '../i18n';

export function downloadBlob(blob, fileName) {
  if (!(blob instanceof Blob)) {
    throw new Error(i18n.t('common.downloadblob_esperaba_objeto_blob_valido'));
  }
  const safeName = fileName || `archivo-${Date.now()}.bin`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

