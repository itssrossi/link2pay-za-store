// Celebration sound with mobile compatibility
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const playCelebrationSound = async () => {
  try {
    const context = getAudioContext();
    
    // Resume context if it's suspended (required for mobile)
    if (context.state === 'suspended') {
      await context.resume();
    }
    
    // Create celebration melody with multiple notes
    const notes = [
      { freq: 523.25, duration: 0.15 }, // C5
      { freq: 659.25, duration: 0.15 }, // E5
      { freq: 783.99, duration: 0.15 }, // G5
      { freq: 1046.50, duration: 0.3 }, // C6
    ];
    
    let startTime = context.currentTime;
    
    notes.forEach((note, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.setValueAtTime(note.freq, startTime);
      oscillator.type = 'sine';
      
      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + note.duration);
      
      startTime += note.duration * 0.8; // Slight overlap
    });
    
  } catch (error) {
    console.log('Audio not supported or failed to play celebration sound:', error);
  }
};