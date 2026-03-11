import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

export const UserIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
});
export type UserIdParam = z.infer<typeof UserIdParamSchema>;
