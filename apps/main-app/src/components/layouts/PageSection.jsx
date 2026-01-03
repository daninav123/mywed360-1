import React from 'react';
import PropTypes from 'prop-types';

/**
 * PageSection - Sección de contenido dentro de PageLayout
 * Aplica padding consistente según el sistema de diseño
 * 
 * @example
 * <PageSection>
 *   <div>Contenido de la sección</div>
 * </PageSection>
 */
export default function PageSection({ children, className = "", noPadding = false }) {
  if (noPadding) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`px-6 py-6 ${className}`}>
      {children}
    </div>
  );
}

PageSection.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  noPadding: PropTypes.bool,
};
