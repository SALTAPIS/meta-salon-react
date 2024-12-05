import { memo } from 'react';
import { Badge } from '@chakra-ui/react';

interface ConnectionStatusProps {
  status: string;
}

const ConnectionStatus = memo(({ status }: ConnectionStatusProps) => {
  return (
    <Badge
      ml={4}
      colorScheme={status === 'connected' ? 'green' : 'yellow'}
      variant="subtle"
      sx={{
        transition: 'background-color 0.2s ease-in-out',
      }}
    >
      RT: {status}
    </Badge>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';

export default ConnectionStatus; 