
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Namaste! I am your BharatVote Buddy. How can I help you with the voting process today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    const updatedHistory = [...messages, { role: 'user', text: userMsg }];
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: updatedHistory })
      });

      if (!response.ok) {
        throw new Error('Assistant service unavailable');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.answer || 'I am unable to respond right now. Please try again.' }]);
    } catch (err) {
      console.error('Assistant error:', err);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting to the election assistant right now. Please try again later." }]);
      setError('Unable to connect to BharatVote Buddy at the moment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[70vh] border border-gray-100">
      {/* Header */}
      <div className="bg-[#000080] p-6 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">BharatVote Buddy</h2>
            <div className="flex items-center space-x-1 opacity-80">
              <Sparkles size={12} className="text-yellow-400" />
              <span className="text-xs">Powered by Gemini AI</span>
            </div>
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-widest bg-white/10 px-2 py-1 rounded">Official Election Assistant</div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start max-w-[80%] space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 shadow-sm ${
                msg.role === 'user' ? 'bg-[#FF9933] text-white' : 'bg-white text-[#000080]'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#000080] text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center space-x-3 text-gray-400">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-xs font-medium">Assistant is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center space-x-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about candidates, voting steps, or your rights..."
            className="flex-grow p-4 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#000080] outline-none text-sm transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
              input.trim() && !isLoading ? 'bg-[#138808] text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-amber-700 text-center">
            {error}
          </p>
        )}
        <p className="mt-3 text-[10px] text-gray-400 text-center uppercase tracking-widest">
          Information provided for guidance only. Consult EC guidelines for legal matters.
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
