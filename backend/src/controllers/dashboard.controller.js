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
}

export default DashboardController;
