import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui';
import { formatCurrency } from '../../utils/formatUtils';
import useTranslations from '../../hooks/useTranslations';

/**
 * Formulario para crear/editar transacciones
 * Incluye validacion y categorias predefinidas
 */
export default function TransactionForm({ transaction, onSave, onCancel, isLoading }) {
  const { t } = useTranslations();

  const [formData, setFormData] = useState({
    concept: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: '',
    description: '',
    provider: '',
    dueDate: '',
    status: 'pending',
    paidAmount: ''
  });

  const [errors, setErrors] = useState({});
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [newAttachments, setNewAttachments] = useState([]);
  const fileInputRef = useRef(null);


  // Categorias predefinidas (valores internos no traducidos para coherencia)
  const categories = {
    expense: [
      'Catering',
      'Musica',
      'Flores',
      'Fotografia',
      'Vestimenta',
      'Decoracion',
      'Transporte',
      'Alojamiento',
      'Invitaciones',
      'Luna de miel',
      'Otros'
    ],
    income: [
      'Aportacion inicial',
      'Aportacion mensual',
      'Regalo de boda',
      'Aportacion familiar',
      'Otros ingresos'
    ]
  };

  // Inicializar formulario con datos de transaccin existente
  useEffect(() => {
    if (transaction) {
      const defaultStatus = transaction.type === 'income' ? 'expected' : 'pending';
      setFormData({
        concept: transaction.concept || transaction.description || '',
        amount: transaction.amount?.toString() || '',
        date: transaction.date || new Date().toISOString().split('T')[0],
        type: transaction.type || 'expense',
        category: transaction.category || '',
        description: transaction.description || '',
        provider: transaction.provider || '',
        dueDate: transaction.dueDate ? transaction.dueDate.slice(0, 10) : '',
        status: transaction.status || defaultStatus,
        paidAmount: transaction.paidAmount != null ? String(transaction.paidAmount) : '',
      });
      setExistingAttachments(Array.isArray(transaction.attachments) ? transaction.attachments : []);
      setNewAttachments([]);
    } else {
      setExistingAttachments([]);
      setNewAttachments([]);
    }
  }, [transaction]);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    const amountValue = Number(formData.amount);
    const paidValue = formData.paidAmount === '' ? 0 : Number(formData.paidAmount);

    if (!formData.concept.trim()) {
      newErrors.concept = t('finance.form.errors.conceptRequired', { defaultValue: 'El concepto es obligatorio' });
    }

    if (!formData.amount || Number.isNaN(amountValue) || amountValue <= 0) {
      newErrors.amount = t('finance.form.errors.amountPositive', { defaultValue: 'El monto debe ser un n?mero positivo' });
    }

    if (!formData.date) {
      newErrors.date = t('finance.form.errors.dateRequired', { defaultValue: 'La fecha es obligatoria' });
    }

    if (!formData.category) {
      newErrors.category = t('finance.form.errors.categoryRequired', { defaultValue: 'La categoria es obligatoria' });
    }

    if (formData.paidAmount !== '' && (Number.isNaN(paidValue) || paidValue < 0)) {
      newErrors.paidAmount = t('finance.form.errors.paidAmountPositive', { defaultValue: 'El monto pagado debe ser un n?mero positivo' });
    } else if (!Number.isNaN(amountValue) && paidValue > amountValue) {
      newErrors.paidAmount = t('finance.form.errors.paidAmountExceeds', { defaultValue: 'El monto pagado no puede superar el total' });
    } else if (formData.type === 'expense' && formData.status === 'partial' && paidValue <= 0) {
      newErrors.paidAmount = t('finance.form.errors.paidAmountRequired', { defaultValue: 'Registra cu?nto has pagado para marcar el estado como parcial' });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envo del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const amountValue = Number(formData.amount);
    const rawPaidValue = formData.paidAmount === '' ? null : Number(formData.paidAmount);
    const sanitizedPaidValue = rawPaidValue == null || Number.isNaN(rawPaidValue) ? null : Math.max(0, rawPaidValue);

    const transactionData = {
      ...formData,
      concept: formData.concept.trim(),
      provider: formData.provider.trim(),
      amount: amountValue,
      paidAmount: sanitizedPaidValue,
      dueDate: formData.dueDate || null,
    };

    if (transactionData.type === 'expense') {
      if (transactionData.status === 'paid') {
        transactionData.paidAmount = Number.isNaN(amountValue) ? null : amountValue;
      } else if (transactionData.paidAmount != null && !Number.isNaN(amountValue) && amountValue > 0) {
        transactionData.paidAmount = Math.min(transactionData.paidAmount, amountValue);
      }
    } else if (transactionData.type === 'income' && transactionData.status === 'received' && transactionData.paidAmount == null && !Number.isNaN(amountValue)) {
      transactionData.paidAmount = amountValue;
    }

    const attachmentsPayload = {
      keep: existingAttachments,
      newFiles: newAttachments,
    };

    await onSave({ ...transactionData, attachments: attachmentsPayload });
  };

  const handleAttachmentFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setNewAttachments((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingAttachment = (index) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewAttachment = (index) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Manejar cambios en los campos
  const handleChange = (field, value) => {
    setFormData(prev => {
      let next = { ...prev, [field]: value };

      if (field === 'type') {
        const defaultStatus = value === 'income' ? 'expected' : 'pending';
        const allowedCategories = categories[value] || [];
        next = {
          ...next,
          status: defaultStatus,
          category: allowedCategories.includes(prev.category) ? prev.category : '',
        };
        if (defaultStatus === 'expected' && !prev.paidAmount) {
          next.paidAmount = '';
        }
      }

      if (field === 'status' && value === 'paid') {
        const amountValue = Number(next.amount);
        if (!Number.isNaN(amountValue) && amountValue > 0) {
          next.paidAmount = String(amountValue);
        }
      }

      if (field === 'amount' && next.status === 'paid') {
        const amountValue = Number(value);
        if (!Number.isNaN(amountValue) && amountValue > 0) {
          next.paidAmount = String(amountValue);
        }
      }

      return next;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if ((field === 'amount' || field === 'paidAmount' || field === 'status') && errors.paidAmount) {
      setErrors(prev => ({ ...prev, paidAmount: '' }));
    }
  };

  // Obtener categorias segn el tipo
  const availableCategories = categories[formData.type] || [];
  const statusOptions = formData.type === "income"
    ? [
        { value: 'expected', label: t('finance.form.status.expected', { defaultValue: 'Esperado' }) },
        { value: 'received', label: t('finance.form.status.received', { defaultValue: 'Recibido' }) },
      ]
    : [
        { value: 'pending', label: t('finance.form.status.pending', { defaultValue: 'Pendiente' }) },
        { value: 'partial', label: t('finance.form.status.partial', { defaultValue: 'Pago parcial' }) },
        { value: 'paid', label: t('finance.form.status.paid', { defaultValue: 'Pagado' }) },
      ];

  const numericAmount = Number(formData.amount) || 0;
  const numericPaid = formData.paidAmount === '' ? 0 : Math.max(0, Number(formData.paidAmount) || 0);
  const effectivePaid = numericAmount > 0 ? Math.min(numericPaid, numericAmount) : numericPaid;
  const remainingAmount = Math.max(0, numericAmount - effectivePaid);
  const dueDateObject = formData.dueDate ? new Date(formData.dueDate) : null;
  const isOverdue = Boolean(dueDateObject && dueDateObject < new Date() && formData.status !== 'paid');


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo de transaccin */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-2">
          {t('finance.form.type', { defaultValue: 'Tipo de transaccin' })}
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="expense"
              checked={formData.type === 'expense'}
              onChange={(e) => handleChange('type', e.target.value)}
              className="mr-2"
            />
            <span className="text-sm text-[color:var(--color-text)]/80">{t('finance.transactions.expense', { defaultValue: 'Gasto' })}</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="income"
              checked={formData.type === 'income'}
              onChange={(e) => handleChange('type', e.target.value)}
              className="mr-2"
            />
            <span className="text-sm text-[color:var(--color-text)]/80">{t('finance.transactions.income', { defaultValue: 'Ingreso' })}</span>
          </label>
        </div>
      </div>

      {/* Concepto */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
          {t('finance.form.concept', { defaultValue: 'Concepto' })} *
        </label>
        <input
          type="text"
          value={formData.concept}
          onChange={(e) => handleChange('concept', e.target.value)}
          placeholder={t('finance.form.conceptPlaceholder', { defaultValue: 'Ej: Pago de catering, Regalo de boda...' })}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)] ${
            errors.concept ? 'border-[color:var(--color-danger)]' : 'border-[color:var(--color-text)]/20'
          }`}
        />
        {errors.concept && (
          <p className="mt-1 text-sm text-[color:var(--color-danger)]">{errors.concept}</p>
        )}
      </div>

      {/* Proveedor / Fuente */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
          {t('finance.form.provider', { defaultValue: 'Proveedor / Fuente' })}
        </label>
        <input
          type="text"
          value={formData.provider}
          onChange={(e) => handleChange('provider', e.target.value)}
          placeholder={t('finance.form.providerPlaceholder', { defaultValue: 'Ej: Catering Gourmet, Banco BBVA...' })}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent border-[color:var(--color-text)]/20 bg-[var(--color-surface)] text-[color:var(--color-text)]"
        />
        <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
          {t('finance.form.providerHint', { defaultValue: 'Identifica con quin se contrata o de dnde proviene el dinero.' })}
        </p>
      </div>

      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
          {t('finance.form.amount', { defaultValue: 'Monto ()' })} *
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          placeholder="0.00"
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)] ${
            errors.amount ? 'border-[color:var(--color-danger)]' : 'border-[color:var(--color-text)]/20'
          }`}
        />
        {errors.amount && (
          <p className="mt-1 text-sm text-[color:var(--color-danger)]">{errors.amount}</p>
        )}
        {formData.amount && !isNaN(formData.amount) && (
          <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
            {t('finance.form.amountLabel', { defaultValue: 'Monto:' })} {formatCurrency(Number(formData.amount))}
          </p>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
          {t('finance.form.date', { defaultValue: 'Fecha' })} *
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)] ${
            errors.date ? 'border-[color:var(--color-danger)]' : 'border-[color:var(--color-text)]/20'
          }`}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-[color:var(--color-danger)]">{errors.date}</p>
        )}
      </div>

      {/* Categoria */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
          {t('finance.form.category', { defaultValue: 'Categoria' })} *
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)] ${
            errors.category ? 'border-[color:var(--color-danger)]' : 'border-[color:var(--color-text)]/20'
          }`}
        >
          <option value="">{t('finance.form.selectCategory', { defaultValue: 'Selecciona una categoria' })}</option>
          {availableCategories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-[color:var(--color-danger)]">{errors.category}</p>
        )}
      </div>

      {/* Seguimiento de pago */}
      <div>
        <h3 className="text-sm font-medium text-[color:var(--color-text)]/80 mb-2">{t('finance.form.paymentTracking', { defaultValue: 'Seguimiento de pago' })}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">{t('finance.form.dueDate', { defaultValue: 'Fecha limite' })}</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent border-[color:var(--color-text)]/20 bg-[var(--color-surface)] text-[color:var(--color-text)]"
            />
            {isOverdue && (
              <p className="mt-1 text-sm text-[color:var(--color-danger)]">{t('finance.form.dueDateOverdue', { defaultValue: 'Atencion: este pago est vencido.' })}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">{t('finance.form.status', { defaultValue: 'Estado' })}</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent border-[color:var(--color-text)]/20 bg-[var(--color-surface)] text-[color:var(--color-text)]"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">{t('finance.form.paidAmount', { defaultValue: 'Monto abonado' })}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.paidAmount}
              onChange={(e) => handleChange('paidAmount', e.target.value)}
              placeholder="0.00"
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)] ${errors.paidAmount ? 'border-[color:var(--color-danger)]' : 'border-[color:var(--color-text)]/20'}`}
            />
            {errors.paidAmount && (
              <p className="mt-1 text-sm text-[color:var(--color-danger)]">{errors.paidAmount}</p>
            )}
            {numericAmount > 0 && (
              <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
                {t(formData.type === 'expense' ? 'finance.form.remainingToPay' : 'finance.form.remainingToReceive', { defaultValue: formData.type === 'expense' ? 'Pendiente por pagar:' : 'Pendiente por recibir:' })} {formatCurrency(remainingAmount)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Comprobantes */}
      <div>
        <h3 className="text-sm font-medium text-[color:var(--color-text)]/80 mb-2">{t('finance.form.attachments.title', { defaultValue: 'Comprobantes' })}</h3>
        <p className="text-xs text-[color:var(--color-text)]/60 mb-3">{t('finance.form.attachments.help', { defaultValue: 'Adjunta facturas, contratos o recibos para tenerlos a mano.' })}</p>
        <div className="space-y-2">
          {existingAttachments.length > 0 && existingAttachments.map((attachment, index) => (
            <div key={attachment.url || attachment.filename || index} className="flex items-center justify-between rounded border border-[color:var(--color-text)]/15 px-3 py-2">
              <div className="flex flex-col">
                {attachment.url ? (
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[color:var(--color-primary)] hover:underline">
                    {attachment.filename || `${t('finance.transactions.attachment', { defaultValue: 'Adjunto' })} ${index + 1}`}
                  </a>
                ) : (
                  <span className="text-sm text-[color:var(--color-text)]">
                    {attachment.filename || `${t('finance.transactions.attachment', { defaultValue: 'Adjunto' })} ${index + 1}`}
                  </span>
                )}
                {typeof attachment.size === 'number' && attachment.size > 0 && (
                  <span className="text-xs text-[color:var(--color-text)]/60">{(attachment.size / 1024).toFixed(1)} KB</span>
                )}
              </div>
              <button
                type="button"
                className="text-sm text-[color:var(--color-danger)] hover:underline"
                onClick={() => handleRemoveExistingAttachment(index)}
                disabled={isLoading}
              >
                {t('finance.form.attachments.remove', { defaultValue: 'Quitar' })}
              </button>
            </div>
          ))}
          {newAttachments.length > 0 && newAttachments.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded border border-dashed border-[color:var(--color-text)]/15 px-3 py-2 bg-[var(--color-surface)]/60">
              <div className="flex flex-col text-sm text-[color:var(--color-text)]/80">
                <span>{file.name}</span>
                <span className="text-xs text-[color:var(--color-text)]/60">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
              <button
                type="button"
                className="text-sm text-[color:var(--color-danger)] hover:underline"
                onClick={() => handleRemoveNewAttachment(index)}
                disabled={isLoading}
              >
                {t('finance.form.attachments.remove', { defaultValue: 'Quitar' })}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleAttachmentFiles}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            {t('finance.form.attachments.add', { defaultValue: 'Adjuntar comprobante' })}
          </Button>
          {(existingAttachments.length + newAttachments.length) > 0 && (
            <span className="text-xs text-[color:var(--color-text)]/60 self-center">
              {t('finance.form.attachments.count', { defaultValue: 'Total adjuntos:' })} {existingAttachments.length + newAttachments.length}
            </span>
          )}
        </div>
      </div>



      {/* Descripcion adicional (opcional) */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
          {t('finance.form.description', { defaultValue: 'Descripcion adicional' })}
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={t('finance.form.descriptionPlaceholder', { defaultValue: 'Detalles adicionales sobre la transaccin...' })}
          rows={3}
          className="w-full px-3 py-2 border border-[color:var(--color-text)]/20 rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
        />
      </div>

      {/* Botones de accin */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t('app.cancel', { defaultValue: 'Cancelar' })}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? t('app.saving', { defaultValue: 'Guardando...' }) : (transaction ? t('app.update', { defaultValue: 'Actualizar' }) : t('app.create', { defaultValue: 'Crear' }))} {t('finance.form.transaction', { defaultValue: 'Transaccin' })}
        </Button>
      </div>
    </form>
  );
}
