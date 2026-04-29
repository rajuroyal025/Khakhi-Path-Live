import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Target Date: June 14, 2026, 00:00:00 IST
const TARGET_DATE = new Date('2026-06-14T00:00:00+05:30').getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const CountdownTimer: React.FC = () => {
  const calculateTimeLeft = useCallback((): TimeLeft => {
    const now = new Date().getTime();
    const difference = TARGET_DATE - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  }, []);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const getTimeLabelInfo = () => {
    const daysLeft = timeLeft.days;
    if (timeLeft.total <= 0) {
      return {
        message: "શુભેચ્છાઓ! ખાખી તમારી રાહ જોઈ રહી છે.",
        subMessage: "Best of luck! The Khakhi awaits you.",
        color: "text-green-400",
        accent: "bg-green-500"
      };
    }
    if (daysLeft <= 30) {
      return {
        message: "પુનરાવર્તન અને રિવિજન શરૂ કરો! સમય ઓછો છે.",
        subMessage: "Review, revise, and conquer.",
        color: "text-orange-400",
        accent: "bg-orange-500"
      };
    }
    if (daysLeft <= 100) {
      return {
        message: "અંતિમ તૈયારી શરૂ કરો. ધ્યાન કેન્દ્રિત કરો!",
        subMessage: "The final sprint begins. Stay focused!",
        color: "text-brand-300",
        accent: "bg-brand-500"
      };
    }
    return {
      message: "સતત મહેનત પાયો મજબૂત કરે છે.",
      subMessage: "Consistent effort builds the foundation.",
      color: "text-brand-300",
      accent: "bg-brand-500"
    };
  };

  const status = getTimeLabelInfo();

  if (timeLeft.total <= 0) {
    return (
      <section className="px-4 py-8 max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-brand-500/5 backdrop-blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">MISSION ACCOMPLISHED!</h2>
            <p className="text-2xl font-bold text-brand-400">{status.message}</p>
            <p className="text-slate-400 font-medium uppercase tracking-widest mt-2">{status.subMessage}</p>
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8 max-w-5xl mx-auto">
      <motion.div 
        whileHover={{ boxShadow: "0 20px 40px -10px rgba(79, 70, 229, 0.2)" }}
        className="bg-slate-900 border border-slate-800 rounded-[3rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group transition-all duration-500"
      >
        {/* Background Accents */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px]"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.span 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1.5 bg-brand-600/20 border border-brand-500/30 rounded-full text-brand-400 text-xs font-bold tracking-[0.2em] uppercase mb-4"
            >
              MISSION CONSTABLE 2026
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              વરદી મેળવવા માટેનો સમય
              <span className="block text-slate-400 text-lg md:text-xl font-medium mt-2">Time to Earn the Uniform</span>
            </h2>
          </div>

          {/* Timer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full">
            <TimerBlock value={timeLeft.days} label="DAYS" guLabel="દિવસો" />
            <TimerBlock value={timeLeft.hours} label="HOURS" guLabel="કલાકો" />
            <TimerBlock value={timeLeft.minutes} label="MINS" guLabel="મિનિટો" />
            <TimerBlock value={timeLeft.seconds} label="SECS" guLabel="સેકન્ડો" />
          </div>

          {/* Dynamic Footer Message */}
          <div className="mt-10 pt-8 border-t border-slate-800 w-full text-center">
            <motion.p 
              key={status.message}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-lg md:text-xl font-bold ${status.color} italic`}
            >
              "{status.message}"
            </motion.p>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">{status.subMessage}</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

const TimerBlock: React.FC<{ value: number; label: string; guLabel: string }> = ({ value, label, guLabel }) => {
  return (
    <div className="relative group/block h-full">
      <div className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-4 py-8 md:py-10 flex flex-col items-center justify-center transition-all duration-300 group-hover/block:bg-slate-800/60 group-hover/block:border-brand-500/30">
        
        {/* Pulsing Highlight Dot */}
        <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-brand-500 rounded-full opacity-40 animate-ping"></div>

        <AnimatePresence mode="wait">
          <motion.div
            key={value}
            initial={{ y: 20, opacity: 0, rotateX: -90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: -20, opacity: 0, rotateX: 90 }}
            transition={{ duration: 0.4, ease: "backOut" }}
            className="text-5xl md:text-6xl lg:text-7xl font-black text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] tabular-nums mb-3"
          >
            {value.toString().padStart(2, '0')}
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] md:text-sm font-black text-white/90 tracking-widest">{label}</span>
          <span className="text-[8px] md:text-xs font-bold text-slate-500 tracking-wider">{guLabel}</span>
        </div>
      </div>
      
      {/* Subtle Neumorphic Shadow Effect */}
      <div className="absolute -bottom-2 inset-x-4 h-4 bg-black/20 rounded-[2rem] blur-md -z-10 opacity-0 group-hover/block:opacity-100 transition-opacity"></div>
    </div>
  );
};
