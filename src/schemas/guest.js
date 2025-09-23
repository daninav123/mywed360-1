import { z } from 'zod';

const statusEnum = z.enum(['pending', 'confirmed', 'declined', 'accepted', 'rejected']).optional();

// Base object schema to derive create/update variants
const guestBaseSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1, 'Nombre requerido').max(200),
  email: z.string().email().optional().or(z.literal('')).optional(),
  phone: z.string().max(30).optional().or(z.literal('')).optional(),
  address: z.string().max(300).optional().or(z.literal('')).optional(),
  table: z.string().max(50).optional().or(z.literal('')).optional(),
  companion: z.coerce.number().int().min(0).max(20).optional(),
  companionGroupId: z.string().max(80).optional().or(z.literal('')).optional(),
  response: z.string().max(50).optional(),
  status: statusEnum,
  dietaryRestrictions: z.string().max(300).optional().or(z.literal('')).optional(),
  notes: z.string().max(1000).optional().or(z.literal('')).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const withNormalization = (schema, { fillDefaults }) =>
  schema.transform((obj) => {
    const out = { ...obj };
    if (typeof out.name === 'string') out.name = out.name.trim();
    if (fillDefaults) {
      // Normalizar campos vacíos solo en creación
      if (out.email === undefined) out.email = '';
      if (out.phone === undefined) out.phone = '';
      if (out.table === undefined) out.table = '';
      if (out.address === undefined) out.address = '';
      if (out.dietaryRestrictions === undefined) out.dietaryRestrictions = '';
      if (out.notes === undefined) out.notes = '';
      if (out.response === undefined) out.response = '';
      if (out.status === undefined) out.status = 'pending';
    }
    return out;
  });

export const guestSchema = withNormalization(guestBaseSchema, { fillDefaults: true });
export const guestUpdateSchema = withNormalization(guestBaseSchema.partial(), { fillDefaults: false });

