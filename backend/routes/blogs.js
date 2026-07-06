const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { sendBlogApprovalNotification, sendBlogSubmissionNotification } = require('../utils/emailService');

router.use((req, res, next) => {
  console.log(`Blog Router: ${req.method} ${req.url}`);
  next();
});

const SUPER_ADMIN_EMAIL = 'raraju@velvorax.tech';

// Helper to get email from header
const getBlogEmail = (req) => {
  return req.header('X-Blog-Email');
};

// @route   GET api/blogs
router.get('/', async (req, res) => {
  console.log("GET /api/blogs called");
  try {
    const userEmail = getBlogEmail(req);
    let query = {};
    if (userEmail === SUPER_ADMIN_EMAIL) {
      query = {};
    } else if (userEmail) {
      query = { $or: [{ isApproved: true }, { authorEmail: userEmail }] };
    } else {
      query = { isApproved: true };
    }
    const blogs = await Blog.find(query).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST api/blogs
router.post('/', async (req, res) => {
  const userEmail = getBlogEmail(req);
  console.log(`[BLOG POST] Request from: ${userEmail}`);
  const { title, content, category, image, author, phone } = req.body;

  if (!userEmail) {
    console.error("[BLOG POST] FAILED: No email header");
    return res.status(401).json({ msg: 'Email required' });
  }

  try {
    console.log(`[BLOG POST] Saving blog: "${title}" for author: ${author || userEmail}`);
    const newBlog = new Blog({
      title, content, authorEmail: userEmail,
      author: userEmail === SUPER_ADMIN_EMAIL ? 'Velvorax Team' : (author || userEmail.split('@')[0]),
      authorPhone: phone,
      category: category || 'General',
      image: image || (userEmail === SUPER_ADMIN_EMAIL ? 'assets/logo.jpg' : 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop'),
      isApproved: userEmail === SUPER_ADMIN_EMAIL
    });
    const blog = await newBlog.save();
    console.log(`[BLOG POST] SUCCESS: Saved with ID ${blog._id}`);

    // Send email notification to author
    sendBlogSubmissionNotification(userEmail, blog.author, blog.title).catch(err => {
      console.error("[BLOG POST] Email Notification Failed:", err.message);
    });

    res.status(201).json(blog);
  } catch (err) {
    console.error("[BLOG POST] CRITICAL SAVE ERROR:", err);
    res.status(500).json({ msg: 'Server Error during save', error: err.message });
  }
});

// @route   PUT api/blogs/:id
router.put('/:id', async (req, res) => {
  const userEmail = getBlogEmail(req);
  const { id } = req.params;
  console.log(`[BLOG PUT] Updating ID: ${id}, User: ${userEmail}`);
  try {
    let blog = await Blog.findById(id);
    if (!blog) {
      console.warn(`[BLOG PUT] NOT FOUND: ID ${id}`);
      return res.status(404).json({ msg: 'Blog not found' });
    }

    if (userEmail !== SUPER_ADMIN_EMAIL && userEmail !== blog.authorEmail) {
      console.warn(`[BLOG PUT] UNAUTHORIZED: User ${userEmail} tried to edit blog by ${blog.authorEmail}`);
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const updateFields = { ...req.body };
    if (req.body.phone) updateFields.authorPhone = req.body.phone;

    blog = await Blog.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    console.log(`[BLOG PUT] SUCCESS: Updated ID ${id}`);
    res.json(blog);
  } catch (err) {
    console.error(`[BLOG PUT] ERROR for ID ${id}:`, err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE api/blogs/:id
router.delete('/:id', async (req, res) => {
  const userEmail = getBlogEmail(req);
  const { id } = req.params;
  console.log(`[BLOG DELETE] Deleting ID: ${id}, User: ${userEmail}`);
  try {
    let blog = await Blog.findById(id);
    if (!blog) {
      console.warn(`[BLOG DELETE] NOT FOUND: ID ${id}`);
      return res.status(404).json({ msg: 'Blog not found' });
    }

    if (userEmail !== SUPER_ADMIN_EMAIL && userEmail !== blog.authorEmail) {
      console.warn(`[BLOG DELETE] UNAUTHORIZED: User ${userEmail} tried to delete blog by ${blog.authorEmail}`);
      return res.status(403).json({ msg: 'Not authorized' });
    }

    await Blog.findByIdAndDelete(id);
    console.log(`[BLOG DELETE] SUCCESS: Removed ID ${id}`);
    res.json({ msg: 'Removed' });
  } catch (err) {
    console.error(`[BLOG DELETE] ERROR for ID ${id}:`, err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PATCH api/blogs/:id/approve
router.patch('/:id/approve', async (req, res) => {
  const userEmail = getBlogEmail(req);
  if (userEmail !== SUPER_ADMIN_EMAIL) return res.status(403).json({ msg: 'Admin only' });
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });
    blog.isApproved = true;
    await blog.save();

    // Send email notification to author
    if (blog.authorEmail) {
      sendBlogApprovalNotification(blog.authorEmail, blog.author, blog.title).catch(err => {
        console.error("Failed to send blog approval email:", err.message);
      });
    }

    res.json(blog);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PATCH api/blogs/:id/like
router.patch('/:id/like', async (req, res) => {
  const userEmail = getBlogEmail(req);
  if (!userEmail) {
    return res.status(401).json({ msg: 'Please login to like posts' });
  }

  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });

    // Ensure likedBy exists
    if (!blog.likedBy) blog.likedBy = [];

    const alreadyLiked = blog.likedBy.includes(userEmail);

    if (alreadyLiked) {
      // Unlike
      blog.likedBy = blog.likedBy.filter(email => email !== userEmail);
      blog.likes = Math.max(0, blog.likes - 1);
      await blog.save();
      return res.json({ id: blog._id, likes: blog.likes, liked: false });
    } else {
      // Like
      blog.likedBy.push(userEmail);
      blog.likes += 1;
      await blog.save();
      return res.json({ id: blog._id, likes: blog.likes, liked: true });
    }
  } catch (err) {
    console.error("LIKE ERROR:", err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
