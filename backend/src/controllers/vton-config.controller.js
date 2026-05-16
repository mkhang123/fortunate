import vtonAIService from '../services/ai/vton-ai.service.js';

class VtonConfigController {
    /**
     * GET /api/vton/config
     * Lấy config VTON hiện tại
     */
    getConfig = async (req, res) => {
        try {
            const config = vtonAIService.getConfig();
            return res.json({
                success: true,
                data: config,
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    };

    /**
     * PUT /api/vton/config
     * Cập nhật Colab URL (không cần restart backend)
     * Body: { colabUrl: "https://xxxx.gradio.live" }
     */
    updateColabUrl = async (req, res) => {
        try {
            const { colabUrl } = req.body;

            if (!colabUrl || typeof colabUrl !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'colabUrl không hợp lệ. Vui lòng nhập link gradio.live từ Google Colab.',
                });
            }
            if (!colabUrl.startsWith('http')) {
                return res.status(400).json({
                    success: false,
                    message: 'URL không hợp lệ. Phải bắt đầu bằng https://',
                });
            }

            vtonAIService.setColabUrl(colabUrl.trim());

            return res.json({
                success: true,
                message: '✅ Đã cập nhật Colab URL thành công! AI mode chuyển sang Colab.',
                data: vtonAIService.getConfig(),
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    };
}

export default new VtonConfigController();
