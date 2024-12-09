import { useState, useEffect, useRef } from 'react';
import { Text, Skeleton } from '@chakra-ui/react';
import { useTokens } from '../../hooks/token/useTokens';

interface TokenBalanceProps {
  animate?: boolean;
}

export function TokenBalance({ animate = true }: TokenBalanceProps) {
  const { balance, isLoading } = useTokens();
  const [displayBalance, setDisplayBalance] = useState<number | null>(null);
  const [targetBalance, setTargetBalance] = useState<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (balance !== null) {
      setTargetBalance(balance);
      if (!animate) {
        setDisplayBalance(balance);
      }
    }
  }, [balance, animate]);

  useEffect(() => {
    if (!animate || targetBalance === null || displayBalance === null) return;

    const startTime = Date.now();
    const startValue = displayBalance;
    const endValue = targetBalance;
    const duration = 1000; // 1 second animation

    const updateBalance = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;

      setDisplayBalance(Math.round(currentValue));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(updateBalance);
      }
    };

    animationRef.current = requestAnimationFrame(updateBalance);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetBalance, displayBalance, animate]);

  if (isLoading) {
    return <Skeleton height="1.5em" width="4em" />;
  }

  return <Text>{displayBalance ?? balance ?? 0} SLN</Text>;
} 