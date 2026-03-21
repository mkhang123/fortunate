const VN_STOP = new Set([
  "là",
  "gồm",
  "mấy",
  "một",
  "những",
  "các",
  "cái",
  "gì",
  "bao",
  "bao nhiêu",
  "nào",
  "như",
  "trong",
  "về",
  "của",
  "đến",
  "để",
  "và",
  "hoặc",
  "hay",
  "theo",
  "phần",
  "không",
  "có",
  "được",
  "làm",
  "tóm",
  "tắt",
  "xin",
  "hỏi",
  "cho",
  "giúp",
  "tôi",
  "muốn",
  "mua",
  "tìm",
  "xem",
  "ơi",
  "ạ",
  "nhỉ",
  // Note: "quần", "áo", "váy", "đầm" được giữ lại vì là từ khóa sản phẩm quan trọng của fashion shop
]);

export const noAccent = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const toLC = (s = "") => noAccent(String(s)).toLowerCase();

export function tokenize(q) {
  return Array.from(
    new Set(
      toLC(q)
        .split(/[^a-z0-9]+/i)
        .filter((t) => t && t.length >= 2 && !VN_STOP.has(t)),
    ),
  ).slice(0, 8);
}
