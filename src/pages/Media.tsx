import React, { useState, useEffect } from 'react';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { SEO } from '../components/SEO';
import { ArrowRight, Search, FileText, Newspaper, Lightbulb, BookOpen, ArrowLeft, Calendar, Clock, User, Share2, Linkedin, Twitter, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Publication } from '../data/media';
import { Button } from '../components/ui/Button';

export function Media() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [publicationsData, setPublicationsData] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cms/data')
      .then(res => res.json())
      .then(data => {
        if (data && data.media) {
          // Filter out Drafts in the main view
          setPublicationsData(data.media.filter((m: any) => m.status !== 'Draft'));
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);
  
  // CMS Filter Categories
  const categories = [
    { name: 'All', icon: Search },
    { name: 'Insights', icon: Lightbulb },
    { name: 'Research', icon: FileText },
    { name: 'News', icon: Newspaper }
  ];

  if (isLoading) return <div className="p-24 text-center min-h-[60vh] flex items-center justify-center font-bold text-ink">Loading publications...</div>;

  // If we are on an individual article page
  if (slug) {
    const article = publicationsData.find(p => p.slug === slug);
    
    if (!article) {
      return (
        <div className="w-full bg-white min-h-[60vh] flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-ink mb-4">Article not found</h2>
          <Button to="/media" variant="secondary">Return to Media</Button>
        </div>
      );
    }

    return (
      <div className="w-full bg-white min-h-screen">
        <SEO 
          title={article.title} 
          description={article.summary} 
          canonical={`/media/${article.slug}`} 
        />
        {/* Article Header */}
        <section className="bg-silver-light border-b border-silver/20 pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-6">
            <AnimatedSection>
              <button onClick={() => navigate('/media')} className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-primary mb-8 transition-colors">
                <ArrowLeft size={16} /> Back to Publications
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-mono uppercase tracking-wider text-primary bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  CMS Status: {article.status}
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-ink/60 border border-silver/30 px-3 py-1.5 rounded-full">
                  {article.category}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-8 text-ink font-heading">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-sm text-ink/70 border-t border-silver/20 pt-6">
                <div className="flex items-center gap-2"><User size={16} className="text-primary" /> By {article.author}</div>
                <div className="flex items-center gap-2"><Calendar size={16} className="text-primary" /> {article.date}</div>
                <div className="flex items-center gap-2"><Clock size={16} className="text-primary" /> {article.readTime}</div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row gap-12">
            
            {/* Share Sidebar */}
            <div className="md:w-16 flex-shrink-0">
              <div className="sticky top-28 flex flex-col gap-4">
                <span className="text-xs font-bold text-silver uppercase tracking-widest mb-2 text-center md:text-left">Share</span>
                <div className="flex md:flex-col gap-3">
                  <button className="w-10 h-10 rounded-full border border-silver/30 flex items-center justify-center text-ink/60 hover:text-primary hover:border-primary transition-colors bg-white shadow-sm" aria-label="Share on LinkedIn">
                    <Linkedin size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-full border border-silver/30 flex items-center justify-center text-ink/60 hover:text-primary hover:border-primary transition-colors bg-white shadow-sm" aria-label="Share on Twitter">
                    <Twitter size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-full border border-silver/30 flex items-center justify-center text-ink/60 hover:text-primary hover:border-primary transition-colors bg-white shadow-sm" aria-label="Copy Link" onClick={() => alert('Link copied to clipboard')}>
                    <LinkIcon size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <AnimatedSection delay={0.1}>
                <div className="prose prose-lg max-w-none text-ink/80 leading-relaxed font-light">
                  <p className="text-xl text-ink font-medium leading-relaxed mb-8 border-l-4 border-primary pl-6 py-1 bg-silver-light/30 rounded-r-sm">
                    {article.summary}
                  </p>
                  
                  {article.content.map((paragraph, idx) => (
                    <p key={idx} className="mb-6">
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className="mt-16 pt-8 border-t border-silver/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {article.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-ink">{article.author}</div>
                      <div className="text-sm text-ink/60">Vyomatrix Expert</div>
                    </div>
                  </div>
                  <button className="px-6 py-3 border border-silver/30 rounded-full text-sm font-medium hover:bg-silver-light transition-colors flex items-center gap-2">
                    <Share2 size={16} /> Share Article
                  </button>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // --- Main Media List View ---
  const filtered = activeFilter === 'All' 
    ? publicationsData 
    : publicationsData.filter(p => p.category === activeFilter);

  return (
    <div className="w-full bg-white min-h-screen">
      <SEO 
        title="Media and Publications" 
        description="Insights on AI quality, governance, and accountability from the Vyomatrix team." 
        canonical="/media" 
      />
      {/* Hero Section */}
      <section className="bg-ink text-white pt-24 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <AnimatedSection>
            <div className="font-mono text-xs font-bold tracking-widest text-primary-light mb-6 uppercase flex items-center gap-2">
              <BookOpen size={16} /> MEDIA AND PUBLICATIONS
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-4xl text-white font-heading">
              Insights on AI quality, governance and accountability.
            </h1>
            <p className="text-lg md:text-2xl text-white/80 max-w-2xl font-light leading-relaxed">
              Articles, research notes and news from the Vyomatrix team.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Content Grid */}
      <section className="py-20 bg-silver-light/20">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="flex flex-wrap items-center gap-3 mb-16 pb-4 border-b border-silver/10">
            <span className="text-sm font-bold text-silver uppercase tracking-widest mr-4">Filter:</span>
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  onClick={() => setActiveFilter(cat.name)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 border shadow-sm ${
                    activeFilter === cat.name 
                      ? 'bg-primary text-white border-primary shadow-primary/20' 
                      : 'bg-white text-ink border-silver/20 hover:border-primary/40 hover:bg-silver-light'
                  }`}
                >
                  <Icon size={16} className={activeFilter === cat.name ? 'text-white' : 'text-primary'} />
                  {cat.name}
                </button>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((pub, idx) => (
              <AnimatedSection key={pub.id} delay={idx * 0.1}>
                <Link to={`/media/${pub.slug}`} className="group flex flex-col h-full border border-silver/20 rounded-sm hover:border-primary/50 hover:shadow-xl transition-all duration-300 p-8 bg-white relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-light transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  
                  {/* Optional Thumbnail Placeholder */}
                  {pub.thumbnailUrl && (
                    <div className="w-full h-48 bg-silver-light/50 rounded-sm mb-6 overflow-hidden border border-silver/10">
                      <img src={pub.thumbnailUrl} alt={pub.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono uppercase tracking-wider text-primary bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 flex items-center gap-2">
                      <FileText size={14} /> {pub.category}
                    </span>
                    <span className="text-xs text-ink/50 font-medium flex items-center gap-1.5"><Calendar size={14} /> {pub.date}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold font-heading mb-4 text-ink group-hover:text-primary transition-colors leading-snug">
                    {pub.title}
                  </h3>
                  
                  <p className="text-ink/70 text-sm mb-8 flex-1 leading-relaxed">
                    {pub.summary}
                  </p>
                  
                  <div className="flex items-center gap-2 text-primary font-bold text-sm mt-auto pt-6 border-t border-silver/10">
                    Read more <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-ink/50 border border-dashed border-silver/30 rounded-sm bg-silver-light/30">
              <FileText size={48} className="text-silver mx-auto mb-4" />
              <p className="text-lg">No publications found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Subscribe block */}
      <section className="py-24 bg-primary text-white relative overflow-hidden border-t border-primary-dark">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <h3 className="text-3xl md:text-4xl font-bold mb-4 font-heading">Subscribe for updates</h3>
              <p className="text-white/80 text-lg font-light leading-relaxed mb-6">
                Receive our latest technical whitepapers, compliance updates, and deep-dive research directly in your inbox. No spam, just rigorous insights.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-white/90"><CheckCircle2 size={16} className="text-primary-light" /> Exclusive early access to research</li>
                <li className="flex items-center gap-3 text-sm text-white/90"><CheckCircle2 size={16} className="text-primary-light" /> Regulatory updates and news</li>
              </ul>
            </AnimatedSection>
            <AnimatedSection delay={0.2} className="bg-white/10 backdrop-blur-sm p-8 rounded-sm border border-white/20">
              <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); alert('Subscribed successfully!'); }}>
                <div>
                  <label className="block text-sm font-medium mb-2">Work Email Address</label>
                  <input 
                    required
                    type="email" 
                    placeholder="sarah@company.com" 
                    className="w-full px-5 py-4 bg-white border-none rounded-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-light shadow-inner"
                  />
                </div>
                <button className="w-full bg-white text-primary px-6 py-4 rounded-sm font-bold hover:bg-silver-light transition-colors mt-2 shadow-lg text-lg">
                  Subscribe
                </button>
                <p className="text-xs text-white/60 text-center mt-2">
                  By subscribing, you agree to our privacy policy. You can unsubscribe at any time.
                </p>
              </form>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-primary-dark text-white py-12 text-center">
        <AnimatedSection>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xl">
            <span className="font-light">Want to work with us?</span>
            <Link to="/contact" className="inline-flex items-center gap-2 font-bold hover:text-primary-light transition-colors group">
              Talk to us <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
