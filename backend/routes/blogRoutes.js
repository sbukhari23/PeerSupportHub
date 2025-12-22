const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// @route   GET /api/blogs
// @desc    Get all published blog posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { status: 'published' };

    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Filter by tag
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    // Search
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const posts = await BlogPost.find(filter)
      .populate('author', 'name username')
      .sort({ isSticky: -1, publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content') // Exclude full content in list
      .lean();

    const total = await BlogPost.countDocuments(filter);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/blogs/featured
// @desc    Get featured (sticky) blog posts
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const posts = await BlogPost.find({
      status: 'published',
      isSticky: true,
    })
      .populate('author', 'name username')
      .sort({ publishedAt: -1 })
      .limit(3)
      .select('-content')
      .lean();

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/blogs/popular
// @desc    Get most popular blog posts
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const posts = await BlogPost.find({ status: 'published' })
      .populate('author', 'name username')
      .sort({ views: -1, likes: -1 })
      .limit(limit)
      .select('-content')
      .lean();

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/blogs/:slug
// @desc    Get blog post by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({
      slug: req.params.slug,
      status: 'published',
    })
      .populate('author', 'name username bio')
      .lean();

    if (!post) {
      return res.status(404).json({ msg: 'Blog post not found' });
    }

    // Increment views
    await BlogPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } });

    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/blogs
// @desc    Create new blog post
// @access  Admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      tags,
      featuredImage,
      status,
      metaDescription,
      metaKeywords,
    } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ msg: 'Please provide title, content, and category' });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();

    // Check if slug exists
    const existingPost = await BlogPost.findOne({ slug });
    if (existingPost) {
      return res.status(400).json({ msg: 'Blog post with this title already exists' });
    }

    const post = await BlogPost.create({
      title,
      slug,
      content,
      excerpt,
      author: req.user._id,
      category,
      tags: tags || [],
      featuredImage,
      status: status || 'draft',
      publishedAt: status === 'published' ? new Date() : null,
      metaDescription,
      metaKeywords,
    });

    await post.populate('author', 'name username');

    res.status(201).json({
      msg: 'Blog post created successfully',
      post,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/blogs/:id
// @desc    Update blog post
// @access  Admin only
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Blog post not found' });
    }

    const {
      title,
      content,
      excerpt,
      category,
      tags,
      featuredImage,
      status,
      isSticky,
      metaDescription,
      metaKeywords,
    } = req.body;

    // Update fields
    if (title) post.title = title;
    if (content) post.content = content;
    if (excerpt) post.excerpt = excerpt;
    if (category) post.category = category;
    if (tags) post.tags = tags;
    if (featuredImage !== undefined) post.featuredImage = featuredImage;
    if (isSticky !== undefined) post.isSticky = isSticky;
    if (metaDescription) post.metaDescription = metaDescription;
    if (metaKeywords) post.metaKeywords = metaKeywords;

    // Handle status change
    if (status && status !== post.status) {
      post.status = status;
      if (status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }
    }

    await post.save();
    await post.populate('author', 'name username');

    res.json({
      msg: 'Blog post updated successfully',
      post,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE /api/blogs/:id
// @desc    Delete blog post
// @access  Admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Blog post not found' });
    }

    await post.deleteOne();

    res.json({ msg: 'Blog post deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/blogs/:id/like
// @desc    Like/unlike blog post
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Blog post not found' });
    }

    await post.toggleLike(req.user._id);

    res.json({
      msg: 'Like status updated',
      likeCount: post.likes.length,
      isLiked: post.likes.includes(req.user._id),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
