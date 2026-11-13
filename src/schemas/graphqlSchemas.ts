import { z } from 'zod';

export const countrySchema = z.object({
  code: z.string().length(2),
  name: z.string().min(1),
  capital: z.string().nullable(),
  currency: z.string().nullable(),
  continent: z.object({ code: z.string(), name: z.string() }).nullable(),
  languages: z.array(z.object({ code: z.string(), name: z.string() })).optional(),
});

export const continentSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(1),
});
