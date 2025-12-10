/**
 * Audio Player Component
 * 
 * Refactored to use shared MediaTimeDisplay and ProgressBar components
 * for consistent time-based UI patterns across the application.
 */

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import MediaTimeDisplay from "./MediaTimeDisplay";
import ProgressBar from "./ProgressBar";

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
  const [volume, setVolume] = useState(0.5); // Default to 50% volume

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set default volume
    audio.volume = volume;

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
  }, [volume]);

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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    
    // Unmute if volume is increased from 0
    if (newVolume > 0 && isMuted) {
      audio.muted = false;
      setIsMuted(false);
    }
  };

  const handleProgressClick = (percent: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const newTime = (percent / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 dark:bg-gray-800/40 border border-gray-700/50 dark:border-gray-700/50">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-700/50 border border-gray-600/50 hover:border-primary/50 hover:bg-gray-700/70 transition-all duration-200 group flex-shrink-0"
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
        <MediaTimeDisplay seconds={currentTime} format="digital" size="sm" className="min-w-[2.5rem] text-right" />
        <div className="flex-1">
          <ProgressBar
            progress={progressPercent}
            onClick={handleProgressClick}
            showThumb={true}
            variant="primary"
            size="sm"
            ariaLabel="Audio progress"
          />
        </div>
        <MediaTimeDisplay seconds={duration} format="digital" size="sm" className="min-w-[2.5rem]" />
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Volume Slider */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-16 h-1.5 bg-gray-700/50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          aria-label="Volume control"
          style={{
            background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${volume * 100}%, rgb(55 65 81 / 0.5) ${volume * 100}%, rgb(55 65 81 / 0.5) 100%)`,
          }}
        />
        
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
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={src} preload="metadata">
        <track kind="captions" />
      </audio>
    </div>
  );
}
