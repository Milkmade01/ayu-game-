
export const ASSETS = {
  CHARACTERS: [
    {
      id: 'katappa',
      name: 'KATAPPA',
      image: 'https://iili.io/fIgyM7a.png',
    },
    {
      id: 'guruji',
      name: 'GURU JI',
      image: 'https://iili.io/fIrtszN.png',
    },
    {
      id: 'awara',
      name: 'AWARA',
      image: 'https://iili.io/fI49fJn.png',
    }
  ],
  // Alternating sounds
  GAME_OVER_SOUNDS: [
    'https://media.vocaroo.com/mp3/1kmbNgSgMVtm',
    'https://media.vocaroo.com/mp3/1n7ySTXGJLjK'
  ],
  // Sound played when entering the "Get Ready" screen
  GAME_START_SOUND: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'
};

export const PHYSICS = {
  // Adjusted for 1:1 feel with original Flappy Bird
  GRAVITY: 0.3,          // Reduced from 0.6
  JUMP_STRENGTH: -5.5,   // Reduced from -8
  GAME_SPEED: 2.0,       // Reduced from 3.5 to match original scroll speed
  OBSTACLE_WIDTH: 60,
  OBSTACLE_GAP: 160,     // Slightly reduced gap to match new speed/gravity
  SPAWN_RATE: 160,       // Increased frames (was 100) to maintain distance with slower speed
};

export const DIMENSIONS = {
  GAME_WIDTH: 400, // Mobile-first logic width
  GAME_HEIGHT: 600,
  BIRD_SIZE: 40,
};
