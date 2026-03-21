import { OKResponse } from "../response/success.js";
import DashboardService from "../services/dashboard.service.js";

class DashboardController {
    /**
     * GET /api/admin/dashboard
     * Lấy toàn bộ dữ liệu thống kê cho admin dashboard
     */
    static async getDashboard(req, res) {
        const data = await DashboardService.getDashboardStats();
        new OKResponse({
            message: "Dashboard data retrieved successfully",
            metadata: data,
        }).send(res);
    }

    /**
     * GET /api/admin/dashboard/vton-sessions
     * Lấy lịch sử thử đồ ảo của người dùng cho admin
     */
    static async getVtonSessions(req, res) {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const status = req.query.status || "";
        const search = req.query.search || "";

        const data = await DashboardService.getVtonSessions({
            page,
            limit,
            status,
            search,
        });

        new OKResponse({
            message: "VTON sessions retrieved successfully",
            metadata: data,
        }).send(res);
    }
}

export default DashboardController;
