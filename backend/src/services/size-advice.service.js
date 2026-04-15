/**
 * Một nguồn quy tắc size cho chatbot (controller + Gemini).
 * Khớp bảng NAM/NỮ trong prompt AI; logic: lấy size có chỉ số (index) lớn nhất
 * trong các chiều có dữ liệu (ưu tiên số đo vòng khi có).
 */

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

function noAccent(s = "") {
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function isFemaleBodyProfile(bodyProfile = {}) {
  const g = noAccent(String(bodyProfile.gender ?? "").trim());
  return ["female", "f", "nu", "woman", "women"].includes(g);
}

function indexToSize(i) {
  const clamped = Math.min(Math.max(i, 0), SIZE_ORDER.length - 1);
  return SIZE_ORDER[clamped];
}

function upOneSize(size) {
  const idx = SIZE_ORDER.indexOf(size);
  if (idx < 0) return size;
  return SIZE_ORDER[Math.min(idx + 1, SIZE_ORDER.length - 1)];
}

// ─── Nam ───────────────────────────────────────────────────────────────────

function maleIndexFromHeight(h) {
  if (h < 163) return 0;
  if (h <= 168) return 1;
  if (h <= 173) return 2;
  if (h <= 177) return 3;
  if (h <= 181) return 4;
  return 5;
}

function maleIndexFromWeight(w) {
  if (w < 53) return 0;
  if (w <= 62) return 1;
  if (w <= 70) return 2;
  if (w <= 78) return 3;
  if (w <= 87) return 4;
  return 5;
}

function maleIndexFromChest(c) {
  if (c < 84) return 0;
  if (c < 90) return 1;
  if (c < 96) return 2;
  if (c < 102) return 3;
  if (c < 108) return 4;
  return 5;
}

function maleIndexFromWaist(wa) {
  if (wa < 70) return 0;
  if (wa < 74) return 1;
  if (wa < 78) return 2;
  if (wa < 83) return 3;
  if (wa < 89) return 4;
  return 5;
}

function maleTopIndex(h, w, chest) {
  const parts = [maleIndexFromHeight(h), maleIndexFromWeight(w)];
  if (chest != null && Number(chest) > 0) parts.push(maleIndexFromChest(Number(chest)));
  return Math.max(...parts);
}

function maleBottomIndex(h, w, waist) {
  if (waist != null && Number(waist) > 0) return maleIndexFromWaist(Number(waist));
  return Math.max(maleIndexFromHeight(h), maleIndexFromWeight(w));
}

// ─── Nữ ───────────────────────────────────────────────────────────────────

function femaleIndexFromHeight(h) {
  if (h < 155) return 0;
  if (h <= 160) return 1;
  if (h <= 163) return 2;
  if (h <= 167) return 3;
  if (h <= 170) return 4;
  return 5;
}

function femaleIndexFromWeight(w) {
  if (w < 43) return 0;
  if (w <= 50) return 1;
  if (w <= 57) return 2;
  if (w <= 65) return 3;
  if (w <= 72) return 4;
  return 5;
}

function femaleIndexFromChest(c) {
  if (c < 78) return 0;
  if (c < 83) return 1;
  if (c < 88) return 2;
  if (c < 93) return 3;
  if (c < 98) return 4;
  return 5;
}

function femaleIndexFromWaist(wa) {
  if (wa < 60) return 0;
  if (wa < 65) return 1;
  if (wa < 70) return 2;
  if (wa < 76) return 3;
  if (wa < 82) return 4;
  return 5;
}

function femaleIndexFromHip(hi) {
  if (hi < 82) return 0;
  if (hi < 87) return 1;
  if (hi < 92) return 2;
  if (hi < 97) return 3;
  if (hi < 102) return 4;
  return 5;
}

function femaleTopIndex(h, w, chest) {
  const parts = [femaleIndexFromHeight(h), femaleIndexFromWeight(w)];
  if (chest != null && Number(chest) > 0) parts.push(femaleIndexFromChest(Number(chest)));
  return Math.max(...parts);
}

function femaleBottomIndex(h, w, waist, hip) {
  const parts = [];
  if (waist != null && Number(waist) > 0) parts.push(femaleIndexFromWaist(Number(waist)));
  if (hip != null && Number(hip) > 0) parts.push(femaleIndexFromHip(Number(hip)));
  if (parts.length === 0) {
    return Math.max(femaleIndexFromHeight(h), femaleIndexFromWeight(w));
  }
  return Math.max(...parts);
}

/**
 * @returns {null | { topBase: string, bottomBase: string, jacket: string, chartLabel: string }}
 */
export function getFortunateSizeSuggestions(bodyProfile) {
  if (!bodyProfile) return null;
  const h = Number(bodyProfile.height) || 0;
  const w = Number(bodyProfile.weight) || 0;
  if (!h || !w) return null;

  const chest = bodyProfile.chest != null ? Number(bodyProfile.chest) : null;
  const waist = bodyProfile.waist != null ? Number(bodyProfile.waist) : null;
  const hip = bodyProfile.hip != null ? Number(bodyProfile.hip) : null;

  const female = isFemaleBodyProfile(bodyProfile);
  let topIdx;
  let bottomIdx;

  if (female) {
    topIdx = femaleTopIndex(h, w, chest);
    bottomIdx = femaleBottomIndex(h, w, waist, hip);
  } else {
    topIdx = maleTopIndex(h, w, chest);
    bottomIdx = maleBottomIndex(h, w, waist);
  }

  const topBase = indexToSize(topIdx);
  const bottomBase = indexToSize(bottomIdx);
  const jacket = upOneSize(topBase);
  const chartLabel = female ? "Nữ" : "Nam";

  return { topBase, bottomBase, jacket, chartLabel };
}

/** Bảng size — dùng trong system prompt Gemini (đồng bộ với logic trên). */
export const FORTUNATE_SIZE_GUIDE_MARKDOWN = `
BẢNG SIZE FORTUNATE (dùng để tư vấn; ưu tiên số đo vòng ngực/eo/mông nếu có):

NỮ:
| Size | Chiều cao | Cân nặng | Ngực    | Eo      | Mông    |
|------|-----------|----------|---------|---------|---------|
| XS   | <155cm    | <43kg    | <78cm   | <60cm   | <82cm   |
| S    | 155-160cm | 43-50kg  | 78-83cm | 60-65cm | 82-87cm |
| M    | 158-163cm | 50-57kg  | 83-88cm | 65-70cm | 87-92cm |
| L    | 162-167cm | 57-65kg  | 88-93cm | 70-76cm | 92-97cm |
| XL   | 165-170cm | 65-72kg  | 93-98cm | 76-82cm | 97-102cm|
| XXL  | >168cm    | >72kg    | >98cm   | >82cm   | >102cm  |

NAM:
| Size | Chiều cao | Cân nặng | Ngực     | Eo      |
|------|-----------|----------|----------|---------|
| XS   | <163cm    | <53kg    | <84cm    | <70cm   |
| S    | 163-168cm | 53-62kg  | 84-90cm  | 70-74cm |
| M    | 168-173cm | 62-70kg  | 90-96cm  | 74-78cm |
| L    | 172-177cm | 70-78kg  | 96-102cm | 78-83cm |
| XL   | 176-181cm | 78-87kg  | 102-108cm| 83-89cm |
| XXL  | >179cm    | >87kg    | >108cm   | >89cm   |

QUY TẮC TƯ VẤN SIZE THEO LOẠI SẢN PHẨM:
• Áo thun (T-shirt, Polo, Tee): Fit ôm vừa người → chọn ĐÚNG size chuẩn (topBase).
• Áo khoác ngoài (Jacket, Coat, Blazer, Windbreaker, Bomber, Parka): Layering → lên 1 size so với chuẩn (jacket).
• Áo hoodie / Sweatshirt: Form thường rộng → hỏi khách thích vừa hay oversized, rồi dùng topBase hoặc jacket.
• Áo sơ mi: Fit regular → topBase.
• Quần: Ưu tiên eo (nam) hoặc eo + hông (nữ); nếu thiếu số đo vòng thì dùng bottomBase đã tính.
• Váy / Đầm: Ưu tiên eo và mông; nếu thiếu thì bottomBase.
`.trim();
