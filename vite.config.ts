import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load các biến môi trường từ file .env hoặc từ Netlify Environment
  // process.cwd() an toàn hơn ''
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // THÊM DÒNG NÀY: Giúp Netlify hiểu đường dẫn tương đối, tránh lỗi 404 file JS/CSS
    base: '/', 
    
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // Cách này an toàn hơn để tránh lỗi "process is not defined" trên trình duyệt
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      // Thêm dòng này nếu code của bạn có chỗ nào dùng process.env.NODE_ENV
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'), // Đã sửa lại '.' thay vì './' để chắc chắn trỏ đúng root
      },
    },
  };
});
