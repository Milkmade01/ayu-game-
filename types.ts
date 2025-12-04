export enum GameState {
  START = 'START',
  READY = 'READY',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Obstacle {
  id: number;
  x: number;
  gapTop: number; // The Y position of the top of the gap
  gapHeight: number; // The height of the safe gap
  width: number;
  passed: boolean;
}

export interface GameConfig {
  gravity: number;
  jumpStrength: number;
  speed: number;
  obstacleSpawnRate: number; // in frames
  obstacleGapHeight: number;
}