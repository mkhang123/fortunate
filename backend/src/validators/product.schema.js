import { z } from "zod";

// Schema cho hình ảnh sản phẩm
const productImagesSchema = z.object({
  url: z.string().url("Đường dẫn ảnh không hợp lệ"),
  isMain: z.boolean().default(false),
});

// Schema cho biến thể sản phẩm (Size, màu, giá...)
const productVariantSchema = z.object({
  sku: z.string().min(1, "SKU không được để trống"),
  color: z.string().min(1, "Màu sắc không được để trống"),
  size: z.string().min(1, "Kích thước không được để trống"),
  // Sử dụng coerce để ép kiểu từ chuỗi sang số (cho giá và kho)
  price: z.coerce.number().positive("Giá phải lớn hơn 0"),
  stock: z.coerce.number().int().nonnegative("Số lượng kho không được âm"),
});

// Schema chính để tạo sản phẩm
export const createProductSchema = z.object({
  name: z.string().min(3, "Tên sản phẩm phải có ít nhất 3 ký tự"),
  slug: z.string().min(3, "Slug phải có ít nhất 3 ký tự"),
  description: z.string().optional().nullable(),
  
  // SỬA TẠI ĐÂY: Dùng z.coerce.number() để tránh lỗi 400 khi nhận String từ Frontend
  categoryId: z.coerce.number({
    required_error: "Danh mục là bắt buộc",
    invalid_type_error: "ID danh mục phải là một con số",
  }).int().positive(),

  brandId: z.coerce.number()
    .int()
    .positive()
    .optional()
    .nullable(),

  status: z.enum(["DRAFT", "PUBLISHED", "OUT_OF_STOCK", "ARCHIVED"]).default("DRAFT"),

  // Mảng các hình ảnh
  images: z.array(productImagesSchema).min(1, "Phải có ít nhất một hình ảnh"),

  // Mảng các biến thể
  variants: z.array(productVariantSchema).min(1, "Phải có ít nhất một biến thể sản phẩm"),
});

// Schema cho việc cập nhật
export const updateProductSchema = createProductSchema.partial();