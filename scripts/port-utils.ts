import net from 'net';

export function findAvailablePort(startPort: number, endPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    function tryPort(port: number) {
      if (port > endPort) {
        reject(new Error(`No available ports between ${startPort} and ${endPort}`));
        return;
      }

      const server = net.createServer();
      server.unref();

      server.on('error', () => {
        tryPort(port + 1);
      });

      server.listen(port, '127.0.0.1', () => {
        server.close(() => {
          resolve(port);
        });
      });
    }

    tryPort(startPort);
  });
} 