import React, { useState, useEffect } from 'react';
import { vtonAPI } from '../apis/vton.api';
import { Wifi, WifiOff, Settings, ExternalLink, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function VtonAdminConfig() {
 const [colabUrl, setColabUrl] = useState('');
 const [currentConfig, setCurrentConfig] = useState(null);
 const [isLoading, setIsLoading] = useState(false);
 const [isFetching, setIsFetching] = useState(true);
 const [status, setStatus] = useState(null); // { type: 'success'|'error', message }

 // Lấy config hiện tại khi component mount
 useEffect(() => {
 fetchConfig();
 }, []);

 const fetchConfig = async () => {
 try {
 setIsFetching(true);
 const res = await vtonAPI.getConfig();
 if (res.success) {
 setCurrentConfig(res.data);
 if (res.data.colabUrl) setColabUrl(res.data.colabUrl);
 }
 } catch (err) {
 console.error('Không thể lấy config VTON:', err);
 } finally {
 setIsFetching(false);
 }
 };

 const handleUpdate = async () => {
 if (!colabUrl.trim()) {
 setStatus({ type: 'error', message: 'Vui lòng nhập link Gradio từ Google Colab.' });
 return;
 }

 setIsLoading(true);
 setStatus(null);
 try {
 const res = await vtonAPI.updateColabUrl(colabUrl.trim());
 if (res.success) {
 setCurrentConfig(res.data);
 setStatus({ type: 'success', message: 'Đã kết nối Colab thành công! AI mode: COLAB 🎉' });
 }
 } catch (err) {
 setStatus({
 type: 'error',
 message: err.response?.data?.message || 'Không thể cập nhật. Kiểm tra lại URL.',
 });
 } finally {
 setIsLoading(false);
 }
 };

 const modeColor = {
 colab: 'text-green-600 bg-green-50',
 huggingface: 'text-blue-600 bg-blue-50',
 mock: 'text-yellow-600 bg-yellow-50',
 replicate: 'text-purple-600 bg-purple-50',
 };

 const modeLabel = {
 colab: '☁️ Google Colab (Không giới hạn)',
 huggingface: '🤗 Hugging Face (~3 lần/IP)',
 mock: '🎭 Mock (Demo)',
 replicate: '⚡ Replicate',
 };

 return (
 <div className="border border-gray-200 rounded-sm bg-white p-4 space-y-4">
 {/* Header */}
 <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
 <Settings className="w-4 h-4 text-gray-500" />
 <h3 className="text-xs font-black tracking-wider">Cấu hình AI Server</h3>
 <span className="ml-auto text-[9px] text-gray-400 font-bold">Admin Only</span>
 </div>

 {/* Current Mode */}
 {!isFetching && currentConfig && (
 <div className="flex items-center gap-2">
 <span className="text-[10px] text-gray-500 font-bold ">Mode hiện tại:</span>
 <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${modeColor[currentConfig.mode] || 'text-gray-600 bg-gray-100'}`}>
 {modeLabel[currentConfig.mode] || currentConfig.mode}
 </span>
 {currentConfig.mode === 'colab' ? (
 <Wifi className="w-3.5 h-3.5 text-green-500 ml-auto" />
 ) : (
 <WifiOff className="w-3.5 h-3.5 text-gray-300 ml-auto" />
 )}
 </div>
 )}

 {/* Input URL */}
 <div className="space-y-2">
 <label className="text-[10px] font-black tracking-wider text-gray-600 block">
 Link Google Colab (gradio.live)
 </label>
 <div className="flex gap-2">
 <input
 type="url"
 value={colabUrl}
 onChange={(e) => setColabUrl(e.target.value)}
 placeholder="https://xxxxxxxx.gradio.live"
 className="flex-1 border border-gray-200 px-3 py-2 text-[11px] font-mono rounded-sm focus:outline-none focus:border-black transition-colors"
 />
 <button
 onClick={handleUpdate}
 disabled={isLoading}
 className="bg-black text-white px-4 py-2 text-[10px] font-black tracking-widest hover:bg-gray-800 transition-colors disabled:bg-gray-300 rounded-sm flex items-center gap-1.5"
 >
 {isLoading ? <Loader className="w-3 h-3 animate-spin" /> : null}
 {isLoading ? 'Đang kết nối...' : 'Kết nối'}
 </button>
 </div>

 {/* Status message */}
 {status && (
 <div className={`flex items-start gap-2 p-2 rounded-sm text-[10px] ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
 {status.type === 'success'
 ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
 : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
 }
 <span className="font-bold">{status.message}</span>
 </div>
 )}
 </div>

 {/* Hướng dẫn nhanh */}
 <div className="bg-gray-50 p-3 rounded-sm space-y-1">
 <p className="text-[9px] font-black tracking-wider text-gray-500 mb-2">Cách lấy link Colab:</p>
 <ol className="space-y-0.5 text-[9px] text-gray-500 leading-relaxed">
 <li>1. Mở file <code className="bg-gray-200 px-1 rounded text-[8px]">IDM_VTON_Colab.ipynb</code> trên Google Colab.</li>
 <li>2. Chọn Runtime → T4 GPU → Chạy Ô 1 rồi Ô 2.</li>
 <li>3. Copy link <code className="bg-gray-200 px-1 rounded text-[8px]">https://xxxx.gradio.live</code> và paste vào ô trên.</li>
 </ol>
 <a
 href="https://colab.research.google.com"
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 text-[9px] text-blue-600 hover:underline mt-1"
 >
 <ExternalLink className="w-2.5 h-2.5" />
 Mở Google Colab
 </a>
 </div>
 </div>
 );
}
