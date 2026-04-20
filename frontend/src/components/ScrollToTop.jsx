import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Đưa cửa sổ trình duyệt về đầu trang (0,0)
    window.scrollTo(0, 0);
  }, [pathname]); // Chạy lại mỗi khi đường dẫn (URL) thay đổi

  return null;
}
