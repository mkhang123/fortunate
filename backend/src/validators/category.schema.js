import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Tên danh mục quá ngắn"),
  image: z.string().trim().url("Link ảnh không hợp lệ").optional(),
  displayOrder: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

