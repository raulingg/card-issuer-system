import { z } from 'zod';

export const CardIssuedSchema = z.object({
  card: z.object({
    id: z.string().nonempty(),
    maskedNumber: z.string().length(19),
    expirationDate: z.string().regex(/^\d{2}\/\d{2}$/),
  }),
  requestId: z.string().nonempty(),
});

export type CardIssuedDto = z.infer<typeof CardIssuedSchema>;
