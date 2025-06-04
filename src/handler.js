import { Router } from 'itty-router';

const router = Router();

// In-memory vote counts (in production, use Durable Objects or KV)
const voteCounts = {
  yes: 0,
  no: 0,
  neutral: 0,
};

// Connected WebSocket clients
const clients = new Set();

router.get('/ws', async request => {
  if (!request.headers.get('Upgrade')?.toLowerCase().includes('websocket')) {
    return new Response('Expected websocket', { status: 400 });
  }

  const [client, server] = Object.values(new WebSocketPair());
  server.accept();

  clients.add(server);

  // Send initial counts to new client
  server.send(JSON.stringify({ type: 'update', counts: voteCounts }));

  server.addEventListener('message', event => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'vote') {
        const vote = message.vote;
        if (voteCounts[vote] !== undefined) {
          voteCounts[vote]++;
          broadcastCounts();
        }
      }
    } catch (e) {
      console.error('Invalid message', e);
    }
  });

  server.addEventListener('close', () => {
    clients.delete(server);
  });

  return new Response(null, { status: 101, webSocket: client });
});

function broadcastCounts() {
  const message = JSON.stringify({ type: 'update', counts: voteCounts });
  clients.forEach(client => {
    try {
      client.send(message);
    } catch (e) {
      // Handle broken socket
      clients.delete(client);
    }
  });
}

router.get('*', () => new Response('Not found', { status: 404 }));

export default {
  fetch: router.handle,
};
