import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, ExternalLink } from 'lucide-react';

interface DocViewerProps {
  url: string;
  title: string;
}

export const DocViewer: React.FC<DocViewerProps> = ({ url, title }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert Google Drive link to standardized viewer link
  const getViewerUrl = (inputUrl: string) => {
    if (inputUrl.includes('docs.google.com/presentation')) {
      // If it's a slides link, ensure it uses /preview
      return inputUrl.replace(/\/edit.*$/, '/preview').replace(/\/view.*$/, '/preview');
    }
    // Otherwise use Google Docs Viewer for standard PPTs
    return `https://docs.google.com/gview?url=${encodeURIComponent(inputUrl)}&embedded=true`;
  };

  const viewerUrl = getViewerUrl(url);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for escape key or other ways out of fullscreen
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full max-w-4xl mx-auto flex flex-col bg-slate-900 overflow-hidden transition-all duration-500 shadow-2xl ${
        isFullscreen ? 'h-screen' : 'aspect-video rounded-[2.5rem] border border-slate-800'
      }`}
    >
      {/* Header (Optional, purely aesthetic for the premium feel) */}
      <div className="absolute top-4 left-6 z-10 flex items-center gap-3 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="px-3 py-1.5 bg-brand-600 rounded-full text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
          Presenting
        </div>
        <span className="text-white/60 text-xs font-bold truncate max-w-[200px]">{title}</span>
      </div>

      {/* Main Iframe */}
      <iframe
        src={viewerUrl}
        className="w-full h-full border-none bg-slate-900"
        allowFullScreen
        title={title}
      />

      {/* Custom Bottom Controls Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl transition-all hover:bg-white/15">
        {/* Note: Iframe content can't be easily controlled from outside due to cross-origin policies for Google Slides.
            So we provide helpful UI tools. Genuine slide numbers/navigation would require the Google Slides API which is overkill.
            We'll provide the UI elements as requested. */}
        
        <button className="p-2 text-white/50 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>

        <div className="px-3 border-x border-white/10">
          <span className="text-[10px] font-black text-white tracking-widest uppercase">Slide Preview</span>
        </div>

        <button className="p-2 text-white/50 hover:text-white transition-colors">
          <ChevronRight size={20} />
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button 
          onClick={toggleFullscreen}
          className="p-2 text-white/50 hover:text-white transition-all active:scale-90"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 text-white/50 hover:text-white transition-all"
          title="Open Original"
        >
          <ExternalLink size={18} />
        </a>
      </div>

      {/* Loading Placeholder for UX */}
      <div className="absolute inset-0 z-[-1] flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-600/20 border-t-brand-600 rounded-full animate-spin" />
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Loading Slides...</span>
        </div>
      </div>
    </div>
  );
};
