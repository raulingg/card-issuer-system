import { z } from 'zod';
import { IssueCardSchema } from '@libs/common';
import { KafkaTopic } from '@libs/kafka';

export const CardRequestedSchema = z.object({
  id: z.number().int(),
  source: z.string().nonempty(),
  type: z.literal(KafkaTopic.CARD_REQUESTED),
  data: z.object({
    requestId: z.string().nonempty(),
    ...IssueCardSchema.shape,
  }),
});

export type CardRequestedDto = z.infer<typeof CardRequestedSchema>;
