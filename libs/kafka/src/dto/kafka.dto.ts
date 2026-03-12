import { z } from "zod";
import { CardRequestedEventDataSchema, CardIssuedEventDataSchema } from "@libs/common";

export type CardRequestedEventDataDto = z.infer<typeof CardRequestedEventDataSchema>;
export type CardIssuedEventDataDto = z.infer<typeof CardIssuedEventDataSchema>;
