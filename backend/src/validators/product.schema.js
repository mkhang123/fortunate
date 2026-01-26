import { z } from "zod";

const productVariantSchema = z.object({
  color: z.string().min(1, "Màu sắc là bắt buộc"),
  size: z.string().min(1, "Kích thước là bắt buộc"),
  price: z.coerce.number().positive("Giá phải lớn hơn 0"),
  stock: z.coerce.number().int().nonnegative("Kho không được âm"),
});

export const createProductSchema = z.object({
  name: z.string().min(3, "Tên quá ngắn"),
  slug: z.string().min(3),
  // Bỏ description vì không có trong Prisma Product schema
  categoryId: z.coerce.number().int().positive(),
  brandId: z.coerce.number().int().positive().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "OUT_OF_STOCK", "ARCHIVED"]).default("DRAFT"),
  // QUAN TRỌNG: Chỉ chấp nhận mảng các String (URL)
  images: z.array(z.string().url("Link ảnh không hợp lệ")).min(1, "Phải có ít nhất 1 ảnh"),
  variants: z.array(productVariantSchema).min(1, "Phải có ít nhất 1 biến thể"),
});

export const updateProductSchema = createProductSchema.partial();