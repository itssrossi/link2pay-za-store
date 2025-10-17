interface StreakDisplayProps {
  streak: number;
}

export const StreakDisplay = ({ streak }: StreakDisplayProps) => {
  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full shadow-lg">
      <span className="text-2xl animate-pulse">🔥</span>
      <span className="font-bold text-xl">{streak}</span>
      <span className="text-sm">{streak === 1 ? 'day streak!' : 'day streak!'}</span>
    </div>
  );
};
