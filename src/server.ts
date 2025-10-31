import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import app from './app.js';

dotenv.config();

// نتأكد من اتصال قاعدة البيانات قبل التصدير
connectDB();

// ملاحظة: لا نستخدم app.listen() على Vercel
export default app;
