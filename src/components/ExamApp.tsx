import React, { useState, useEffect } from 'react';
import { BookOpen, Brain, Calculator, FlaskConical, History, Map, Newspaper, Trophy, Timer, CheckCircle2, ChevronRight, ArrowLeft, LogOut, Settings, Swords, Zap, MessageSquare, Loader2, User, Mail, Lock, Phone, ShieldCheck, Eye, EyeOff, Calendar, Flame, Lightbulb, Target, RotateCw, Bookmark, X, Megaphone, Send, Bell, Search, Bot, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Question, Test, UserAttempt, Lesson, CurrentAffairsDaily, CurrentAffairsArticle } from '../types';
import { subjects } from '../mockData';
import { lessonsData } from '../data/lessons';
import { generateQuestionExplanation, explainCurrentAffairs } from '../services/geminiService';
import { AudioPlayer } from './AudioPlayer';
import { DocViewer } from './DocViewer';
import { auth, googleProvider, signInWithPopup, signOut, db, collection, query, orderBy, limit, onSnapshot, createUserWithEmailAndPassword, signInWithEmailAndPassword, where, getDocs, setDoc, doc, serverTimestamp, getDoc, sendPasswordResetEmail, handleFirestoreError, OperationType } from '../firebase';

// --- Icons Mapping ---
const IconMap: Record<string, any> = {
  BookOpen, Brain, Calculator, FlaskConical, History, Map, Newspaper, Lightbulb
};

import Markdown from 'react-markdown';

// --- Header Component ---
export const Header: React.FC<{ 
  onNavigate: (view: any) => void; 
  user: any;
  streak?: number;
}> = ({ onNavigate, user, streak = 0 }) => {
  const isAdmin = user?.role === 'admin' || user?.email === 'rajuroyal025@gmail.com';
  const [notification, setNotification] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Listen for the latest global announcement
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const notifData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
        const lastDismissedId = localStorage.getItem('last_dismissed_notif');
        
        if (lastDismissedId !== notifData.id) {
          setNotification(notifData);
          setShowNotification(true);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [user]);

  const handleDismiss = () => {
    if (notification) {
      localStorage.setItem('last_dismissed_notif', notification.id);
    }
    setShowNotification(false);
  };

  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) return;
    setIsSending(true);
    try {
      const newNotifRef = doc(collection(db, 'notifications'));
      await setDoc(newNotifRef, {
        message: announcementText,
        createdAt: serverTimestamp(),
        type: 'info'
      });
      setAnnouncementText('');
      setShowAdminPanel(false);
      alert('સફળતાપૂર્વક સમાચાર મોકલ્યા!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'notifications');
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onNavigate('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="glass-nav">
      <AnimatePresence>
        {showNotification && notification && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-brand-600 text-white py-2 px-4 relative overflow-hidden"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Megaphone className="w-4 h-4 animate-bounce" />
                </div>
                <p className="text-sm font-bold truncate pr-6 sm:pr-0">
                  {notification.message}
                </p>
              </div>
              <button 
                onClick={handleDismiss}
                className="hover:bg-white/20 p-1 rounded-full transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          <div className="flex items-center cursor-pointer shrink-0 group transition-transform active:scale-95" onClick={() => onNavigate('home')}>
            <div className="bg-[#c3b091] text-white rounded-2xl p-2 mr-3 shadow-[0_8px_16px_-4px_rgba(195,176,145,0.4)] relative overflow-hidden">
               <motion.div 
                 animate={{ rotate: [0, 10, -10, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               >
                <BookOpen className="w-6 h-6" />
               </motion.div>
               <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter leading-none font-sans group-hover:text-brand-600 transition-colors">KHAKHI PATH</h1>
              <p className="font-mono text-[9px] font-black leading-none mt-1.5 uppercase tracking-[0.25em] text-[#c3b091]">THE CADET HUB</p>
            </div>
          </div>

          {/* Center Links - Premium Underline */}
          <div className="hidden md:flex items-center space-x-10">
            {[
              { name: 'હોમ', path: 'home' },
              { name: 'દૈનિક ક્વિઝ', path: 'test' },
              { name: 'લીડરબોર્ડ', path: 'leaderboard', scroll: true }
            ].map((item) => (
              <button 
                key={item.name}
                onClick={() => {
                  if (item.scroll) {
                    const el = document.getElementById('leaderboard');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    onNavigate(item.path);
                  }
                }} 
                className="relative text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold transition-all py-2 group"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}
            <button 
              onClick={() => onNavigate('duel')} 
              className="bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:hover:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-black px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 border border-brand-100 dark:border-brand-900/30 shadow-sm"
            >
              <Swords size={18} className="animate-pulse" /> બેટલ મોડ
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-super-khaki'))}
              className="w-10 h-10 flex items-center justify-center text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-2xl transition border border-transparent hover:border-brand-100 dark:hover:border-brand-900/30"
              title="Super Khakhi AI"
            >
              <Bot size={22} className="animate-pulse" />
            </button>

            {isAdmin && (
              <button 
                onClick={() => setShowAdminPanel(true)}
                className="w-10 h-10 flex items-center justify-center text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-2xl transition border border-transparent hover:border-brand-100 dark:hover:border-brand-900/30"
                title="Admin Panels"
              >
                <div className="relative">
                  <Bell size={22} className={showNotification ? "animate-swing" : ""} />
                  {showNotification && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
                </div>
              </button>
            )}
            
            {streak > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 px-4 py-2 rounded-2xl text-orange-600 dark:text-orange-400 font-black text-xs border border-orange-100/50 dark:border-orange-500/20 shadow-sm">
                <Trophy size={16} className="fill-current" />
                <span className="tabular-nums">{streak} DAYS_STREAK</span>
              </div>
            )}

            {!user ? (
              <button 
                onClick={() => onNavigate('login')}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-2xl font-black text-sm tracking-tight transition shadow-lg shadow-slate-200 dark:shadow-none hover:scale-105 active:scale-95"
              >
                ACCESS_PORTAL
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onNavigate('profile')}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-tr from-brand-500 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-800 shadow-xl overflow-hidden active:scale-90 transition-all">
                    <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="User" referrerPolicy="no-referrer" />
                  </div>
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-1"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          
        </div>
        {/* Mobile Nav Links */}
        <div className="md:hidden flex overflow-x-auto py-2 border-t border-gray-50 dark:border-slate-800 space-x-6 scrollbar-hide px-2">
          <button onClick={() => onNavigate('home')} className="text-gray-600 dark:text-slate-400 hover:text-brand-600 font-medium text-sm transition whitespace-nowrap">હોમ</button>
          <button onClick={() => onNavigate('duel')} className="text-brand-600 hover:text-brand-700 font-bold text-sm transition whitespace-nowrap flex items-center gap-1">
            <Swords size={14} /> બેટલ
          </button>
          <button onClick={() => onNavigate('test')} className="text-gray-600 dark:text-slate-400 hover:text-brand-600 font-medium text-sm transition whitespace-nowrap">દૈનિક ક્વિઝ</button>
          <button onClick={() => {
            const el = document.getElementById('leaderboard');
            el?.scrollIntoView({ behavior: 'smooth' });
          }} className="text-gray-600 dark:text-slate-400 hover:text-brand-600 font-medium text-sm transition whitespace-nowrap">લીડરબોર્ડ</button>
        </div>
      </div>

      <AnimatePresence>
        {showAdminPanel && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminPanel(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-[0_32px_128px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col border border-white/20 dark:border-white/5 z-10"
            >
              {/* Decorative Accent */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600"></div>

              {/* Header */}
              <div className="px-8 pt-10 pb-6 flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="inline-flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.3em] font-mono">ADMIN_TERMINAL // SECURE</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">નવી જાહેરાત</h3>
                </div>
                <button 
                  onClick={() => setShowAdminPanel(false)} 
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-110 active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="px-8 pb-10 space-y-8">
                <div className="space-y-3">
                  <div className="relative group">
                    <textarea 
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      placeholder="વિદ્યાર્થીઓ માટે મહત્વનો સંદેશ અહીં લખો..."
                      className="w-full h-48 p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-brand-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white text-lg font-bold leading-relaxed resize-none"
                    />
                    <div className="absolute bottom-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                      <Megaphone size={60} className="text-brand-500" />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={handlePostAnnouncement}
                    disabled={isSending || !announcementText.trim()}
                    className="w-full relative group overflow-hidden bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-all rounded-[1.5rem] shadow-xl shadow-brand-500/20"
                  >
                    <div className="relative flex items-center justify-center gap-3 py-5 px-8 text-white font-black text-lg tracking-tight">
                      {isSending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <>
                          <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          <span>બ્રોડકાસ્ટ કરો</span>
                        </>
                      )}
                    </div>
                  </button>
                  <p className="text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    SYSTEM WILL NOTIFY ALL ACTIVE SESSIONS INSTANTLY
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Hero Component ---
const slideData = [
  {
    quote: "પરસેવાની શાહીથી જેઓ પોતાના ઈરાદાઓ લખે છે, તેમના મુકદ્દરના પાના ક્યારેય કોરા નથી હોતા.",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop"
  },
  {
    quote: "તમારી સફળતાની તૈયારી અહીંથી શરૂ થાય છે.",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200&auto=format&fit=crop"
  },
  {
    quote: "ખાખી માત્ર રંગ નથી, એ એક જવાબદારી અને ગૌરવ છે.",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200&auto=format&fit=crop"
  },
  {
    quote: "આત્મવિશ્વાસ અને મહેનત સાથે કંઈપણ શક્ય છે.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
  }
];

export const Hero: React.FC<{ onStartTest: () => void; onNavigate: (view: any) => void; isCompleted?: boolean }> = ({ onStartTest, onNavigate, isCompleted }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slideData.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-20 tech-grid rounded-3xl sm:rounded-[4rem] mt-2 md:mt-4 mb-8 md:mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
        
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8 order-2 lg:order-1"
        >
          <div className="inline-flex items-center gap-3 bg-white/40 dark:bg-brand-900/10 px-5 py-2 rounded-full border border-white/60 dark:border-brand-900/20 backdrop-blur-xl shadow-sm">
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            <span className="text-[10px] font-black text-brand-800 dark:text-brand-400 uppercase tracking-[0.25em] font-mono">CADET_PORTAL // SECURE_ACCESS</span>
          </div>

          <div className="min-h-[120px] sm:min-h-[160px] flex items-center"> 
            <AnimatePresence mode="wait">
              <motion.h1 
                key={currentIndex}
                id="animated-quote"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl sm:text-4xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-[1.2] lg:leading-[1.15] tracking-tight font-display"
              >
                {slideData[currentIndex].quote}
              </motion.h1>
            </AnimatePresence>
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl leading-relaxed font-medium">
            ગુજરાત સરકારની તમામ સ્પર્ધાત્મક પરીક્ષાઓ માટે શ્રેષ્ઠ મટીરીયલ અને મોક ટેસ્ટ. તમારી સફળતાની સફર અહીંથી શરૂ કરો.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 md:gap-5 pt-4 md:pt-6">
            <button 
              onClick={onStartTest}
              className="group relative bg-brand-600 hover:bg-brand-700 text-white font-black py-4 px-8 md:px-10 rounded-2xl shadow-xl shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="tracking-tight text-base md:text-lg relative z-10">{isCompleted ? 'રિઝલ્ટ જુઓ' : 'ટેસ્ટ શરૂ કરો'}</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform relative z-10" strokeWidth={3} />
            </button>
            <button 
              onClick={() => onNavigate('duel')}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-slate-200 font-bold py-4 px-8 md:px-10 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800 active:scale-[0.98] flex items-center justify-center gap-3 hover:shadow-md hover:border-slate-300"
            >
              <Swords size={20} className="text-brand-500" /> <span className="tracking-tight text-base md:text-lg font-black">બેટલ મોડ</span>
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, x: 30 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          className="relative group order-1 lg:order-2"
        >
          <div className="absolute -inset-4 bg-gradient-to-tr from-brand-500/10 to-khaki-500/10 rounded-[3rem] blur-2xl group-hover:opacity-100 opacity-0 transition-opacity duration-700"></div>
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800 h-[350px] sm:h-[450px] lg:h-[550px] w-full transform hover:rotate-1 transition-transform duration-700">
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentIndex}
                src={slideData[currentIndex].image} 
                alt="KHAKHI PATH" 
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
            
            {/* Overlay UI Elements */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
               <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white shadow-lg">
                    <Target size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Active Target</p>
                    <p className="text-sm font-bold text-white">POLICE PSI (EXT)</p>
                  </div>
               </div>
               <div className="flex gap-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${currentIndex === i ? 'w-8 bg-brand-500' : 'w-2 bg-white/40'}`}></div>
                  ))}
               </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

// --- Leaderboard Component ---
export const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('totalScore', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leaderboardData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Client-side tie-breaker sorting
      const sortedLeaders = [...leaderboardData].sort((a: any, b: any) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        // If scores are tied, lower bestTime is better
        return (a.bestTime || 9999) - (b.bestTime || 9999);
      });

      setLeaders(sortedLeaders);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leaderboard');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return (index + 1).toString();
  };

  return (
    <section id="leaderboard" className="py-16 px-4 flex justify-center bg-slate-50/50 dark:bg-black/20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-3xl sm:rounded-[3rem] border border-white dark:border-white/5 max-w-4xl w-full mx-auto relative shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-none overflow-hidden"
      >
        {/* Subtle Decorative Gradient Bar */}
        <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 opacity-80"></div>
        
        <div className="p-6 sm:p-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 md:mb-12">
            <div>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] font-mono leading-none mb-3 block">CADET_RANKINGS // 2026</span>
              <h3 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Global Leaderboard</h3>
            </div>
            <div className="bg-slate-100/50 dark:bg-white/5 p-4 rounded-3xl backdrop-blur-sm border border-white dark:border-white/5">
              <Trophy size={32} className="text-amber-500" />
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Syncing Data...</p>
              </div>
            ) : leaders.length > 0 ? (
              leaders.map((leader, idx) => (
                <motion.div 
                  key={`leader-${leader.id || idx}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-[2rem] transition-all group border ${
                    idx === 0 
                      ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 shadow-sm' 
                      : 'bg-white dark:bg-white/5 border-transparent hover:border-slate-100 dark:hover:border-white/10 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none'
                  }`}
                >
                  {/* Rank Circle */}
                  <div className={`w-12 h-12 flex items-center justify-center shrink-0 rounded-2xl text-xl transition-all ${
                    idx === 0 ? 'bg-amber-100 dark:bg-amber-500/20 scale-110 shadow-lg shadow-amber-200/50' : 
                    idx === 1 ? 'bg-slate-100 dark:bg-slate-500/20' : 
                    idx === 2 ? 'bg-orange-50 dark:bg-orange-500/20' : 
                    'bg-slate-50 dark:bg-white/5'
                  }`}>
                    <span className="font-black text-slate-800 dark:text-white">{getRankIcon(idx)}</span>
                  </div>

                  <div className="flex-1 flex items-center gap-4 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`absolute -inset-1 rounded-2xl blur-md opacity-0 group-hover:opacity-40 transition-opacity ${
                        idx === 0 ? 'bg-amber-400' : 'bg-indigo-400'
                      }`}></div>
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-sm">
                        <img 
                          src={leader.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.displayName}`} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                    
                    <div className="truncate">
                      <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate leading-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {leader.displayName || 'કેડેટ'}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                          {leader.testsCompleted || 0} SE-ID
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none tabular-nums">
                      {leader.totalScore.toFixed(1)}
                    </span>
                    <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full border ${
                      leader.accuracy >= 80 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' 
                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                    }`}>
                      <Zap size={10} className="fill-current" />
                      <span className="text-[10px] font-bold tabular-nums">{Math.round(leader.accuracy || 0)}%</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-400 text-sm">
                હજુ સુધી કોઈ ડેટા નથી. પ્રથમ ટેસ્ટ આપો!
              </div>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                   {[1, 2, 3, 4].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white dark:border-slate-800 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                     </div>
                   ))}
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">+1240 MORE ACTIVE</span>
             </div>
             <button className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
                VIEW ALL RECORDS // 2026
             </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

// --- Subject Grid ---
export const SubjectGrid: React.FC<{ onSubjectClick?: (subjectName: string) => void }> = ({ onSubjectClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredSubjects = subjects.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">વિષય મુજબ તૈયારી</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm sm:text-base mt-1 font-medium">તમારા મનપસંદ વિષય પર ક્લિક કરો</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-super-khaki'))}
            className="flex items-center justify-center gap-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:hover:bg-brand-400/20 text-brand-600 dark:text-brand-400 font-black px-5 py-3 rounded-2xl border border-brand-100 dark:border-brand-900/30 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap shadow-sm h-full"
          >
            <Bot size={18} className="animate-pulse" />
            <span className="text-xs uppercase tracking-widest">સુપર ખાખી AI</span>
          </button>
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-800 shadow-sm w-full md:w-72 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all">
             <Search size={18} className="text-slate-400 mr-3" />
             <input 
                type="text" 
                placeholder="વિષય શોધો (દા.ત. ઇતિહાસ)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold text-slate-600 dark:text-slate-300 w-full" 
             />
             {searchTerm && (
               <button onClick={() => setSearchTerm('')} className="bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                 <X size={14} className="text-slate-400" />
               </button>
             )}
          </div>
        </div>
      </div>
      
      {filteredSubjects.length > 0 ? (
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          className="flex md:grid md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6 overflow-x-auto md:overflow-visible pb-6 md:pb-0 snap-x w-full scrollbar-hide"
        >
          {filteredSubjects.map((subject, idx) => {
            const Icon = IconMap[subject.icon] || BookOpen;
            return (
              <motion.div
                key={`${subject.name}-${idx}`}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                className="tech-card flex-none md:flex-1 w-36 md:w-auto h-40 flex flex-col items-center justify-center snap-start cursor-pointer group"
                onClick={() => onSubjectClick?.(subject.name)}
              >
                <div className={`w-14 h-14 ${subject.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon size={28} />
                </div>
                <span className="font-black text-slate-700 dark:text-slate-200 text-sm text-center px-2 tracking-tight">{subject.name}</span>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
           <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-slate-400" />
           </div>
           <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">કોઈ વિષય મળ્યો નથી</h3>
           <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">તમારો સ્પેલિંગ તપાસો અથવા બીજા શબ્દથી શોધો</p>
        </div>
      )}
    </section>
  );
};

// --- Test View ---
export const TestView: React.FC<{ 
  test: Test; 
  onComplete: (attempt: UserAttempt) => void; 
  onCancel: () => void;
  isPracticeMode?: boolean;
  onSaveQuestion?: (question: Question) => void;
}> = ({ test, onComplete, onCancel, isPracticeMode, onSaveQuestion }) => {
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<(number | null)[]>(new Array(test.questions.length).fill(null));
  const [timeLeft, setTimeLeft] = React.useState(test.durationMinutes * 60);

  const handleSubmit = React.useCallback(() => {
    let score = 0;
    answers.forEach((ans, idx) => {
      if (ans === test.questions[idx].correctAnswer) score++;
    });
    onComplete({
      testId: test.id,
      answers,
      score,
      totalMarks: test.totalMarks,
      timeTaken: (test.durationMinutes * 60) - timeLeft,
      isFirstAttempt: !isPracticeMode,
      completedAt: new Date()
    });
  }, [answers, test, onComplete, timeLeft, isPracticeMode]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const currentQuestion = test.questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        {isPracticeMode && (
          <div className="bg-orange-500 text-white text-center py-2 text-sm font-bold mb-4 -mx-4 -mt-4">
            તમે આજની લાઈવ ટેસ્ટ આપી દીધી છે. આ માત્ર પ્રેક્ટિસ માટે છે અને લીડરબોર્ડમાં ગણાશે નહીં.
          </div>
        )}
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button onClick={onCancel} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium">
            <ArrowLeft size={20} /> બહાર નીકળો
          </button>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
              <Timer size={20} className={timeLeft < 60 ? 'text-red-600' : 'text-brand-600'} />
              {formatTime(timeLeft)}
            </div>
            <button 
              onClick={handleSubmit}
              className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all"
            >
              સબમિટ કરો
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {test.questions.map((_, idx) => (
            <button
              key={`question-indicator-${idx}`}
              onClick={() => setCurrentIdx(idx)}
              className={`w-10 h-10 shrink-0 rounded-xl font-bold transition-all border-2 ${
                currentIdx === idx 
                  ? 'bg-brand-600 border-brand-600 text-white' 
                  : answers[idx] !== null 
                    ? 'bg-brand-50 border-brand-200 text-brand-600' 
                    : 'bg-white border-slate-200 text-slate-400 hover:border-brand-300'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-8"
        >
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-brand-600 font-bold text-sm uppercase tracking-wider">{currentQuestion.subject} • {currentQuestion.topic}</span>
              <button 
                onClick={() => onSaveQuestion?.(currentQuestion)}
                className="p-2 text-slate-300 hover:text-brand-600 transition-colors"
                title="પ્રશ્ન સેવ કરો"
              >
                <Bookmark size={20} />
              </button>
            </div>
            <h4 className="text-2xl font-bold text-slate-900 leading-relaxed">
              {currentIdx + 1}. {currentQuestion.text}
            </h4>
          </div>

          <div className="grid gap-4">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={`q-opt-${idx}`}
                onClick={() => handleAnswer(idx)}
                className={`flex items-center justify-between p-5 rounded-2xl border-2 text-left transition-all ${
                  answers[currentIdx] === idx 
                    ? 'bg-brand-50 border-brand-500 text-brand-700' 
                    : 'bg-white border-slate-100 hover:border-brand-200 text-slate-700'
                }`}
              >
                <span className="font-medium text-lg">{option}</span>
                {answers[currentIdx] === idx && <CheckCircle2 className="text-brand-600" size={24} />}
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <button 
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              className="px-6 py-3 text-slate-500 font-bold disabled:opacity-30"
            >
              પાછળ
            </button>
            <button 
              disabled={currentIdx === test.questions.length - 1}
              onClick={() => setCurrentIdx(prev => prev + 1)}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-30"
            >
              આગળ
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

// --- Result View ---
export const ResultView: React.FC<{ 
  attempt: UserAttempt; 
  test: Test; 
  onBack: () => void; 
  onSaveQuestion?: (question: Question) => void;
}> = ({ attempt, test, onBack, onSaveQuestion }) => {
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [loadingExplanations, setLoadingExplanations] = useState<Record<number, boolean>>({});

  const percentage = (attempt.score / test.totalMarks) * 100;
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} મિનિટ ${secs} સેકન્ડ`;
  };

  const handleGetExplanation = async (questionIdx: number) => {
    if (explanations[questionIdx] || loadingExplanations[questionIdx]) return;

    setLoadingExplanations(prev => ({ ...prev, [questionIdx]: true }));
    try {
      const q = test.questions[questionIdx];
      const userAnsIdx = attempt.answers[questionIdx];
      const userChoice = userAnsIdx !== null ? q.options[userAnsIdx] : 'Not Answered';
      const explanation = await generateQuestionExplanation(
        q.text,
        q.options,
        q.options[q.correctAnswer],
        userChoice
      );
      setExplanations(prev => ({ ...prev, [questionIdx]: explanation }));
    } catch (error: any) {
      if (error.message === 'GUJARATI_QUOTA_EXCEEDED') {
        setExplanations(prev => ({ ...prev, [questionIdx]: 'AI સર્વરની દૈનિક મર્યાદા અત્યારે પૂરી થઈ ગઈ છે. કૃપા કરીને આ પ્રશ્નની સમજૂતી માટે આવતીકાલે પ્રયાસ કરો.' }));
      } else {
        console.error('Explanation error:', error);
      }
    } finally {
      setLoadingExplanations(prev => ({ ...prev, [questionIdx]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 md:py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        {!attempt.isFirstAttempt && (
          <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded-r-xl">
            <div className="flex items-center gap-3">
              <Zap className="text-orange-500" size={20} />
              <p className="text-orange-700 font-bold text-sm">પ્રેક્ટિસ મોડ: આ સ્કોર લીડરબોર્ડમાં ઉમેરવામાં આવ્યો નથી.</p>
            </div>
          </div>
        )}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl text-center space-y-6 sm:space-y-8"
        >
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto">
            <Trophy size={40} className="sm:w-12 sm:h-12" />
          </div>
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">અભિનંદન!</h2>
            <p className="text-slate-500 text-sm sm:text-base">તમે ટેસ્ટ પૂર્ણ કરી છે.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div className="p-4 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-3xl">
              <div className="text-2xl sm:text-3xl font-black text-brand-600 leading-tight">{attempt.score}/{test.totalMarks}</div>
              <div className="text-[10px] sm:text-sm text-slate-500 font-bold uppercase mt-1">સ્કોર</div>
            </div>
            <div className="p-4 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-3xl">
              <div className="text-2xl sm:text-3xl font-black text-brand-600 leading-tight">{Math.round(percentage)}%</div>
              <div className="text-[10px] sm:text-sm text-slate-500 font-bold uppercase mt-1">પરિણામ</div>
            </div>
            <div className="p-4 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-3xl col-span-2 md:col-span-1">
              <div className="text-lg sm:text-xl font-black text-brand-600 leading-tight">{formatDuration(attempt.timeTaken)}</div>
              <div className="text-[10px] sm:text-sm text-slate-500 font-bold uppercase mt-1">સમય લીધો</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={onBack}
              className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all"
            >
              હોમ પેજ પર પાછા જાઓ
            </button>
          </div>
        </motion.div>

        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-800 px-4">જવાબોની સમીક્ષા</h3>
          {test.questions.map((q, idx) => {
            const userAns = attempt.answers[idx];
            const isCorrect = userAns === q.correctAnswer;
            
            return (
              <div key={`result-q-${q.id || idx}-${idx}`} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="font-bold text-slate-800">
                    {idx + 1}. {q.text}
                  </h4>
                  <button 
                    onClick={() => onSaveQuestion?.(q)}
                    className="p-2 text-slate-300 hover:text-brand-600 transition-colors shrink-0"
                    title="પ્રશ્ન સેવ કરો"
                  >
                    <Bookmark size={18} />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isCorrectOpt = optIdx === q.correctAnswer;
                    const isUserOpt = optIdx === userAns;
                    
                    let bgClass = 'bg-slate-50 border-slate-100 text-slate-600';
                    let label = '';
                    
                    if (isCorrectOpt) {
                      bgClass = 'bg-green-50 border-green-500 text-green-800';
                      label = '✓ સાચો જવાબ';
                    } else if (isUserOpt && !isCorrect) {
                      bgClass = 'bg-red-50 border-red-500 text-red-800';
                      label = '✗ તમારો જવાબ';
                    }
                    
                    return (
                      <div key={`result-opt-${optIdx}`} className={`${bgClass} border p-3 rounded-xl flex justify-between items-center text-sm transition-all`}>
                        <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                        {label && <span className="font-bold text-xs uppercase">{label}</span>}
                      </div>
                    );
                  })}
                </div>

                {!isCorrect && (
                  <div className="pt-2">
                    <AnimatePresence>
                      {explanations[idx] ? (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-brand-50 border border-brand-100 rounded-xl p-4 mt-2"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center shrink-0">
                              <Brain size={16} className="text-white" />
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-brand-600 uppercase">AI પ્રોફેસરની સમજૂતી</div>
                              <div className="text-sm text-slate-700 leading-relaxed markdown-body">
                                <Markdown>{explanations[idx]}</Markdown>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <button
                          onClick={() => handleGetExplanation(idx)}
                          disabled={loadingExplanations[idx]}
                          className="text-brand-600 text-sm font-bold flex items-center gap-2 hover:text-brand-700 transition-colors p-2 -ml-2"
                        >
                          {loadingExplanations[idx] ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <MessageSquare size={16} />
                          )}
                          {loadingExplanations[idx] ? 'AI પ્રોફેસર જવાબ વિચારી રહ્યા છે...' : 'સાચો જવાબ જાણો'}
                        </button>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Teachers Path Component ---
export const TeachersPath: React.FC<{ 
  subject: string; 
  onBack: () => void;
  onStartLesson: (lesson: Lesson) => void;
  completedLessons?: string[];
}> = ({ subject, onBack, onStartLesson, completedLessons = [] }) => {
  const lessons = lessonsData[subject] || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <h2 className="text-xl font-bold text-slate-800">{subject} - લર્નિંગ પાથ</h2>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-md">
              📖
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{subject}</h1>
              <p className="text-gray-500 text-sm">ઝીરો થી હીરો - સંપૂર્ણ અભ્યાસક્રમ</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 text-right">
             <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-400 uppercase">પ્રગતિ</span>
                <span className="text-xl font-black text-brand-600">
                   {Math.round((lessons.filter(l => completedLessons.includes(l.id)).length / (lessons.length || 1)) * 100)}%
                </span>
             </div>
             <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(lessons.filter(l => completedLessons.includes(l.id)).length / (lessons.length || 1)) * 100}%` }}
                   className="h-full bg-brand-600"
                />
             </div>
          </div>
        </div>

        {lessons.length > 0 ? (
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
            {lessons.map((lesson, idx) => (
              <div key={`${lesson.id}-${idx}`} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${lesson.status !== 'locked' ? 'is-active' : ''}`}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${completedLessons.includes(lesson.id) ? 'bg-green-500' : lesson.color} ${lesson.status === 'locked' ? 'text-gray-400' : 'text-white'} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${lesson.status === 'active' && !completedLessons.includes(lesson.id) ? 'animate-pulse' : ''}`}>
                  {completedLessons.includes(lesson.id) ? <CheckCircle2 size={24} /> : lesson.icon}
                </div>
                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-xl shadow-sm border ${
                  completedLessons.includes(lesson.id) ? 'bg-white border-green-200' : 
                  lesson.status === 'active' ? 'bg-white border-2 border-blue-400 shadow-md transform scale-105 transition-transform' : 
                  'bg-gray-50 border-gray-100 opacity-75'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      completedLessons.includes(lesson.id) ? 'text-green-600 bg-green-50' : 
                      lesson.status === 'active' ? 'text-blue-600 bg-blue-50' : 
                      'text-gray-500 bg-gray-200'
                    }`}>
                      {completedLessons.includes(lesson.id) ? 'પૂર્ણ થયેલ' : lesson.level}
                    </span>
                    {completedLessons.includes(lesson.id) && (
                      <span className="flex items-center gap-1 text-green-600 font-black text-[10px] uppercase">
                        <CheckCircle2 size={12} /> પૂર્ણ
                      </span>
                    )}
                  </div>
                  <h3 className={`font-bold text-lg ${lesson.status === 'locked' ? 'text-gray-600' : 'text-gray-800'}`}>
                    {lesson.title}
                  </h3>
                  <p className={`text-sm mt-2 ${lesson.status === 'locked' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {lesson.description}
                  </p>
                  <div className="mt-4 flex gap-2">
                    {lesson.status === 'active' && (
                      <button 
                        onClick={() => onStartLesson(lesson)}
                        className="text-xs font-bold bg-blue-600 text-white px-4 py-1.5 rounded shadow hover:bg-blue-700"
                      >
                        શીખવાનું શરૂ કરો
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">📚</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">પાઠ ટૂંક સમયમાં ઉપલબ્ધ થશે</h3>
            <p className="text-slate-500">અમે આ વિષય માટે અભ્યાસક્રમ તૈયાર કરી રહ્યા છીએ. કૃપા કરીને થોડા સમય પછી તપાસો.</p>
          </div>
        )}
      </div>
    </div>
  );
};


// --- Lesson View Component ---
export const LessonView: React.FC<{ 
  lesson: Lesson; 
  content: string; 
  loading: boolean;
  onBack: () => void;
  onToggleCompletion?: (lessonId: string) => void;
  isCompleted?: boolean;
  onToggleBookmark?: (lessonId: string) => void;
  isBookmarked?: boolean;
}> = ({ 
  lesson, 
  content, 
  loading, 
  onBack, 
  onToggleCompletion, 
  isCompleted = false,
  onToggleBookmark,
  isBookmarked = false
}) => {
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f7f6] relative">
      {/* Smart Orientation Overlay */}
      <AnimatePresence>
        {isPortrait && lesson.pptUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div 
              animate={{ rotate: 90 }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", repeatDelay: 1 }}
              className="bg-brand-600 p-6 rounded-3xl mb-8 shadow-2xl shadow-brand-500/20"
            >
              <RotateCw size={64} className="text-white" />
            </motion.div>
            <h3 className="text-2xl font-black text-white mb-4">
              📱 ફોન રોટેટ કરો (Rotate Phone)
            </h3>
            <p className="text-slate-300 font-bold text-lg mb-8">
              for btter view ppt you can full view then after rotate your phone
            </p>
            <button 
              onClick={() => setIsPortrait(false)}
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-black transition-all border border-white/20"
            >
              સમજાઈ ગયું (Understood)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Header with Breadcrumbs */}
      <div className="bg-white border-b border-[#e0e6ed] px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">
              {lesson.subject} <span className="mx-1 text-slate-300 font-normal">&gt;</span> <span className="text-brand-600 underline underline-offset-4 decoration-brand-200">{lesson.title}</span>
            </div>
            <h2 className="text-base md:text-lg font-black text-slate-800 leading-none truncate">{lesson.title}</h2>
          </div>

          <button 
            onClick={() => onToggleBookmark?.(lesson.id)} 
            className={`p-3 rounded-2xl transition-all active:scale-90 ${isBookmarked ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Bookmark size={24} fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>
        {/* Progress Bar Container - Fixed at the very top of the viewport */}
        <div className="fixed top-0 left-0 w-full h-[4px] bg-slate-100/50 z-[100]">
           <ReadingProgressBar />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium italic">તમારા માટે અભ્યાસ સામગ્રી તૈયાર થઈ રહી છે...</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Audio Section (Phase 1 Vision) */}
            {lesson.audioUrl && (
              <div className="bg-[#e8f4fd] border border-blue-100 p-6 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200">
                    <Zap size={20} className="fill-white" />
                  </div>
                  <h3 className="font-black text-lg text-[#1b4f72]">🎧 ઓડિયો લેક્ચર સાંભળો</h3>
                </div>
                
                {lesson.audioUrl.includes('drive.google.com') ? (
                  <div className="rounded-2xl overflow-hidden bg-white/50 relative group">
                    <iframe 
                      src={lesson.audioUrl.includes('uc?id=') || lesson.audioUrl.includes('id=') 
                        ? `https://drive.google.com/file/d/${(lesson.audioUrl.match(/[-\w]{25,}/) || [])[0]}/preview`
                        : lesson.audioUrl.replace('/view', '/preview').replace('/edit', '/preview')
                      } 
                      width="100%" 
                      height="120" 
                      style={{ border: 'none' }}
                      title="Audio Lecture"
                      onContextMenu={(e) => e.preventDefault()}
                    ></iframe>
                    {/* Protective Overlay for Drive Download/Pop-out Buttons */}
                    <div className="absolute top-0 right-0 w-32 h-14 bg-transparent z-10" />
                  </div>
                ) : (
                  <audio 
                    controls 
                    controlsList="nodownload" 
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full h-12 rounded-2xl outline-none" 
                    preload="metadata"
                  >
                    <source src={lesson.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                )}
                
                <p className="text-[10px] text-blue-500/70 font-bold mt-2 uppercase tracking-tighter">HD આઝાદી: ઓટોમેટીક ઓન-ડિમાન્ડ ટ્યુટરિંગ</p>
              </div>
            )}

            {/* Modern PPT/Viewer Section */}
            {lesson.pptUrl && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                  <h3 className="font-black text-xl text-slate-800 tracking-tight">સ્ટડી મટીરીયલ (Study Slides)</h3>
                </div>
                <DocViewer url={lesson.pptUrl} title={lesson.title} />
                <div className="relative py-8 flex flex-col items-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-brand-500/20 to-transparent rounded-full" />
                  
                  <div className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full shadow-sm group-hover:shadow-md transition-all">
                       <Maximize2 size={12} className="text-brand-500" />
                       <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Full Experience</span>
                    </div>
                    
                    <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold text-center max-w-xs leading-relaxed">
                      For better view PPT you can <span className="text-brand-500">Full View</span> then after rotate your phone
                    </p>
                  </div>

                  <div className="flex items-center gap-6 mt-6">
                    <div className="flex flex-col items-center gap-1 text-slate-300 dark:text-slate-700">
                      <Zap size={14} className="fill-current" />
                      <span className="text-[8px] font-black tracking-widest uppercase">Fast Load</span>
                    </div>
                    <div className="w-12 h-[1px] bg-slate-100 dark:bg-slate-800" />
                    <div className="flex flex-col items-center gap-1 text-slate-300 dark:text-slate-700">
                      <ShieldCheck size={14} className="fill-current" />
                      <span className="text-[8px] font-black tracking-widest uppercase">Secure Docs</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50 dark:border-slate-800/50">
                <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-2">
                  <div className="w-2 h-8 bg-brand-600 rounded-full"></div>
                  મુખ્ય મુદ્દાઓ
                </h3>
                <ReadingTimeEstimator content={content} />
              </div>
              <div className="markdown-body prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-p:font-medium prose-li:font-medium">
                <Markdown>{content}</Markdown>
              </div>
              
              <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
                <button 
                  onClick={() => {
                    onToggleCompletion?.(lesson.id);
                    if (!isCompleted) {
                      // Trigger back after marking as completed if it wasn't
                      setTimeout(onBack, 1000);
                    }
                  }}
                  className={`px-10 py-5 ${isCompleted ? 'bg-green-600' : 'bg-slate-900'} text-white rounded-2xl font-black hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-200 flex items-center gap-2`}
                >
                  <CheckCircle2 size={24} className={isCompleted ? 'text-white' : 'text-brand-400'} />
                  {isCompleted ? 'પૂર્ણ કર્યું છે (પહેલેથી)' : 'પાઠ પૂર્ણ કરો'}
                </button>
                
                <button 
                  onClick={onBack}
                  className="text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
                >
                  બાકી રાખીને પાછા જાઓ
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- Login Component ---
export const Login: React.FC<{ onNavigate: (view: any) => void; onLogin: (user: any) => void }> = ({ onNavigate, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      setError('પાસવર્ડ રિસેટ કરવા માટે પહેલા તમારો ઈમેલ લખો.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('આ ઈમેલ સાથે કોઈ ખાતું મળ્યું નથી.');
      } else {
        setError('પાસવર્ડ રિસેટ રિક્વેસ્ટ મોકલવામાં ભૂલ આવી.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user);
    } catch (err: any) {
      console.error('Google login error:', err);
      // Handle the "Popup closed by user" error gracefully
      if (err.code === 'auth/popup-closed-by-user') {
        return; 
      }
      setError('Google લૉગિનમાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Pro Engineer Fix: Sanitize inputs (trim whitespace)
    const cleanEmail = email.trim();
    const cleanPassword = password; // Do not trim password as it can contain spaces at start/end intentionally

    try {
      const result = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      onLogin(result.user);
    } catch (err: any) {
      console.error('Email login error:', err);
      
      // Handle the generic "invalid-credential" with a user-friendly message
      if (err.code === 'auth/invalid-credential') {
        setError('ઈમેલ અથવા પાસવર્ડ ખોટો છે. મહેરબાની કરીને ફરી તપાસો.');
      } else if (err.code === 'auth/user-not-found') {
        setError('આ ઈમેલ સાથે કોઈ ખાતું મળ્યું નથી.');
      } else if (err.code === 'auth/wrong-password') {
        setError('પાસવર્ડ ખોટો છે.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('ઘણા અસફળ પ્રયાસો. થોડી વાર પછી ફરી પ્રયાસ કરો.');
      } else {
        setError('લૉગિન કરવામાં ભૂલ આવી. ફરી પ્રયાસ કરો.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 relative overflow-hidden px-4 py-10">
      {/* Background Orbs for Premium Feel */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-600 rounded-full blur-[120px] opacity-10 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-500 rounded-full blur-[120px] opacity-10 translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/90 backdrop-blur-2xl p-6 md:p-10 rounded-3xl md:rounded-[3rem] shadow-2xl border border-white/50 space-y-6 md:space-y-8 relative">
          <button 
            onClick={() => onNavigate('home')}
            className="absolute top-6 left-6 md:top-8 md:left-8 text-slate-400 hover:text-slate-600 transition-colors z-10"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="text-center space-y-2 md:space-y-3 pt-6 md:pt-4">
            <div className="inline-flex p-3 md:p-4 text-white rounded-2xl md:rounded-3xl shadow-xl mb-1 md:mb-2" style={{ backgroundColor: '#c3b091', boxShadow: '0 20px 25px -5px rgba(195, 176, 145, 0.4)' }}>
              <ShieldCheck size={32} className="md:w-10 md:h-10" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">ખાખી પથ</h2>
              <div className="font-bold text-xs md:text-sm tracking-widest uppercase mt-0.5 md:mt-1" style={{ color: '#c3b091' }}>Khakhi Path</div>
            </div>
            <p className="text-slate-500 text-xs md:text-sm font-medium px-4">પોલીસ ભરતી ૨૦૨૬ માટે ગુજરાતનું શ્રેષ્ઠ પલેટફોર્મ</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold"
              >
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleEmailLogin} className="space-y-5 md:space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">ઈમેલ એડ્રેસ</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (resetSent) setResetSent(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] py-4 md:py-5 pl-14 pr-4 outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-800"
                  placeholder="તમારો ઈમેલ"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">પાસવર્ડ</label>
                <button 
                  type="button" 
                  onClick={handlePasswordReset}
                  className="text-[10px] font-black text-brand-600 hover:text-brand-700 uppercase tracking-tighter"
                >
                  પાસવર્ડ ભૂલી ગયા?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] py-4 md:py-5 pl-14 pr-14 outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-800"
                  placeholder="ગુપ્ત પાસવર્ડ"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {resetSent && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center gap-3 text-green-700 text-xs font-bold"
                >
                  <CheckCircle2 size={16} />
                  તમારા ઈમેલ પર પાસવર્ડ રીસેટ કરવા માટે લીંક મોકલી છે.
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black py-4 md:py-5 rounded-[2rem] shadow-2xl shadow-slate-200 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 text-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Zap size={22} className="text-brand-400 fill-brand-400" />}
              {loading ? 'તપાસ થઈ રહી છે...' : 'લૉગિન કરો'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-white px-6 text-slate-400 font-black uppercase tracking-[0.3em]">અથવા</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-50 text-slate-700 font-bold py-5 rounded-[2rem] hover:bg-slate-50 hover:border-slate-100 transition-all active:scale-95 shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pjax/google.png" className="w-5 h-5" alt="Google" />
            Google વડે લૉગિન
          </button>
          
          <div className="pt-4 text-center">
            <p className="text-slate-500 font-medium">
              શું તમે નવા છો?{' '}
              <button 
                onClick={() => onNavigate('signup')}
                className="text-brand-600 font-black hover:text-brand-700 transition-colors border-b-2 border-brand-100 hover:border-brand-600"
              >
                નવું ખાતું બનાવો
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- SignUp Component ---
export const SignUp: React.FC<{ onNavigate: (view: any) => void; onSignUp: (user: any) => void }> = ({ onNavigate, onSignUp }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const checkUsernameUnique = async (username: string) => {
    try {
      const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
      return !usernameDoc.exists();
    } catch (err) {
      console.error('Error checking username:', err);
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cleanUsername = formData.username.toLowerCase().trim();
      const cleanEmail = formData.email.trim();
      const cleanName = formData.name.trim();
      
      // Basic validation
      if (formData.password.length < 6) {
        setError('પાસવર્ડ ઓછામાં ઓછો ૬ અક્ષરનો હોવો જોઈએ.');
        setLoading(false);
        return;
      }
      
      // 1. Check username uniqueness
      const isUnique = await checkUsernameUnique(cleanUsername);
      if (!isUnique) {
        setError('આ યુઝરનેમ પહેલેથી લેવાયેલું છે. બીજું પસંદ કરો.');
        setLoading(false);
        return;
      }

      // 2. Create Auth Account
      const result = await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
      const user = result.user;

      // 3. Create Database Profile and Username record
      await Promise.all([
        setDoc(doc(db, 'users', user.uid), {
          name: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          streak: 0,
          lastExamDate: null,
          createdAt: serverTimestamp(),
          elo: 1000
        }),
        setDoc(doc(db, 'usernames', cleanUsername), {
          uid: user.uid
        })
      ]);

      onSignUp(user);
    } catch (err: any) {
      console.error('SignUp error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('આ ઈમેલ પહેલેથી વપરાયેલ છે. મહેરબાની કરીને લૉગિન કરો અથવા બીજો ઈમેલ વાપરો.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('ઈમેલ રજીસ્ટ્રેશન હાલમાં બંધ છે.');
      } else {
        setError('ખાતું બનાવવામાં ભૂલ આવી. ફરી પ્રયાસ કરો.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user already exists in DB
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // If they don't exist, we need to create a profile
        // Since Google sign-in doesn't give us a custom username, we'll generate one
        const generatedUsername = (result.user.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'cadet') + Math.floor(Math.random() * 1000);
        
        // Wait, checking username uniqueness for generated one
        let finalUsername = generatedUsername;
        let isUnique = await checkUsernameUnique(finalUsername);
        let attempts = 0;
        while (!isUnique && attempts < 5) {
          finalUsername = generatedUsername + Math.floor(Math.random() * 1000);
          isUnique = await checkUsernameUnique(finalUsername);
          attempts++;
        }

        await Promise.all([
          setDoc(doc(db, 'users', result.user.uid), {
            name: result.user.displayName || 'કેડેટ',
            username: finalUsername,
            email: result.user.email,
            photoURL: result.user.photoURL,
            streak: 0,
            lastExamDate: null,
            createdAt: serverTimestamp(),
            elo: 1000
          }),
          setDoc(doc(db, 'usernames', finalUsername), {
            uid: result.user.uid
          })
        ]);
      }
      
      onSignUp(result.user);
    } catch (err: any) {
      console.error('Google sign-up error:', err);
      if (err.code === 'auth/popup-closed-by-user') return;
      setError('Google સાઈન-અપમાં ભૂલ આવી. ફરી પ્રયાસ કરો.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 relative overflow-hidden px-4 py-10">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-600 rounded-full blur-[120px] opacity-10 translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-500 rounded-full blur-[120px] opacity-10 -translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="relative w-full max-w-lg"
      >
        <div className="bg-white/90 backdrop-blur-2xl p-6 md:p-10 rounded-3xl md:rounded-[3.5rem] shadow-2xl border border-white/50 space-y-6 md:space-y-8 relative">
          <button 
            onClick={() => onNavigate('home')}
            className="absolute top-6 left-6 md:top-8 md:left-8 text-slate-400 hover:text-slate-600 transition-colors z-10"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="text-center space-y-2 md:space-y-3 pt-6 md:pt-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">નવું ખાતું બનાવો</h2>
            <p className="text-slate-500 text-sm md:text-base font-bold">તમારી ખાખીની સફરનો પહેલો કદમ</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-black"
              >
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSignUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">પૂરું નામ</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] py-5 pl-14 pr-4 outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-800"
                  placeholder="તમારું નામ"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">યુઝરનેમ</label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 font-black text-lg">@</span>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '')})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] py-5 pl-14 pr-4 outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-800"
                  placeholder="username"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">ઈમેલ એડ્રેસ</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] py-5 pl-14 pr-4 outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-800"
                  placeholder="તમારો ઈમેલ"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">પાસવર્ડ</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] py-5 pl-14 pr-12 outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-800"
                  placeholder="●●●●●●"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 pt-4 md:pt-6">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white font-black py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] shadow-2xl shadow-slate-200 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg md:text-xl"
              >
                {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24} className="text-brand-400" />}
                {loading ? 'નોંધણી થઈ રહી છે...' : 'રજીસ્ટ્રેશન કરો'}
              </button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-white px-6 text-slate-400 font-black uppercase tracking-[0.3em]">અથવા</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-50 text-slate-700 font-bold py-5 rounded-2xl md:rounded-[2rem] hover:bg-slate-50 hover:border-slate-100 transition-all active:scale-95 shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pjax/google.png" className="w-5 h-5" alt="Google" />
            Google વડે સાઈન-અપ
          </button>

          <div className="text-center pt-4">
            <p className="text-slate-500 font-bold">
              પહેલેથી ખાતું છે?{' '}
              <button 
                onClick={() => onNavigate('login')}
                className="text-brand-600 font-black hover:text-brand-700 transition-colors border-b-2 border-brand-100 hover:border-brand-600"
              >
                લૉગિન કરો
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export { Profile } from './Profile';
export const ReadingProgressBar: React.FC = () => {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    let requestRunning = false;

    const handleScroll = () => {
      if (!requestRunning) {
        requestRunning = true;
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
          setScroll(Math.min(100, Math.max(0, progress)));
          requestRunning = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isComplete = scroll >= 99.5;

  return (
    <div 
      className={`h-full transition-all duration-300 rounded-r-full shadow-lg ${
        isComplete 
          ? 'bg-emerald-500 shadow-emerald-200' 
          : 'bg-brand-600 shadow-brand-200'
      }`} 
      style={{ width: `${scroll}%` }} 
    />
  );
};

export const ReadingTimeEstimator: React.FC<{ content: string }> = ({ content }) => {
  const calculateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length || 0;
    const time = Math.ceil(words / wordsPerMinute);
    return Math.max(1, time);
  };

  const readingTime = calculateReadingTime(content);

  return (
    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
      <Timer size={14} />
      <span>{readingTime} મિનિટ વાંચન (Estimated)</span>
    </div>
  );
};
// --- Bookmarks View ---
export const BookmarksView: React.FC<{
  bookmarkedIds: string[];
  onBack: () => void;
  onSelectLesson: (lesson: Lesson) => void;
}> = ({ bookmarkedIds, onBack, onSelectLesson }) => {
  const allLessons = Object.values(lessonsData).flat();
  const savedLessons = allLessons.filter(lesson => bookmarkedIds.includes(lesson.id));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-800">તમારા સેવ કરેલા પાઠ</h2>
          <p className="text-slate-500 font-bold">ઝડપી પુનરાવર્તન માટે (Quick Revision)</p>
        </div>
      </div>

      {savedLessons.length > 0 ? (
        <div className="grid gap-4">
          {savedLessons.map((lesson, idx) => {
            const Icon = IconMap[lesson.icon] || BookOpen;
            return (
              <motion.div
                key={`saved-lesson-${lesson.id}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onSelectLesson(lesson)}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-brand-200 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${lesson.color} rounded-2xl flex items-center justify-center text-white shadow-sm`}>
                    {typeof lesson.icon === 'string' ? <Icon size={24} /> : lesson.icon}
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase">{lesson.subject}</div>
                    <h3 className="text-lg font-bold text-slate-800">{lesson.title}</h3>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-brand-600 transition-colors" />
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bookmark size={40} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">હજુ સુધી કોઈ પાઠ સેવ કર્યો નથી</h3>
          <p className="text-slate-500 font-bold max-w-sm mx-auto mb-8">
            મહત્વના પાઠો વાંચતી વખતે તમે તેને સેવ કરી શકો છો જેથી તેને પાછળથી ઝડપથી શોધી શકાય.
          </p>
          <button 
            onClick={onBack}
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black hover:scale-105 transition-all active:scale-95 shadow-xl shadow-slate-200"
          >
            પાઠ શોધવાનું શરૂ કરો
          </button>
        </div>
      )}
    </div>
  );
};

export const CurrentAffairsView: React.FC<{
  data: CurrentAffairsDaily | null;
  loading: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onBack: () => void;
}> = ({ data, loading, selectedDate, onDateChange, onBack }) => {
  const [aiExplanations, setAiExplanations] = useState<Record<number, string>>({});
  const [loadingAi, setLoadingAi] = useState<Record<number, boolean>>({});

  const handleAiExplain = async (article: CurrentAffairsArticle, idx: number) => {
    if (aiExplanations[idx] || loadingAi[idx]) return;
    
    setLoadingAi(prev => ({ ...prev, [idx]: true }));
    try {
      const explanation = await explainCurrentAffairs(article);
      setAiExplanations(prev => ({ ...prev, [idx]: explanation }));
    } catch (error) {
      console.error("AI Explain error:", error);
    } finally {
      setLoadingAi(prev => ({ ...prev, [idx]: false }));
    }
  };

  // Generate dates for the scrollable header (last 7 days)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    const guDays = ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'];
    return guDays[d.getDay()];
  };

  const getDayNum = (dateStr: string) => {
    return dateStr.split('-')[2];
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ગુજરાત વિશેષ': return 'bg-orange-500';
      case 'રાષ્ટ્રીય': return 'bg-blue-600';
      case 'આંતરરાષ્ટ્રીય': return 'bg-purple-600';
      case 'રમત-ગમત': return 'bg-green-600';
      case 'સંરક્ષણ': return 'bg-red-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900">ડેઈલી કરંટ અફેર્સ</h2>
              <p className="text-sm text-slate-500 font-bold">તમારી ખાખીની તૈયારી માટે દરરોજ નવું</p>
            </div>
          </div>

          {/* Date Chips */}
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {dates.map((date) => {
              const isActive = date === selectedDate;
              return (
                <button
                  key={date}
                  onClick={() => onDateChange(date)}
                  className={`flex-none w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all snap-start ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30 scale-110' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className={`text-[10px] uppercase font-black ${isActive ? 'text-brand-100' : 'text-slate-400'}`}>
                    {getDayName(date)}
                  </span>
                  <span className="text-xl font-black">{getDayNum(date)}</span>
                  {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={48} className="animate-spin mb-4" />
            <p className="font-bold">આજના સમાચાર તૈયાર થઈ રહ્યા છે...</p>
          </div>
        ) : data ? (
          <div className="space-y-8">
            {data.articles.map((article, idx) => (
              <motion.div
                key={`ca-${article.id || idx}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
              >
                <div className="p-6 sm:p-8">
                  {/* Category Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-wider ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {article.tags.map((tag, tagIdx) => (
                        <span key={`${tag}-${tagIdx}`} className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded">#{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Headline */}
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-4">
                    {article.headline_gu}
                  </h3>

                  {/* Details */}
                  <div className="text-slate-600 font-medium leading-relaxed mb-6 whitespace-pre-wrap text-sm sm:text-base">
                    {article.details_gu}
                  </div>

                  {/* Secret Weapon Element */}
                  <div className="bg-brand-50 border border-brand-100/50 rounded-2xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                      <Target size={64} className="text-brand-600" />
                    </div>
                    <div className="flex gap-3 relative z-10">
                      <div className="bg-brand-600 text-white p-2 rounded-xl h-fit shrink-0 shadow-lg shadow-brand-200">
                        <Lightbulb size={20} />
                      </div>
                      <div>
                        <h4 className="text-brand-800 font-black text-sm uppercase tracking-wider mb-1">પરીક્ષા માટે ખાસ (Exam Insights)</h4>
                        <p className="text-brand-900 font-bold text-sm leading-relaxed">
                          {article.key_takeaway_for_exam}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Tutor Section */}
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <AnimatePresence>
                      {aiExplanations[idx] ? (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-white rounded-2xl border-2 border-brand-100 p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-200">
                                <Brain size={20} />
                              </div>
                              <div>
                                <h4 className="text-brand-600 font-black text-sm uppercase tracking-widest leading-none">ખાખી પથ AI શિક્ષક</h4>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">વધારાની માહિતી અને સમજૂતી</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setAiExplanations(prev => {
                                const next = { ...prev };
                                delete next[idx];
                                return next;
                              })}
                              className="text-slate-300 hover:text-slate-500 transition-colors"
                            >
                              <X size={20} />
                            </button>
                          </div>
                          
                          <div className="text-slate-700 text-sm leading-relaxed markdown-body">
                            <Markdown>{aiExplanations[idx]}</Markdown>
                          </div>
                        </motion.div>
                      ) : (
                        <button 
                          onClick={() => handleAiExplain(article, idx)}
                          disabled={loadingAi[idx]}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                        >
                          {loadingAi[idx] ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <MessageSquare className="w-5 h-5 text-brand-400 fill-brand-400 transition-transform group-hover:scale-110" />
                          )}
                          {loadingAi[idx] ? 'AI શિક્ષક વિચારી રહ્યા છે...' : 'AI શિક્ષક પાસે સમજો (Detailed AI Explanation)'}
                        </button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <Newspaper size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-bold">કોઈ ડેટા મળ્યો નથી.</p>
          </div>
        )}
      </div>
    </div>
  );
};
