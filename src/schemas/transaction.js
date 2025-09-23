import { z } from 'zod';

const statusEnum = z.enum(['pending', 'paid', 'expected', 'received', 'overdue', 'canceled']);

// Base object schema used to derive strict and partial variants
const transactionBaseSchema = z.object({
  type: z.enum(['expense', 'income']).default('expense'),
  amount: z.coerce.number().finite().nonnegative(),
  status: statusEnum.optional(),
  concept: z.string().max(300).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().max(120).optional(),
  provider: z.string().trim().max(120).optional().nullable(),
  date: z.string().optional(),
  dueDate: z.union([z.string(), z.date()]).optional().nullable(),
  paidAmount: z.coerce.number().nonnegative().nullable().optional(),
  source: z.string().optional(),
  createdAt: z.string().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        size: z.coerce.number().nonnegative().optional(),
        url: z.string().url().optional(),
        uploadedAt: z.string().optional(),
      })
    )
    .optional(),
});

const withBusinessRules = (schema) =>
  schema.superRefine((obj, ctx) => {
    // Validar estado según tipo
    if (obj.status) {
      const s = obj.status;
      if (obj.type === 'expense' && !['pending', 'paid', 'overdue', 'canceled'].includes(s)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Estado inválido para gasto', path: ['status'] });
      }
      if (obj.type === 'income' && !['expected', 'received'].includes(s)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Estado inválido para ingreso', path: ['status'] });
      }
    }
    // paidAmount no puede exceder amount
    if (obj.paidAmount != null && obj.amount > 0 && obj.paidAmount > obj.amount) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'paidAmount no puede exceder amount', path: ['paidAmount'] });
    }
  });

export const transactionSchema = withBusinessRules(transactionBaseSchema);
export const transactionUpdateSchema = withBusinessRules(transactionBaseSchema.partial());

