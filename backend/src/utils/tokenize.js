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

  "toi",    // tôi
  "muon",   // muốn
  "tim",    // tìm
  "oi",     // ơi
  "tu",     // tư (as in "tư vấn" - to advise; NOT a product keyword)
  "van",    // vấn (as in "tư vấn"; prevents matching brand names like Stussy via "stu")
  "goi",    // gợi (as in "gợi ý" - to suggest)
  "y",      // ý  (as in "gợi ý"; also filtered by length>=2 but keep here for clarity)
  "hay",    // hãy (imperative particle)
  "gi",     // gì
  "la",     // là
  "khong",  // không
  "co",     // có
  "duoc",   // được
  "lam",    // làm
  "nao",    // nào
  "nhu",    // như
  "cua",    // của
  "den",    // đến
  "de",     // để
  "nhung",  // những
  "cac",    // các
  "mot",    // một
  "trong",
  "ve",     // về
  "va",     // và
  "hoac",   // hoặc
  "theo",
  "phan",   // phần
  "tom",    // tóm
  "tat",    // tắt
  "xin",
  "hoi",    // hỏi
  "giup",   // giúp
  "nhung",  // những
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
