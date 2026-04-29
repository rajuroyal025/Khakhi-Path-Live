import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lightbulb, Brain, ArrowLeft, Loader2, BookOpen as BookOpenIcon, Instagram, X } from 'lucide-react';
import { Header, Hero, SubjectGrid, TestView, ResultView, Leaderboard, Login, SignUp, TeachersPath, LessonView, CurrentAffairsView, Profile, BookmarksView } from './components/ExamApp';
import { CountdownTimer } from './components/CountdownTimer';
import { SuperKhaki } from './components/SuperKhaki';
import { DuelArena } from './components/DuelArena';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { dailyTest as initialDailyTest } from './mockData';
import { UserAttempt, Test, Lesson, CurrentAffairsDaily } from './types';
import { generateDailyTest, generateStudyContent, generateCurrentAffairs, generateGKReadingMaterial } from './services/geminiService';
import { db, collection, doc, getDoc, setDoc, handleFirestoreError, OperationType, auth, onAuthStateChanged, serverTimestamp, increment, signOut, writeBatch } from './firebase';

type View = 'home' | 'test' | 'result' | 'login' | 'signup' | 'teachers-path' | 'lesson' | 'duel' | 'current-affairs' | 'profile' | 'gk-reading-generator' | 'bookmarks';

import { subjectStudyContent } from './data/subjectContent';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [lastAttempt, setLastAttempt] = useState<UserAttempt | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [streak, setStreak] = useState(0); 
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('completed_lessons');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing completed_lessons from localStorage", e);
      return [];
    }
  });
  const [bookmarkedLessons, setBookmarkedLessons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bookmarked_lessons');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing bookmarked_lessons from localStorage", e);
      return [];
    }
  });
  const [activeTest, setActiveTest] = useState<Test>(initialDailyTest);
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  const [geminiQuotaError, setGeminiQuotaError] = useState(false);
  
  // Teachers Path State
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonContent, setLessonContent] = useState<string>('');
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);

  // Current Affairs State
  const [caData, setCaData] = useState<CurrentAffairsDaily | null>(null);
  const [caLoading, setCaLoading] = useState(false);
  const [caDate, setCaDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    const handleOpenPrivacy = () => setShowPrivacy(true);
    window.addEventListener('open-privacy', handleOpenPrivacy);
    return () => window.removeEventListener('open-privacy', handleOpenPrivacy);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Load user profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ ...firebaseUser, ...userData });
            setStreak(userData.streak || 0);
            setCompletedLessons(userData.completedLessons || []);
            setBookmarkedLessons(userData.bookmarkedLessons || []);
          } else {
            // Initialize user doc
            const newUser = {
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              streak: 0,
              lastExamDate: null,
              createdAt: serverTimestamp(),
              elo: 1000,
              completedLessons: [],
              bookmarkedLessons: []
            };
            await setDoc(userDocRef, newUser);
            setUser({ ...firebaseUser, ...newUser });
            setCompletedLessons([]);
            setBookmarkedLessons([]);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setStreak(0);
        setCompletedLessons([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadDailyTest = async () => {
      setIsLoadingTest(true);
      const today = new Date().toISOString().split('T')[0];
      const path = `dailyTests/${today}`;
      const testDocRef = doc(db, 'dailyTests', today);

      try {
        const testDoc = await getDoc(testDocRef);
        if (testDoc.exists()) {
          setActiveTest(testDoc.data() as Test);
        } else {
          const questions = await generateDailyTest();
          const newTest: Test = {
            id: `daily-${today}`,
            title: `દૈનિક ટેસ્ટ - ${new Date().toLocaleDateString('gu-IN')}`,
            description: 'આજના મહત્વના ૨૫ પ્રશ્નોની પ્રેક્ટિસ કરો.',
            questions,
            durationMinutes: 20,
            totalMarks: questions.length
          };
          try {
            await setDoc(testDocRef, newTest);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, path);
          }
          setActiveTest(newTest);
        }
      } catch (error: any) {
        if (error.message === 'GUJARATI_QUOTA_EXCEEDED') {
          setGeminiQuotaError(true);
        } else {
          handleFirestoreError(error, OperationType.GET, path);
        }
      } finally {
        setIsLoadingTest(false);
      }
    };

    loadDailyTest();
  }, []);

  // Handle Current Affairs Loading
  useEffect(() => {
    if (currentView !== 'current-affairs') return;

    const loadCA = async () => {
      setCaLoading(true);
      const caDocRef = doc(db, 'currentAffairs', caDate);
      try {
        const caDoc = await getDoc(caDocRef);
        if (caDoc.exists()) {
          setCaData(caDoc.data() as CurrentAffairsDaily);
        } else {
          const newData = await generateCurrentAffairs(caDate);
          if (auth.currentUser) {
            try {
              await setDoc(caDocRef, newData);
            } catch (e) {
              handleFirestoreError(e, OperationType.WRITE, `currentAffairs/${caDate}`);
            }
          }
          setCaData(newData);
        }
      } catch (error: any) {
        if (error.message === 'GUJARATI_QUOTA_EXCEEDED') {
          setGeminiQuotaError(true);
        } else {
          handleFirestoreError(error, OperationType.GET, `currentAffairs/${caDate}`);
        }
      } finally {
        setCaLoading(false);
      }
    };

    loadCA();
  }, [currentView, caDate]);

  const handleStartTest = async () => {
    if (!user) {
      setCurrentView('login');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    let practice = false;

    if (user.lastExamDate === today) {
      practice = true;
    }

    setIsPracticeMode(practice);
    setTestStartTime(Date.now());
    setCurrentView('test');
  };

  const handleCompleteTest = async (attempt: UserAttempt) => {
    const endTime = Date.now();
    const actualTimeTaken = testStartTime ? Math.floor((endTime - testStartTime) / 1000) : attempt.timeTaken;
    
    // Anti-Cheating: If 25 questions are answered in less than 10 seconds, flag it
    const isSuspicious = actualTimeTaken < 10 && attempt.score > 20;
    
    const finalAttempt = {
      ...attempt,
      timeTaken: actualTimeTaken,
      isFirstAttempt: !isPracticeMode && !isSuspicious
    };

    setLastAttempt(finalAttempt);
    setCurrentView('result');
    
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const userDocRef = doc(db, 'users', user.uid);
      const leaderboardRef = doc(db, 'leaderboard', user.uid);
      const attemptRef = doc(db, 'attempts', `${user.uid}_${today}_${Date.now()}`);

      try {
        // 1. Save Attempt (Always save for record)
        await setDoc(attemptRef, {
          ...finalAttempt,
          userId: user.uid,
          userEmail: user.email,
          testId: activeTest.id,
          createdAt: serverTimestamp(),
          isSuspicious
        });

        // 2. Update User Profile & Leaderboard ONLY if it's the first non-suspicious attempt
        if (finalAttempt.isFirstAttempt) {
          await setDoc(userDocRef, {
            lastExamDate: today,
            streak: increment(1),
            totalTests: increment(1)
          }, { merge: true });

          const accuracy = (attempt.score / activeTest.totalMarks) * 100;
          await setDoc(leaderboardRef, {
            displayName: user.displayName,
            photoURL: user.photoURL,
            totalScore: increment(attempt.score),
            testsCompleted: increment(1),
            accuracy: accuracy,
            bestTime: actualTimeTaken, // For tie-breaking
            lastUpdated: serverTimestamp()
          }, { merge: true });

          // Update local state
          setUser((prev: any) => ({ ...prev, lastExamDate: today, totalTests: (prev.totalTests || 0) + 1 }));
          setStreak(prev => prev + 1);
        }

        // 3. Record Mistakes (Questions answered incorrectly)
        const batch = writeBatch(db);
        let hasMistakes = false;
        activeTest.questions.forEach((q, idx) => {
          const userAns = finalAttempt.answers[idx];
          if (userAns !== null && userAns !== q.correctAnswer) {
            hasMistakes = true;
            // Use a simple hash or question text slice for ID
            const textKey = q.text.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
            const mistakeId = `${textKey}_${idx}`;
            const mistakeRef = doc(db, 'users', user.uid, 'mistakes', mistakeId);
            batch.set(mistakeRef, {
              question: q,
              userAnswer: userAns,
              missedAt: serverTimestamp()
            }, { merge: true });
          }
        });
        
        if (hasMistakes) {
          await batch.commit();
        }

      } catch (error) {
        console.error("Error saving test results:", error);
        handleFirestoreError(error, OperationType.WRITE, 'attempts');
      }
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  const handleSaveQuestion = async (question: any) => {
    if (!user) {
      setCurrentView('login');
      return;
    }
    
    try {
      const saveRef = doc(db, 'users', user.uid, 'saved', question.id);
      await setDoc(saveRef, {
        question,
        savedAt: serverTimestamp()
      });
      console.log("Question saved successfully");
    } catch (error) {
      console.error("Error saving question:", error);
    }
  };

  const handleLogin = (userData: any) => {
    // User state is handled by onAuthStateChanged
    setCurrentView('home');
  };

  const handleGuardedNavigate = (view: View) => {
    const protectedViews: View[] = ['test', 'teachers-path', 'lesson', 'duel', 'current-affairs'];
    if (protectedViews.includes(view) && !user) {
      setCurrentView('login');
      return;
    }
    setCurrentView(view);
  };

  const handleOpenTeachersPath = (subject: string) => {
    if (!user) {
      setCurrentView('login');
      return;
    }
    if (subject === 'કરંટ અફેર્સ') {
      setCurrentView('current-affairs');
      return;
    }
    if (subject === 'સામાન્ય જ્ઞાન') {
      setCurrentView('gk-reading-generator');
      return;
    }
    setSelectedSubject(subject);
    setCurrentView('teachers-path');
  };

  const handleStartLesson = async (lesson: Lesson) => {
    if (!user) {
      setCurrentView('login');
      return;
    }
    setSelectedLesson(lesson);
    setCurrentView('lesson');
    setIsLoadingLesson(true);
    try {
      // If the lesson has hardcoded content, use it. Otherwise call AI or use subject placeholder.
      if (lesson.content) {
        setLessonContent(lesson.content);
      } else if (selectedSubject && subjectStudyContent[selectedSubject]) {
        setLessonContent(subjectStudyContent[selectedSubject]);
      } else {
        const content = await generateStudyContent(selectedSubject, lesson.title);
        setLessonContent(content);
      }
    } catch (error: any) {
      if (error.message === 'GUJARATI_QUOTA_EXCEEDED') {
        setLessonContent("<div class='bg-orange-50 border-2 border-orange-200 p-6 rounded-3xl text-orange-700 font-bold text-center'>AI સર્વરની દૈનિક મર્યાદા પૂરી થઈ ગઈ છે. કૃપા કરીને આ પાઠ માટે આવતીકાલે પ્રયાસ કરો. તમારી મહેનત ચાલુ રાખજો!</div>");
      } else {
        console.error("Error loading lesson:", error);
        setLessonContent("<p class='text-red-500'>ક્ષમા કરશો, પાઠ લોડ કરવામાં ભૂલ આવી છે. કૃપા કરીને ફરી પ્રયાસ કરો.</p>");
      }
    } finally {
      setIsLoadingLesson(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isCompleted = user?.lastExamDate === today;

  const handleUpdateProfile = (newData: any) => {
    setUser((prev: any) => ({ ...prev, ...newData }));
  };

  const handleToggleLessonCompletion = async (lessonId: string) => {
    if (!user) {
      // Guest mode - only localStorage
      const isCurrentlyCompleted = completedLessons.includes(lessonId);
      const newCompletedLessons = isCurrentlyCompleted
        ? completedLessons.filter(id => id !== lessonId)
        : [...completedLessons, lessonId];
      setCompletedLessons(newCompletedLessons);
      localStorage.setItem('completed_lessons', JSON.stringify(newCompletedLessons));
      return;
    }

    const isCurrentlyCompleted = completedLessons.includes(lessonId);
    const newCompletedLessons = isCurrentlyCompleted
      ? completedLessons.filter(id => id !== lessonId)
      : [...completedLessons, lessonId];

    setCompletedLessons(newCompletedLessons);
    localStorage.setItem('completed_lessons', JSON.stringify(newCompletedLessons));

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { completedLessons: newCompletedLessons }, { merge: true });
    } catch (error) {
      console.error("Error updating lesson completion:", error);
    }
  };

  const handleToggleBookmark = async (lessonId: string) => {
    const isCurrentlyBookmarked = bookmarkedLessons.includes(lessonId);
    const newBookmarkedLessons = isCurrentlyBookmarked
      ? bookmarkedLessons.filter(id => id !== lessonId)
      : [...bookmarkedLessons, lessonId];

    setBookmarkedLessons(newBookmarkedLessons);
    localStorage.setItem('bookmarked_lessons', JSON.stringify(newBookmarkedLessons));

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { bookmarkedLessons: newBookmarkedLessons }, { merge: true });
      } catch (error) {
        console.error("Error updating bookmarks:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {geminiQuotaError && (
        <div className="bg-orange-600 text-white py-3 px-4 text-center font-bold shadow-lg flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500 relative z-[200]">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span className="text-sm">AI સર્વરની મર્યાદા અત્યારે પૂરી થઈ ગઈ છે. કૃપા કરીને થોડીવાર પછી અથવા આવતીકાલે પ્રયાસ કરો.</span>
          </div>
          <button 
            onClick={() => setGeminiQuotaError(false)}
            className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <Header 
        onNavigate={handleGuardedNavigate} 
        user={user} 
        streak={streak}
      />

      {currentView === 'home' && (
        <>
          <main className="">
            <Hero onStartTest={handleStartTest} onNavigate={handleGuardedNavigate} isCompleted={isCompleted} />
            
            <CountdownTimer />
            
            <SubjectGrid onSubjectClick={handleOpenTeachersPath} />
            
            <section className="px-4 max-w-7xl mx-auto mt-8">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32"></div>
                <div className="relative z-10 space-y-6 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 rounded-full text-brand-300 text-sm font-bold">
                    <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse"></span>
                    લાઈવ ટેસ્ટ
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold">{activeTest.title}</h3>
                  <p className="text-slate-400 text-lg">
                    {activeTest.description} આ ટેસ્ટમાં {activeTest.questions.length} પ્રશ્નો છે અને સમય {activeTest.durationMinutes} મિનિટ છે.
                  </p>
                  <button 
                    onClick={handleStartTest}
                    disabled={isLoadingTest}
                    className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all active:scale-95 shadow-lg shadow-brand-900/20 disabled:opacity-50"
                  >
                    {isLoadingTest ? 'લોડ થઈ રહ્યું છે...' : (isCompleted ? 'રિઝલ્ટ જુઓ' : 'ટેસ્ટ શરૂ કરો')}
                  </button>
                </div>
              </div>
            </section>

            <Leaderboard />
          </main>
          
          <footer className="border-t border-slate-200 py-12 px-4 text-center text-slate-500 bg-white">
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-wrap justify-center items-center gap-6">
                <button 
                  onClick={() => setShowPrivacy(true)}
                  className="text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors"
                >
                  ગોપનીયતા નીતિ (Privacy Policy)
                </button>
                <a 
                  href="https://www.instagram.com/raju.royal/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white rounded-full shadow-lg shadow-pink-200 hover:scale-110 active:scale-95 transition-all"
                  aria-label="Follow on Instagram"
                >
                  <Instagram size={20} />
                </a>
              </div>
              <p className="font-bold text-[10px] text-slate-400">© 2026 KHAKHI PATH. All rights reserved.</p>
            </div>
          </footer>

          <PrivacyPolicy isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
        </>
      )}

      {currentView === 'teachers-path' && (
        <TeachersPath 
          subject={selectedSubject} 
          onBack={handleBackToHome}
          onStartLesson={handleStartLesson}
          completedLessons={completedLessons}
        />
      )}

      {currentView === 'current-affairs' && (
        <CurrentAffairsView
          data={caData}
          loading={caLoading}
          selectedDate={caDate}
          onDateChange={setCaDate}
          onBack={handleBackToHome}
        />
      )}

      {currentView === 'lesson' && selectedLesson && (
        <LessonView 
          lesson={selectedLesson}
          content={lessonContent}
          loading={isLoadingLesson}
          onBack={() => {
            if (selectedLesson.subject === 'સામાન્ય જ્ઞાન') {
              setCurrentView('gk-reading-generator');
            } else {
              setCurrentView('teachers-path');
            }
          }}
          onToggleCompletion={handleToggleLessonCompletion}
          isCompleted={completedLessons.includes(selectedLesson.id)}
          onToggleBookmark={handleToggleBookmark}
          isBookmarked={bookmarkedLessons.includes(selectedLesson.id)}
        />
      )}

      {currentView === 'test' && (
        <TestView 
          test={activeTest} 
          onComplete={handleCompleteTest} 
          onCancel={handleBackToHome}
          isPracticeMode={isPracticeMode}
          onSaveQuestion={handleSaveQuestion}
        />
      )}

      {currentView === 'result' && lastAttempt && (
        <ResultView 
          attempt={lastAttempt} 
          test={activeTest} 
          onBack={handleBackToHome} 
          onSaveQuestion={handleSaveQuestion}
        />
      )}

      {currentView === 'duel' && user && (
        <DuelArena user={user} onBack={handleBackToHome} />
      )}

      {currentView === 'login' && (
        <Login onNavigate={setCurrentView} onLogin={handleLogin} />
      )}

      {currentView === 'signup' && (
        <SignUp onNavigate={setCurrentView} onSignUp={handleLogin} />
      )}

      {currentView === 'profile' && user && (
        <Profile 
          user={user} 
          onNavigate={handleGuardedNavigate} 
          onUpdate={handleUpdateProfile}
          onLogout={async () => {
            await signOut(auth);
            handleBackToHome();
          }} 
        />
      )}

      {currentView === 'bookmarks' && (
        <BookmarksView 
          bookmarkedIds={bookmarkedLessons}
          onBack={handleBackToHome}
          onSelectLesson={(lesson) => {
            setSelectedLesson(lesson);
            setSelectedSubject(lesson.subject);
            setCurrentView('lesson');
            handleStartLesson(lesson);
          }}
        />
      )}

      {currentView === 'gk-reading-generator' && (
        <GKReadingGenerator 
          onGenerate={async (topic) => {
            setIsLoadingLesson(true);
            try {
              const content = await generateGKReadingMaterial(topic);
              setLessonContent(content);
              setSelectedLesson({
                id: `gk-${Date.now()}`,
                title: topic,
                subject: 'સામાન્ય જ્ઞાન',
                description: 'AI જનરેટેડ વાંચન સામગ્રી',
                status: 'active',
                level: 'માસ્ટર',
                icon: 'Lightbulb',
                color: 'bg-yellow-500'
              });
              setCurrentView('lesson');
            } catch (err: any) {
              if (err.message === 'GUJARATI_QUOTA_EXCEEDED') {
                setGeminiQuotaError(true);
              } else {
                console.error("GK Reading Gen error:", err);
              }
            } finally {
              setIsLoadingLesson(false);
            }
          }}
          onBack={handleBackToHome}
          isLoading={isLoadingLesson}
        />
      )}
      <SuperKhaki />
    </div>
  );
}

function GKReadingGenerator({ onGenerate, onBack, isLoading }: { onGenerate: (topic: string) => void, onBack: () => void, isLoading: boolean }) {
  const [topic, setTopic] = useState('');
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative"
      >
        <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        
        <div className="text-center space-y-3 pt-6">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Lightbulb size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center">GK વાંચન સામગ્રી</h2>
          <p className="text-slate-500 font-bold text-center">કોઈપણ વિષય પર "માસ્ટર" નોટ્સ મેળવો</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">વિષય (Topic)</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="દા.ત. સોલંકી કાળ / ૧૮૫૭નો વિપ્લવ"
              className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] py-5 px-6 outline-none focus:bg-white focus:border-brand-500 transition-all font-bold text-slate-800"
            />
          </div>

          <p className="text-xs text-slate-400 font-medium px-4 leading-relaxed italic text-center">
            "ખાખી પથ" AI તમારા વિષય મુજબ ઊંડાણપૂર્વકની વાંચન સામગ્રી તૈયાર કરશે.
          </p>

          <button 
            onClick={() => topic.trim() && onGenerate(topic)}
            disabled={isLoading || !topic.trim()}
            className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-slate-100 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <BookOpenIcon size={24} className="text-brand-300" />}
            {isLoading ? 'મટીરીયલ તૈયાર થઈ રહ્યું છે...' : 'વાંચન સામગ્રી મેળવો'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
