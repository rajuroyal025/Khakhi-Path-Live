import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  Download, 
  AlertCircle, 
  Moon, 
  Bell, 
  PhoneCall, 
  LogOut, 
  ChevronRight, 
  Trophy, 
  Target, 
  ArrowLeft,
  User,
  MapPin,
  Shield,
  CreditCard,
  RotateCw,
  Sun,
  FileText,
  ExternalLink,
  Mail,
  HelpCircle,
  MessageSquare,
  UserX,
  Trash2,
  X,
  CheckCircle2,
  Instagram,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, getDocs, query, where, auth, deleteUser, deleteDoc, doc, orderBy, limit, getDoc, updateDoc } from '../firebase';

interface ProfileProps {
  user: any;
  onNavigate: (view: any) => void;
  onUpdate: (newData: any) => void;
  onLogout: () => void;
}

type SubView = 'main' | 'saved' | 'downloads' | 'mistakes' | 'notifications' | 'help' | 'edit';

// --- Sub-View: Saved MCQs ---
const SavedMCQs: React.FC<{ uid: string, onBack: () => void }> = ({ uid, onBack }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const savedRef = collection(db, 'users', uid, 'saved');
        const q = query(savedRef, orderBy('savedAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(data);
      } catch (error) {
        console.error("Error fetching saved questions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, [uid]);

  const removeSaved = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid, 'saved', id));
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error removing saved question:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black">સાચવેલા પ્રશ્નો</h2>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <RotateCw className="animate-spin text-brand-600" size={32} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-100 dark:border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
            <Bookmark size={32} />
          </div>
          <p className="text-slate-500 font-bold">તમે હજુ સુધી કોઈ પ્રશ્ન સેવ કર્યો નથી.</p>
          <p className="text-slate-400 text-sm">ટેસ્ટ દરમિયાન પ્રશ્નોને સેવ કરવા માટે બુકમાર્ક આઇકન પર ક્લિક કરો.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={`saved-mcq-${item.id || idx}-${idx}`} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3 relative group">
              <div className="flex justify-between items-start gap-4">
                <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">{item.question.subject}</span>
                <button 
                  onClick={() => removeSaved(item.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                {item.question.text}
              </h4>
              <div className="grid gap-2">
                {item.question.options.map((opt: string, optIdx: number) => (
                  <div 
                    key={optIdx}
                    className={`p-3 rounded-xl text-sm font-medium ${optIdx === item.question.correctAnswer ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-transparent'}`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Sub-View: Downloaded Materials ---
const DownloadedMaterials: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const materials = [
    { title: 'ગુજરાતનો ઇતિહાસ - ક્વિક રિવિઝન', size: '2.4 MB', type: 'PDF' },
    { title: 'બંધારણના મહત્વના અનુચ્છેદો', size: '1.8 MB', type: 'PDF' },
    { title: 'વિકલી કરંટ અફેર્સ - એપ્રિલ સપ્તાહ ૧', size: '4.1 MB', type: 'PDF' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black">મટીરીયલ્સ</h2>
      </div>
      <div className="space-y-3">
        {materials.map((m, idx) => (
          <div key={`material-${idx}`} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-brand-200 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="font-bold">{m.title}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.size} • {m.type}</p>
              </div>
            </div>
            <button className="p-2 text-slate-300 hover:text-brand-600 transition-colors">
              <Download size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Sub-View: My Mistakes ---
const MyMistakes: React.FC<{ uid: string, onBack: () => void }> = ({ uid, onBack }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMistakes = async () => {
      try {
        const mistakesRef = collection(db, 'users', uid, 'mistakes');
        const q = query(mistakesRef, orderBy('missedAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(data);
      } catch (error) {
        console.error("Error fetching mistakes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMistakes();
  }, [uid]);

  const removeMistake = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid, 'mistakes', id));
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error removing mistake:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black">મારી ભૂલો (My Mistakes)</h2>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <RotateCw className="animate-spin text-orange-500" size={32} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 p-10 rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 bg-white dark:bg-slate-900 text-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle size={32} />
          </div>
          <p className="text-orange-900 dark:text-orange-200 font-bold">શાબાશ! તમે હજુ સુધી કોઈ ભૂલ કરી નથી.</p>
          <p className="text-orange-700/60 dark:text-orange-400/60 text-sm">ટેસ્ટ આપવાનું ચાલુ રાખો, જે પ્રશ્નો ખોટા પડશે તે અહીં દેખાશે.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-900/30">
            <p className="text-xs font-bold text-orange-800 dark:text-orange-300 leading-relaxed">
              અહીં એવા પ્રશ્નો છે જેનો તમે ટેસ્ટ દરમિયાન ખોટો જવાબ આપ્યો હતો. આને વારંવાર રીવાઈઝ કરો.
            </p>
          </div>
          {items.map((item, idx) => (
            <div key={`mistake-${item.id || idx}-${idx}`} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{item.question.subject}</span>
                <button onClick={() => removeMistake(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <h4 className="font-bold leading-relaxed">{item.question.text}</h4>
              <div className="space-y-2">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 text-sm flex items-center gap-3">
                  <X size={16} />
                  <span>તમારો જવાબ: <b>{item.question.options[item.userAnswer]}</b></span>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-100 dark:border-green-900/30 text-sm flex items-center gap-3">
                  <CheckCircle2 size={16} />
                  <span>સાચો જવાબ: <b>{item.question.options[item.question.correctAnswer]}</b></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Sub-View: Edit Profile ---
const EditProfile: React.FC<{ user: any, onBack: () => void, onUpdate: (newData: any) => void }> = ({ user, onBack, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    phone: user.phone || '',
    district: user.district || '',
    targetExam: user.targetExam || 'PSI/ASI'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        fullName: formData.fullName,
        district: formData.district,
        targetExam: formData.targetExam
      });
      onUpdate(formData);
      onBack();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black">પ્રોફાઇલ એડિટ કરો</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 ml-1">પૂરું નામ</label>
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="તમારું પૂરું નામ લખો"
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 ml-1">જિલ્લો</label>
          <div className="relative">
            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={formData.district}
              onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
              placeholder="તમારો જિલ્લો"
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 ml-1">લક્ષ્ય પરીક્ષા</label>
          <div className="relative">
            <Target size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={formData.targetExam}
              onChange={(e) => setFormData(prev => ({ ...prev, targetExam: e.target.value }))}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all appearance-none"
            >
              {['PSI/ASI', 'Constable', 'Clerk', 'GPSC', 'Other'].map(exam => (
                <option key={exam} value={exam}>{exam}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          type="submit"
          disabled={saving}
          className="w-full bg-brand-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-brand-200 dark:shadow-none hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
        >
          {saving ? <RotateCw className="animate-spin" size={20} /> : 'ફેરફાર સાચવો'}
        </button>
      </form>
    </div>
  );
};

// --- Sub-View: Notifications ---
const NotificationSettings: React.FC<{ uid: string, onBack: () => void }> = ({ uid, onBack }) => {
  const [settings, setSettings] = useState({
    dailyTest: true,
    weeklyUpdates: false,
    duelChallenges: true,
    newMaterials: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists() && userDoc.data().notifications) {
          setSettings(userDoc.data().notifications);
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [uid]);

  const toggleSetting = async (id: string) => {
    const newVal = !settings[id as keyof typeof settings];
    const newSettings = { ...settings, [id]: newVal };
    setSettings(newSettings);
    
    try {
      await updateDoc(doc(db, 'users', uid), {
        notifications: newSettings
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black">નોટિફિકેશન સેટિંગ્સ</h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-20">
          <RotateCw className="animate-spin text-brand-600" size={32} />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm divide-y divide-slate-50 dark:divide-slate-800">
          {[
            { id: 'dailyTest', label: 'દૈનિક ટેસ્ટ રિમાઈન્ડર' },
            { id: 'weeklyUpdates', label: 'સાપ્તાહિક રીપોર્ટ' },
            { id: 'duelChallenges', label: 'બેટલ ચેલેન્જ નોટિફિકેશન' },
            { id: 'newMaterials', label: 'નવા મટીરીયલની અપડેટ' }
          ].map(({ id, label }) => (
            <div key={id} className="flex items-center justify-between p-5">
              <span className="font-bold">{label}</span>
              <button 
                onClick={() => toggleSetting(id)}
                className={`w-12 h-6 rounded-full transition-all relative ${settings[id as keyof typeof settings] ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings[id as keyof typeof settings] ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Sub-View: Help ---
const HelpSupport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const contactItems = [
    { icon: Mail, label: 'ઈમેલ સપોર્ટ', value: 'rajuroyal025@gmail.com', href: 'mailto:rajuroyal025@gmail.com', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
    { icon: Instagram, label: 'ઇન્સ્ટાગ્રામ ફોલો કરો', value: '@raju.royal', href: 'https://www.instagram.com/raju.royal/', color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400' },
    { icon: HelpCircle, label: 'વિશેષ મદદ', value: 'ડાયરેક્ટ મેસેજ (DM) કરો', href: 'https://www.instagram.com/raju.royal/', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black">સંપર્ક અને મદદ</h2>
      </div>
      <div className="space-y-4">
        {contactItems.map((item, idx) => (
          <a 
            key={`help-item-${idx}`} 
            href={item.href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group transition-all hover:border-brand-200"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${item.color}`}>
                <item.icon size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</h4>
                <p className="font-bold">{item.value}</p>
              </div>
            </div>
            <ExternalLink size={18} className="text-slate-300 group-hover:text-brand-600 transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
};

// --- Component 1: The "Virtual Cadet ID" ---
const VirtualCadetID: React.FC<{ user: any }> = ({ user }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const cadetNumber = `KP-${new Date(user?.createdAt?.seconds * 1000 || Date.now()).getFullYear()}-${(user?.uid || '0000').slice(-4).toUpperCase()}`;
  const joinDate = user?.createdAt?.seconds 
    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('gu-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '10 March 2026';

  return (
    <div 
      className="relative w-full max-w-[420px] aspect-[1.6/1] perspective-1000 group cursor-pointer mx-auto"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full transition-all duration-700 preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 80 }}
      >
        {/* Front Side */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl sm:rounded-[2rem] bg-[#020617] p-5 sm:p-7 text-white shadow-2xl border border-white/10 overflow-hidden flex flex-col justify-between">
          {/* Visual Background Elements */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" className="text-white">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[10px] font-black tracking-[0.3em] text-brand-400 uppercase leading-none mb-1">KHAKHI PATH</span>
              <span className="text-[7px] sm:text-[8px] font-bold opacity-40 uppercase tracking-widest">Virtual Credential</span>
            </div>
            {/* Simulated Chip */}
            <div className="w-8 h-6 sm:w-10 sm:h-8 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-200 rounded-md border border-amber-500/30 flex flex-col gap-1 p-1 sm:p-1.5 shadow-inner">
               <div className="h-full w-full border border-amber-900/10 rounded-sm flex items-center justify-center p-0.5">
                  <div className="w-full h-full grid grid-cols-3 gap-0.5 opacity-40">
                    {[...Array(6)].map((_, i) => <div key={i} className="bg-amber-900/30 rounded-[1px]"></div>)}
                  </div>
               </div>
            </div>
          </div>

          <div className="flex gap-4 sm:gap-6 items-center relative z-10 mt-1 sm:mt-2">
            <div className="relative group/avatar shrink-0">
               <div className="absolute -inset-1 bg-gradient-to-tr from-brand-500 to-khaki-500 rounded-2xl blur opacity-20 transition duration-500 group-hover/avatar:opacity-40"></div>
               <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border border-white/20 bg-slate-950 overflow-hidden shadow-2xl">
                <img 
                  src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2 overflow-hidden flex-1">
              <div>
                <h2 className="text-lg sm:text-2xl font-black truncate text-white leading-none mb-1">{user?.fullName || user?.displayName || 'કેડેટ'}</h2>
                <div className="h-0.5 w-12 bg-khaki-600 rounded-full"></div>
              </div>

              <div className="space-y-1 sm:space-y-1.5 pt-1">
                <div className="flex flex-col">
                  <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest">કેડેટ આઈડી</span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-brand-300 leading-none">{cadetNumber}</span>
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex flex-col">
                    <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest">શ્રેણી</span>
                    <span className="text-[10px] sm:text-xs font-bold leading-none">{user?.targetExam || 'POLICE PSI/ASI'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest">જિલ્લો</span>
                    <span className="text-[10px] sm:text-xs font-bold leading-none">{user?.district || 'GUJARAT'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end relative z-10">
            <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                   {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-brand-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>)}
                </div>
                <span className="text-[6px] sm:text-[7px] font-mono text-brand-500/60 font-bold uppercase">System Active // Secure-X Encrypted</span>
            </div>
            
            {/* Simulated QR Code Area */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 rounded-lg p-1 border border-white/10">
               <div className="w-full h-full grid grid-cols-5 gap-0.5 opacity-60">
                 {[...Array(25)].map((_, i) => (
                   <div key={i} className={`rounded-[1px] ${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}`}></div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rounded-3xl sm:rounded-[2rem] bg-gradient-to-br from-slate-900 to-brand-950 p-6 sm:p-8 text-white shadow-2xl border border-white/10 flex flex-col justify-between"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <div className="space-y-4 sm:space-y-6">
             <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-brand-400" />
                  <span className="text-[9px] sm:text-[10px] font-black tracking-widest opacity-60 uppercase">CADET AUTHENTICATION</span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-brand-300">VALID 2026-27</span>
             </div>
             
             <div className="grid grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4">
               <div className="space-y-1">
                 <span className="text-[7px] sm:text-[8px] font-black opacity-40 uppercase tracking-widest">જોડાણ તારીખ</span>
                 <p className="text-xs sm:text-sm font-bold">{joinDate}</p>
               </div>
               <div className="space-y-1">
                 <span className="text-[7px] sm:text-[8px] font-black opacity-40 uppercase tracking-widest">કુલ પ્રોગ્રેસ</span>
                 <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-bold text-brand-300">74%</p>
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-brand-500 w-[74%]"></div>
                    </div>
                 </div>
               </div>
               <div className="space-y-1">
                 <span className="text-[7px] sm:text-[8px] font-black opacity-40 uppercase tracking-widest">પરીક્ષા ક્ષમતા</span>
                 <p className="text-xs sm:text-sm font-bold">Grade A+</p>
               </div>
               <div className="space-y-1">
                 <span className="text-[7px] sm:text-[8px] font-black opacity-40 uppercase tracking-widest">સુરક્ષા વિગતો</span>
                 <p className="text-[9px] sm:text-[10px] font-mono font-bold opacity-60">AUTH-0482-SYS</p>
               </div>
             </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="text-center italic text-xs sm:text-sm font-medium text-brand-200 leading-relaxed border-t border-white/5 pt-3 sm:pt-4">
               "પરસેવો પાડીને મેળવેલી ખાખીનો રંગ ક્યારેય ઉતરતો નથી."
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Component 2: Performance Dashboard (Bento) ---
const PerformanceDashboard: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-[1.8rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between col-span-1"
      >
        <span className="mono-label">કુલ ટેસ્ટ</span>
        <div className="mt-1 sm:mt-2 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{user.totalTests || 0}</span>
          <span className="text-[9px] sm:text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1 sm:px-1.5 py-0.5 rounded-md leading-none">+1</span>
        </div>
      </motion.div>

      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-[1.8rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between col-span-1"
      >
        <span className="mono-label">સરેરાશ સ્કોર</span>
        <div className="mt-1 sm:mt-2 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-black text-brand-600 leading-none">82<span className="text-xs sm:text-sm opacity-60">%</span></span>
        </div>
      </motion.div>

      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-[#0f172a] p-4 sm:p-5 rounded-2xl sm:rounded-[1.8rem] text-white flex flex-col justify-between shadow-xl shadow-slate-200 dark:shadow-none col-span-2 md:col-span-1 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[60px] opacity-20 -mr-16 -mt-16 group-hover:opacity-40 transition-opacity"></div>
        <div className="flex justify-between items-start relative z-10">
            <span className="text-[9px] sm:text-[10px] font-black text-brand-400 uppercase tracking-widest leading-none">રાજ્યમાં રેન્ક</span>
            <Trophy size={16} className="text-amber-400 sm:w-[18px] sm:h-[18px]" />
        </div>
        <div className="mt-1 sm:mt-2 relative z-10">
          <div className="flex items-baseline gap-1">
             <span className="text-[10px] sm:text-xs opacity-60 leading-none">#</span>
             <span className="text-2xl sm:text-3xl font-black leading-none">124</span>
          </div>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400">ટોપ 5% કેડેટ્સમાં સામેલ</p>
        </div>
      </motion.div>
    </div>
  );
};

// --- Component 3 & 4: Menu Lists ---
const MenuList: React.FC<{ 
  items: { icon: any, label: string, badge?: string, color?: string, onClick: () => void }[] 
}> = ({ items }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {items.map((item, idx) => (
        <button 
          key={`menu-item-${idx}`}
          onClick={item.onClick}
          className={`w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${idx !== items.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${item.color || 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <item.icon size={20} />
            </div>
            <span className={`font-bold text-sm sm:text-base ${item.color?.includes('red') ? 'text-red-600' : 'text-slate-700 dark:text-slate-200'}`}>
              {item.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {item.badge && (
              <span className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                {item.badge}
              </span>
            )}
            <ChevronRight size={18} className="text-slate-300" />
          </div>
        </button>
      ))}
    </div>
  );
};

// --- Component: Delete Confirmation Modal ---
const DeleteAccountModal: React.FC<{ 
  onConfirm: () => void, 
  onCancel: () => void, 
  isDeleting: boolean 
}> = ({ onConfirm, onCancel, isDeleting }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 shadow-2xl border border-slate-100 dark:border-slate-800"
      >
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <Trash2 size={32} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black">એકાઉન્ટ ડિલીટ કરવું છે?</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold leading-relaxed">
            આ કરવાથી તમારો બધો ડેટા, ટેસ્ટ સ્કોર અને પ્રોગ્રેસ કાયમ માટે ડિલીટ થઈ જશે. આ પ્રક્રિયા પાછી ખેંચી શકાશે નહીં.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button 
            disabled={isDeleting}
            onClick={onConfirm}
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-200 dark:shadow-none hover:bg-red-700 transition-all flex items-center justify-center gap-2"
          >
            {isDeleting ? <RotateCw size={20} className="animate-spin" /> : 'હા, ડિલીટ કરો'}
          </button>
          <button 
            disabled={isDeleting}
            onClick={onCancel}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black transition-all"
          >
            ના, રહેવા દો
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const Profile: React.FC<ProfileProps> = ({ user, onNavigate, onLogout, onUpdate }) => {
  const [activeSubView, setActiveSubView] = useState<SubView>('main');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const toggleDarkMode = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    if (newVal) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  }, []);

  const actionItems = [
    { icon: Bot, label: 'સુપર ખાખી AI મેન્ટર (AI Assistant)', badge: 'NEW', color: 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400', onClick: () => window.dispatchEvent(new CustomEvent('open-super-khaki')) },
    { icon: Bookmark, label: 'સાચવેલા પાઠ (Saved Lessons)', onClick: () => onNavigate('bookmarks') },
    { icon: Bookmark, label: 'સાચવેલા પ્રશ્નો (Saved MCQs)', onClick: () => setActiveSubView('saved') },
    { icon: Download, label: 'ડાઉનલોડ કરેલ મટીરીયલ (Downloaded Materials)', onClick: () => setActiveSubView('downloads') },
    { icon: AlertCircle, label: 'મારી ભૂલો (My Mistakes)', badge: 'PREMIUM', color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400', onClick: () => setActiveSubView('mistakes') },
  ];

  const systemItems = [
    { icon: User, label: 'પ્રોફાઇલ એડિટ કરો (Edit Profile)', onClick: () => setActiveSubView('edit') },
    { icon: darkMode ? Sun : Moon, label: darkMode ? 'લાઈટ મોડ (Light Mode)' : 'ડાર્ક મોડ (Dark Mode)', badge: darkMode ? 'ON' : 'OFF', onClick: toggleDarkMode },
    { icon: Bell, label: 'નોટિફિકેશન સેટિંગ્સ (Notification Settings)', onClick: () => setActiveSubView('notifications') },
    { icon: Shield, label: 'ગોપનીયતા નીતિ (Privacy Policy)', onClick: () => window.dispatchEvent(new CustomEvent('open-privacy')) },
    { icon: PhoneCall, label: 'સંપર્ક અને મદદ (Help & Support)', onClick: () => setActiveSubView('help') },
    { icon: LogOut, label: 'લોગ આઉટ (Log Out)', color: 'bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400', onClick: onLogout },
    { icon: UserX, label: 'એકાઉન્ટ ડિલીટ કરો (Delete Account)', color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400', onClick: () => setShowDeleteConfirm(true) },
  ];

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    
    setIsDeleting(true);
    try {
      // 1. Delete user document from Firestore
      await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      
      // 2. Delete user from Firebase Auth
      await deleteUser(auth.currentUser);
      
      // 3. Navigate back to home/login
      onNavigate('home');
    } catch (error: any) {
      console.error("Account deletion error:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("સુરક્ષાના કારણોસર, એકાઉન્ટ ડિલીટ કરવા માટે તમારે ફરીથી લોગિન કરવું પડશે. કૃપા કરીને લોગ આઉટ કરીને ફરી લોગિન કરો.");
      } else {
        alert("ક્ષમા કરશો, એકાઉન્ટ ડિલીટ કરવામાં ભૂલ આવી છે. કૃપા કરીને પછી પ્રયાસ કરો.");
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className={`min-h-screen pb-20 overflow-x-hidden transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-xl mx-auto px-4 space-y-8 pt-8">
        
        <AnimatePresence>
          {showDeleteConfirm && (
            <DeleteAccountModal 
              onConfirm={handleDeleteAccount} 
              onCancel={() => setShowDeleteConfirm(false)} 
              isDeleting={isDeleting}
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeSubView === 'main' ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => onNavigate('home')} 
                  className={`p-3 rounded-2xl shadow-sm border transition-colors active:scale-90 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-500 hover:text-slate-800'}`}
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h1 className="text-2xl font-black leading-tight">પ્રોફાઇલ</h1>
                  <p className="text-sm text-slate-500 font-bold">તમારો પ્રોગ્રેસ અને સેટિંગ્સ</p>
                </div>
              </div>

              <section>
                <VirtualCadetID user={user} />
                <p className="text-center mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  3D વ્યૂ માટે કાર્ડ પર ટેપ કરો
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                   <div className="w-1.5 h-4 bg-brand-600 rounded-full"></div>
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">પરફોર્મન્સ ડેશબોર્ડ</h3>
                </div>
                <PerformanceDashboard user={user} />
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                   <div className="w-1.5 h-4 bg-brand-600 rounded-full"></div>
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">લાઈબ્રેરી</h3>
                </div>
                <MenuList items={actionItems} />
              </section>

              <section className="space-y-4 pb-12">
                <div className="flex items-center gap-2 px-1">
                   <div className="w-1.5 h-4 bg-slate-400 rounded-full"></div>
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">સેટિંગ્સ</h3>
                </div>
                <MenuList items={systemItems} />
              </section>
            </motion.div>
          ) : (
            <motion.div
              key={activeSubView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="pt-4"
            >
              {activeSubView === 'saved' && <SavedMCQs uid={user.uid} onBack={() => setActiveSubView('main')} />}
              {activeSubView === 'edit' && <EditProfile user={user} onBack={() => setActiveSubView('main')} onUpdate={onUpdate} />}
              {activeSubView === 'downloads' && <DownloadedMaterials onBack={() => setActiveSubView('main')} />}
              {activeSubView === 'mistakes' && <MyMistakes uid={user.uid} onBack={() => setActiveSubView('main')} />}
              {activeSubView === 'notifications' && <NotificationSettings uid={user.uid} onBack={() => setActiveSubView('main')} />}
              {activeSubView === 'help' && <HelpSupport onBack={() => setActiveSubView('main')} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};
