import { useState, useEffect } from 'react';
import { TextProps, useColorModeValue } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedBalanceProps extends Omit<TextProps, 'transition' | 'animation'> {
  balance: number;
}

const MotionDiv = motion.div;

export function AnimatedBalance({ balance, fontSize, fontWeight }: AnimatedBalanceProps) {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [isAnimating, setIsAnimating] = useState(false);
  const textColor = useColorModeValue('gray.800', 'white');
  const highlightColor = useColorModeValue('green.500', 'green.300');

  useEffect(() => {
    if (balance !== displayBalance) {
      setIsAnimating(true);
      const duration = 500; // Animation duration in ms
      const steps = 10; // Number of steps in the animation
      const stepDuration = duration / steps;
      const increment = (balance - displayBalance) / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        setDisplayBalance(prev => {
          const next = prev + increment;
          // Ensure we exactly hit the target on the last step
          return currentStep === steps ? balance : next;
        });

        if (currentStep === steps) {
          clearInterval(interval);
          setTimeout(() => setIsAnimating(false), 500); // Keep highlight for 500ms after counting ends
        }
      }, stepDuration);

      return () => clearInterval(interval);
    }
  }, [balance]);

  return (
    <AnimatePresence>
      <MotionDiv
        style={{
          fontSize: typeof fontSize === 'string' ? fontSize : undefined,
          fontWeight: typeof fontWeight === 'string' ? fontWeight : undefined,
          color: textColor,
        }}
        animate={{
          scale: isAnimating ? [1, 1.1, 1] : 1,
          color: isAnimating ? [textColor, highlightColor, textColor] : textColor,
        }}
        transition={{
          duration: 0.5,
          ease: "easeInOut",
        }}
      >
        {Math.round(displayBalance).toLocaleString()} SLN
      </MotionDiv>
    </AnimatePresence>
  );
} 