import * as React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { TokenService } from '../../services/token/tokenService';

function animateValue(start: number, end: number, duration: number, callback: (value: number) => void) {
  const startTime = performance.now();
  
  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(start + (end - start) * easeOutQuart);
    
    callback(current);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

export function TokenBalance() {
  const { user } = useAuth();
  const [displayBalance, setDisplayBalance] = React.useState<number | null>(null);
  const [targetBalance, setTargetBalance] = React.useState<number | null>(null);
  const tokenService = TokenService.getInstance();
  const animationRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!user) {
      setDisplayBalance(null);
      setTargetBalance(null);
      return;
    }

    // Initial balance fetch
    tokenService.getBalance(user.id).then(balance => {
      setDisplayBalance(balance);
      setTargetBalance(balance);
    }).catch(console.error);

    // Subscribe to balance updates
    const unsubscribe = tokenService.onBalanceUpdate((newBalance) => {
      console.log('TokenBalance: Balance updated:', newBalance);
      setTargetBalance(newBalance);
    });

    return () => {
      unsubscribe();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [user]);

  // Handle balance animation when target changes
  React.useEffect(() => {
    if (displayBalance !== null && targetBalance !== null && displayBalance !== targetBalance) {
      animateValue(displayBalance, targetBalance, 500, (value) => {
        setDisplayBalance(value);
      });
    }
  }, [targetBalance]);

  if (!user || displayBalance === null) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Balance:</span>
      <span className="text-sm font-bold">{displayBalance}</span>
    </div>
  );
} 