import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function GalaxyBackground() {
  const { theme } = useTheme();
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: string; duration: string }[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`,
    }));
    setStars(newStars);
  }, []);

  if (theme !== 'dark') return null;

  return (
    <div className="galaxy-bg">
      <div className="stars-container">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              '--duration': star.duration,
            } as any}
          />
        ))}
      </div>
    </div>
  );
}
