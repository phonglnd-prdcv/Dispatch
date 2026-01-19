import { RefreshCw } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';

interface AnimatedRefreshIconProps {
  isLoading: boolean;
  size?: number;
}

export const AnimatedRefreshIcon: React.FC<AnimatedRefreshIconProps> = ({ isLoading, size = 14 }) => {
  const { colorScheme } = useColorScheme();
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTimeRef.current;
        const degrees = (elapsed / 1000) * 360; // Full rotation per second
        setRotation(degrees % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setRotation(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLoading]);

  const iconColor = colorScheme === 'dark' ? '#9ca3af' : '#6b7280';

  return (
    <div
      style={{
        display: 'inline-flex',
        transform: `rotate(${rotation}deg)`,
        transition: isLoading ? 'none' : 'transform 0.2s ease-out',
      }}
    >
      <RefreshCw size={size} color={iconColor} />
    </div>
  );
};
