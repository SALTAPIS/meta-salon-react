export const getEntryAnimation = (position: 'left' | 'right') => {
  const xOffset = position === 'left' ? -2000 : 2000;
  return {
    x: xOffset,
    y: Math.random() * 500 - 250, // Random value between -250 and 250
    rotate: (Math.random() * 30 - 15) * (position === 'left' ? 1 : -1), // Rotate towards the center
  }
}

export const getExitAnimation = (position: 'left' | 'right') => {
  const xOffset = position === 'left' ? -2000 : 2000;
  return {
    x: xOffset,
    y: Math.random() * 1000 - 500, // Random value between -500 and 500
    rotate: (Math.random() * 60 - 30) * (position === 'left' ? -1 : 1), // Rotate away from the center
  }
}

export const getNodAnimation = () => {
  return {
    rotate: [0, -10, 10, -5, 5, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
    }
  }
}

