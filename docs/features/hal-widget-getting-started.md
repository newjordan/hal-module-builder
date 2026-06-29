# HAL Widget - Getting Started 🚀

HAL Widget transforms your code events into beautiful, ambient visual feedback through a floating desktop widget.

## What We've Built

### Core Components
- **Transparent Electron Window**: Floating, always-on-top widget
- **Visual Effect Engine**: Canvas-based rendering with 5+ effects (pulse, wave, flash, spiral, shake)
- **WebSocket Service**: Real-time event ingestion
- **Event Mapper**: Intelligent event → visual translation
- **Widget Controls**: Hover controls for settings and positioning

### Visual Effects Available
1. **Pulse** - Expanding circle (perfect for heartbeats, API calls)
2. **Wave** - Ripple effect (great for data flow, responses)
3. **Flash** - Quick bright flash (ideal for errors, alerts)
4. **Spiral** - Rotating spiral (perfect for LLM thinking, processing)
5. **Shake** - Glitch effect (excellent for errors, failures)

### Smart Event Mapping
The widget automatically recognizes common event patterns:

```typescript
"llm.thinking" → Spiral (blue)
"llm.response" → Pulse (green)
"api.request"  → Pulse (purple)
"api.error"    → Shake (red)
"build.success" → Wave (green)
"error"        → Shake (red)
"success"      → Wave (green)
```

## Quick Start Guide

### 1. Start the Test Server
```bash
npm run test-server
```
This starts a WebSocket server at `ws://localhost:8765/hal-events` that sends sample events.

### 2. Launch HAL in Electron Mode
```bash
npm run electron:dev
```

### 3. Launch Widget Mode
- Look for the 🪟 button in the Layer Controls header
- Click it to launch the floating widget
- The widget will appear as a transparent circle in the bottom-right corner

### 4. See Events Flow
- The test server automatically sends events every 2-5 seconds
- Watch the widget react with different visual effects
- Open the browser console to see event logs

### 5. Interact with the Widget
- **Hover** over the widget to see controls
- **Drag** the top area to move the widget
- **Adjust** opacity and size with the controls
- **Toggle** click-through mode
- **Return** to composer mode or close the widget

## Testing Dashboard

Visit `http://localhost:8765` to see the test server dashboard where you can:
- See connection status
- Manually trigger specific events
- Monitor event flow
- Get setup instructions

## Event Examples

Send events to the widget via WebSocket:

```javascript
// LLM thinking
{
  "type": "llm.thinking",
  "effect": "spiral",
  "color": "#44aaff",
  "intensity": 0.6,
  "duration": 2000,
  "data": { "tokens": 42 }
}

// API error
{
  "type": "api.error",
  "effect": "shake",
  "color": "#ff4444",
  "intensity": 0.8,
  "duration": 1000,
  "data": { "status": 500 }
}

// Build success
{
  "type": "build.success",
  "effect": "wave",
  "color": "#44ff44",
  "intensity": 0.8,
  "duration": 2000
}
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│            Main HAL App                 │
│  ┌─────────────────────────────────────┐│
│  │     Layer Composer Mode             ││
│  │  (Normal HAL functionality)         ││
│  │                                     ││
│  │  [🪟 Launch Widget] [🌙 Theme]      ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
                    |
                    | createWidget()
                    ↓
┌─────────────────────────────────────────┐
│         Floating Widget Window          │
│  ┌─────────────────────────────────────┐│
│  │   Transparent Canvas (200x200)     ││
│  │                                     ││
│  │     ┌───┐  Visual Effects:          ││
│  │     │ ○ │  • Pulse, Wave, Flash    ││
│  │     └───┘  • Spiral, Shake         ││
│  │                                     ││
│  │   [Controls on hover]               ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
                    ↑
                    | WebSocket
                    |
┌─────────────────────────────────────────┐
│          Test Server                    │
│     ws://localhost:8765/hal-events      │
│                                         │
│  • Auto-sends random events             │
│  • Web dashboard for manual events      │
│  • Connection monitoring                │
└─────────────────────────────────────────┘
```

## File Structure

```
src/
├── components/Widget/
│   ├── WidgetContainer.tsx         # Main widget component
│   ├── WidgetRenderer.tsx          # Canvas rendering
│   ├── WidgetControls.tsx          # Hover controls
│   └── WidgetWebSocketConnection.tsx # Event connection
├── services/
│   ├── VisualEffectEngine.ts       # Effect rendering
│   ├── WebSocketService.ts         # Connection management
│   └── EventMapperService.ts       # Event → Visual mapping
├── types/
│   └── widget-types.ts             # TypeScript definitions
electron/
├── main.js                         # Electron main process
└── preload.js                      # Secure IPC bridge
test-server.js                      # WebSocket test server
```

## Next Steps

This is the MVP foundation! From here you can:

1. **Add more visual effects** (particles, lightning, constellation)
2. **Connect to real applications** (replace test server with your app's events)
3. **Add event choreography** (flows, sequences, correlations)
4. **Create custom mappings** (your own event → visual rules)
5. **Add team features** (shared widgets, session recording)

## Troubleshooting

### Widget not appearing?
- Make sure you're running in Electron mode (`npm run electron:dev`)
- Check the console for errors
- Verify the widget button shows 🪟 icon

### No visual effects?
- Ensure test server is running (`npm run test-server`)
- Check WebSocket connection status (top-left corner in dev mode)
- Look for errors in both main and widget dev tools

### Performance issues?
- The widget is optimized for 60 FPS
- Uses efficient Canvas rendering
- Limits event history to last 10 events
- Effects auto-cleanup after completion

---

**🎉 Congratulations! You've built the foundation of HAL Widget - a programmable ambient intelligence system for developers.**

The widget is now ready to make your code come alive with visual feedback! 🚀