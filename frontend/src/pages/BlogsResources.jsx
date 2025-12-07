import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Search, BookOpen, Download, Play, FileText, Clock, Compass } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function BlogsResources({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  const featuredArticle = {
    image: "Featured article image",
    title: "How to Stay Consistent Even When You're Unmotivated",
    summary: "Discover the science-backed strategies that help you show up every day, even when motivation runs low. Learn how to build systems that work for you.",
  };

  const articles = [
    {
      title: "The Power of Micro-Habits",
      excerpt: "Start small to build lasting change. Learn how tiny actions compound into major transformations.",
      tags: ["#Discipline", "#Focus", "#Habits"],
    },
    {
      title: "Why Peer Accountability Works",
      excerpt: "Research shows that sharing your goals increases success rates by 65%. Here's why.",
      tags: ["#Accountability", "#Community", "#Research"],
    },
    {
      title: "Breaking the Procrastination Cycle",
      excerpt: "Understand the psychology behind procrastination and discover practical tools to overcome it.",
      tags: ["#Productivity", "#Focus", "#MindsetShift"],
    },
    {
      title: "Building a Morning Routine That Sticks",
      excerpt: "Transform your mornings with intentional habits that set the tone for your entire day.",
      tags: ["#MorningRoutine", "#StudyHabits", "#Wellness"],
    },
    {
      title: "Digital Detox: Finding Balance in a Connected World",
      excerpt: "Reduce screen time without missing out. Strategies for healthy tech boundaries.",
      tags: ["#DigitalBalance", "#Wellness", "#Focus"],
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

  const handleReadArticle = (title) => {
    alert(`Article page coming soon: ${title}`);
  };

  const handleDownloadGuide = (title) => {
    alert(`PDF download coming soon: ${title}`);
  };

  const handlePlayRecording = (title) => {
    setSelectedVideo(title);
  };

  const handleSubmitStory = () => {
    alert('Story submission form coming soon!');
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-white px-6 py-20 md:py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
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
        </div>
      </section>

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
              {featuredArticle.title}
            </h3>
            <p className="text-gray-700 text-lg md:text-xl mb-8 leading-relaxed">
              {featuredArticle.summary}
            </p>
            <Button 
              className="rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
              onClick={() => handleReadArticle(featuredArticle.title)}
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

          <div className="space-y-6">
            {articles.map((article, index) => (
              <Card key={index} className="border-2 border-gray-900 rounded-2xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300 bg-white">
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
                      {article.excerpt}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {article.tags.map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Button 
                      variant="outline"
                      className="rounded-full border-2 border-black px-8 py-6 text-lg hover:bg-gray-50 transition-all"
                      onClick={() => handleReadArticle(article.title)}
                    >
                      Read More
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

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
    </div>
  );
}
