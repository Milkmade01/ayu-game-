
import React from 'react';
import { DIMENSIONS } from '../constants';

interface BuildingProps {
  obstacle: any;
}

// Access React from global scope
const Building: React.FC<BuildingProps> = ({ obstacle }) => {
  const bottomBuildingHeight = DIMENSIONS.GAME_HEIGHT - obstacle.gapTop - obstacle.gapHeight;

  return (
    <React.Fragment>
      <style>
        {`
          .building-pattern {
            background-color: #525252;
            background-image: 
              linear-gradient(rgba(255, 255, 255, 0.1) 2px, transparent 2px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 20px 20px, 20px 20px, 10px 10px, 10px 10px;
            box-shadow: inset 5px 0 10px rgba(0,0,0,0.5), inset -5px 0 10px rgba(0,0,0,0.5);
            border: 2px solid #262626;
          }
          .building-cap {
             background: #262626;
             width: 110%;
             margin-left: -5%;
             height: 10px;
             border-radius: 2px;
          }
          .window {
            background: #fef08a;
            box-shadow: 0 0 5px #fef08a;
          }
        `}
      </style>

      {/* Top Building */}
      <div
        className="absolute z-20 flex flex-col items-center justify-end"
        style={{
          left: obstacle.x,
          top: 0,
          width: obstacle.width,
          height: obstacle.gapTop,
        }}
      >
        <div className="w-full h-full building-pattern relative overflow-hidden">
           {/* Decorative windows for top building */}
           <div className="absolute bottom-4 left-2 right-2 flex justify-between flex-wrap gap-1">
              <div className="w-3 h-4 bg-gray-800/50"></div>
              <div className="w-3 h-4 bg-yellow-200/20"></div>
              <div className="w-3 h-4 bg-gray-800/50"></div>
              <div className="w-3 h-4 bg-gray-800/50"></div>
           </div>
        </div>
        <div className="building-cap mb-[-2px]" />
      </div>

      {/* Bottom Building */}
      <div
        className="absolute z-20 flex flex-col items-center justify-start"
        style={{
          left: obstacle.x,
          top: obstacle.gapTop + obstacle.gapHeight,
          width: obstacle.width,
          height: bottomBuildingHeight,
        }}
      >
        <div className="building-cap mt-[-2px] z-30" />
        <div className="w-full h-full building-pattern relative overflow-hidden">
             {/* Decorative windows for bottom building */}
             <div className="absolute top-4 left-2 right-2 flex justify-between flex-wrap gap-2">
                <div className="w-4 h-6 bg-yellow-200/10"></div>
                <div className="w-4 h-6 bg-yellow-200/40 window"></div>
                <div className="w-4 h-6 bg-gray-800/50"></div>
                <div className="w-4 h-6 bg-gray-800/50"></div>
                <div className="w-4 h-6 bg-yellow-200/20"></div>
                <div className="w-4 h-6 bg-gray-800/50"></div>
             </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Building;
