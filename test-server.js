const http = require('http');
const WebSocket = require('ws');

const PORT = 8765;

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({
  server,
  path: '/hal-events'
});

console.log('🚀 HAL Widget Test Server Starting...');

let eventCounter = 0;

wss.on('connection', (ws, request) => {
  const clientIp = request.socket.remoteAddress;
  console.log(`📱 Widget connected from ${clientIp}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'system.connected',
    data: { message: 'Connected to HAL Widget Test Server' },
    timestamp: Date.now(),
    effect: 'glow',
    color: '#44ff44',
    intensity: 0.7,
    duration: 2000
  }));

  // Send periodic test events
  const sendTestEvent = () => {
    if (ws.readyState !== WebSocket.OPEN) return;

    eventCounter++;
    const eventTypes = [
      {
        type: 'llm.thinking',
        effect: 'spiral',
        color: '#44aaff',
        intensity: 0.6,
        duration: 2000,
        data: { tokens: eventCounter % 100 }
      },
      {
        type: 'api.request',
        effect: 'pulse',
        color: '#aa44ff',
        intensity: 0.4,
        duration: 800,
        data: { endpoint: '/api/test' }
      },
      {
        type: 'build.success',
        effect: 'wave',
        color: '#44ff44',
        intensity: 0.8,
        duration: 2000,
        data: { duration: '2.3s' }
      },
      {
        type: 'error',
        effect: 'shake',
        color: '#ff4444',
        intensity: 0.9,
        duration: 1000,
        data: { message: 'Test error event' }
      },
      {
        type: 'llm.token',
        effect: 'pulse',
        color: '#88aaff',
        intensity: 0.3,
        duration: 200,
        data: { token: 'hello', confidence: 0.95 }
      }
    ];

    const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const event = {
      ...randomEvent,
      id: `test_${eventCounter}`,
      timestamp: Date.now()
    };

    ws.send(JSON.stringify(event));
    console.log(`📤 Sent: ${event.type} (${event.effect})`);
  };

  // Send test events every 2-5 seconds
  const eventInterval = setInterval(sendTestEvent, 2000 + Math.random() * 3000);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📥 Received from widget:`, message);

      // Echo back a confirmation
      ws.send(JSON.stringify({
        type: 'system.echo',
        data: { original: message },
        timestamp: Date.now(),
        effect: 'flash',
        color: '#ffaa44',
        intensity: 0.5,
        duration: 500
      }));
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`📴 Widget disconnected from ${clientIp}`);
    clearInterval(eventInterval);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ HAL Widget Test Server running on ws://localhost:${PORT}/hal-events`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔧 Send test events every 2-5 seconds`);
  console.log(`🛑 Press Ctrl+C to stop`);
});

// Simple dashboard
server.on('request', (req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>HAL Widget Test Server</title>
  <style>
    body { font-family: monospace; background: #1a1a1a; color: #00ff00; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    .status { background: #2a2a2a; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .event-type { color: #44aaff; }
    .effect { color: #ffaa44; }
    button { background: #44aa44; color: white; border: none; padding: 10px 20px; margin: 5px; cursor: pointer; border-radius: 4px; }
    button:hover { background: #55bb55; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 HAL Widget Test Server</h1>
    <div class="status">
      <h2>Status: Running ✅</h2>
      <p>WebSocket endpoint: <code>ws://localhost:${PORT}/hal-events</code></p>
      <p>Connected clients: <span id="clients">${wss.clients.size}</span></p>
    </div>

    <div class="status">
      <h2>Test Events</h2>
      <button onclick="sendEvent('llm.thinking')">🧠 LLM Thinking</button>
      <button onclick="sendEvent('api.request')">📡 API Request</button>
      <button onclick="sendEvent('build.success')">✅ Build Success</button>
      <button onclick="sendEvent('error')">❌ Error</button>
      <button onclick="sendEvent('llm.token')">🪙 Token</button>
    </div>

    <div class="status">
      <h2>Instructions</h2>
      <ol>
        <li>Run HAL in Electron mode: <code>npm run electron:dev</code></li>
        <li>Click the 🪟 button to launch Widget Mode</li>
        <li>Events will automatically flow to the widget</li>
        <li>Use buttons above to send specific test events</li>
      </ol>
    </div>
  </div>

  <script>
    function sendEvent(type) {
      fetch('/send-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
    }

    // Update client count
    setInterval(() => {
      fetch('/status')
        .then(r => r.json())
        .then(data => {
          document.getElementById('clients').textContent = data.clients;
        });
    }, 1000);
  </script>
</body>
</html>
    `);
  } else if (req.url === '/send-event' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { type } = JSON.parse(body);

        const eventMap = {
          'llm.thinking': { effect: 'spiral', color: '#44aaff', intensity: 0.6, duration: 2000 },
          'api.request': { effect: 'pulse', color: '#aa44ff', intensity: 0.4, duration: 800 },
          'build.success': { effect: 'wave', color: '#44ff44', intensity: 0.8, duration: 2000 },
          'error': { effect: 'shake', color: '#ff4444', intensity: 0.9, duration: 1000 },
          'llm.token': { effect: 'pulse', color: '#88aaff', intensity: 0.3, duration: 200 }
        };

        const eventData = eventMap[type] || { effect: 'pulse', color: '#44aaff', intensity: 0.5, duration: 1000 };

        const event = {
          type,
          ...eventData,
          id: `manual_${Date.now()}`,
          timestamp: Date.now(),
          data: { source: 'dashboard', manual: true }
        };

        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(event));
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, event }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ clients: wss.clients.size }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down HAL Widget Test Server...');
  server.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});