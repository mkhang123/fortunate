import { Navigate, useLocation } from "react-router-dom";

/**
 * Bảo vệ route - chuyển hướng về /login nếu chưa đăng nhập.
 * Login page sẽ đọc location.state.message để hiển thị thông báo.
 */
export default function PrivateRoute({ children, message = "Vui lòng đăng nhập để tiếp tục!" }) {
 const user = JSON.parse(localStorage.getItem("user"));
 const location = useLocation();

 if (!user) {
 return (
 <Navigate
 to="/login"
 state={{ from: location.pathname, message }}
 replace
 />
 );
 }

 return children;
}
