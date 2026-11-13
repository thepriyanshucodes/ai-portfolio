"use client"

import { useState, useRef, useEffect } from 'react';
import { QUICK_RESPONSES } from '@/lib/quickResponse';

export default function AskMeApp({ isMaximized = false }: { isMaximized: boolean }) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, text };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 1. Check if the prompt matches a preset button response
    if (QUICK_RESPONSES[text]) {
      // Simulate artificial thinking delay for realism
      await new Promise((resolve) => setTimeout(resolve, 600));

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: QUICK_RESPONSES[text] },
      ]);
      setIsLoading(false);
      return;
    }

    // 2. Otherwise, make the network call to Gemini API for custom prompts
    try {
      const formattedHistory = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: formattedHistory,
          message: text,
        }),
      });

      const data = await res.json();

      if (res.ok && data.text) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.text }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'Oops! Something went wrong. Please try again.' },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Failed to connect to AI server.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 bg-slate-900 text-slate-100 rounded-2xl">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
        {messages.length === 0 ? (
          <div className="space-y-2 animate-in fade-in duration-300">
            <p className={`text-amber-400 font-semibold ${isMaximized ? 'text-base' : 'text-sm'}`}>
              ✨ Ask me anything!
            </p>
            <div className="flex flex-col gap-2 pt-2">
              {Object.keys(QUICK_RESPONSES).map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  disabled={isLoading}
                  className={`self-start bg-slate-800 hover:bg-slate-700 hover:border-blue-500/50 text-slate-300 px-3 border border-slate-700 transition-all text-left cursor-pointer rounded-full ${
                    isMaximized ? 'py-2 text-sm' : 'py-1.5 text-xs'
                  }`}
                >
                  • {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    isMaximized ? 'text-sm' : 'text-xs'
                  } ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`bg-slate-800 text-slate-400 px-3 py-2 rounded-2xl border border-slate-700 animate-pulse ${
                  isMaximized ? 'text-sm' : 'text-xs'
                }`}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-4 flex justify-center w-full shrink-0"
      >
        <div className="relative w-full max-w-2xl flex items-center">
          <input
            type="text"
            value={inputValue}
            disabled={isLoading}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className={`w-full ${ isMaximized ? "h-14 text-sm pl-5 pr-14" : "h-11 text-xs pl-4 pr-11"} bg-slate-800/80 border border-slate-700 rounded-full text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50`}
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`absolute ${ isMaximized ? "right-3.5 w-9 h-9" : "right-2 w-7 h-7"} top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full text-blue-400 hover:text-blue-300 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer`}
          >
            <svg
              className={`${isMaximized ? "w-6 h-6" : "w-4 h-4"} shrink-0`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2.5L2 10.5L10.5 13.5M21.5 2.5L13.5 22L10.5 13.5M21.5 2.5L10.5 13.5" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}