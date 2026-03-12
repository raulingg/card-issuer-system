import { z } from 'zod';

export const IssueCardSchema = z.object({
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

export type IssueCardDto = z.infer<typeof IssueCardSchema>;
