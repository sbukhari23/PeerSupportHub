const mongoose = require('mongoose');

const blogPostSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      maxlength: 300,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['mental-health', 'wellness', 'productivity', 'community', 'tips', 'stories'],
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    featuredImage: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    isSticky: {
      type: Boolean,
      default: false,
    },
    metaDescription: {
      type: String,
      maxlength: 160,
    },
    metaKeywords: [String],
  },
  {
    timestamps: true,
  }
);

// Index for searching
blogPostSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Index for published posts
blogPostSchema.index({ status: 1, publishedAt: -1 });

// Index for slug lookup
blogPostSchema.index({ slug: 1 });

// Virtual for like count
blogPostSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

// Static method to get published posts
blogPostSchema.statics.getPublishedPosts = function (filter = {}) {
  return this.find({ ...filter, status: 'published' })
    .populate('author', 'name username')
    .sort({ isSticky: -1, publishedAt: -1 });
};

// Method to increment views
blogPostSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Method to publish post
blogPostSchema.methods.publish = function () {
  this.status = 'published';
  if (!this.publishedAt) {
    this.publishedAt = new Date();
  }
  return this.save();
};

// Method to toggle like
blogPostSchema.methods.toggleLike = function (userId) {
  const index = this.likes.indexOf(userId);
  if (index > -1) {
    this.likes.splice(index, 1);
  } else {
    this.likes.push(userId);
  }
  return this.save();
};

// Generate slug from title before saving
blogPostSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
  next();
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);
module.exports = BlogPost;
