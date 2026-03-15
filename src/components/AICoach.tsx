import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, MessageSquare, RefreshCw, Send, User as UserIcon, Bot } from 'lucide-react';
import Markdown from 'react-markdown';
import { User, FoodLog, WeightLog } from '../types';
import { getAICoachAdvice } from '../services/gemini';
import { GoogleGenAI } from "@google/genai";

interface AICoachProps {
  user: User;
  logs: FoodLog[];
  weightHistory: WeightLog[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function AICoach({ user, logs, weightHistory }: AICoachProps) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAdvice = async () => {
    setLoading(true);
    const result = await getAICoachAdvice(user, logs, weightHistory);
    setAdvice(result);
    setLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const chat = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: `You are an expert AI Health & Nutrition Coach for NutriForge. 
          User: ${user.name}, Weight: ${user.current_weight}kg, Goal: ${user.target_weight}kg.
          Be helpful, motivating, and concise.`,
        },
      });

      // For simplicity in this demo, we'll just send the message without full history for now
      // but we could pass the history if we wanted.
      const response = await chat.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble responding right now." }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] -mr-48 -mt-48" />
        
        <div className="relative flex flex-col md:flex-row items-start gap-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Brain className="text-black w-8 h-8" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">AI Health Coach</h2>
              <button 
                onClick={fetchAdvice}
                disabled={loading}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all disabled:opacity-50"
              >
                <RefreshCw className={loading ? "w-5 h-5 animate-spin" : "w-5 h-5"} />
              </button>
            </div>
            <p className="text-white/40">Personalized insights powered by Gemini AI based on your recent activity and goals.</p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Advice */}
          <div className="bg-black/20 rounded-[2rem] p-8 border border-white/5 h-full">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Daily Insights
            </h3>
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-white/40 font-medium animate-pulse">Analyzing your data...</p>
              </div>
            ) : advice ? (
              <div className="prose prose-invert max-w-none text-sm">
                <Markdown>{advice}</Markdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                <MessageSquare className="w-12 h-12 text-white/10" />
                <p className="text-white/20">Click refresh to get your daily AI insights.</p>
              </div>
            )}
          </div>

          {/* Chat Interface */}
          <div className="bg-black/20 rounded-[2rem] border border-white/5 flex flex-col h-[600px] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="font-bold">Chat with Coach</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                  <MessageSquare className="w-12 h-12" />
                  <p className="text-sm">Ask me anything about your diet, workouts, or progress!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-white/10" : "bg-emerald-500/10"
                  )}>
                    {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm",
                    msg.role === 'user' ? "bg-white/5 text-white" : "bg-emerald-500/5 text-emerald-50"
                  )}>
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="bg-emerald-500/5 p-4 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 border-t border-white/5 flex gap-3">
              <input 
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask your coach..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button 
                type="submit"
                disabled={chatLoading || !input.trim()}
                className="p-3 bg-emerald-500 text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
          <h3 className="text-xl font-bold mb-4">How it works</h3>
          <p className="text-white/40 text-sm leading-relaxed">
            Our AI Coach analyzes your daily calorie intake, macro distribution, and weight trends to provide actionable advice. 
            It looks for patterns in your logging habits and suggests adjustments to help you reach your target weight of {user.target_weight}kg more efficiently.
          </p>
        </div>
        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
          <h3 className="text-xl font-bold mb-4">Privacy First</h3>
          <p className="text-white/40 text-sm leading-relaxed">
            Your data is only used to generate these personalized insights. We use the latest Gemini models to ensure high-quality, 
            medically-informed (but not medical advice) suggestions for your fitness journey.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
