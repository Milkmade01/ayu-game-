// Global Types
// Interfaces are removed by Babel during compilation
// Enums become objects

export const GameState = {
  START: 'START',
  READY: 'READY',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

// TypeScript interfaces are stripped by Babel, so we can leave them here for reference or just ignore them.
// Since we are running in a "script" mode effectively, we don't export.