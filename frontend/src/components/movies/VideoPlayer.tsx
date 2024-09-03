import React, { useRef } from 'react';
import ReactPlayer from 'react-player';

interface Props {
  url: string;
  autoPlay?: boolean;
  muted?: boolean;
}

const VideoPlayer: React.FC<Props> = ({ url, autoPlay = false, muted = false }) => {
  const videoRef = useRef<ReactPlayer>(null);

  const handlePlayPauseClick = () => {
    if (videoRef.current) {
      const player = videoRef.current.getInternalPlayer();
      if (player) {
        if (player.paused) {
          player.play();
        } else {
          player.pause();
        }
      }
    }
  };

  return (
    <div className="w-100 cursor-pointer overflow-hidden">
      <ReactPlayer
        ref={videoRef}
        url={url}
        controls={true}
        width="100%"
        height="100%"
        playsinline={true}
        className="react-player"
        autoPlay={autoPlay}
        muted={muted}
        onClick={handlePlayPauseClick}
      />
    </div>
  );
};

export default VideoPlayer;
