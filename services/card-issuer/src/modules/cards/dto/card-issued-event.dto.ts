import { z } from 'zod';
import { CardIssuedEventDataSchema } from '@libs/common';
import { KafkaTopic } from '@libs/kafka';

export const CardIssuedEventSchema = z.object({
  id: z.number().int(),
  source: z.string().nonempty(),
  type: z.literal(KafkaTopic.CARD_ISSUED),
  data: CardIssuedEventDataSchema,
});

export type CardIssuedEventDto = z.infer<typeof CardIssuedEventSchema>;
