const mongoose = require('mongoose');

const faqSchema = mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['general', 'account', 'habits', 'groups', 'mentoring', 'billing', 'technical'],
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    views: {
      type: Number,
      default: 0,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    notHelpful: {
      type: Number,
      default: 0,
    },
    relatedFAQs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FAQ',
    }],
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });

// Index for category and order
faqSchema.index({ category: 1, order: 1 });

// Index for published status
faqSchema.index({ isPublished: 1 });

// Virtual for helpfulness ratio
faqSchema.virtual('helpfulnessRatio').get(function () {
  const total = this.helpful + this.notHelpful;
  if (total === 0) return 0;
  return (this.helpful / total) * 100;
});

// Static method to get published FAQs by category
faqSchema.statics.getByCategory = function (category) {
  return this.find({ category, isPublished: true })
    .sort({ order: 1, createdAt: -1 })
    .lean();
};

// Static method to search FAQs
faqSchema.statics.search = function (searchTerm) {
  return this.find(
    {
      $text: { $search: searchTerm },
      isPublished: true,
    },
    {
      score: { $meta: 'textScore' },
    }
  )
    .sort({ score: { $meta: 'textScore' } })
    .lean();
};

// Method to increment views
faqSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Method to mark as helpful
faqSchema.methods.markHelpful = function () {
  this.helpful += 1;
  return this.save();
};

// Method to mark as not helpful
faqSchema.methods.markNotHelpful = function () {
  this.notHelpful += 1;
  return this.save();
};

const FAQ = mongoose.model('FAQ', faqSchema);
module.exports = FAQ;
