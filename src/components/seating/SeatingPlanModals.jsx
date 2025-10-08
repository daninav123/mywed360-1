import React from 'react';
import { venueTemplates } from '../data/venueTemplates';
import VenueTemplateSelector from '../components/seating/VenueTemplateSelector';

const TemplateSelector = ({ onApply, onClose, guests, tables, hallSize, areas }) => {
  const handleApply = (tpl) => {
    onApply?.({
      ...tpl,
    });
    onClose?.();
  };

  return (
    <div className="space-y-3">
      <VenueTemplateSelector onApply={handleApply} selectedTemplateId={null} />
    </div>
  );
};

export default TemplateSelector;
