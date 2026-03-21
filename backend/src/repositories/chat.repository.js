import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MIN_SCORE = 0.05;

/**
 * Normalizes the raw SQL results into a structured format.
 */
function normalize(rows = []) {
  return rows
    .filter((r) => Number(r.score) >= MIN_SCORE)
    .map((r) => ({
      source: "product",
      productId: r.id,
      name: r.name,
      slug: r.slug,
      price: r.price,
      brandName: r.brand_name || "",
      categoryName: r.category_name || "",
      // `ProductVariant.color` được dùng để lưu "phong cách" (theo UI quản lý sản phẩm)
      styles: Array.isArray(r.styles)
        ? r.styles.filter(Boolean)
        : (r.styles ? [r.styles] : []),
      images: Array.isArray(r.images) ? r.images : (r.images ? [r.images] : []),
      score: Number(r.score || 0),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * 1) Full-Text Search on Product Name, Category Name, and Brand Name
 */
export async function searchProductsFT(query, limit = 6) {
  // Using unaccent and simple dictionary for Vietnamese search
  const rows = await prisma.$queryRawUnsafe(
    `
    SELECT 
      p.id, p.name, p.slug, p.price, p.images,
      b.name AS brand_name,
      c.name AS category_name,
      (
        SELECT array_agg(DISTINCT pv2."color")
        FROM "ProductVariant" pv2
        WHERE pv2."productId" = p.id
      ) AS styles,
      (
        ts_rank(
          setweight(to_tsvector('simple', unaccent(p.name)), 'A') ||
          setweight(to_tsvector('simple', unaccent(COALESCE(b.name, ''))), 'B') ||
          setweight(to_tsvector('simple', unaccent(COALESCE(c.name, ''))), 'C'),
          websearch_to_tsquery('simple', unaccent($1))
        )
        + CASE WHEN unaccent(p.name) ILIKE '%'||unaccent($1)||'%' THEN 0.1 ELSE 0 END
        + CASE
            WHEN EXISTS (
              SELECT 1
              FROM "ProductVariant" pv2
              WHERE pv2."productId" = p.id
                AND to_tsvector('simple', unaccent(pv2."color"))
                    @@ websearch_to_tsquery('simple', unaccent($1))
            )
            THEN 0.3
            ELSE 0
          END
      ) AS score
    FROM "Product" p
    LEFT JOIN "Brand" b ON p."brandId" = b.id
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    WHERE 
      p.status = 'PUBLISHED' AND
      (
        (
          setweight(to_tsvector('simple', unaccent(p.name)), 'A') ||
          setweight(to_tsvector('simple', unaccent(COALESCE(b.name, ''))), 'B') ||
          setweight(to_tsvector('simple', unaccent(COALESCE(c.name, ''))), 'C')
        ) @@ websearch_to_tsquery('simple', unaccent($1))
        OR EXISTS (
          SELECT 1
          FROM "ProductVariant" pv2
          WHERE pv2."productId" = p.id
            AND to_tsvector('simple', unaccent(pv2."color"))
                @@ websearch_to_tsquery('simple', unaccent($1))
        )
      )
    ORDER BY score DESC, p.id DESC
    LIMIT $2;
    `,
    query,
    limit
  );
  return normalize(rows);
}

/**
 * 2) Fallback ILIKE search using multiple tokens
 */
export async function searchProductsILIKE(patterns = [], limit = 6) {
  if (!patterns.length) return [];
  
  const rows = await prisma.$queryRawUnsafe(
    `
    SELECT 
      p.id, p.name, p.slug, p.price, p.images,
      b.name AS brand_name,
      c.name AS category_name,
      (
        SELECT array_agg(DISTINCT pv2."color")
        FROM "ProductVariant" pv2
        WHERE pv2."productId" = p.id
      ) AS styles,
      (
        (SELECT COUNT(*) FROM unnest($1::text[]) tok WHERE unaccent(p.name) ILIKE tok) * 0.05
        +
        (SELECT COUNT(*)
          FROM unnest($1::text[]) tok
          WHERE EXISTS (
            SELECT 1
            FROM "ProductVariant" pv2
            WHERE pv2."productId" = p.id
              AND unaccent(pv2."color") ILIKE tok
          )
        ) * 0.1
      ) AS score
    FROM "Product" p
    LEFT JOIN "Brand" b ON p."brandId" = b.id
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    WHERE 
      p.status = 'PUBLISHED' AND
      (
        EXISTS (SELECT 1 FROM unnest($1::text[]) tok WHERE unaccent(p.name) ILIKE tok) OR
        EXISTS (SELECT 1 FROM unnest($1::text[]) tok WHERE unaccent(c.name) ILIKE tok) OR
        EXISTS (
          SELECT 1
          FROM unnest($1::text[]) tok
          WHERE EXISTS (
            SELECT 1
            FROM "ProductVariant" pv2
            WHERE pv2."productId" = p.id
              AND unaccent(pv2."color") ILIKE tok
          )
        )
      )
    ORDER BY score DESC, p.id DESC
    LIMIT $2;
    `,
    patterns, // Array of '%token%'
    limit
  );
  return normalize(rows);
}
