"use client";

import React, { useState } from 'react';

interface ContactAppProps {
  githubUrl?: string;
  recipientEmail?: string;
}

export default function ContactApp({
  githubUrl = 'https://github.com/thepriyanshucodes',
  recipientEmail = 'thepriyanshucodes@gmail.com',
}: ContactAppProps) {
  const [view, setView] = useState<'main' | 'email'>('main');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleGitHubClick = () => {
    window.open(githubUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderEmail.trim() || !message.trim() || isSending) return;

    setIsSending(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail,
          subject,
          message,
        }),
      });

      if (res.ok) {
        setIsSent(true);
        setTimeout(() => {
          setIsSent(false);
          setView('main');
          setSenderEmail('');
          setSubject('');
          setMessage('');
        }, 2000);
      } else {
        alert('Failed to send email. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while sending your message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100 p-5 rounded-2xl select-none overflow-y-auto no-scrollbar">
      {view === 'main' ? (
        /* Main Contact Hub View */
        <div className="flex flex-col h-full justify-between animate-in fade-in duration-200">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white tracking-wide">
                Get in Touch 📬
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Feel free to reach out for collaborations, project inquiries, or opportunities!
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              {/* GitHub Button */}
              <button
                onClick={handleGitHubClick}
                className="flex items-center justify-between p-3.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 hover:border-blue-500/50 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-slate-200 group-hover:text-white group-hover:scale-105 transition-all">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white">GitHub Profile</p>
                    <p className="text-[10px] text-slate-400">View code repositories & projects</p>
                  </div>
                </div>
                <span className="text-md text-white group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </button>

              {/* Gmail / Contact Form Button */}
              <button
                onClick={() => setView('email')}
                className="flex items-center justify-between p-3.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 hover:border-blue-500/50 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-red-400 group-hover:scale-105 transition-all">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white">Send Email</p>
                    <p className="text-[10px] text-slate-400">{recipientEmail}</p>
                  </div>
                </div>
                <span className="text-md text-white group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </button>
            </div>
          </div>

          <p className="text-[10px] text-center text-slate-500 pt-4">
            Priyanshu Raj • Desktop Portfolio
          </p>
        </div>
      ) : (
        /* Form View */
        <div className="flex flex-col h-full animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <button
              onClick={() => setView('main')}
              disabled={isSending}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
            >
              ← Back
            </button>
            <span className="text-xs font-semibold text-slate-300">New Message</span>
            <div className="w-10" />
          </div>

          {isSent ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-center animate-in zoom-in-95 duration-200">
              <span className="text-3xl">🚀</span>
              <p className="text-sm font-semibold text-emerald-400">Message Dispatched!</p>
              <p className="text-xs text-slate-400">Thanks for reaching out! I&apos;ll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSendEmail} className="flex-1 flex flex-col justify-between gap-3">
              <div className="space-y-2.5">
                {/* Sender Email */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isSending}
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Title / Subject */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Subject / Title
                  </label>
                  <input
                    type="text"
                    disabled={isSending}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Project Inquiry, Hiring, etc."
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Message Textarea */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    disabled={isSending}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here..."
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none no-scrollbar disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSending || !senderEmail.trim() || !message.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message 📤'
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}