import { memo, useMemo } from 'react';
import { Badge, Box } from '@chakra-ui/react';

interface ConnectionStatusProps {
  status: string;
}

const ConnectionStatus = memo(({ status }: ConnectionStatusProps) => {
  const badgeProps = useMemo(() => {
    switch (status) {
      case 'connected':
        return { colorScheme: 'green', text: 'Connected' };
      case 'disconnected':
        return { colorScheme: 'red', text: 'Offline' };
      case 'reconnecting':
        return { colorScheme: 'yellow', text: 'Connecting' };
      default:
        return { colorScheme: 'gray', text: status };
    }
  }, [status]);

  return (
    <Box position="absolute" top={4} right={4}>
      <Badge
        colorScheme={badgeProps.colorScheme}
        variant="subtle"
        fontSize="xs"
      >
        {badgeProps.text}
      </Badge>
    </Box>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';

export default ConnectionStatus; 