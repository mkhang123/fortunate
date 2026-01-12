import React, { useState, useEffect } from "react";
import api from "../apis/axiosConfig";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Lấy danh sách toàn bộ người dùng
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/all");
      setUsers(res.data?.data || []);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách người dùng:", err);
      alert("Không có quyền truy cập hoặc lỗi server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Hàm xử lý cập nhật Role
  const handleUpdateRole = async (userId, newRole) => {
    if (!window.confirm(`Bạn có chắc muốn chuyển người dùng này thành ${newRole}?`)) return;

    try {
      await api.put(`/users/role/${userId}`, { role: newRole });
      alert("Cập nhật quyền thành công!");
      fetchUsers(); // Tải lại danh sách để cập nhật giao diện
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật quyền");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Quản lý Người dùng (Admin)</h1>

      <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b text-left">
              <th className="p-4 font-semibold text-gray-600">ID</th>
              <th className="p-4 font-semibold text-gray-600">Tên người dùng</th>
              <th className="p-4 font-semibold text-gray-600">Email</th>
              <th className="p-4 font-semibold text-gray-600">Quyền hiện tại</th>
              <th className="p-4 font-semibold text-gray-600 text-center">Thay đổi quyền</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-500 text-sm">#{user.id}</td>
                  <td className="p-4 font-medium text-gray-800">{user.name}</td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      user.role === 'ADMIN' ? 'bg-red-100 text-red-600' : 
                      user.role === 'CREATOR' ? 'bg-blue-100 text-blue-600' : 
                      'bg-green-100 text-green-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleUpdateRole(user.id, "USER")}
                        disabled={user.role === "USER"}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-30"
                      >
                        USER
                      </button>
                      <button 
                        onClick={() => handleUpdateRole(user.id, "CREATOR")}
                        disabled={user.role === "CREATOR"}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-30"
                      >
                        CREATOR
                      </button>
                      <button 
                        onClick={() => handleUpdateRole(user.id, "ADMIN")}
                        disabled={user.role === "ADMIN"}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-30"
                      >
                        ADMIN
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">Không có người dùng nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}