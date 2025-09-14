import React from 'react';
import UnifiedEmail from '../UnifiedEmail';

// Wrapper de compatibilidad para LazyEmailInbox
// Mantiene una ruta estable para carga perezosa del buzón
const EmailInbox = () => {
  return <UnifiedEmail />;
};

export default EmailInbox;