const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const BLOGS_FILE = path.join(__dirname, '..', 'data', 'blogs.json');
const VISITORS_FILE = path.join(__dirname, '..', 'data', 'visitors.json');
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';

// Multer config for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public', 'uploads'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = crypto.randomBytes(8).toString('hex') + ext;
        cb(null, name);
    }
});

const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mime = allowedTypes.test(file.mimetype.split('/')[1]);
        if (ext && mime) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});

function getBlogs() {
    return JSON.parse(fs.readFileSync(BLOGS_FILE, 'utf-8'));
}

function saveBlogs(blogs) {
    fs.writeFileSync(BLOGS_FILE, JSON.stringify(blogs, null, 4), 'utf-8');
}

// Simple session-based auth middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    }
    res.redirect('/admin/login');
}

// Login page
router.get('/login', (req, res) => {
    res.render('admin-login', { error: null });
});

router.post('/login', (req, res) => {
    if (req.body.password === ADMIN_PASS) {
        req.session.admin = true;
        res.redirect('/admin');
    } else {
        res.render('admin-login', { error: 'Invalid password' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Dashboard
router.get('/', requireAuth, (req, res) => {
    const blogs = getBlogs();
    res.render('admin-dashboard', { blogs });
});

// New blog form
router.get('/new', requireAuth, (req, res) => {
    res.render('admin-editor', { blog: null });
});

// Edit blog form
router.get('/edit/:id', requireAuth, (req, res) => {
    const blogs = getBlogs();
    const blog = blogs.find(b => b.id === req.params.id);
    if (!blog) return res.status(404).render('404');
    res.render('admin-editor', { blog });
});

// Upload image (AJAX)
router.post('/upload-image', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
});

// Create blog
router.post('/create', requireAuth, (req, res) => {
    const blogs = getBlogs();
    const { title, excerpt, content, tags, coverImage, category } = req.body;

    const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const blog = {
        id,
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        category: category || 'tech',
        coverImage: coverImage || null,
        date: new Date().toISOString().split('T')[0],
        readTime: Math.max(1, Math.ceil(content.split(/\s+/).length / 200))
    };

    blogs.unshift(blog);
    saveBlogs(blogs);
    res.redirect('/admin');
});

// Update blog
router.post('/update/:id', requireAuth, (req, res) => {
    const blogs = getBlogs();
    const index = blogs.findIndex(b => b.id === req.params.id);
    if (index === -1) return res.status(404).render('404');

    const { title, excerpt, content, tags, coverImage, category } = req.body;

    blogs[index] = {
        ...blogs[index],
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        category: category || blogs[index].category,
        coverImage: coverImage || blogs[index].coverImage,
        readTime: Math.max(1, Math.ceil(content.split(/\s+/).length / 200))
    };

    saveBlogs(blogs);
    res.redirect('/admin');
});

// Delete blog
router.post('/delete/:id', requireAuth, (req, res) => {
    let blogs = getBlogs();
    blogs = blogs.filter(b => b.id !== req.params.id);
    saveBlogs(blogs);
    res.redirect('/admin');
});

// Visitors dashboard
function getVisitors() {
    try {
        return JSON.parse(fs.readFileSync(VISITORS_FILE, 'utf-8'));
    } catch {
        return [];
    }
}

router.get('/visitors', requireAuth, (req, res) => {
    const visitors = getVisitors();
    res.render('admin-visitors', { visitors });
});

// Visitors API (JSON)
router.get('/api/visitors', requireAuth, (req, res) => {
    const visitors = getVisitors();
    const totalVisitors = visitors.length;
    const totalPageViews = visitors.reduce((sum, v) => sum + v.visitCount, 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayVisitors = visitors.filter(v => v.lastVisit.startsWith(todayStr)).length;

    res.json({
        totalVisitors,
        totalPageViews,
        todayVisitors,
        visitors: visitors.sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit))
    });
});

// Clear visitor data
router.post('/visitors/clear', requireAuth, (req, res) => {
    fs.writeFileSync(VISITORS_FILE, '[]', 'utf-8');
    res.redirect('/admin/visitors');
});

module.exports = router;
