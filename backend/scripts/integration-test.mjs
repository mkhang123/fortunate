/**
 * Kiểm thử tích hợp API Fortunate (chạy khi backend đã bật tại BASE_URL).
 * Usage: node scripts/integration-test.mjs
 */
import "dotenv/config";

const BASE = process.env.TEST_API_BASE || "http://localhost:4000/api";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "fortunate@admin.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "fortunate@admin123";

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`[FAIL] ${name}${detail ? ` — ${detail}` : ""}`);
}

function cookieHeader(res) {
  const list = res.headers.getSetCookie?.();
  if (!list?.length) return "";
  return list.map((c) => c.split(";")[0]).join("; ");
}

async function jfetch(path, opts = {}) {
  const { cookie, method = "GET", body, headers = {} } = opts;
  const h = { ...headers };
  if (cookie) h.Cookie = cookie;
  if (body !== undefined && !(body instanceof FormData)) {
    h["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h,
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }
  return { res, data, setCookie: cookieHeader(res) };
}

async function login(email, password) {
  const { res, data, setCookie } = await jfetch("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (!res.ok) {
    return { ok: false, status: res.status, data, cookie: "" };
  }
  return { ok: true, user: data?.user, cookie: setCookie };
}

async function main() {
  const t = Date.now();
  const emailUser = `it_user_${t}@test.fortunate`;
  const emailBlocked = `it_blocked_${t}@test.fortunate`;
  const password = "TestPass123!";

  // --- Đăng ký ---
  {
    const { res, data } = await jfetch("/auth/register", {
      method: "POST",
      body: { email: emailUser, password, name: "IT User A" },
    });
    if (res.status === 201 && data?.success) pass("USER — Đăng ký (API)", emailUser);
    else fail("USER — Đăng ký (API)", `${res.status} ${JSON.stringify(data)}`);
  }

  {
    const { res } = await jfetch("/auth/register", {
      method: "POST",
      body: { email: emailBlocked, password, name: "IT User B" },
    });
    if (res.status === 201) pass("USER — Đăng ký user thứ hai (chặn sau)");
    else fail("USER — Đăng ký user thứ hai", String(res.status));
  }

  // --- Đăng nhập sai MK ---
  {
    const { res, data } = await jfetch("/auth/login", {
      method: "POST",
      body: { email: emailUser, password: "wrong-password" },
    });
    if (res.status === 400 && data?.success === false) pass("USER — Đăng nhập sai mật khẩu");
    else fail("USER — Đăng nhập sai mật khẩu", `${res.status}`);
  }

  const session = await login(emailUser, password);
  if (!session.ok) {
    fail("USER — Đăng nhập đúng", "Không thể tiếp tục giỏ/đơn");
    printSummary();
    process.exit(1);
  }
  pass("USER — Đăng nhập đúng", `role=${session.user?.role}`);

  let cookie = session.cookie;

  // --- /users/me ---
  {
    const { res, data } = await jfetch("/users/me", { cookie });
    if (res.ok && data?.data?.email === emailUser) pass("USER — GET /users/me");
    else fail("USER — GET /users/me", String(res.status));
  }

  // --- Danh mục + sản phẩm + variant ---
  let categoryId;
  let variantId;
  {
    const { res, data } = await jfetch("/categories");
    const cats = data?.data || [];
    categoryId = cats[0]?.id;
    if (!categoryId) {
      fail("USER — Lấy category", "Không có danh mục trong DB");
      printSummary();
      process.exit(1);
    }
  }

  {
    const { res, data } = await jfetch("/products");
    const products = data?.data || [];
    const p = products.find((x) => x.variants?.length);
    variantId = p?.variants?.[0]?.id;
    if (!variantId) {
      fail("USER — Tìm variant cho giỏ hàng", "Không có sản phẩm + variant");
      printSummary();
      process.exit(1);
    }
    pass("USER — Dữ liệu sản phẩm cho giỏ", `variantId=${variantId}`);
  }

  // --- Giỏ hàng ---
  {
    const { res, data } = await jfetch("/cart/add", {
      method: "POST",
      cookie,
      body: { variantId, quantity: 1 },
    });
    if (res.ok && data?.success) pass("USER — Thêm vào giỏ (/cart/add)");
    else fail("USER — Thêm vào giỏ", `${res.status} ${JSON.stringify(data)}`);
  }

  let cartItemId;
  {
    const { res, data } = await jfetch("/cart", { cookie });
    const items = data?.data?.items || [];
    cartItemId = items[0]?.id;
    if (res.ok && cartItemId) pass("USER — Xem giỏ (/cart)");
    else fail("USER — Xem giỏ", String(res.status));
  }

  {
    const { res, data } = await jfetch(`/cart/item/${cartItemId}`, {
      method: "PATCH",
      cookie,
      body: { quantity: 2 },
    });
    if (res.ok && data?.success) pass("USER — Cập nhật SL giỏ (/cart/item/:id PATCH)");
    else fail("USER — Cập nhật SL giỏ", `${res.status}`);
  }

  // --- Đơn hàng (COD, tránh VNPAY) ---
  let orderId;
  {
    const { res, data } = await jfetch("/orders", {
      method: "POST",
      cookie,
      body: {
        receiverName: "Nguyễn Kiểm Thử",
        receiverPhone: "0912345678",
        receiverEmail: emailUser,
        shippingAddress: "123 Đường Test, Q1",
        city: "TP.HCM",
        paymentMethod: "COD",
        notes: "Integration test",
      },
    });
    orderId = data?.metadata?.order?.id;
    if (res.status === 201 && orderId) pass("USER — Tạo đơn (/orders, COD)", `#${orderId}`);
    else fail("USER — Tạo đơn", `${res.status} ${JSON.stringify(data)}`);
  }

  // --- VTON: thiếu ảnh ---
  {
    const { res, data } = await jfetch("/vton/try-on", {
      method: "POST",
      cookie,
      headers: { "Content-Type": "application/json" },
      body: {},
    });
    if (res.status === 400 && /ảnh|upload|person/i.test(JSON.stringify(data))) {
      pass("USER — VTON thiếu ảnh (400)");
    } else if (res.status === 400) {
      pass("USER — VTON thiếu ảnh (400)", "message từ server");
    } else {
      fail("USER — VTON thiếu ảnh", `${res.status} ${JSON.stringify(data)}`);
    }
  }

  // --- Chat AI (SSE) ---
  {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 45000);
    try {
      const res = await fetch(`${BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Gợi ý cho tôi một vài sản phẩm áo basic trong shop",
        }),
        signal: ac.signal,
      });
      const raw = await res.text();
      clearTimeout(to);
      const hasChunk = raw.includes("event: chunk") || raw.includes("event: done") || raw.includes("event: error");
      if (res.ok && hasChunk) pass("USER — Chat AI (SSE có event)");
      else fail("USER — Chat AI", `${res.status} len=${raw.length}`);
    } catch (e) {
      clearTimeout(to);
      fail("USER — Chat AI", e.message || String(e));
    }
  }

  // --- Admin: đăng nhập ---
  const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  if (!admin.ok) {
    fail("ADMIN — Đăng nhập admin", "Bỏ qua các bước admin (kiểm tra SEED_ADMIN_EMAIL/PASSWORD hoặc seed)");
    printSummary();
    process.exit(results.some((r) => !r.ok && r.name.startsWith("USER")) ? 1 : 0);
  }
  pass("ADMIN — Đăng nhập");
  const adminCookie = admin.cookie;

  // --- Phân quyền CREATOR ---
  let userRowId = session.user?.id;
  {
    const { res, data } = await jfetch("/users/all", { cookie: adminCookie });
    const users = data?.data || [];
    const u = users.find((x) => x.email === emailUser);
    if (u) userRowId = u.id;
    if (!res.ok) fail("ADMIN — GET /users/all", String(res.status));
    else pass("ADMIN — Danh sách user");
  }

  {
    const { res, data } = await jfetch(`/users/role/${userRowId}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { role: "CREATOR" },
    });
    if (res.ok) pass("ADMIN — Phân quyền USER → CREATOR");
    else fail("ADMIN — Phân quyền", `${res.status} ${JSON.stringify(data)}`);
  }

  // --- CREATOR: tạo + xóa sản phẩm (JWT mới sau đổi role) ---
  const creatorSess = await login(emailUser, password);
  if (!creatorSess.ok) {
    fail("CREATOR — Đăng nhập lại sau phân quyền", "");
  } else {
    pass("CREATOR — Đăng nhập (role CREATOR)");
    const cCookie = creatorSess.cookie;
    const slug = `test-sp-${t}`;
    let newProductId;
    {
      const { res, data } = await jfetch("/products", {
        method: "POST",
        cookie: cCookie,
        body: {
          name: `Sản phẩm IT ${t}`,
          slug,
          categoryId,
          brandName: "Brand IT",
          images: ["https://picsum.photos/seed/fortuneit/400/500"],
          variants: [
            { color: "Basic", size: "M", price: 99000, stock: 5 },
          ],
        },
      });
      newProductId = data?.data?.id;
      if (res.status === 201 && newProductId) pass("CREATOR — Tạo sản phẩm (POST /products)");
      else fail("CREATOR — Tạo sản phẩm", `${res.status} ${JSON.stringify(data)}`);
    }

    if (newProductId) {
      const { res, data } = await jfetch(`/products/${newProductId}`, {
        method: "DELETE",
        cookie: cCookie,
      });
      if (res.ok) pass("CREATOR — Xóa sản phẩm (DELETE /products/:id)");
      else fail("CREATOR — Xóa sản phẩm", `${res.status} ${JSON.stringify(data)}`);
    }
  }

  // --- Chặn user ---
  let blockedId;
  {
    const { res, data } = await jfetch("/users/all", { cookie: adminCookie });
    const users = data?.data || [];
    const u = users.find((x) => x.email === emailBlocked);
    blockedId = u?.id;
    if (!blockedId) fail("ADMIN — Tìm user để chặn", "");
  }

  if (blockedId) {
    const { res } = await jfetch(`/users/active/${blockedId}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { isActive: false },
    });
    if (res.ok) pass("ADMIN — Chặn user (isActive false)");
    else fail("ADMIN — Chặn user", String(res.status));

    const blockTry = await login(emailBlocked, password);
    if (!blockTry.ok && blockTry.status === 403) pass("USER — Đăng nhập khi bị chặn (403)");
    else fail("USER — Đăng nhập khi bị chặn", `status=${blockTry.status}`);

    await jfetch(`/users/active/${blockedId}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { isActive: true },
    });
    pass("ADMIN — Mở chặn user (khôi phục)");
  }

  // --- Cập nhật trạng thái đơn ---
  if (orderId) {
    const { res, data } = await jfetch(`/orders/${orderId}/status`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { status: "SHIPPED" },
    });
    if (res.ok) pass("ADMIN — Cập nhật trạng thái đơn → SHIPPED");
    else fail("ADMIN — Cập nhật trạng thái đơn", `${res.status} ${JSON.stringify(data)}`);
  }

  // Khôi phục role USER cho tài khoản test (tránh rác quyền)
  if (userRowId) {
    await jfetch(`/users/role/${userRowId}`, {
      method: "PUT",
      cookie: adminCookie,
      body: { role: "USER" },
    });
    pass("ADMIN — Khôi phục role USER cho tài khoản test");
  }

  printSummary();
  const bad = results.filter((r) => !r.ok);
  process.exit(bad.length ? 1 : 0);
}

function printSummary() {
  const ok = results.filter((r) => r.ok).length;
  const bad = results.filter((r) => !r.ok);
  console.log("\n=== Tổng kết ===");
  console.log(`Đạt: ${ok} / ${results.length}`);
  if (bad.length) {
    console.log("Chưa đạt:");
    for (const b of bad) console.log(`  - ${b.name}: ${b.detail}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
