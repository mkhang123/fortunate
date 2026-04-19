import * as authService from "../services/auth.service.js";

const isProd = process.env.NODE_ENV === "production";

const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

const accessCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...accessCookieOptions, maxAge: 0 });
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions, maxAge: 0 });
}

// ĐĂNG KÝ
export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    await authService.register({ email, password, name });
    res.status(201).json({ success: true, message: "Đăng ký thành công" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

// ĐĂNG NHẬP — Set accessToken + refreshToken vào HttpOnly cookies
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(
      email,
      password,
    );

    res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions);
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    res
      .status(error.statusCode || 400)
      .json({ success: false, message: error.message });
  }
};

// LÀM MỚI ACCESS TOKEN — Dùng refreshToken trong cookie + DB
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    const { accessToken } = await authService.refresh(token);

    res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions);
    res.json({ success: true });
  } catch (error) {
    res
      .status(error.statusCode || 403)
      .json({ success: false, message: error.message });
  }
};

// ĐĂNG XUẤT — Xóa refreshToken khỏi DB + clear cookies
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      await authService.logout(token);
    }
    clearAuthCookies(res);
    res.json({ success: true, message: "Đăng xuất thành công" });
  } catch (error) {
    // Dù lỗi, vẫn clear cookie để client không giữ session "ma"
    clearAuthCookies(res);
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

// ĐĂNG NHẬP GOOGLE — Passport đã xác thực, req.user là Prisma user object
export const googleCallback = async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await authService.googleLogin(
      req.user,
    );

    res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions);
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);

    // Encode user thành JSON string rồi truyền qua query string
    const userEncoded = encodeURIComponent(JSON.stringify(user));

    // Redirect về frontend (cookie đã được set)
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/callback?user=${userEncoded}`,
    );
  } catch (error) {
    // Nếu tài khoản bị admin chặn, redirect về trang login để hiển thị toast đúng message
    if (error?.statusCode === 403) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=account_blocked`);
      return;
    }
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_login_failed`);
  }
};
