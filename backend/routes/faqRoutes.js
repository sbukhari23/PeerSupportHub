const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// @route   GET /api/faqs
// @desc    Get all published FAQs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const filter = { isPublished: true };

    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Search
    if (req.query.search) {
      const faqs = await FAQ.search(req.query.search);
      return res.json({ faqs, total: faqs.length });
    }

    const faqs = await FAQ.find(filter)
      .populate('relatedFAQs', 'question')
      .sort({ order: 1, createdAt: -1 })
      .lean();

    res.json({ faqs, total: faqs.length });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/faqs/categories
// @desc    Get FAQs grouped by category
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = ['general', 'account', 'habits', 'groups', 'mentoring', 'billing', 'technical'];
    
    const result = {};
    
    for (const category of categories) {
      result[category] = await FAQ.getByCategory(category);
    }

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/faqs/popular
// @desc    Get most viewed FAQs
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const faqs = await FAQ.find({ isPublished: true })
      .sort({ views: -1 })
      .limit(limit)
      .select('question answer category views')
      .lean();

    res.json(faqs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/faqs/:id
// @desc    Get specific FAQ
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id)
      .populate('relatedFAQs', 'question category')
      .lean();

    if (!faq) {
      return res.status(404).json({ msg: 'FAQ not found' });
    }

    if (!faq.isPublished) {
      return res.status(404).json({ msg: 'FAQ not found' });
    }

    // Increment views
    await FAQ.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json(faq);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/faqs
// @desc    Create new FAQ
// @access  Admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { question, answer, category, order, tags, relatedFAQs, isPublished } = req.body;

    if (!question || !answer || !category) {
      return res.status(400).json({ msg: 'Please provide question, answer, and category' });
    }

    const faq = await FAQ.create({
      question,
      answer,
      category,
      order: order || 0,
      tags: tags || [],
      relatedFAQs: relatedFAQs || [],
      isPublished: isPublished !== undefined ? isPublished : true,
      lastUpdatedBy: req.user._id,
    });

    res.status(201).json({
      msg: 'FAQ created successfully',
      faq,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/faqs/:id
// @desc    Update FAQ
// @access  Admin only
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ msg: 'FAQ not found' });
    }

    const { question, answer, category, order, tags, relatedFAQs, isPublished } = req.body;

    // Update fields
    if (question) faq.question = question;
    if (answer) faq.answer = answer;
    if (category) faq.category = category;
    if (order !== undefined) faq.order = order;
    if (tags) faq.tags = tags;
    if (relatedFAQs) faq.relatedFAQs = relatedFAQs;
    if (isPublished !== undefined) faq.isPublished = isPublished;
    faq.lastUpdatedBy = req.user._id;

    await faq.save();

    res.json({
      msg: 'FAQ updated successfully',
      faq,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE /api/faqs/:id
// @desc    Delete FAQ
// @access  Admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ msg: 'FAQ not found' });
    }

    await faq.deleteOne();

    res.json({ msg: 'FAQ deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/faqs/:id/helpful
// @desc    Mark FAQ as helpful
// @access  Public
router.post('/:id/helpful', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ msg: 'FAQ not found' });
    }

    await faq.markHelpful();

    res.json({
      msg: 'Thank you for your feedback',
      helpful: faq.helpful,
      notHelpful: faq.notHelpful,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/faqs/:id/not-helpful
// @desc    Mark FAQ as not helpful
// @access  Public
router.post('/:id/not-helpful', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ msg: 'FAQ not found' });
    }

    await faq.markNotHelpful();

    res.json({
      msg: 'Thank you for your feedback',
      helpful: faq.helpful,
      notHelpful: faq.notHelpful,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
