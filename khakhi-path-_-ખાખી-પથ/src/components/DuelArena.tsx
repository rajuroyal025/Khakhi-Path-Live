import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Swords, Users, Trophy, Timer, Zap, Flame, 
  Target, Shield, ArrowLeft, Share2, Award, 
  Brain, Search, User, Bot, CheckCircle2, XCircle,
  Plus, LogIn, Hash, Loader2
} from 'lucide-react';
import { 
  db, collection, doc, setDoc, updateDoc, onSnapshot, getDoc,
  query, where, orderBy, limit, serverTimestamp, increment,
  auth, handleFirestoreError, OperationType, deleteDoc
} from '../firebase';
import { Question, Duel, DuelPlayer, MatchmakingQueue } from '../types';
import { generateDuelQuestions, generatePostMatchCoach } from '../services/geminiService';

interface DuelArenaProps {
  user: any;
  onBack: () => void;
}

export const DuelArena: React.FC<DuelArenaProps> = ({ user, onBack }) => {
  const [status, setStatus] = useState<'lobby' | 'searching' | 'waiting_room' | 'playing' | 'result'>('lobby');
  const [duel, setDuel] = useState<Duel | null>(null);
  const [matchmakingId, setMatchmakingId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('ભારતનું બંધારણ');
  const [timeLeft, setTimeLeft] = useState(10);
  const [coachFeedback, setCoachFeedback] = useState<string | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joiningError, setJoiningError] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const topics = [
    'ભારતનું બંધારણ',
    'ગુજરાતનો ઇતિહાસ',
    'ગુજરાતની ભૂગોળ',
    'સામાન્ય વિજ્ઞાન',
    'રીઝનીંગ',
    'કાયદો (IPC, CRPC, Evidence)'
  ];

  // --- Matchmaking Logic (Quick Match) ---
  const startSearching = async () => {
    if (!user) return;
    setStatus('searching');
    
    const mmId = user.uid;
    setMatchmakingId(mmId);

    const queueEntry: MatchmakingQueue = {
      uid: user.uid,
      displayName: user.displayName || 'તૈયાર ઉમેદવાર',
      photoURL: user.photoURL || '',
      elo: user.elo || 1000,
      topic: selectedTopic,
      joinedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'matchmaking', mmId), queueEntry);
      
      // Listener for Guest: See if someone else created a duel for us
      const duelQuery = query(
        collection(db, 'duels'),
        where('status', '==', 'playing'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const duelUnsubscribe = onSnapshot(duelQuery, (snapshot) => {
        if (!snapshot.empty) {
          const joinedDuel = snapshot.docs[0].data() as Duel;
          if (joinedDuel.players[user.uid] && joinedDuel.hostId !== user.uid) {
            setDuel(joinedDuel);
            setStatus('playing');
            duelUnsubscribe();
            // Cleanup our own matchmaking entry
            deleteDoc(doc(db, 'matchmaking', user.uid));
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'duels');
      });

      const q = query(
        collection(db, 'matchmaking'), 
        where('topic', '==', selectedTopic),
        where('uid', '!=', user.uid),
        limit(1)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (!snapshot.empty) {
          const opponent = snapshot.docs[0].data() as MatchmakingQueue;
          duelUnsubscribe(); // Stop guest listener
          await createDuel(opponent);
          unsubscribe();
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'matchmaking');
      });

      searchTimeoutRef.current = setTimeout(() => {
        unsubscribe();
        duelUnsubscribe();
        createDuelWithBot();
      }, 10000);

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'matchmaking');
    }
  };

  const createDuel = async (opponent: MatchmakingQueue) => {
    setIsGeneratingQuestions(true);
    try {
      const questions = await generateDuelQuestions(selectedTopic);
      if (!questions || questions.length === 0) {
        setIsGeneratingQuestions(false);
        return;
      }

      const duelId = `duel_${Date.now()}_${user.uid}`;
    const newDuel: Duel = {
      id: duelId,
      status: 'playing',
      topic: selectedTopic,
      questions,
      players: {
        [user.uid]: {
          uid: user.uid,
          displayName: user.displayName || 'તમે',
          photoURL: user.photoURL || '',
          score: 0,
          currentQuestionIndex: 0,
          answers: [],
          isReady: true,
          elo: user.elo || 1000
        },
        [opponent.uid]: {
          uid: opponent.uid,
          displayName: opponent.displayName,
          photoURL: opponent.photoURL,
          score: 0,
          currentQuestionIndex: 0,
          answers: [],
          isReady: true,
          elo: opponent.elo
        }
      },
      createdAt: serverTimestamp(),
      startTime: serverTimestamp(),
      hostId: user.uid,
      currentQuestionIndex: 0
    };

    await setDoc(doc(db, 'duels', duelId), newDuel);
    await deleteDoc(doc(db, 'matchmaking', user.uid));
    
    setDuel(newDuel);
    setStatus('playing');
    setIsGeneratingQuestions(false);
    } catch (err: any) {
      setIsGeneratingQuestions(false);
      if (err.message === 'GUJARATI_QUOTA_EXCEEDED') {
        alert("AI સર્વરની દૈનિક મર્યાદા અત્યારે પૂરી થઈ ગઈ છે. કૃપા કરીને આવતીકાલે પ્રયાસ કરો.");
        setStatus('lobby');
      } else {
        console.error("Duel creation error:", err);
      }
    }
  };

  const createDuelWithBot = async () => {
    setIsGeneratingQuestions(true);
    try {
      const questions = await generateDuelQuestions(selectedTopic);
      if (!questions || questions.length === 0) {
        setIsGeneratingQuestions(false);
        return;
      }

      const duelId = `duel_bot_${Date.now()}_${user.uid}`;
    const botNames = ['PSI જાડેજા', 'કોન્સ્ટેબલ રાઠોડ', 'ઇન્સ્પેક્ટર પટેલ', 'ખાખી માસ્ટર'];
    const botName = botNames[Math.floor(Math.random() * botNames.length)];

    const newDuel: Duel = {
      id: duelId,
      status: 'playing',
      topic: selectedTopic,
      questions,
      players: {
        [user.uid]: {
          uid: user.uid,
          displayName: user.displayName || 'તમે',
          photoURL: user.photoURL || '',
          score: 0,
          currentQuestionIndex: 0,
          answers: [],
          isReady: true,
          elo: user.elo || 1000
        },
        'bot_id': {
          uid: 'bot_id',
          displayName: botName,
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${botName}`,
          score: 0,
          currentQuestionIndex: 0,
          answers: [],
          isReady: true,
          isBot: true,
          elo: 1100
        }
      },
      createdAt: serverTimestamp(),
      startTime: serverTimestamp(),
      hostId: user.uid,
      currentQuestionIndex: 0
    };

    await setDoc(doc(db, 'duels', duelId), newDuel);
    setDuel(newDuel);
    setStatus('playing');
    setIsGeneratingQuestions(false);
    } catch (err: any) {
      setIsGeneratingQuestions(false);
      if (err.message === 'GUJARATI_QUOTA_EXCEEDED') {
        alert("AI સર્વરની દૈનિક મર્યાદા અત્યારે પૂરી થઈ ગઈ છે. કૃપા કરીને આવતીકાલે પ્રયાસ કરો.");
        setStatus('lobby');
      } else {
        console.error("Duel with bot creation error:", err);
      }
    }
  };

  // --- Private Room Logic ---
  const createPrivateRoom = async () => {
    if (!user) return;
    setIsGeneratingQuestions(true);
    // Note: We do NOT set status to 'waiting_room' yet to prevent the "Race Condition"
    // The user will see a loading spinner while questions generate and the DB is written.
    
    try {
      // 1. Generate unique-ish 4-digit PIN (Always as String)
      const pin = String(Math.floor(1000 + Math.random() * 9000));

      // 2. Generate questions ONCE (Host rule)
      const questions = await generateDuelQuestions(selectedTopic);
      if (!questions || questions.length === 0) {
        throw new Error("Questions could not be generated");
      }

      // 3. Create the Duel Object (SSOT)
      const duelId = `duel_${pin}_${Date.now()}`;
      const roomData: Duel = {
        id: duelId,
        status: 'waiting',
        topic: selectedTopic,
        questions,
        players: {
          [user.uid]: {
            uid: user.uid,
            displayName: user.displayName || 'હોસ્ટ',
            photoURL: user.photoURL || '',
            score: 0,
            currentQuestionIndex: 0,
            answers: [],
            isReady: true,
            elo: user.elo || 1000
          }
        },
        createdAt: serverTimestamp(),
        hostId: user.uid,
        currentQuestionIndex: 0
      };

      // 4. Secure the Write (The PIN is the Document ID)
      // Only reveal the PIN to the host after the write is confirmed successful
      const roomRef = doc(db, 'rooms', pin);
      await setDoc(roomRef, roomData);
      
      setRoomCode(pin);
      setDuel(roomData);
      setStatus('waiting_room');
      setIsGeneratingQuestions(false);
    } catch (error: any) {
      console.error("Critical Room Creation Error:", error);
      let errorMsg = "રૂમ બનાવવામાં ભૂલ આવી. ફરી પ્રયાસ કરો.";
      
      if (error.code === 'permission-denied') {
        errorMsg = "તમને રૂમ બનાવવાની પરવાનગી નથી. મહેરબાની કરીને લોગીન તપાસો.";
      } else if (error.message === 'GUJARATI_QUOTA_EXCEEDED') {
        errorMsg = "AI સર્વરની દૈનિક મર્યાદા અત્યારે પૂરી થઈ ગઈ છે. કૃપા કરીને રૂમ બનાવવા માટે આવતીકાલે પ્રયાસ કરો.";
      }
      
      alert(errorMsg);
      setStatus('lobby');
      setIsGeneratingQuestions(false);
    }
  };

  const joinPrivateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!user || cleanPin.length !== 4) return;
    setJoiningError(null);
    setIsGeneratingQuestions(true); // Re-use for joining loading state

    try {
      // 1. Explicitly cast lookup key to String to avoid Type Traps (Integer vs String)
      const pinString = String(cleanPin);
      const roomRef = doc(db, 'rooms', pinString);
      
      console.log(`Attempting to join room: ${pinString}`);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setJoiningError(`રૂમ '${pinString}' મળ્યો નથી. પિન ફરીથી તપાસો.`);
        setIsGeneratingQuestions(false);
        return;
      }

      const roomData = roomSnap.data() as Duel;
      
      // 2. Validate Room State before jumping in
      if (roomData.status !== 'waiting') {
        setJoiningError("આ રૂમ પહેલેથી ભરાયેલો છે અથવા રમત શરૂ થઈ ગઈ છે.");
        setIsGeneratingQuestions(false);
        return;
      }

      // Join as guest
      const guestData: DuelPlayer = {
        uid: user.uid,
        displayName: user.displayName || 'ખેલાડી',
        photoURL: user.photoURL || '',
        score: 0,
        currentQuestionIndex: 0,
        answers: [],
        isReady: true,
        elo: user.elo || 1000
      };

      // 3. Atomically update the room to join
      const updatedPlayers = {
        ...roomData.players,
        [user.uid]: guestData
      };

      await updateDoc(roomRef, {
        [`players.${user.uid}`]: guestData,
        status: 'playing',
        startTime: serverTimestamp()
      });

      console.log("Successfully joined private room!");
      setRoomCode(pinString);
      
      // Safety: Use updated players for immediate local state
      setDuel({
        ...roomData,
        players: updatedPlayers,
        status: 'playing'
      }); 
      setStatus('playing');
    } catch (error: any) {
      console.error("Critical Joining Error:", error);
      let errorMessage = "રૂમમાં જોડાવામાં ભૂલ આવી.";
      
      if (error.code === 'permission-denied') {
        errorMessage = "પરવાનગી નથી (Permission Denied). સર્વર સિક્યુરિટી રૂલ્સ ચેક કરો.";
      }
      
      setJoiningError(errorMessage);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // --- Real-time Duel/Room Sync ---
  useEffect(() => {
    let roomId = duel?.id;
    let roomPin = roomCode;

    // We track either by the complex ID or the 4-digit PIN
    if (roomPin || roomId) {
      const targetPath = roomPin ? doc(db, 'rooms', roomPin) : doc(db, 'duels', roomId!);
      
      const unsubscribe = onSnapshot(targetPath, (snapshot) => {
        if (snapshot.exists()) {
          const updatedDuel = snapshot.data() as Duel;
          setDuel(updatedDuel);
          
          if (updatedDuel.status === 'playing' && status !== 'playing') {
            setStatus('playing');
          }

          if (updatedDuel.status === 'finished') {
            setStatus('result');
            generateFeedback(updatedDuel);
            
            // Clean up room PIN if it was a guest entry
            if (roomPin) {
               // Optional: delete room pinning doc after match
            }
          }
        }
      });
      return () => unsubscribe();
    }
  }, [duel?.id, roomCode]);

  // --- Game Loop ---
  useEffect(() => {
    if (status === 'playing' && duel) {
      setTimeLeft(10);
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Check if I have already answered this question
            const me = duel.players[user.uid];
            const hasAnswered = me.answers.some(a => a.questionId === duel.questions[duel.currentQuestionIndex].id);
            
            if (!hasAnswered) {
              // Forced timeout answer
              handleAnswer(-1);
            }
            return 10;
          }
          return prev - 1;
        });
      }, 1000);

      // Bot logic
      const opponent = Object.values(duel.players).find(p => p.uid !== user.uid);
      if (opponent?.isBot && opponent.currentQuestionIndex === duel.currentQuestionIndex) {
        const botDelay = 2000 + Math.random() * 5000;
        setTimeout(() => {
          handleBotAnswer();
        }, botDelay);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, duel?.currentQuestionIndex]);

  const handleAnswer = async (answerIndex: number) => {
    if (!duel || !user) return;
    
    const currentQ = duel.questions[duel.currentQuestionIndex];
    if (!currentQ) return;
    
    // Safety: check if user already answered this exact question ID to prevent double-posts
    if (duel.players[user.uid].answers.some(a => a.questionId === currentQ.id)) return;

    const isCorrect = answerIndex === currentQ.correctAnswer;
    const timeTaken = 10 - timeLeft;
    const isJoker = duel.currentQuestionIndex === duel.questions.length - 1;
    
    // Scoring: First Blood Mechanic
    const opponent = Object.values(duel.players).find(p => p.uid !== user.uid);
    const opponentAnswer = opponent?.answers.find(a => a.questionId === currentQ.id);
    
    let points = 0;
    if (isCorrect) {
      if (!opponentAnswer || !opponentAnswer.isCorrect) {
        points = 20; // First Blood
      } else {
        points = 10;
      }
      if (isJoker) points *= 3; // Joker Question
    } else {
      points = -5;
    }

    const updatedPlayer = {
      ...duel.players[user.uid],
      score: duel.players[user.uid].score + points,
      currentQuestionIndex: duel.players[user.uid].currentQuestionIndex + 1,
      answers: [...duel.players[user.uid].answers, {
        questionId: currentQ.id,
        answerIndex,
        timeTaken,
        isCorrect
      }]
    };

    const isLastQuestion = duel.currentQuestionIndex === duel.questions.length - 1;
    
    // SSOT Sync: Logic to move to next question only when both players have answered
    const otherPlayer = Object.values(duel.players).find(p => p.uid !== user.uid);
    const otherPlayerHasAnswered = otherPlayer ? otherPlayer.currentQuestionIndex > duel.currentQuestionIndex : true;

    const updates: any = {
      [`players.${user.uid}`]: updatedPlayer
    };

    const targetPath = roomCode ? doc(db, 'rooms', roomCode) : doc(db, 'duels', duel.id);

    if (otherPlayerHasAnswered || (isLastQuestion && opponent?.isBot)) {
      if (isLastQuestion) {
        updates.status = 'finished';
        // Determine winner
        const myFinalScore = updatedPlayer.score;
        const opponentFinalScore = opponent?.score || 0;
        updates.winnerUid = myFinalScore > opponentFinalScore ? user.uid : (opponent?.uid || 'draw');
        
        // Update Elo (Simple +25/-25)
        if (user.uid) {
          const eloChange = myFinalScore > opponentFinalScore ? 25 : -15;
          updateDoc(doc(db, 'users', user.uid), {
            elo: increment(eloChange)
          });
        }
      } else {
        updates.currentQuestionIndex = increment(1);
      }
    }

    await updateDoc(targetPath, updates);
  };

  const handleBotAnswer = async () => {
    if (!duel || status !== 'playing') return;
    const bot = Object.values(duel.players).find(p => p.isBot);
    if (!bot) return;

    const currentQ = duel.questions[duel.currentQuestionIndex];
    const isCorrect = Math.random() > 0.3; // 70% accuracy
    const answerIndex = isCorrect ? currentQ.correctAnswer : (currentQ.correctAnswer + 1) % 4;
    
    // Bot scoring
    const player = duel.players[user.uid];
    const playerAnswer = player.answers.find(a => a.questionId === currentQ.id);
    
    let points = 0;
    if (isCorrect) {
      points = (!playerAnswer || !playerAnswer.isCorrect) ? 20 : 10;
    } else {
      points = -5;
    }

    const updatedBot = {
      ...bot,
      score: bot.score + points,
      currentQuestionIndex: bot.currentQuestionIndex + 1,
      answers: [...bot.answers, {
        questionId: currentQ.id,
        answerIndex,
        timeTaken: 5,
        isCorrect
      }]
    };

    const isLastQuestion = duel.currentQuestionIndex === duel.questions.length - 1;
    const playerFinished = player.currentQuestionIndex > duel.currentQuestionIndex;

    const updates: any = {
      [`players.${bot.uid}`]: updatedBot
    };

    if (playerFinished || isLastQuestion) {
      if (isLastQuestion) {
        updates.status = 'finished';
        const botFinalScore = updatedBot.score;
        const playerFinalScore = player.score;
        updates.winnerUid = botFinalScore > playerFinalScore ? bot.uid : user.uid;
      } else {
        updates.currentQuestionIndex = increment(1);
      }
    }

    await updateDoc(doc(db, 'duels', duel.id), updates);
  };

  const generateFeedback = async (finalDuel: Duel) => {
    const myAnswers = finalDuel.players[user.uid].answers;
    const missed = myAnswers.filter(a => !a.isCorrect).map(a => {
      const q = finalDuel.questions.find(q => q.id === a.questionId);
      return { question: q?.text, yourAnswer: q?.options[a.answerIndex], correctAnswer: q?.options[q.correctAnswer] };
    });
    
    try {
      const feedback = await generatePostMatchCoach(missed);
      setCoachFeedback(feedback);
    } catch (err: any) {
      if (err.message === 'GUJARATI_QUOTA_EXCEEDED') {
        setCoachFeedback("AI સર્વરની મર્યાદા પૂરી થઈ ગઈ છે, તેથી અત્યારે કોચિંગ ફિડબેક આપી શકાશે નહીં. તમારી રમત સારી હતી!");
      } else {
        console.error("Coach feedback error:", err);
      }
    }
  };

  // --- Render Helpers ---
  const renderLobby = () => (
    <div className="max-w-4xl mx-auto space-y-8 py-10 px-4 md:px-0">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-brand-100 text-brand-600 rounded-3xl mb-4">
          <Swords size={48} />
        </div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">બેટલ એરેના</h2>
        <p className="text-slate-500 text-lg">અન્ય ઉમેદવારો સાથે લાઈવ સ્પર્ધા કરો અને ખાખી માટે સજ્જ બનો.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Quick Battle */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Zap className="text-brand-600 fill-brand-600" /> ક્વિક મેચ
            </h3>
            <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-600 rounded">ઓનલાઈન: ૨૪+</span>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-500 font-medium">રેન્ડમ ખેલાડી સાથે સ્પર્ધા કરો:</p>
            <div className="grid grid-cols-2 gap-2">
              {topics.slice(0, 4).map((topic, idx) => (
                <button
                  key={`topic-${topic}-${idx}`}
                  onClick={() => setSelectedTopic(topic)}
                  className={`p-3 rounded-xl border-2 text-sm transition-all text-left font-bold truncate ${
                    selectedTopic === topic 
                    ? 'border-brand-600 bg-brand-50 text-brand-700' 
                    : 'border-slate-50 hover:border-brand-200 text-slate-600'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
            <button
              onClick={startSearching}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              બેટલ શરૂ કરો
            </button>
          </div>
        </div>

        {/* Right: Social Battle (Private Room) */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 rounded-full blur-[80px] opacity-20"></div>
          
          <h3 className="text-xl font-bold flex items-center gap-2 relative z-10">
            <Users className="text-brand-400" /> મિત્ર સાથે રમો
          </h3>

          <div className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={createPrivateRoom}
                className="group p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-lg">રૂમ બનાવો</div>
                  <div className="text-xs text-slate-400">PIN દ્વારા મિત્રને ઇન્વાઇટ કરો</div>
                </div>
                <div className="bg-brand-500 p-2 rounded-xl group-hover:scale-110 transition-transform">
                  <Plus size={20} />
                </div>
              </button>

              <div className="p-1 bg-white/5 border border-white/10 rounded-2xl">
                <form onSubmit={joinPrivateRoom} className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text"
                      maxLength={4}
                      placeholder="4-digit PIN"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-transparent border-none py-4 pl-12 pr-4 font-black tracking-widest text-xl focus:ring-0 placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pinInput.length !== 4}
                    className="bg-brand-600 px-6 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-700 transition-colors"
                  >
                    જોડાવો
                  </button>
                </form>
              </div>
              {joiningError && <p className="text-red-400 text-xs font-bold text-center">{joiningError}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatsCard icon={<Trophy className="text-yellow-500" />} value="1200" label="તમારો ELO" />
        <StatsCard icon={<Flame className="text-orange-500" />} value="15" label="કુલ જીત" />
        <StatsCard icon={<Award className="text-blue-500" />} value="#42" label="રેન્કિંગ" />
      </div>
    </div>
  );

  const StatsCard = ({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) => (
    <div className="bg-white p-4 rounded-3xl text-center shadow-sm border border-slate-100 group hover:shadow-md transition-shadow">
      <div className="flex justify-center mb-1 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-slate-900 font-black text-2xl">{value}</div>
      <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</div>
    </div>
  );

  const renderWaitingRoom = () => (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 rounded-full blur-[150px] opacity-10 -mr-20 -mt-20"></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-10 relative z-10"
      >
        <div className="space-y-4">
          <div className="bg-brand-600/20 border border-brand-500/30 text-brand-400 px-4 py-1.5 rounded-full inline-block text-xs font-black uppercase tracking-widest">
            તમારો રૂમ તૈયાર છે
          </div>
          <h2 className="text-4xl font-black">મિત્રને ઇન્વાઇટ કરો</h2>
        </div>

        <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] relative group">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">ROOM PIN</div>
          <div className="text-7xl font-black tracking-[0.2em] text-brand-500 tabular-nums">
            {roomCode}
          </div>
          <p className="mt-6 text-slate-400 text-sm font-medium">તમારા મિત્રને આ PIN જણાવો</p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl border-2 border-brand-500 overflow-hidden shadow-lg shadow-brand-500/20">
              <img src={user.photoURL} referrerPolicy="no-referrer" />
            </div>
            <div className="w-8 h-px bg-slate-800"></div>
            <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center bg-slate-900 animate-pulse">
              <User className="text-slate-700" size={24} />
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-3">
             <div className="w-2 h-2 bg-brand-500 rounded-full animate-ping"></div>
             <p className="text-brand-400 font-bold italic">બીજા ખેલાડીની રાહ જોઈ રહ્યા છીએ...</p>
          </div>
        </div>

        <button
          onClick={() => setStatus('lobby')}
          className="px-8 py-3 text-slate-500 hover:text-white font-bold transition flex items-center gap-2 mx-auto"
        >
          કેન્સલ કરો
        </button>
      </motion.div>
    </div>
  );

  const renderSearching = () => (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white p-6">
      <div className="relative w-64 h-64 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-4 border-brand-500/30 border-t-brand-500 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="bg-brand-600 p-8 rounded-full shadow-[0_0_50px_rgba(37,99,235,0.5)]"
        >
          <Search size={48} className="text-white" />
        </motion.div>
      </div>
      
      <div className="mt-12 text-center space-y-4">
        <h3 className="text-3xl font-black">પ્રતિસ્પર્ધીની શોધ ચાલુ છે...</h3>
        <p className="text-slate-400 text-lg">તમારા લેવલના ઉમેદવારને શોધી રહ્યા છીએ</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-bold">
          <Target size={16} className="text-brand-400" /> {selectedTopic}
        </div>
      </div>

      <button
        onClick={() => {
          if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
          setStatus('lobby');
        }}
        className="mt-12 text-slate-400 hover:text-white font-bold transition underline underline-offset-4"
      >
        કેન્સલ કરો
      </button>
    </div>
  );

  const renderArena = () => {
    if (!duel || !user) return null;
    
    const me = duel.players[user.uid];
    const opponent = Object.values(duel.players).find(p => p.uid !== user.uid);
    const currentQ = duel.questions[duel.currentQuestionIndex];
    
    if (!me || !opponent || !currentQ) return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <Brain className="w-12 h-12 text-brand-500 mx-auto animate-pulse" />
          <p className="text-xl font-bold">બેટલ ગ્રાઉન્ડ તૈયાર થઈ રહ્યું છે...</p>
        </div>
      </div>
    );

    const myAnswer = me.answers.find(a => a.questionId === currentQ.id);
    const opponentAnswer = opponent.answers.find(a => a.questionId === currentQ.id);

    return (
      <div className="h-[100dvh] flex flex-col bg-slate-950 text-white overflow-hidden">
        {/* Top Bar: Opponent Info */}
        <div className="bg-slate-900/50 p-3 md:p-4 flex items-center justify-between border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <img src={opponent.photoURL} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-2 border-red-500/50" referrerPolicy="no-referrer" />
              {opponentAnswer && (
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-brand-500 p-1 rounded-full border-2 border-slate-900"
                >
                  <CheckCircle2 size={10} />
                </motion.div>
              )}
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">પ્રતિસ્પર્ધી</div>
              <div className="text-sm md:text-base font-bold flex items-center gap-2">
                {opponent.displayName}
                {opponent.isBot && <span className="text-[8px] md:text-[10px] bg-white/10 px-1.5 py-0.5 rounded uppercase">AI BOT</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-black text-red-500 leading-none">{opponent.score}</div>
            <div className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">POINTS</div>
          </div>
        </div>

        {/* Middle: Question Area */}
        <div className="flex-1 overflow-y-auto flex flex-col p-5 md:p-8 space-y-6 md:space-y-10 relative no-scrollbar">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(duel.currentQuestionIndex / duel.questions.length) * 100}%` }}
              className="h-full bg-brand-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]"
            />
          </div>

          <div className="flex justify-between items-center shrink-0">
            <div className="px-3 py-1 md:px-4 md:py-1.5 bg-white/5 rounded-full text-[10px] md:text-xs font-bold border border-white/10 flex items-center gap-2">
              {duel.currentQuestionIndex === duel.questions.length - 1 && <Zap size={12} className="text-yellow-500 fill-yellow-500" />}
              {duel.currentQuestionIndex === duel.questions.length - 1 ? 'જોકર પ્રશ્ન (3X Points)' : `પ્રશ્ન ${duel.currentQuestionIndex + 1} / ${duel.questions.length}`}
            </div>
            <div className={`flex items-center gap-2 text-xl md:text-2xl font-black ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-brand-400'}`}>
              <Timer size={20} className="md:w-6 md:h-6" /> {timeLeft}s
            </div>
          </div>

          <div className="space-y-6 md:space-y-8 flex-1">
            <h3 className="text-xl sm:text-2xl md:text-4xl font-bold leading-tight md:leading-[1.2]">
              {currentQ.text}
            </h3>
            
            <div className="grid grid-cols-1 gap-3 md:gap-4 pb-8">
              {currentQ.options.map((option, idx) => {
                const isSelected = myAnswer?.answerIndex === idx;
                const isCorrect = idx === currentQ.correctAnswer;
                const showResult = !!myAnswer;

                return (
                  <button
                    key={`duel-opt-${idx}`}
                    disabled={!!myAnswer}
                    onClick={() => handleAnswer(idx)}
                    className={`p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] text-left font-bold text-base md:text-xl transition-all relative overflow-hidden border-2 ${
                      isSelected 
                        ? (isCorrect ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500')
                        : (showResult && isCorrect ? 'bg-green-500/20 border-green-500' : 'bg-white/5 border-white/10 hover:bg-white/10')
                    }`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <span className="pr-4">{option}</span>
                      {isSelected && (isCorrect ? <CheckCircle2 className="text-green-500 shrink-0" /> : <XCircle className="text-red-500 shrink-0" />)}
                    </div>
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`absolute inset-0 ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar: My Info */}
        <div className="bg-slate-900 px-5 py-4 md:px-8 md:py-6 flex items-center justify-between border-t border-white/5 shrink-0">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="relative">
              <img src={user.photoURL} className="w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] border-2 border-brand-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]" referrerPolicy="no-referrer" />
              <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-orange-500 text-white text-[8px] md:text-[10px] font-black px-1.5 md:px-2 py-0.5 rounded-full border-2 border-slate-900">
                STREAK 🔥
              </div>
            </div>
            <div>
              <div className="text-[10px] md:text-sm font-black text-brand-400 uppercase tracking-tighter leading-none mb-1 md:mb-1.5">તમે</div>
              <div className="text-base md:text-2xl font-bold leading-none">{user.displayName}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl md:text-6xl font-black text-brand-500 leading-none">{me.score}</div>
            <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mt-1">MY SCORE</div>
          </div>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!duel || !user) return null;
    const me = duel.players[user.uid];
    const opponent = Object.values(duel.players).find(p => p.uid !== user.uid);
    
    if (!me || !opponent) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-brand-600 mx-auto mb-4" size={48} />
          <p className="text-slate-500 font-bold">પરિણામ લોડ થઈ રહ્યું છે...</p>
        </div>
      </div>
    );

    const isWinner = duel.winnerUid === user.uid;
    const isDraw = duel.winnerUid === 'draw';

    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`inline-flex p-8 rounded-full ${isWinner ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-600'}`}
          >
            {isWinner ? <Trophy size={80} /> : <Award size={80} />}
          </motion.div>
          
          <h2 className="text-5xl font-black text-slate-800">
            {isWinner ? 'વિજયી ભવ!' : (isDraw ? 'મેચ ડ્રો થઈ!' : 'વધુ મહેનત કરો!')}
          </h2>
          <p className="text-slate-500 text-xl">
            {isWinner ? 'તમે પ્રતિસ્પર્ધીને હરાવી દીધા છે.' : 'આ વખતે નસીબ સાથ ના આપ્યો, પણ હિંમત ના હારશો.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Score Card */}
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Swords className="text-slate-100 w-24 h-24" />
            </div>
            <div className="relative z-10 space-y-8">
              <h3 className="text-2xl font-black text-slate-800">સ્કોરબોર્ડ</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-brand-50 rounded-3xl border border-brand-100">
                  <div className="flex items-center gap-4">
                    <img src={user.photoURL} className="w-12 h-12 rounded-2xl border-2 border-brand-500" referrerPolicy="no-referrer" />
                    <div className="font-bold">{user.displayName} (તમે)</div>
                  </div>
                  <div className="text-3xl font-black text-brand-600">{me.score}</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <img src={opponent.photoURL} className="w-12 h-12 rounded-2xl border-2 border-slate-300" referrerPolicy="no-referrer" />
                    <div className="font-bold">{opponent.displayName}</div>
                  </div>
                  <div className="text-3xl font-black text-slate-600">{opponent.score}</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Coach Feedback */}
          <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Brain className="text-white/5 w-24 h-24" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 rounded-full text-brand-400 text-xs font-bold uppercase">
                <Zap size={14} /> AI કોચ સલાહ
              </div>
              <h3 className="text-2xl font-bold">તમારું પર્ફોર્મન્સ એનાલિસિસ</h3>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 italic text-lg leading-relaxed text-slate-300">
                {coachFeedback || 'એનાલિસિસ થઈ રહ્યું છે...'}
              </div>
              <button className="flex items-center gap-2 text-brand-400 font-bold hover:text-brand-300 transition">
                <Share2 size={18} /> રિઝલ્ટ શેર કરો
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <button
            onClick={() => setStatus('lobby')}
            className="px-12 py-5 bg-brand-600 text-white rounded-3xl font-black text-xl shadow-xl hover:bg-brand-700 transition-all active:scale-95"
          >
            ફરીથી રમો
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 relative pb-20">
      <AnimatePresence>
        {isGeneratingQuestions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[1000] flex items-center justify-center p-6 text-center"
          >
            <div className="space-y-8 max-w-sm">
              <div className="relative mx-auto w-32 h-32">
                <div className="absolute inset-0 border-4 border-brand-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Swords className="text-brand-500 w-12 h-12" />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white italic tracking-tight">બેટલ ગ્રાઉન્ડ તૈયાર થઈ રહ્યું છે...</h3>
                <div className="space-y-2">
                  <p className="text-slate-400 text-sm leading-relaxed">
                    અમે સિલેબસ મુજબ પ્રશ્નો અને સિક્યોર કનેક્શન સેટ કરી રહ્યા છીએ.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-brand-400 text-xs font-mono">
                    <Zap size={14} className="animate-pulse" /> બૂટિંગ AI ઇન્સ્ટ્રક્ટર...
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {status !== 'playing' && status !== 'searching' && status !== 'waiting_room' && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-brand-600 font-bold transition group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-lg">હોમ પર પાછા જાઓ</span>
          </button>
        </div>
      )}

      <main className="relative z-10 w-full h-full min-h-[calc(100vh-160px)] flex flex-col">
        <AnimatePresence mode="wait">
          {status === 'lobby' && (
            <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1">
              {renderLobby()}
            </motion.div>
          )}
          {status === 'searching' && (
            <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500]">
              {renderSearching()}
            </motion.div>
          )}
          {status === 'waiting_room' && (
            <motion.div key="waiting" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500]">
              {renderWaitingRoom()}
            </motion.div>
          )}
          {status === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500]">
              {renderArena()}
            </motion.div>
          )}
          {status === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1">
              {renderResult()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
