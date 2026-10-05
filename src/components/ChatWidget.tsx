import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: 'Welcome to Vyomatrix.ai! How can I help you with our AI Quality, Managed Services, Platform, or Academy offerings today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  const getFallbackReply = (userMsg: string) => {
    const lower = (userMsg || '').toLowerCase();
    if (/\b(hi|hello|hey|start|welcome)\b/.test(lower)) {
      return 'Welcome to Vyomatrix.ai! How can I help you with our AI Quality, Managed Services, Platform, or Academy offerings today?';
    }
    if (lower.includes('quality') || lower.includes('audit') || lower.includes('assurance') || lower.includes('hallucination') || lower.includes('bias')) {
      return 'Our AI Quality & Assurance offering provides independent auditing, accuracy & hallucination scoring, safety/bias reviews, and ongoing monitoring retainers for regulated industries.';
    }
    if (lower.includes('managed') || lower.includes('service') || lower.includes('build') || lower.includes('deploy') || lower.includes('annotation') || lower.includes('moderation')) {
      return 'Vyomatrix Managed AI Services helps build, deploy, and run custom AI bots, modernize legacy systems, and provide human data annotation, content moderation, and AI QA.';
    }
    if (lower.includes('platform') || lower.includes('governance') || lower.includes('accountability') || lower.includes('trail')) {
      return 'The Vyomatrix Platform is a unified suite for AI quality, governance, and accountability with configurable risk evaluation modules and immutable audit trails.';
    }
    if (lower.includes('academy') || lower.includes('course') || lower.includes('bootcamp') || lower.includes('train') || lower.includes('learn') || lower.includes('workshop')) {
      return 'Vyomatrix Academy offers practical training in AI evaluation & safety. See the Academy page for current programs and pricing.';
    }
    if (lower.includes('price') || lower.includes('cost') || lower.includes('fee') || lower.includes('pay') || lower.includes('enrol')) {
      return 'Current pricing for every Academy program is listed on the Academy page, and on the Checkout page when you enrol.';
    }
    if (lower.includes('contact') || lower.includes('email') || lower.includes('phone') || lower.includes('reach') || lower.includes('location') || lower.includes('headquarter')) {
      return 'Vyomatrix.ai is headquartered in Malaysia, serving Southeast Asia. You can reach our team via the Contact page or email us at support@vyomatrix.ai.';
    }
    return 'Vyomatrix.ai empowers organizations with AI Quality Assurance, Managed AI Services, Enterprise Governance Platform, and Academy training. How can I assist you further with these solutions?';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
          return;
        }
      }
      setMessages(prev => [...prev, { role: 'bot', text: getFallbackReply(userMsg) }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: getFallbackReply(userMsg) }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 w-[calc(100vw-3rem)] sm:w-[350px] h-[500px] max-h-[calc(100vh-8rem)] bg-white border border-silver/20 rounded-md shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="bg-primary text-white p-4 flex items-center justify-between">
              <div className="font-heading font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                Vyomatrix Support
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-silver-light/30">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-br-sm' 
                      : 'bg-white border border-silver/20 text-ink rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-silver/20 text-ink rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm">
                    <Loader2 size={16} className="animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 bg-white border-t border-silver/20 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 bg-silver-light/50 border border-silver/30 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <Send size={16} className="-ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-dark transition-transform hover:scale-105 active:scale-95"
        aria-label="Toggle chat"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}
