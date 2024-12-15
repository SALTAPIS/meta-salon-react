import { useState, useEffect } from 'react';
import { TextProps, useColorModeValue, Box, VStack, Text } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedBalanceProps extends Omit<TextProps, 'transition' | 'animation'> {
  balance: number;
}

const MotionBox = motion(Box);

export function AnimatedBalance({ balance, fontSize = "3xl", fontWeight = "normal", ...props }: AnimatedBalanceProps) {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [isAnimating, setIsAnimating] = useState(false);
  const textColor = useColorModeValue('gray.800', 'white');
  const labelColor = useColorModeValue('gray.500', 'gray.500');
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
      <VStack spacing={1} align="flex-end">
        <MotionBox
          fontSize={fontSize}
          fontWeight={fontWeight}
          color={textColor}
          animate={{
            scale: isAnimating ? [1, 1.1, 1] : 1,
            color: isAnimating ? [textColor, highlightColor, textColor] : textColor,
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
          {...props}
        >
          {Math.round(displayBalance).toLocaleString()} SLN
        </MotionBox>
        <Text color={labelColor}>Balance</Text>
      </VStack>
    </AnimatePresence>
  );
} 