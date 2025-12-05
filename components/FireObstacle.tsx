import React from 'react';
import { DIMENSIONS } from '../constants';

const FireObstacle = ({ obstacle }) => {
  const bottomBuildingHeight = DIMENSIONS.GAME_HEIGHT - obstacle.gapTop - obstacle.gapHeight;

  return (
    <React.Fragment>
      <style>
        {`
          @keyframes fire-flow {
            0% { background-position: 0% 0%; }
            100% { background-position: 0% -200%; }
          }
          @keyframes fire-flow-reverse {
            0% { background-position: 0% 0%; }
            100% { background-position: 0% 200%; }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
          .fire-column {
            background: repeating-linear-gradient(
              0deg,
              #7f1d1d 0%,
              #991b1b 10%,
              #ea580c 25%,
              #fbbf24 40%,
              #ea580c 55%,
              #991b1b 70%,
              #7f1d1d 85%,
              #450a0a 100%
            );
            background-size: 100% 200%;
            box-shadow: 
              0 0 10px #ea580c, 
              inset 0 0 10px #450a0a;
            border-left: 2px solid #fbbf24;
            border-right: 2px solid #fbbf24;
          }
          .fire-anim-up {
            animation: fire-flow 1.5s linear infinite;
          }
          .fire-anim-down {
            animation: fire-flow-reverse 1.5s linear infinite;
          }
          .fire-core {
             background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 40%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.3) 60%, transparent 100%);
             mix-blend-mode: overlay;
          }
          .particle {
             background: #fbbf24;
             border-radius: 50%;
             box-shadow: 0 0 4px #fbbf24;
          }
        `}
      </style>

      {/* Top Fire Column (Hanging down) */}
      <div
        className="absolute fire-column fire-anim-down rounded-b-xl overflow-hidden z-20"
        style={{
          left: obstacle.x,
          top: 0,
          width: obstacle.width,
          height: obstacle.gapTop,
        }}
      >
        {/* Glowing Core */}
        <div className="absolute inset-0 fire-core animate-pulse" />
        
        {/* Bottom edge glow */}
        <div className="absolute bottom-0 w-full h-4 bg-gradient-to-t from-yellow-300 to-transparent opacity-80" />
      </div>

      {/* Bottom Fire Column (Rising up) */}
      <div
        className="absolute fire-column fire-anim-up rounded-t-xl overflow-hidden z-20"
        style={{
          left: obstacle.x,
          top: obstacle.gapTop + obstacle.gapHeight,
          width: obstacle.width,
          height: bottomBuildingHeight,
        }}
      >
        {/* Glowing Core */}
        <div className="absolute inset-0 fire-core animate-pulse" />

        {/* Top edge glow */}
        <div className="absolute top-0 w-full h-4 bg-gradient-to-b from-yellow-300 to-transparent opacity-80" />
      </div>
    </React.Fragment>
  );
};

export default FireObstacle;