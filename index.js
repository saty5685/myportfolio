require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const messageRouter = require('./routes/messageRoute');
const adminRouter = require('./routes/adminRoute');
const trackVisitor = require('./middleware/trackVisitor');

const app = express();
const PORT = process.env.PORT || 3000;

function getBlogs() {
    const data = fs.readFileSync(path.join(__dirname, 'data', 'blogs.json'), 'utf-8');
    return JSON.parse(data);
}

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(trackVisitor);

app.get('/', (req, res) => {
    const blogs = getBlogs();
    res.render('home', { blogs });
});

app.get('/blog/:id', (req, res) => {
    const blogs = getBlogs();
    const blog = blogs.find(b => b.id === req.params.id);
    if (!blog) {
        return res.status(404).render('404');
    }
    res.render('blog', { blog, blogs });
});

app.get('/blogs', (req, res) => {
    const blogs = getBlogs();
    res.render('blogs', { blogs });
});

app.get('/hld', (req, res) => {
    res.render('hld');
});

app.use('/sendMessage', messageRouter);
app.use('/admin', adminRouter);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
