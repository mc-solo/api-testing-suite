import { z } from 'zod';

export const postSchema = z.object({
  userId: z.number().int().positive(),
  id: z.number().int().positive(),
  title: z.string().min(1),
  body: z.string().min(1),
});

export const userSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  username: z.string().min(1),
  email: z.string().email(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    zipcode: z.string(),
  }),
  phone: z.string(),
  website: z.string(),
  company: z.object({ name: z.string() }),
});

export const commentSchema = z.object({
  postId: z.number().int().positive(),
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email(),
  body: z.string().min(1),
});

export const todoSchema = z.object({
  userId: z.number().int().positive(),
  id: z.number().int().positive(),
  title: z.string().min(1),
  completed: z.boolean(),
});

export const albumSchema = z.object({
  userId: z.number().int().positive(),
  id: z.number().int().positive(),
  title: z.string().min(1),
});
