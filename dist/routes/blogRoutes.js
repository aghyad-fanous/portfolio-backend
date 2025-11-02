import express from 'express';
import { createBlog, updateBlog, deleteBlog, getBlogs, getBlog, } from '../controllers/blogController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';
const router = express.Router();
// Admin routes
router.post('/create', verifyToken, requireAdmin, createBlog);
router.put('/:id', verifyToken, requireAdmin, updateBlog);
router.delete('/:id', verifyToken, requireAdmin, deleteBlog);
// Public routes
router.get('/', getBlogs);
router.get('/:slug', getBlog);
export default router;
