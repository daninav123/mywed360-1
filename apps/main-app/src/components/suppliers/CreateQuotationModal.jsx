import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, Calendar, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../Modal';
import Button from '../ui/Button';

export default function CreateQuotationModal({ isOpen, onClose, request, onQuotationCreated }) {
  // console.log('[CreateQuotationModal] Render:', { isOpen, hasRequest: !!request });

  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [portfolioProducts, setPortfolioProducts] = useState([]);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [discount, setDiscount] = useState({ type: 'fixed', value: 0 });
  const [tax, setTax] = useState({ rate: 21 }); // IVA 21% por defecto
  const [validUntil, setValidUntil] = useState('');
  const [terms, setTerms] = useState(
    'Pago: 50% anticipo, 50% día del evento\nIncluye todos los servicios descritos\nNo incluye desplazamiento fuera de la ciudad'
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar productos del portfolio
  useEffect(() => {
    if (isOpen) {
      loadPortfolio();
    }
  }, [isOpen]);

  const loadPortfolio = async () => {
    try {
      const token = localStorage.getItem('supplier_token');
      const supplierId = localStorage.getItem('supplier_id');

      const response = await fetch(`/api/suppliers/${supplierId}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-supplier-id': supplierId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioProducts(data.products || []);
      }
    } catch (error) {
      // console.error('Error loading portfolio:', error);
    }
  };

  // Agregar producto del portfolio
  const addFromPortfolio = (product) => {
    setItems([
      ...items,
      {
        description: product.name,
        quantity: 1,
        unitPrice: product.basePrice,
      },
    ]);
    setShowPortfolio(false);
    toast.success(`"${product.name}" agregado`);
  };

  // Cálculos
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount =
    discount.type === 'percentage' ? (subtotal * discount.value) / 100 : discount.value;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * tax.rate) / 100;
  const total = taxableAmount + taxAmount;

  // Agregar item
  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  // Eliminar item
  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Actualizar item
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = field === 'description' ? value : Number(value);
    setItems(newItems);
  };

  // Enviar cotización
  const handleSubmit = async () => {
    // Validaciones
    if (items.some((item) => !item.description.trim())) {
      toast.error('Todos los items deben tener descripción');
      return;
    }

    if (items.some((item) => item.quantity <= 0 || item.unitPrice < 0)) {
      toast.error('Cantidades y precios deben ser válidos');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('supplier_token');
      const supplierId = localStorage.getItem('supplier_id');

      const response = await fetch(
        `/api/suppliers/${supplierId}/quote-requests/${request.id}/quotation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-supplier-id': supplierId,
          },
          body: JSON.stringify({
            items,
            discount: discount.value > 0 ? discount : null,
            tax,
            validUntil: validUntil || null,
            terms: terms.trim(),
            notes: notes.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error enviando cotización');
      }

      const data = await response.json();
      toast.success('Cotización enviada correctamente');

      if (onQuotationCreated) {
        onQuotationCreated(data.quotation);
      }

      onClose();
    } catch (error) {
      // console.error('Error:', error);
      toast.error('Error enviando cotización');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Crear Cotización - ${request?.coupleName}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-body">Servicios / Productos</h3>
            <div className="flex gap-2">
              {portfolioProducts.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowPortfolio(!showPortfolio)}
                >
                  <Package size={16} className="mr-1" />
                  Desde Portfolio ({portfolioProducts.length})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus size={16} className="mr-1" />
                Agregar Manualmente
              </Button>
            </div>
          </div>

          {/* Selector de productos del portfolio */}
          {showPortfolio && portfolioProducts.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-app border border-soft max-h-60 overflow-y-auto">
              <p className="text-xs text-muted mb-2">Selecciona un producto de tu portfolio:</p>
              <div className="grid grid-cols-1 gap-2">
                {portfolioProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addFromPortfolio(product)}
                    className="text-left p-3 rounded-md bg-surface hover:bg-app border border-soft hover:border-primary transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-body">{product.name}</p>
                        <p className="text-xs text-muted line-clamp-1">{product.description}</p>
                      </div>
                      <p className="font-bold text-sm text-primary ml-3">{product.basePrice}€</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-6">
                  <input
                    type="text"
                    placeholder="Descripción del servicio"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-soft bg-surface text-body text-sm focus:ring-2 ring-primary"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Cant."
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-soft bg-surface text-body text-sm focus:ring-2 ring-primary"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    placeholder="Precio unit."
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-soft bg-surface text-body text-sm focus:ring-2 ring-primary"
                  />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-danger hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cálculos */}
        <div className="p-4 rounded-lg bg-app border border-soft">
          <div className="flex items-center gap-2 mb-3">
            <Calculator size={18} className="text-primary" />
            <h3 className="font-semibold text-body">Cálculo del Presupuesto</h3>
          </div>

          <div className="space-y-3">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal:</span>
              <span className="font-medium text-body">{subtotal.toFixed(2)}€</span>
            </div>

            {/* Descuento */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted min-w-[80px]">Descuento:</span>
              <select
                value={discount.type}
                onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
                className="px-2 py-1 rounded-md border border-soft bg-surface text-body text-sm focus:ring-2 ring-primary"
              >
                <option value="fixed">€ Fijo</option>
                <option value="percentage">% Porcentaje</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount.value}
                onChange={(e) => setDiscount({ ...discount, value: Number(e.target.value) })}
                className="flex-1 px-3 py-1 rounded-md border border-soft bg-surface text-body text-sm focus:ring-2 ring-primary"
                placeholder="0"
              />
              <span className="text-sm font-medium text-danger">-{discountAmount.toFixed(2)}€</span>
            </div>

            {/* IVA */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted min-w-[80px]">IVA ({tax.rate}%):</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={tax.rate}
                onChange={(e) => setTax({ rate: Number(e.target.value) })}
                className="w-24 px-3 py-1 rounded-md border border-soft bg-surface text-body text-sm focus:ring-2 ring-primary"
              />
              <span className="text-sm font-medium text-body ml-auto">{taxAmount.toFixed(2)}€</span>
            </div>

            {/* Total */}
            <div className="flex justify-between pt-3 border-t border-soft">
              <span className="font-bold text-body">TOTAL:</span>
              <span className="text-2xl font-bold text-primary">{total.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {/* Validez */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-body mb-2">
            <Calendar size={16} />
            Válido hasta (opcional)
          </label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-soft bg-surface text-body focus:ring-2 ring-primary"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Términos y condiciones */}
        <div>
          <label className="block text-sm font-medium text-body mb-2">Términos y Condiciones</label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-md border border-soft bg-surface text-body text-sm focus:ring-2 ring-primary resize-none"
            placeholder="Condiciones de pago, incluye/no incluye, etc."
          />
        </div>

        {/* Notas adicionales */}
        <div>
          <label className="block text-sm font-medium text-body mb-2">
            Notas Adicionales (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-soft bg-surface text-body text-sm focus:ring-2 ring-primary resize-none"
            placeholder="Información adicional para el cliente..."
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t border-soft">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || total <= 0}
            className="flex-1"
          >
            {loading ? 'Enviando...' : `Enviar Cotización (${total.toFixed(2)}€)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
