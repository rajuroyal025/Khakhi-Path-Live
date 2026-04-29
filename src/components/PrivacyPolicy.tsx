import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Lock, Trash2, Mail, Globe, CheckCircle2, Scale, Info, FileText } from 'lucide-react';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'privacy' | 'terms';

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('privacy');

  const containerVariants = {
    hidden: { opacity: 0, y: 100, scale: 0.9, rotateX: -10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      rotateX: 0,
      transition: { 
        type: "spring" as const,
        damping: 25,
        stiffness: 200,
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: 100, 
      scale: 0.9, 
      rotateX: 10,
      transition: { duration: 0.3 }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 md:p-8 perspective-1000">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white dark:bg-[#070708] w-full max-w-4xl h-[85vh] rounded-3xl sm:rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-white/5 flex flex-col md:flex-row overflow-hidden"
          >
            {/* Elite Side Rail (Desktop) */}
            <div className="hidden md:flex w-24 bg-[#c3b091] dark:bg-[#1a1814] border-r border-white/10 flex-col items-center justify-between py-12 shrink-0">
               <div className="vertical-rl transform rotate-180 flex items-center gap-6">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] whitespace-nowrap">ESTABLISHED 2024</span>
                  <div className="h-12 w-[1px] bg-white/20"></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] whitespace-nowrap">ELITE CADET PROTOCOL</span>
               </div>
               <div className="flex flex-col gap-6 items-center">
                  <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                     <Shield size={18} className="text-white/60" />
                  </div>
                  <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                     <Scale size={18} className="text-white/60" />
                  </div>
               </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="p-5 md:p-8 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-[#c3b091] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#c3b091]/20 shrink-0">
                    <Shield size={24} className="md:w-7 md:h-7" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none truncate">Privacy & Terms</h2>
                    <div className="flex items-center gap-2 md:gap-3 mt-1 md:mt-2">
                       <div className="w-2 h-2 bg-[#c3b091] rounded-full animate-pulse shadow-[0_0_8px_#c3b091]"></div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Security Protocol Active</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl flex-1 sm:flex-none">
                      <button 
                        onClick={() => setActiveTab('privacy')}
                        className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${
                          activeTab === 'privacy' 
                            ? 'bg-white dark:bg-slate-800 text-[#c3b091] shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        Privacy
                      </button>
                      <button 
                        onClick={() => setActiveTab('terms')}
                        className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${
                          activeTab === 'terms' 
                            ? 'bg-white dark:bg-slate-800 text-[#c3b091] shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        Terms
                      </button>
                   </div>
                   <button 
                    onClick={onClose}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-90 border border-slate-200 dark:border-white/10 group scroll-ml-auto"
                  >
                    <X size={20} className="md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-300 dark:text-white" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-10 space-y-8 md:space-y-12 custom-scrollbar bg-white dark:bg-transparent">
                <AnimatePresence mode="wait">
                  {activeTab === 'privacy' ? (
                    <motion.div
                      key="privacy-content"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-12"
                    >
                      <section className="space-y-6">
                        <div className="bg-slate-50 dark:bg-white/[0.02] p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-[#c3b091]/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#c3b091]/10 transition-colors"></div>
                           <div className="flex items-center gap-3 mb-4">
                              <Info size={16} className="text-[#c3b091]" />
                              <span className="text-[10px] font-black text-[#c3b091] uppercase tracking-widest">Introduction</span>
                           </div>
                           <p className="text-slate-600 dark:text-slate-400 font-serif text-lg leading-relaxed italic">
                             "At Khakhi Path, we view your data as a sacred trust. Our goal is to provide a world-class training ground for Gujarat's future guardians while maintaining absolute transparency in how we handle your digital identity."
                           </p>
                           <div className="mt-6 flex items-center gap-4">
                              <div className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Version 2.1.0</span>
                              </div>
                              <div className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Released: April 2026</span>
                              </div>
                           </div>
                        </div>
                      </section>

                      <motion.section variants={sectionVariants} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-1.5 h-8 bg-[#c3b091] rounded-full"></div>
                          <h3 className="text-2xl font-black dark:text-white tracking-tight">1. Data Capture Profile</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="bg-white dark:bg-white/[0.02] p-6 rounded-3xl border border-slate-100 dark:border-white/5 hover:border-[#c3b091]/30 transition-colors group">
                            <div className="flex items-center gap-4 mb-3">
                               <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#c3b091] group-hover:bg-[#c3b091] group-hover:text-white transition-all">
                                  <Lock size={20} />
                               </div>
                               <span className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wide">Identity Data</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">Unique identifiers including your full name, authenticated email, and chosen profile representation.</p>
                          </div>
                          <div className="bg-white dark:bg-white/[0.02] p-6 rounded-3xl border border-slate-100 dark:border-white/5 hover:border-[#c3b091]/30 transition-colors group">
                            <div className="flex items-center gap-4 mb-3">
                               <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#c3b091] group-hover:bg-[#c3b091] group-hover:text-white transition-all">
                                  <Globe size={20} />
                               </div>
                               <span className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wide">Performance Metrics</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">Securely stored test scores, time-on-task, and diagnostic study trends to power personal mentorship.</p>
                          </div>
                        </div>
                      </motion.section>

                      <motion.section variants={sectionVariants} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-1.5 h-8 bg-[#c3b091] rounded-full"></div>
                          <h3 className="text-2xl font-black dark:text-white tracking-tight">2. Algorithmic Processing</h3>
                        </div>
                        <div className="bg-slate-950 dark:bg-brand-900/10 p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
                           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(195,176,145,0.15),transparent)]"></div>
                           <p className="text-slate-300 text-base leading-relaxed font-medium relative z-10">
                             Your data serves four critical architectural functions in the Khakhi Path ecosystem:
                           </p>
                           <ul className="space-y-4 relative z-10">
                              {[
                                "Identity Verification & Secure Entry via OTP",
                                "Adaptive Learning Analysis for 'My Mistakes' profiling",
                                "Global High-Score synchronization for Peer Competition",
                                "Generation of your unique Virtual Cadet ID Card"
                              ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-4 text-sm font-medium group">
                                   <div className="mt-1 flex-shrink-0">
                                      <CheckCircle2 size={16} className="text-[#c3b091] group-hover:scale-125 transition-transform" />
                                   </div>
                                   <span className="text-slate-100">{item}</span>
                                </li>
                              ))}
                           </ul>
                        </div>
                      </motion.section>

                      <motion.section variants={sectionVariants} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-1.5 h-8 bg-red-600 rounded-full"></div>
                          <h3 className="text-2xl font-black dark:text-white tracking-tight">3. Sovereignty & Deletion</h3>
                        </div>
                        <div className="border-2 border-dashed border-red-500/20 p-8 rounded-[2.5rem] bg-red-500/[0.02] flex flex-col md:flex-row gap-8 items-start">
                           <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10 shrink-0">
                             <Trash2 size={32} />
                           </div>
                           <div className="space-y-4">
                              <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Account Termination Rights</span>
                              <h4 className="text-xl font-bold dark:text-white">Request Systematic Removal</h4>
                              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                                You possess the ultimate authority over your digital presence. To initiate total data erasure, navigate to <span className="font-bold text-slate-900 dark:text-slate-100 underline decoration-[#c3b091] decoration-2 underline-offset-4">Profile &gt; Safety &gt; Delete My Account</span>. This action is irreversible and synchronous.
                              </p>
                           </div>
                        </div>
                      </motion.section>

                      <div className="pt-12 flex flex-col items-center gap-6">
                         <div className="h-[1px] w-full bg-slate-100 dark:bg-white/5"></div>
                         <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Cadet Protocol</p>
                            <p className="text-[9px] text-slate-300 dark:text-slate-600 font-medium">© 2026 KHAKHI PATH. ALL RIGHTS PROTECTED.</p>
                         </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="terms-content"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-12"
                    >
                      <section className="space-y-6">
                        <div className="bg-[#c3b091] p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                           <div className="flex items-center gap-3 mb-4 relative z-10">
                              <Scale size={20} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Code of Conduct</span>
                           </div>
                           <h3 className="text-3xl font-black tracking-tighter mb-4 relative z-10">Elite Academic Terms</h3>
                           <p className="text-white/80 font-medium text-base leading-relaxed relative z-10">
                             By accessing the Khakhi Path training environment, you enter into a professional covenant. These terms ensure the integrity, dignity, and technological stability of our community.
                           </p>
                        </div>
                      </section>

                      <motion.section variants={sectionVariants} className="space-y-8">
                         {[
                           {
                             title: "Usage Protocol",
                             desc: "Khakhi Path is intended for lawful educational purposes exclusively related to Gujarat Police competitive examinations. Unauthorized scraping or distribution of premium academy resources is strictly prohibited.",
                             icon: <Globe size={20} />
                           },
                           {
                             title: "Account Integrity",
                             desc: "Cadets are responsible for the security of their authenticated session. Sharing entry credentials (OTP) violates our security trust and may result in immediate terminal deactivation.",
                             icon: <Lock size={20} />
                           },
                           {
                             title: "Ethical Conduct",
                             desc: "Engagement within public domains (Leaderboards, Arena) must maintain the highest standard of decorum. Harassment or deceptive manipulation of scores is cause for permanent removal.",
                             icon: <Shield size={20} />
                           }
                         ].map((item, idx) => (
                           <div key={idx} className="flex gap-6 group">
                              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center text-[#c3b091] shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                                 {item.icon}
                              </div>
                              <div className="space-y-2">
                                 <h4 className="text-lg font-black dark:text-white tracking-tight">{item.title}</h4>
                                 <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-serif italic">{item.desc}</p>
                              </div>
                           </div>
                         ))}
                      </motion.section>

                      <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-4">
                         <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                            <FileText size={18} className="text-[#c3b091]" />
                            <span className="font-black text-xs uppercase tracking-[0.2em]">Contact Information</span>
                         </div>
                         <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                           For questions regarding these Elite Terms or to report protocol violations, please contact our administrative desk:
                         </p>
                         <div className="flex items-center gap-3 text-[#c3b091] font-black text-sm tracking-wide bg-white dark:bg-slate-800 w-fit px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
                            <Mail size={16} />
                            <span>rajuroyal025@gmail.com</span>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer Action */}
              <div className="p-6 md:p-8 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 shrink-0 flex items-center justify-between gap-6">
                <div className="hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acknowledgment Required</p>
                  <p className="text-[9px] text-slate-300 dark:text-slate-600 font-medium mt-1 uppercase tracking-wider">Tap below to confirm your status as an elite cadet</p>
                </div>
                <button 
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-12 py-5 bg-slate-950 dark:bg-[#c3b091] text-white dark:text-black rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  Confirm & Continue
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
        .vertical-rl {
          writing-mode: vertical-rl;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </AnimatePresence>
  );
};

