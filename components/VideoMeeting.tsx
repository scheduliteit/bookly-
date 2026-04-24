import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface VideoMeetingProps {
  roomName: string;
  onClose: () => void;
  displayName?: string;
}

const VideoMeeting: React.FC<VideoMeetingProps> = ({ roomName, onClose, displayName = 'Host' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const jitsiLink = `https://meet.jit.si/${roomName}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(jitsiLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    // Load Jitsi script if not already present
    const scriptId = 'jitsi-external-api';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => initJitsi();
      document.body.appendChild(script);
    } else {
      initJitsi();
    }

    let api: any = null;

    function initJitsi() {
      if ((window as any).JitsiMeetExternalAPI && containerRef.current) {
        const domain = 'meet.jit.si';
        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          userInfo: {
            displayName: displayName
          },
          configOverwrite: {
            prejoinPageEnabled: false,
          },
          interfaceConfigOverwrite: {
            // Customize UI if needed
          }
        };
        api = new (window as any).JitsiMeetExternalAPI(domain, options);
      }
    }

    return () => {
      if (api) api.dispose();
    };
  }, [roomName, displayName]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-4 md:inset-10 z-[300] bg-brand-dark rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col"
    >
      <div className="p-4 bg-brand-dark/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
            <Maximize2 size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">In-App Conference</h3>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">Room: {roomName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCopyLink}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied Link' : 'Copy Invite Link'}
          </button>

          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-black relative" ref={containerRef}>
        {/* Jitsi Iframe will be injected here */}
      </div>
    </motion.div>
  );
};

export default VideoMeeting;
