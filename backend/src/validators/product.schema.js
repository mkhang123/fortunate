// fortunate/backend/src/validators/product.schema.js
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm không được rỗng"),
  slug: z.string().min(1, "Slug không được rỗng"),
  description: z.string().optional(),
  categoryId: z.string().uuid("ID danh mục phải là định dạng UUID hợp lệ"),
  brandId: z.string().uuid("ID thương hiệu phải là định dạng UUID hợp lệ").optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "OUT_OF_STOCK", "ARCHIVED"]).optional(),

  images: z.array(
    z.object({
      url: z.string().url("Đường dẫn ảnh không hợp lệ"),
      isMain: z.boolean().optional().default(false),
    })
  ).optional(),

  // CẬP NHẬT: Bắt buộc có ít nhất 1 biến thể (.min(1))
  variants: z.array(
    z.object({
      sku: z.string().min(1, "Mã SKU không được rỗng"),
      color: z.string().min(1, "Màu sắc không được rỗng"),
      size: z.string().min(1, "Kích thước không được rỗng"),
      price: z.number().positive("Giá phải là số dương"),
      stock: z.number().int().nonnegative("Số lượng kho không được âm"),
    })
  ).min(1, "Sản phẩm phải có ít nhất một biến thể (Size/Màu)"),
});