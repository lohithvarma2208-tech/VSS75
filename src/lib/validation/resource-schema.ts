import { z } from 'zod';

export const resourceUploadSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must not exceed 120 characters'),
  description: z
    .string()
    .min(20, 'Description should provide at least 20 characters of academic context')
    .max(2000, 'Description must not exceed 2000 characters'),
  course_code: z
    .string()
    .min(3, 'Course code is required (e.g. 23CS2101)')
    .max(20),
  course_name: z
    .string()
    .min(3, 'Course title is required')
    .max(100),
  semester: z.string().min(1, 'Please select a semester'),
  academic_year: z.string().optional().default('2024-2025'),
  category: z.string().min(1, 'Please choose a category'),
  resource_type: z.string().min(1, 'Resource type is required'),
  tags: z.string().optional(),
  is_anonymous: z.boolean().default(false),
  confirmed_permission: z.literal(true, {
    error: 'You must confirm you have permission to share this resource.',
  }),
  confirmed_educational: z.literal(true, {
    error: 'You must acknowledge this is shared solely for peer study reference.',
  }),
});

export type ResourceUploadFormInput = z.infer<typeof resourceUploadSchema>;
