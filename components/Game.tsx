
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState } from '../types';
import { ASSETS, PHYSICS, DIMENSIONS } from '../constants';
import { getGameCommentary } from '../services/geminiService';
import Building from './Building';

// Inline Icons (replacing Lucide-React to avoid dependency)
const CheckIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const PlayIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const HandIcon = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path></svg>;
const RotateCcwIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>;
const DownloadIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;

const Game = () => {
  const [gameState, setGameState] = useState(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [birdY, setBirdY] = useState(DIMENSIONS.GAME_HEIGHT / 2);
  const [birdRotation, setBirdRotation] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [commentary, setCommentary] = useState("");
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Mutable state for the game loop
  const stateRef = useRef({
    birdY: DIMENSIONS.GAME_HEIGHT / 2,
    velocity: 0,
    obstacles: [],
    score: 0,
    frames: 0,
    gameStatus: GameState.START
  });

  const requestRef = useRef();
  
  // Audio Refs
  const audioTracksRef = useRef([]);
  const gameStartSoundRef = useRef(null);
  // Start at index 0 (first track)
  const currentSoundIndexRef = useRef(0);

  // Initialize Audio
  useEffect(() => {
    // Preload game over sounds
    audioTracksRef.current = ASSETS.GAME_OVER_SOUNDS.map(src => {
      const audio = new Audio(src);
      audio.preload = 'auto'; 
      return audio;
    });

    // Preload start sound
    const startAudio = new Audio(ASSETS.GAME_START_SOUND);
    startAudio.preload = 'auto';
    gameStartSoundRef.current = startAudio;
  }, []);

  const stopAllSounds = useCallback(() => {
    // Stop game over sounds
    if(audioTracksRef.current) {
        audioTracksRef.current.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
        });
    }
    // Stop start sound
    if (gameStartSoundRef.current) {
      gameStartSoundRef.current.pause();
      gameStartSoundRef.current.currentTime = 0;
    }
  }, []);

  const playGameOverSound = useCallback(() => {
    const sounds = audioTracksRef.current;
    if (sounds.length === 0) return;

    // Get the sound for THIS turn
    const index = currentSoundIndexRef.current;
    const audioToPlay = sounds[index];
    
    if (audioToPlay) {
      // Reset and play
      audioToPlay.pause();
      audioToPlay.currentTime = 0;
      audioToPlay.volume = 1.0;
      
      const playPromise = audioToPlay.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Audio playback failed:", error);
        });
      }
    }
    
    // Advance index for the NEXT game over
    // (0 -> 1 -> 0 -> 1 ...)
    currentSoundIndexRef.current = (index + 1) % sounds.length;
  }, []);

  const spawnObstacle = useCallback(() => {
    const minHeight = 50;
    const maxHeight = DIMENSIONS.GAME_HEIGHT - PHYSICS.OBSTACLE_GAP - minHeight;
    const gapTop = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    const newObstacle = {
      id: Date.now(),
      x: DIMENSIONS.GAME_WIDTH,
      gapTop,
      gapHeight: PHYSICS.OBSTACLE_GAP,
      width: PHYSICS.OBSTACLE_WIDTH,
      passed: false,
    };

    stateRef.current.obstacles = [...stateRef.current.obstacles, newObstacle];
  }, []);

  const resetGame = () => {
    stopAllSounds(); // Stop any playing sounds
    
    // Play Start Sound
    if (gameStartSoundRef.current) {
      gameStartSoundRef.current.volume = 0.5;
      gameStartSoundRef.current.play().catch(e => console.log("Start sound blocked", e));
    }

    // Reset to READY state
    setGameState(GameState.READY);
    setScore(0);
    setBirdY(DIMENSIONS.GAME_HEIGHT / 2);
    setBirdRotation(0);
    setObstacles([]);
    setCommentary("");
    
    stateRef.current = {
      birdY: DIMENSIONS.GAME_HEIGHT / 2,
      velocity: 0,
      obstacles: [],
      score: 0,
      frames: 0,
      gameStatus: GameState.READY
    };
  };

  const handleGameOver = () => {
    // CRITICAL: Prevent multiple calls if collision happens in consecutive frames
    if (stateRef.current.gameStatus === GameState.GAME_OVER) return;
    
    stateRef.current.gameStatus = GameState.GAME_OVER;
    setGameState(GameState.GAME_OVER);
    playGameOverSound();
    
    if (stateRef.current.score > highScore) {
      setHighScore(stateRef.current.score);
    }

    // Get local commentary instantly
    const message = getGameCommentary(stateRef.current.score);
    setCommentary(message);
  };

  const update = useCallback(() => {
    // Handle READY state hover animation
    if (stateRef.current.gameStatus === GameState.READY) {
      stateRef.current.frames++;
      // Simple sine wave hover
      const hoverOffset = Math.sin(stateRef.current.frames * 0.1) * 5;
      const baseHeight = DIMENSIONS.GAME_HEIGHT / 2;
      
      setBirdY(baseHeight + hoverOffset);
      
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    if (stateRef.current.gameStatus !== GameState.PLAYING) return;

    // Physics
    stateRef.current.velocity += PHYSICS.GRAVITY;
    stateRef.current.birdY += stateRef.current.velocity;
    stateRef.current.frames++;

    // Bird Rotation
    const rotation = Math.min(Math.max(stateRef.current.velocity * 4, -25), 90);
    setBirdRotation(rotation);

    // Spawn Obstacles
    if (stateRef.current.frames % PHYSICS.SPAWN_RATE === 0) {
      spawnObstacle();
    }

    // Move Obstacles & Collision Detection
    const birdRect = {
      top: stateRef.current.birdY + 5, // slight hitbox padding
      bottom: stateRef.current.birdY + DIMENSIONS.BIRD_SIZE - 5,
      left: 50 + 5, // Bird fixed X is 50
      right: 50 + DIMENSIONS.BIRD_SIZE - 5,
    };

    // Check floor/ceiling collision
    if (stateRef.current.birdY >= DIMENSIONS.GAME_HEIGHT - DIMENSIONS.BIRD_SIZE || stateRef.current.birdY <= 0) {
      handleGameOver();
      return;
    }

    const nextObstacles = stateRef.current.obstacles
      .map(obs => ({ ...obs, x: obs.x - PHYSICS.GAME_SPEED }))
      .filter(obs => obs.x + obs.width > -100);

    for (const obs of nextObstacles) {
      // Collision with buildings
      const inXRange = birdRect.right > obs.x && birdRect.left < obs.x + obs.width;
      
      if (inXRange) {
        const hitTop = birdRect.top < obs.gapTop;
        const hitBottom = birdRect.bottom > obs.gapTop + obs.gapHeight;
        
        if (hitTop || hitBottom) {
          handleGameOver();
          return;
        }
      }

      // Score update
      if (!obs.passed && birdRect.left > obs.x + obs.width) {
        obs.passed = true;
        stateRef.current.score += 1;
        setScore(stateRef.current.score);
      }
    }

    stateRef.current.obstacles = nextObstacles;

    // Sync Ref to State for Rendering
    setBirdY(stateRef.current.birdY);
    setObstacles(stateRef.current.obstacles);

    requestRef.current = requestAnimationFrame(update);
  }, [spawnObstacle, highScore, playGameOverSound]);

  // Game Loop Effect
  useEffect(() => {
    if (gameState === GameState.PLAYING || gameState === GameState.READY) {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, update]);

  const jump = useCallback(() => {
    if (gameState === GameState.PLAYING) {
      stateRef.current.velocity = PHYSICS.JUMP_STRENGTH;
    } else if (gameState === GameState.READY) {
      // Start the game on first jump
      setGameState(GameState.PLAYING);
      stateRef.current.gameStatus = GameState.PLAYING;
      stateRef.current.velocity = PHYSICS.JUMP_STRENGTH;
      stateRef.current.frames = 0; // Reset frames so first obstacle spawn is consistent
    }
  }, [gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (gameState === GameState.START) return; // Don't start from spacebar on selection screen
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, gameState]);

  const handleDownloadStats = async (e) => {
    e.stopPropagation();
    if (isGeneratingImage) return;
    setIsGeneratingImage(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set Canvas Dimensions
      const width = 600;
      const height = 800;
      canvas.width = width;
      canvas.height = height;

      // 1. Background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0f172a'); // Slate 900
      gradient.addColorStop(1, '#334155'); // Slate 700
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Border
      ctx.strokeStyle = '#4ade80'; // Green 400
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // 3. Title
      ctx.font = 'bold 50px "Courier New"'; 
      try { ctx.font = '50px "Press Start 2P"'; } catch (e) {}
      
      ctx.fillStyle = '#ef4444'; // Red 500
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', width / 2, 100);

      // 4. Score Circle
      ctx.beginPath();
      ctx.arc(width / 2, 240, 90, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#facc15'; // Yellow
      ctx.lineWidth = 5;
      ctx.stroke();

      // Score Text
      ctx.fillStyle = '#000000';
      ctx.font = '80px sans-serif'; 
      try { ctx.font = '80px "Press Start 2P"'; } catch (e) {}
      ctx.fillText(score.toString(), width / 2, 270);

      ctx.fillStyle = '#64748b';
      ctx.font = '20px sans-serif';
      try { ctx.font = '20px "Press Start 2P"'; } catch (e) {}
      ctx.fillText('FINAL SCORE', width / 2, 180);

      // 5. Character Section
      const charName = ASSETS.CHARACTERS[selectedCharIndex].name;
      const charImageUrl = ASSETS.CHARACTERS[selectedCharIndex].image;

      // Load Image for Canvas
      const loadImg = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous'; // Critical for canvas export
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      try {
        const charImg = await loadImg(charImageUrl);
        
        // Draw Character Image
        const imgSize = 120;
        const imgX = width / 2 - imgSize / 2;
        const imgY = 380;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(charImg, imgX, imgY, imgSize, imgSize);
        ctx.restore();
        
        // Circle border for char
        ctx.beginPath();
        ctx.arc(width / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();

      } catch (err) {
        // Fallback if image fails
        ctx.beginPath();
        ctx.arc(width / 2, 440, 60, 0, Math.PI * 2);
        ctx.fillStyle = '#aaa';
        ctx.fill();
      }

      // Character Name
      ctx.fillStyle = '#4ade80'; // Green
      ctx.font = '30px sans-serif';
      try { ctx.font = '30px "Press Start 2P"'; } catch (e) {}
      ctx.fillText(charName, width / 2, 550);

      // 6. Stats Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(50, 600, width - 100, 150);
      
      // High Score
      ctx.fillStyle = '#facc15'; // Yellow
      ctx.font = '20px sans-serif';
      try { ctx.font = '20px "Press Start 2P"'; } catch (e) {}
      ctx.fillText(`BEST SCORE: ${highScore}`, width / 2, 650);

      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      try { ctx.font = '16px "Press Start 2P"'; } catch (e) {}
      ctx.fillText('Face Flappy Challenge', width / 2, 720);

      // 7. Convert and Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `flappy-score-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Failed to generate image", error);
      alert("Could not generate image. Browser security may prevent saving images with cross-origin content.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900 touch-none">
      
      {/* Game Container */}
      <div 
        className="relative overflow-hidden shadow-2xl bg-gradient-to-b from-sky-400 to-sky-200"
        style={{ width: DIMENSIONS.GAME_WIDTH, height: DIMENSIONS.GAME_HEIGHT }}
        onClick={jump}
      >
        
        {/* Background Decorative Elements (Clouds) */}
        <div className="absolute top-10 left-10 text-white/40 animate-pulse">
           <svg width="60" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5,19c-3.037,0-5.5-2.463-5.5-5.5c0-0.41,0.063-0.803,0.165-1.185 C10.613,10.239,8.441,9,6,9c-3.314,0-6,2.686-6,6c0,3.314,2.686,6,6,6c0.559,0,1.103-0.076,1.625-0.22C9.288,22.09,11.238,23,13.5,23 c3.59,0,6.5-2.91,6.5-6.5C19.5,17.433,18.736,16.516,17.5,19z"/></svg>
        </div>
        <div className="absolute top-40 right-20 text-white/30">
           <svg width="80" height="50" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5,19c-3.037,0-5.5-2.463-5.5-5.5c0-0.41,0.063-0.803,0.165-1.185 C10.613,10.239,8.441,9,6,9c-3.314,0-6,2.686-6,6c0,3.314,2.686,6,6,6c0.559,0,1.103-0.076,1.625-0.22C9.288,22.09,11.238,23,13.5,23 c3.59,0,6.5-2.91,6.5-6.5C19.5,17.433,18.736,16.516,17.5,19z"/></svg>
        </div>

        {/* Buildings */}
        {obstacles.map(obs => (
          <Building key={obs.id} obstacle={obs} />
        ))}

        {/* The Floor */}
        <div className="absolute bottom-0 w-full h-4 bg-emerald-600 border-t-4 border-emerald-800 z-10" />

        {/* The Character (Bird) */}
        <div
          className="absolute z-20"
          style={{
            left: 50,
            top: birdY,
            width: DIMENSIONS.BIRD_SIZE,
            height: DIMENSIONS.BIRD_SIZE,
            transform: `rotate(${birdRotation}deg)`,
            transition: 'transform 0.1s',
          }}
        >
          <img 
            src={ASSETS.CHARACTERS[selectedCharIndex].image} 
            alt="Character" 
            className="w-full h-full rounded-full border-2 border-white shadow-lg object-cover bg-white"
            onError={(e) => {
               // @ts-ignore
               e.target.src = 'https://picsum.photos/40/40';
            }}
          />
        </div>

        {/* Score Display (Playing) */}
        {(gameState === GameState.PLAYING || gameState === GameState.READY) && (
          <div className="absolute top-10 w-full text-center z-30 pointer-events-none">
            <span className="text-5xl font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] stroke-black">
              {score}
            </span>
          </div>
        )}

        {/* Start / Character Selection Screen */}
        {gameState === GameState.START && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-40 text-center p-4">
            <h1 className="text-3xl text-white font-bold mb-6 drop-shadow-md">CHOOSE CHARACTER</h1>
            
            <div className="flex gap-4 mb-8">
              {ASSETS.CHARACTERS.map((char, index) => (
                <div 
                  key={char.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedCharIndex(index); }}
                  className={`relative cursor-pointer transition-all hover:scale-110 ${selectedCharIndex === index ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}
                >
                  <div className={`w-20 h-20 rounded-full border-4 overflow-hidden bg-white ${selectedCharIndex === index ? 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.6)]' : 'border-white'}`}>
                    <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-2 text-xs text-white font-bold bg-black/50 rounded px-1">{char.name}</div>
                  {selectedCharIndex === index && (
                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-white">
                      <CheckIcon />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); resetGame(); }}
              className="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg border-b-4 border-green-700 transition-all active:border-b-0 active:translate-y-1 animate-pulse"
            >
              <div className="mr-2"><PlayIcon /></div> START GAME
            </button>
          </div>
        )}

        {/* Get Ready Screen */}
        {gameState === GameState.READY && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none">
             <div className="text-white font-bold text-3xl mb-12 drop-shadow-lg stroke-black">GET READY!</div>
             <div className="animate-pulse bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <div className="text-white"><HandIcon /></div>
             </div>
             <p className="text-white mt-4 font-bold drop-shadow-md">Tap to Flap</p>
           </div>
        )}

        {/* Game Over Screen */}
        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-50 p-6 text-center">
            <h2 className="text-3xl text-red-500 font-bold mb-2">GAME OVER</h2>
            
            <div className="bg-white/10 p-4 rounded-xl mb-4 w-full max-w-[280px]">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Score</span>
                <span className="text-white font-bold text-xl">{score}</span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-2">
                <span className="text-yellow-400">Best</span>
                <span className="text-white font-bold text-xl">{highScore}</span>
              </div>
            </div>

            {/* AI Commentary Section - Now Local */}
            <div className="min-h-[60px] mb-4 flex items-center justify-center w-full">
              <p className="text-white text-xs italic border-l-4 border-purple-500 pl-3 text-left">
                "{commentary}"
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              
              {/* Action Buttons */}
              <div className="flex gap-2 w-full">
                 <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    stopAllSounds(); 
                    setGameState(GameState.START); 
                  }}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold text-sm rounded-lg shadow-lg border-b-4 border-gray-800 active:border-b-0 active:translate-y-1"
                >
                  MENU
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); resetGame(); }}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm rounded-lg shadow-lg border-b-4 border-blue-700 active:border-b-0 active:translate-y-1"
                >
                  <RotateCcwIcon /> RETRY
                </button>
              </div>

               {/* Save Stats Button */}
               <button 
                onClick={handleDownloadStats}
                disabled={isGeneratingImage}
                className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-lg shadow-lg border-b-4 border-purple-800 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DownloadIcon /> 
                {isGeneratingImage ? 'SAVING...' : 'SAVE STATS'}
              </button>

            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-gray-500 text-xs text-center max-w-[400px]">
        Playing as: <span className="text-green-400">{ASSETS.CHARACTERS[selectedCharIndex].name}</span><br/>
        Sound on for full humiliation.
      </div>
    </div>
  );
};

export default Game;
