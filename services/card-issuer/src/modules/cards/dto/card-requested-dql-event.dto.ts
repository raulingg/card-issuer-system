import { z } from 'zod';
import { CardRequestedDlqEventDataSchema } from '@libs/common';
import { KafkaTopic } from '@libs/kafka';

export const CardRequestedDlqEventSchema = z.object({
  id: z.number().int(),
  source: z.string().nonempty(),
  type: z.literal(KafkaTopic.CARD_REQUESTED_DLQ),
  data: CardRequestedDlqEventDataSchema,
});

export type CardRequestedDlqEventDto = z.infer<typeof CardRequestedDlqEventSchema>;
