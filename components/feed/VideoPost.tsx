import { useRef, useEffect, useState } from "react";
import { Volume2, VolumeX, RotateCcw } from "lucide-react";

interface VideoPostProps {
  src: string;
}

const VideoPost = ({ src }: VideoPostProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setEnded(false);
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleReplay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
    setEnded(false);
  };

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={src}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        onEnded={() => setEnded(true)}
        className="w-full object-contain"
        style={{ maxHeight: "85vh" }}
      />
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button
          onClick={() => setMuted(!muted)}
          className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        {ended && (
          <button
            onClick={handleReplay}
            className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoPost;
