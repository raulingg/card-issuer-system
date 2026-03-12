import { z } from "zod";
import { CardRequestedEventDataSchema, CardIssuedEventDataSchema, CardRequestedDlqEventDataSchema } from "@libs/common";

export type CardRequestedEventDataDto = z.infer<typeof CardRequestedEventDataSchema>;
export type CardIssuedEventDataDto = z.infer<typeof CardIssuedEventDataSchema>;
export type CardRequestedDlqEventDataDto = z.infer<typeof CardRequestedDlqEventDataSchema>;
