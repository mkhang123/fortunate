import * as authService from "../services/auth.service.js";

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

// ĐĂNG NHẬP — Trả về accessToken (15 phút) + refreshToken (7 ngày)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(
      email,
      password,
    );

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res
      .status(error.statusCode || 400)
      .json({ success: false, message: error.message });
  }
};

// LÀM MỚI ACCESS TOKEN — Dùng refreshToken còn hạn trong DB
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const { accessToken } = await authService.refresh(refreshToken);
    res.json({ success: true, accessToken });
  } catch (error) {
    res
      .status(error.statusCode || 403)
      .json({ success: false, message: error.message });
  }
};

// ĐĂNG XUẤT — Xóa refreshToken khỏi DB
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.json({ success: true, message: "Đăng xuất thành công" });
  } catch (error) {
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

    // Encode user thành JSON string rồi truyền qua query string
    const userEncoded = encodeURIComponent(JSON.stringify(user));

    // Redirect về frontend kèm token
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${userEncoded}`,
    );
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_login_failed`);
  }
};
