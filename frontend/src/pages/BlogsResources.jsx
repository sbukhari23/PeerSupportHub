import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Search, BookOpen, Download, Play, FileText, Clock, Compass, ArrowLeft, Heart, MessageCircle, Eye, Loader2, PenLine, Plus } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { blogsAPI, authAPI, setLogoutCallback } from '../services/api';
import { toast } from 'sonner';

export function BlogsResources({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [featuredBlog, setFeaturedBlog] = useState(null);
  const [popularBlogs, setPopularBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBlog, setNewBlog] = useState({ title: '', content: '', tags: '', category: 'general' });
  const [creating, setCreating] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Set logout callback
  useEffect(() => {
    setLogoutCallback(onNavigate);
  }, [onNavigate]);

  // Fetch blogs from backend
  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const [allBlogs, featured, popular] = await Promise.all([
        blogsAPI.getBlogs().catch(() => ({ data: [] })),
        blogsAPI.getFeatured().catch(() => ({ data: [] })),
        blogsAPI.getPopular().catch(() => ({ data: [] }))
      ]);
      
      setBlogs(allBlogs.data || allBlogs || []);
      setFeaturedBlog((featured.data || featured || [])[0] || null);
      setPopularBlogs(popular.data || popular || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      // Use fallback static data if API fails
      setBlogs(staticArticles);
    } finally {
      setLoading(false);
    }
  };

  // Static fallback data
  const staticArticles = [
    {
      _id: '1',
      title: "The Power of Micro-Habits",
      content: "Start small to build lasting change. Learn how tiny actions compound into major transformations.",
      tags: ["Discipline", "Focus", "Habits"],
      likes: [],
      comments: [],
      views: 124
    },
    {
      _id: '2',
      title: "Why Peer Accountability Works",
      content: "Research shows that sharing your goals increases success rates by 65%. Here's why.",
      tags: ["Accountability", "Community", "Research"],
      likes: [],
      comments: [],
      views: 89
    },
    {
      _id: '3',
      title: "Breaking the Procrastination Cycle",
      content: "Understand the psychology behind procrastination and discover practical tools to overcome it.",
      tags: ["Productivity", "Focus", "MindsetShift"],
      likes: [],
      comments: [],
      views: 156
    },
    {
      _id: '4',
      title: "Building a Morning Routine That Sticks",
      content: "Transform your mornings with intentional habits that set the tone for your entire day.",
      tags: ["MorningRoutine", "StudyHabits", "Wellness"],
      likes: [],
      comments: [],
      views: 203
    },
  ];

  const guides = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Distraction Detox Guide",
      summary: "A 7-day plan to eliminate distractions and reclaim your focus. Includes worksheets, templates, and daily challenges.",
    },
    {
      icon: <Compass className="w-6 h-6" />,
      title: "Consistency Starter Plan",
      summary: "Step-by-step framework for building any habit from scratch. Perfect for beginners starting their growth journey.",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Morning Reset Routine",
      summary: "Transform your mornings with this science-backed routine designed for students and young professionals.",
    },
  ];

  const eventRecordings = [
    {
      title: "Mentor AMA: Building Consistency",
      duration: "42 min",
      description: "Live Q&A session with our top mentors about maintaining daily habits.",
    },
    {
      title: "Peer Challenge Recap: Study Marathon Week",
      duration: "28 min",
      description: "Highlights and insights from our community's most successful study challenge.",
    },
    {
      title: "Time Management Deep Dive",
      duration: "55 min",
      description: "Workshop on prioritization, scheduling, and making the most of your day.",
    },
  ];

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleReadArticle = async (blog) => {
    setSelectedBlog(blog);
    // Increment view count
    if (blog._id) {
      try {
        await blogsAPI.getBlog(blog._id);
      } catch (error) {
        console.error('Error incrementing view:', error);
      }
    }
  };

  const handleLikeBlog = async (blogId) => {
    if (!authAPI.isAuthenticated()) {
      toast.error('Please login to like posts');
      return;
    }
    try {
      await blogsAPI.likeBlog(blogId);
      fetchBlogs();
      toast.success('Post liked!');
    } catch (error) {
      console.error('Error liking blog:', error);
      toast.error('Failed to like post');
    }
  };

  const handleAddComment = async (blogId) => {
    if (!authAPI.isAuthenticated()) {
      toast.error('Please login to comment');
      return;
    }
    if (!commentText.trim()) return;
    
    try {
      await blogsAPI.addComment(blogId, commentText);
      setCommentText('');
      fetchBlogs();
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleCreateBlog = async () => {
    if (!authAPI.isAuthenticated()) {
      toast.error('Please login to create a post');
      return;
    }
    if (!newBlog.title.trim() || !newBlog.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    try {
      setCreating(true);
      const tagsArray = newBlog.tags.split(',').map(t => t.trim()).filter(t => t);
      await blogsAPI.createBlog({
        title: newBlog.title,
        content: newBlog.content,
        tags: tagsArray,
        category: newBlog.category
      });
      setShowCreateModal(false);
      setNewBlog({ title: '', content: '', tags: '', category: 'general' });
      fetchBlogs();
      toast.success('Blog post created!');
    } catch (error) {
      console.error('Error creating blog:', error);
      toast.error('Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadGuide = (title) => {
    toast.info(`PDF download coming soon: ${title}`);
  };

  const handlePlayRecording = (title) => {
    setSelectedVideo(title);
  };

  const handleSubmitStory = () => {
    if (authAPI.isAuthenticated()) {
      setShowCreateModal(true);
    } else {
      toast.error('Please login to submit your story');
    }
  };

  // Filter blogs based on search
  const filteredBlogs = (blogs.length > 0 ? blogs : staticArticles).filter(blog =>
    blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get display featured blog
  const displayFeaturedBlog = featuredBlog || {
    title: "How to Stay Consistent Even When You're Unmotivated",
    content: "Discover the science-backed strategies that help you show up every day, even when motivation runs low. Learn how to build systems that work for you.",
    likes: [],
    comments: [],
    views: 342
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-white px-6 py-20 md:py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          {/* Back Button */}
          <div className="absolute left-0 top-0">
            <Button
              variant="ghost"
              onClick={() => onNavigate('dashboard')}
              className="rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          </div>

          <h1 className="text-foreground text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
            Read. Reflect. Rebuild.
          </h1>

          <p className="text-gray-600 text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto">
            Discover articles, guides, and event recordings that help you stay consistent and balanced.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-12 pr-4 py-7 text-lg rounded-full border-2 border-gray-300 focus:border-black transition-all"
              />
            </div>
          </div>

          {/* Create Post Button (if authenticated) */}
          {authAPI.isAuthenticated() && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="rounded-full bg-black hover:bg-gray-800 px-8 py-6 text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Share Your Story
            </Button>
          )}
        </div>
      </section>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Featured Article Section */}
          <section className="px-6 py-20 max-w-5xl mx-auto">
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">Editor's Pick</h2>
            </div>

            <Card className="border-2 border-gray-900 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white">
              {/* Featured Image Placeholder */}
              <div className="w-full h-64 md:h-80 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <FileText className="w-20 h-20 text-gray-400" />
              </div>
              
              <div className="p-10 md:p-12">
                <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  {displayFeaturedBlog.title}
                </h3>
                <p className="text-gray-700 text-lg md:text-xl mb-4 leading-relaxed">
                  {displayFeaturedBlog.content?.substring(0, 200)}...
                </p>
                
                {/* Stats */}
                <div className="flex items-center gap-6 mb-8 text-gray-500">
                  <span className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    {displayFeaturedBlog.views || 0} views
                  </span>
                  <span className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    {displayFeaturedBlog.likes?.length || 0} likes
                  </span>
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    {displayFeaturedBlog.comments?.length || 0} comments
                  </span>
                </div>

                <Button 
                  className="rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
                  onClick={() => handleReadArticle(displayFeaturedBlog)}
                >
                  Read Now
                </Button>
              </div>
            </Card>

            <div className="mt-12 border-t-2 border-gray-200"></div>
          </section>

          {/* Articles Section */}
          <section className="px-6 py-20 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-5xl mx-auto">
              <div className="mb-12">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">Latest Articles</h2>
              </div>

              {filteredBlogs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No articles found matching your search.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredBlogs.map((article, index) => (
                    <Card key={article._id || index} className="border-2 border-gray-900 rounded-2xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300 bg-white">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          <div className="w-full md:w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center">
                            <FileText className="w-12 h-12 text-gray-400" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <h3 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
                            {article.title}
                          </h3>
                          <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                            {article.content?.substring(0, 150) || article.excerpt}...
                          </p>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {(article.tags || []).map((tag, tagIndex) => (
                              <span 
                                key={tagIndex}
                                className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700"
                              >
                                #{tag.replace('#', '')}
                              </span>
                            ))}
                          </div>

                          {/* Stats & Actions */}
                          <div className="flex items-center gap-6 mb-4 text-gray-500 text-sm">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {article.views || 0}
                            </span>
                            <button 
                              onClick={() => article._id && handleLikeBlog(article._id)}
                              className="flex items-center gap-1 hover:text-red-500 transition-colors"
                            >
                              <Heart className="w-4 h-4" />
                              {article.likes?.length || 0}
                            </button>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {article.comments?.length || 0}
                            </span>
                          </div>

                          <Button 
                            variant="outline"
                            className="rounded-full border-2 border-black px-8 py-6 text-lg hover:bg-gray-50 transition-all"
                            onClick={() => handleReadArticle(article)}
                          >
                            Read More
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Practical Guides Section */}
      <section className="px-6 py-20 md:py-28 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Practical Guides
            </h2>
            <p className="text-gray-700 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              Step-by-step guides to help you manage distractions, stay focused, and build habits with purpose.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {guides.map((guide, index) => (
              <AccordionItem 
                key={index} 
                value={`guide-${index}`}
                className="border-2 border-gray-900 rounded-2xl px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-xl md:text-2xl font-bold hover:no-underline py-6">
                  <div className="flex items-center gap-4">
                    {guide.icon}
                    <span>{guide.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                    {guide.summary}
                  </p>
                  <Button 
                    variant="outline"
                    className="rounded-full border-2 border-black px-8 py-6 text-lg hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
                    onClick={() => handleDownloadGuide(guide.title)}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download PDF
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Event Recordings Section */}
      <section className="px-6 py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Watch Past Events
            </h2>
          </div>

          <div className="space-y-6">
            {eventRecordings.map((event, index) => (
              <Card key={index} className="border-2 border-gray-900 rounded-2xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300 bg-white">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Video Thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="w-full md:w-48 h-48 md:h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center cursor-pointer group"
                         onClick={() => handlePlayRecording(event.title)}>
                      <Play className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
                      {event.title}
                    </h3>
                    <p className="text-gray-500 mb-4 text-lg">{event.duration}</p>
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                      {event.description}
                    </p>
                    <Button 
                      className="rounded-full bg-black hover:bg-gray-800 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                      onClick={() => handlePlayRecording(event.title)}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Play Recording
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Transition Section */}
      <section className="px-6 py-24 md:py-32 text-center bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50/50 to-white pointer-events-none" />
        
        <div className="max-w-3xl mx-auto space-y-10 relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Want to share your story?
          </h2>
          
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Write about your growth or share tips with the community.
          </p>
          
          <Button 
            className="rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
            onClick={handleSubmitStory}
          >
            Submit Your Story
          </Button>
        </div>
      </section>

      {/* Video Player Modal */}
      <Dialog open={selectedVideo !== null} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedVideo}</DialogTitle>
          </DialogHeader>
          <div className="w-full h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center">
            <div className="text-center text-white">
              <Play className="w-20 h-20 mx-auto mb-4" />
              <p className="text-xl">Video player coming soon</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Article Reader Modal */}
      <Dialog open={selectedBlog !== null} onOpenChange={() => setSelectedBlog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">{selectedBlog?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Article Content */}
            <div className="prose max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                {selectedBlog?.content}
              </p>
            </div>

            {/* Tags */}
            {selectedBlog?.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedBlog.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 text-gray-500 border-t pt-4">
              <span className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {selectedBlog?.views || 0} views
              </span>
              <button 
                onClick={() => selectedBlog?._id && handleLikeBlog(selectedBlog._id)}
                className="flex items-center gap-2 hover:text-red-500 transition-colors"
              >
                <Heart className="w-5 h-5" />
                {selectedBlog?.likes?.length || 0} likes
              </button>
              <span className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {selectedBlog?.comments?.length || 0} comments
              </span>
            </div>

            {/* Comments Section */}
            {selectedBlog?._id && authAPI.isAuthenticated() && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-bold text-lg">Comments</h4>
                
                {/* Add Comment */}
                <div className="flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1"
                  />
                  <Button onClick={() => handleAddComment(selectedBlog._id)}>
                    Post
                  </Button>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {(selectedBlog?.comments || []).map((comment, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-sm">{comment.user?.name || 'Anonymous'}</p>
                      <p className="text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Blog Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <PenLine className="w-6 h-6" />
              Share Your Story
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={newBlog.title}
                onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                placeholder="Give your story a compelling title..."
                className="text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={newBlog.category}
                onChange={(e) => setNewBlog({ ...newBlog, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="general">General</option>
                <option value="habits">Habits</option>
                <option value="productivity">Productivity</option>
                <option value="wellness">Wellness</option>
                <option value="motivation">Motivation</option>
                <option value="success-story">Success Story</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                value={newBlog.content}
                onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
                placeholder="Share your experience, tips, or insights..."
                rows={8}
                className="resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
              <Input
                value={newBlog.tags}
                onChange={(e) => setNewBlog({ ...newBlog, tags: e.target.value })}
                placeholder="habits, productivity, morning routine"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBlog}
                disabled={creating}
                className="flex-1 rounded-full bg-black hover:bg-gray-800"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish Story'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
