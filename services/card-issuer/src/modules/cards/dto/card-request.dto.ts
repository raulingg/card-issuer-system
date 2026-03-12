import type { z } from 'zod';
import type { CardRequestSchema } from '@libs/common';

export type CardRequestDto = z.infer<typeof CardRequestSchema>;
