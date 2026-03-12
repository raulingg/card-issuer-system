import { z } from 'zod';

export const CardSchema = z.object({
  id: z.string().nonempty(),
  maskedNumber: z.string().length(19),
  expirationDate: z.string().regex(/^\d{2}\/\d{2}$/),
});

export const CardRequestSchema = z.object({
  customer: z.object({
    documentType: z.literal('DNI'),
    documentNumber: z.string().length(8),
    fullName: z.string().nonempty(),
    age: z.number().int().min(18),
    email: z.string().email(),
  }),
  product: z.object({
    type: z.literal('VISA'),
    currency: z.enum(['PEN', 'USD']),
  }),
  forceError: z.boolean().default(false),
});

const nonEmptyProp = z.string().nonempty();

export const CardRequestedEventDataSchema = z.object({
  requestId: nonEmptyProp,
  ...CardRequestSchema.shape,
});

export const CardIssuedEventDataSchema = z.object({
  requestId: nonEmptyProp,
  card: CardSchema,
});

export const CardRequestedDlqEventDataSchema = z.object({
  reason: nonEmptyProp,
  attempts: z.number().int(),
  originalPayload: CardRequestedEventDataSchema,
});
