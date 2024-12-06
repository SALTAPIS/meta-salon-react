import { useColorModeValue } from '@chakra-ui/react';

export function Logo() {
  const color = useColorModeValue('gray.800', 'white');

  return (
    <svg 
      viewBox="0 0 177 250" 
      xmlns="http://www.w3.org/2000/svg" 
      style={{ 
        width: '24px', 
        height: '24px',
        transition: 'filter 0.2s',
        color: `var(--chakra-colors-${color.replace('.', '-')})` 
      }}
    >
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M88.4866 65.3935C89.683 67.0741 90.8606 68.6981 92.0103 70.2559L95.6648 75.2033C107.834 91.6976 130.5 122.401 136.201 132.712C143.585 146.052 147.557 173.367 133.313 192.269C122.275 206.884 105.937 215.278 88.496 215.278C71.0552 215.278 54.7173 206.884 43.6977 192.288C29.4348 173.376 33.4164 146.062 40.8096 132.693C46.3615 122.628 68.5223 92.5568 80.4205 76.4023C82.0281 74.2308 83.5516 72.1537 84.9442 70.2653C86.1032 68.7075 87.2809 67.0741 88.4866 65.3935M88.4976 0C84.7001 9.24108 71.7958 30.4134 57.5386 49.764C43.3094 69.1429 18.3966 102.624 11.0254 116C-1.89757 139.419 -7.30001 181.678 16.5678 213.385C35.509 238.512 62.6891 250 88.4976 250C114.334 250 141.486 238.512 160.428 213.385C184.286 181.678 178.912 139.419 165.979 116C158.589 102.624 133.695 69.1429 119.438 49.764C105.19 30.4134 92.2859 9.24108 88.4976 0" 
        fill="currentColor"
      />
    </svg>
  );
} 