import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, RotateCw, AlertCircle, ExternalLink } from 'lucide-react';

interface AudioPlayerProps {
  url: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Convert Google Drive share link to direct download link
  const getDirectLink = (driveUrl: string) => {
    if (driveUrl.includes('drive.google.com')) {
      // Improved regex to capture standard ID formats
      const fileIdMatch = driveUrl.match(/\/d\/([\w-]+)/) || driveUrl.match(/[?&]id=([\w-]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;
      if (fileId) {
        // Using docs.google.com/uc which is sometimes more reliable for streaming
        return `https://docs.google.com/uc?export=download&id=${fileId}`;
      }
    }
    return driveUrl;
  };

  const directUrl = getDirectLink(url);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setHasError(false);
    setLoading(true);

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setLoading(false);
    };
    const handleEnd = () => setIsPlaying(false);
    const handleError = () => {
      console.error("Audio Load Error:", audio.error);
      setHasError(true);
      setLoading(false);
    };
    const handleCanPlay = () => setLoading(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [url]);

  const togglePlay = () => {
    if (audioRef.current && !hasError) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Playback failed:", error);
            setHasError(true);
          });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(Math.max(0, audioRef.current.currentTime + amount), duration);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  if (hasError) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30 p-8 text-center">
        <AlertCircle size={40} className="text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-black text-amber-900 dark:text-amber-200 mb-2">ઓડિયો લોડ થઈ રહ્યો નથી</h3>
        <p className="text-sm text-amber-700 dark:text-amber-400 font-bold mb-6">
          ગૂગલ ડ્રાઇવની સુરક્ષા શરતોને કારણે બ્રાઉઝરમાં ઓડિયો પ્લે થઈ શકતો નથી.
        </p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-2xl font-black hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-200 outline-none"
        >
          <ExternalLink size={20} /> ડ્રાઇવમાં ઓપન કરો
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 transition-all duration-300 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
          <div className="w-8 h-8 border-4 border-brand-600/20 border-t-brand-600 rounded-full animate-spin" />
        </div>
      )}
      
      <audio 
        ref={audioRef} 
        src={directUrl} 
        preload="metadata"
        onError={() => setHasError(true)}
      />
      
      <div className="flex flex-col gap-6">
        {/* Progress Bar */}
        <div className="flex flex-col gap-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            disabled={loading}
            className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600 hover:accent-brand-500 transition-all disabled:opacity-50"
          />
          <div className="flex justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 font-mono tracking-wider">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => skip(-10)}
              disabled={loading}
              className="p-3 text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90 disabled:opacity-30"
              title="Rewind 10s"
            >
              <RotateCcw size={22} />
            </button>
            
            <button
              onClick={togglePlay}
              disabled={loading}
              className="w-16 h-16 bg-brand-600 text-white rounded-[2rem] flex items-center justify-center shadow-lg shadow-brand-200 dark:shadow-none hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
            >
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>

            <button
              onClick={() => skip(10)}
              disabled={loading}
              className="p-3 text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90 disabled:opacity-30"
              title="Forward 10s"
            >
              <RotateCw size={22} />
            </button>
          </div>

          <button
            onClick={cyclePlaybackRate}
            disabled={loading}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-xs hover:bg-brand-50 hover:text-brand-600 transition-all active:scale-95 border border-slate-100 dark:border-slate-700 disabled:opacity-30"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};

