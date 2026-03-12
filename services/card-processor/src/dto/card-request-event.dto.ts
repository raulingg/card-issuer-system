import { z } from 'zod';
import { CardRequestedEventDataSchema } from '@libs/common';
import { KafkaTopic } from '@libs/kafka';

export const CardRequestedEventSchema = z.object({
  id: z.number().int(),
  source: z.string().nonempty(),
  type: z.literal(KafkaTopic.CARD_REQUESTED),
  data: CardRequestedEventDataSchema,
});

export type CardRequestedEventDto = z.infer<typeof CardRequestedEventSchema>;
