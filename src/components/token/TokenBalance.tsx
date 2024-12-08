import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { TokenService } from '../../services/token/tokenService';

export function TokenBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const tokenService = TokenService.getInstance();

  useEffect(() => {
    if (!user) {
      setBalance(null);
      return;
    }

    // Initial balance fetch
    tokenService.getBalance(user.id).then(setBalance).catch(console.error);

    // Subscribe to balance updates
    const unsubscribe = tokenService.onBalanceUpdate((newBalance) => {
      console.log('TokenBalance: Balance updated:', newBalance);
      setBalance(newBalance);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  if (!user || balance === null) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Balance:</span>
      <span className="text-sm font-bold">{balance}</span>
    </div>
  );
} 