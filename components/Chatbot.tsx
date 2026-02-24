
import React, { useState, useRef, useEffect } from 'react';
import { Message, Course } from '../types';
import { geminiService } from '../services/geminiService';

interface ChatbotProps {
  courses: Course[];
}

export const Chatbot: React.FC<ChatbotProps> = ({ courses }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "안녕하세요! 학습 보조 AI입니다. 보관 중인 강좌에 대해 궁금한 점이나 학습 계획을 물어보세요!", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await geminiService.getChatResponse(messages, courses, input);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "연결 중 오류가 발생했습니다. 다시 시도해 주세요.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 p-4 flex items-center border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-blue-900/20">
          <i className="fas fa-robot"></i>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">보관함 AI 튜터</h3>
          <p className="text-[10px] text-blue-400 font-medium tracking-wider uppercase">온라인 세션 중</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-700 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
              <div className={`text-[10px] mt-1.5 opacity-60 font-medium ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 flex items-center space-x-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="질문을 입력하세요..."
          className="flex-1 px-4 py-2.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-800 transition-all shadow-md shadow-blue-100 disabled:opacity-50"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};
