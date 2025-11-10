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
  group: z.string().max(80).optional().or(z.literal('')).optional(),
  companion: z.coerce.number().int().min(0).max(20).optional(),
  companionGroupId: z.string().max(80).optional().or(z.literal('')).optional(),
  companionType: z
    .string()
    .max(40)
    .optional()
    .or(z.literal(''))
    .optional(),
  response: z.string().max(50).optional(),
  status: statusEnum,
  dietaryRestrictions: z.string().max(300).optional().or(z.literal('')).optional(),
  notes: z.string().max(1000).optional().or(z.literal('')).optional(),
  whatsappAssetUrl: z.string().max(500).optional().or(z.literal('')).optional(),
  deliveryChannel: z.string().max(40).optional().or(z.literal('')).optional(),
  deliveryStatus: z.string().max(40).optional().or(z.literal('')).optional(),
  printBatchId: z.string().max(120).optional().or(z.literal('')).optional(),
  instagramPollId: z.string().max(120).optional().or(z.literal('')).optional(),
  instagramPollResponse: z.string().max(500).optional().or(z.literal('')).optional(),
  checkInCode: z.string().max(160).optional().or(z.literal('')).optional(),
  checkedIn: z.boolean().optional(),
  checkedInAt: z.string().optional(),
  checkInBy: z.string().max(160).optional().or(z.literal('')).optional(),
  checkInMethod: z.string().max(80).optional().or(z.literal('')).optional(),
  checkInNotes: z.string().max(500).optional().or(z.literal('')).optional(),
  checkInHistory: z
    .array(
      z.object({
        at: z.string(),
        by: z.string().optional(),
        method: z.string().optional(),
        code: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  tags: z.array(z.string().max(60)).optional(),
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
      if (out.group === undefined) out.group = '';
      if (out.address === undefined) out.address = '';
      if (out.companionType === undefined) out.companionType = 'none';
      if (out.dietaryRestrictions === undefined) out.dietaryRestrictions = '';
      if (out.notes === undefined) out.notes = '';
      if (out.response === undefined) out.response = '';
      if (out.status === undefined) out.status = 'pending';
      if (out.whatsappAssetUrl === undefined) out.whatsappAssetUrl = '';
      if (out.deliveryChannel === undefined) out.deliveryChannel = '';
      if (out.deliveryStatus === undefined) out.deliveryStatus = '';
      if (out.printBatchId === undefined) out.printBatchId = '';
      if (out.instagramPollId === undefined) out.instagramPollId = '';
      if (out.instagramPollResponse === undefined) out.instagramPollResponse = '';
      if (out.checkInCode === undefined) out.checkInCode = '';
      if (out.checkedIn === undefined) out.checkedIn = false;
      if (out.checkInBy === undefined) out.checkInBy = '';
      if (out.checkInMethod === undefined) out.checkInMethod = '';
      if (out.checkInNotes === undefined) out.checkInNotes = '';
      if (out.checkInHistory === undefined) out.checkInHistory = [];
      if (out.tags === undefined) out.tags = [];
    }
    if (Object.prototype.hasOwnProperty.call(out, 'table')) {
      out.group = out.table || '';
    }
    return out;
  });

export const guestSchema = withNormalization(guestBaseSchema, { fillDefaults: true });
export const guestUpdateSchema = withNormalization(guestBaseSchema.partial(), { fillDefaults: false });

