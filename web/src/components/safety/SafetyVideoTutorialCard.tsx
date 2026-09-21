import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  X,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  Maximize2,
} from 'lucide-react';
import { SafetyGuideItem } from '../../data/safetyGuidesData';

interface SafetyVideoTutorialCardProps {
  video: SafetyGuideItem['video'];
}

export const SafetyVideoTutorialCard: React.FC<SafetyVideoTutorialCardProps> = ({ video }) => {
  const [isPlayingModalOpen, setIsPlayingModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(38);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Playback timer ticker when video is active
  useEffect(() => {
    let interval: any = null;
    if (isPlayingModalOpen && isPlaying) {
      interval = setInterval(() => {
        setPlaybackSeconds((prev) => (prev >= 320 ? 0 : prev + 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingModalOpen, isPlaying]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Video Tutorial Card */}
      <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 sm:p-6 shadow-card mb-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DCEBED]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#075B8A]">
              VIDEO TUTORIAL
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#708696] uppercase">
            Official Civil Defense Training
          </span>
        </div>

        {/* Video Thumbnail with Play Button */}
        <div
          onClick={() => {
            setIsPlaying(true);
            setIsPlayingModalOpen(true);
          }}
          className="relative group rounded-2xl overflow-hidden bg-slate-900 cursor-pointer aspect-video sm:aspect-[21/9] flex items-center justify-center shadow-md"
        >
          {/* Background Thumbnail Image with Dark Overlay */}
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-300"
          />

          {/* Play Button Overlay */}
          <div className="relative z-10 flex flex-col items-center gap-3 text-center p-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#18C3D0] group-hover:bg-[#15B0BC] text-[#075B8A] flex items-center justify-center shadow-float group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
            </div>
            <div className="text-white max-w-lg">
              <h4 className="text-sm sm:text-base font-extrabold font-sans drop-shadow-md">
                {video.title}
              </h4>
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#D3E8F4] mt-1">
                <span className="flex items-center gap-1 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/20">
                  <Clock className="w-3 h-3 text-[#18C3D0]" />
                  {video.duration}
                </span>
                <span>•</span>
                <span>Click to stream training</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Video Player Modal */}
      {isPlayingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div
            onClick={() => setIsPlayingModalOpen(false)}
            className="fixed inset-0 bg-[#075B8A]/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <div className={`relative w-full ${isFullscreen ? 'max-w-5xl' : 'max-w-3xl'} bg-white rounded-[24px] shadow-float border border-[#DCEBED] overflow-hidden z-10 flex flex-col animate-in fade-in zoom-in-95 duration-200 transition-all`}>
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#075B8A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#18C3D0] text-[#075B8A] flex items-center justify-center font-bold">
                  {isPlaying ? <Play className="w-4 h-4 fill-current ml-0.5" /> : <Pause className="w-4 h-4 fill-current" />}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white font-sans line-clamp-1">
                    {video.title}
                  </h3>
                  <p className="text-[10px] text-[#A7D7E8] font-mono">
                    Instructor: {video.instructor} • {video.duration}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPlayingModalOpen(false)}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Simulation Canvas */}
            <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
              <img
                src={video.thumbnailUrl}
                alt="Video Stream Canvas"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? 'opacity-40 scale-105 transition-transform duration-[10000ms]' : 'opacity-30'}`}
              />
              <div className="relative z-10 text-center p-6 text-white space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18C3D0] text-[#075B8A] text-xs font-mono font-bold">
                  <span className={`w-2 h-2 rounded-full bg-[#075B8A] ${isPlaying ? 'animate-ping' : ''}`} />
                  <span>{isPlaying ? 'LIVE TRAINING STREAM ACTIVE' : 'STREAM PAUSED'}</span>
                </div>
                <h4 className="text-lg font-bold">{video.title}</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {video.description}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="absolute bottom-12 inset-x-4 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                <div
                  className="bg-[#18C3D0] h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (playbackSeconds / 320) * 100)}%` }}
                />
              </div>

              {/* Video Player Controls Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 sm:p-4 flex items-center justify-between text-white text-xs font-mono">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-full bg-white/20 hover:bg-[#18C3D0] hover:text-[#075B8A] transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause video' : 'Play video'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>
                  <span className="text-[11px] text-[#A7D7E8]">
                    {formatTime(playbackSeconds)} / {video.duration.split(' ')[0]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-[#E94B68]" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                    title="Toggle Expand View"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Video Key Takeaways */}
            <div className="p-5 sm:p-6 bg-[#F4F8FA] border-t border-[#DCEBED] space-y-2.5">
              <h4 className="text-xs font-mono font-bold uppercase text-[#075B8A] tracking-wider">
                Key Protocol Takeaways:
              </h4>
              <div className="space-y-1.5">
                {video.keyTakeaways.map((takeaway, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[#18364A]">
                    <CheckCircle2 className="w-4 h-4 text-[#45C79A] shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
