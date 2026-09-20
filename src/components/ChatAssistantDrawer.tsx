import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Trip } from '../types/travel';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  HelpCircle, 
  Clock, 
  DollarSign, 
  AlertTriangle 
} from 'lucide-react';

interface ChatAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onSendMessage: (message: string) => Promise<void>;
  onApplyProposal?: (proposal: any) => Promise<void>;
  isSending: boolean;
}

const QUICK_PROMPTS = [
  'Move today\'s museum to tomorrow',
  'Keep my total budget below $1,800',
  'Make the itinerary more relaxed',
  'Explain why activities were selected',
  'Are there any timing overlaps?'
];

export const ChatAssistantDrawer: React.FC<ChatAssistantDrawerProps> = ({
  isOpen,
  onClose,
  trip,
  onSendMessage,
  onApplyProposal,
  isSending
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const messages = trip.chatHistory || [];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    const msg = input.trim();
    setInput('');
    await onSendMessage(msg);
  };

  const handlePromptClick = async (prompt: string) => {
    if (isSending) return;
    await onSendMessage(prompt);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Trip Planning Assistant</h2>
            <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
              Grounded in {trip.preferences.destination}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Interactive Action Proposal Card for Human-in-the-Loop approval */}
                {msg.proposal && (
                  <div className="mt-3 p-3 rounded-xl bg-white border border-blue-200 shadow-2xs space-y-2 text-slate-900">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-blue-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Actionable Proposal
                      </span>
                      <span className={`px-2 py-0.2 text-[9px] font-bold rounded-full ${
                        msg.proposal.status === 'accepted' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : msg.proposal.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {msg.proposal.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="font-bold text-xs">{msg.proposal.summary}</div>
                    <div className="text-[11px] text-slate-600">{msg.proposal.reason}</div>

                    {msg.proposal.status === 'pending' && onApplyProposal && (
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onApplyProposal(msg.proposal)}
                          className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-colors"
                        >
                          Accept & Apply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (msg.proposal) {
                              msg.proposal.status = 'rejected';
                            }
                          }}
                          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className={`text-[10px] mt-1 ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {isUser && (
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-2.5 items-center text-slate-400 text-xs italic">
            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <span>Evaluating itinerary constraints...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Quick Inquiries
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handlePromptClick(prompt)}
              disabled={isSending}
              className="text-[11px] px-2 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-md text-slate-600 transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask TravelPilot anything about this trip..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
