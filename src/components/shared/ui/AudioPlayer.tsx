import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  title?: string;
}

export function AudioPlayer({ src, title: _title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 dark:bg-gray-800/40 border border-gray-700/50 dark:border-gray-700/50">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-700/50 border border-gray-600/50 hover:border-primary/50 hover:bg-gray-700/70 transition-all duration-200 group"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
        ) : (
          <Play className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors ml-0.5" />
        )}
      </button>

      {/* Progress Bar */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs text-gray-400 font-mono min-w-[2.5rem] text-right">
          {formatTime(currentTime)}
        </span>
        <div
          className="flex-1 h-1.5 bg-gray-700/50 rounded-full cursor-pointer group relative"
          onClick={handleProgressClick}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          aria-label="Audio progress"
        >
          <div
            className="h-full bg-primary rounded-full transition-all duration-150 relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-primary/50" />
          </div>
        </div>
        <span className="text-xs text-gray-400 font-mono min-w-[2.5rem]">
          {formatTime(duration)}
        </span>
      </div>

      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-700/50 border border-gray-600/50 hover:border-primary/50 hover:bg-gray-700/70 transition-all duration-200 group"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
        ) : (
          <Volume2 className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
        )}
      </button>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={src} preload="metadata">
        <track kind="captions" />
      </audio>
    </div>
  );
}
