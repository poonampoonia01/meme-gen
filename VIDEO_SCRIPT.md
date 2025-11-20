# Demo Video Script (1-2 minutes)

## Setup Before Recording
- [ ] Start Redis
- [ ] Start application: `npm run dev`
- [ ] Open Postman with collection imported
- [ ] Have 3 browser tabs ready with demo.html
- [ ] Clear terminal for clean logs

## Script Timeline

### 0:00-0:10 - Introduction (10s)
**Screen:** Terminal with app running
**Script:**
> "Hi! This is the Meme Coin Data Aggregator - a real-time service that fetches and streams token data from multiple DEX sources."

**Show:**
- Terminal with startup logs showing:
  - "Server running on port 3000"
  - "Redis: Connected"

---

### 0:10-0:40 - Live Demo Page (30s)
**Screen:** Browser with demo.html open
**Script:**
> "Here's the live demo page showing real-time token data. Watch as prices update every 5 seconds automatically via WebSocket."

**Actions:**
1. Show token table with live data (5s)
2. Point out the "Connected" status indicator (2s)
3. Show the update counter incrementing (3s)
4. Change sort to "Price Change" (5s)
5. Change sort to "Volume" (5s)
6. Show data updating in real-time (10s)

**Highlight:**
- Green status dot showing WebSocket connection
- Update counter incrementing
- Data refreshing without page reload

---

### 0:40-1:10 - API Performance (30s)
**Screen:** Split screen - Postman + Terminal logs
**Script:**
> "Let's test the API performance. I'll make 10 rapid requests to show response times and caching in action."

**Actions:**
1. Open Postman collection (3s)
2. Run "Get All Tokens" - show response time (cache miss) ~1500ms (5s)
3. Run again - show response time (cache hit) ~50ms (5s)
4. Run "Sort by Volume" request (5s)
5. Run "Sort by Price Change" request (5s)
6. Run "Pagination" requests (7s)

**Show in Terminal:**
- Log messages showing cache hits/misses
- "Returning cached tokens"
- Response times

---

### 1:10-1:30 - WebSocket Updates (20s)
**Screen:** 3 browser tabs side by side
**Script:**
> "Now let's see WebSocket in action. I have 3 tabs open - watch them all update simultaneously."

**Actions:**
1. Arrange 3 browser tabs side by side (3s)
2. Show all tabs receiving updates at the same time (7s)
3. Change filter in one tab (5s)
4. Show that tab updating independently (5s)

**Highlight:**
- All tabs show same data
- Updates happen simultaneously
- Filtering works per connection

---

### 1:30-2:00 - Architecture & Design (30s)
**Screen:** README.md or ARCHITECTURE.md
**Script:**
> "The architecture is simple but powerful. We fetch from DexScreener and Jupiter APIs, merge duplicates intelligently, cache results in Redis, and stream updates via Socket.io."

**Show:**
- Architecture diagram from ARCHITECTURE.md or draw on screen:
```
Client → Express REST API
       ↓
    Aggregation Service
       ↓
  [Cache] [DexScreener] [Jupiter]
       ↓
  WebSocket Updates
```

**Talk through:**
1. "Two DEX API clients with rate limiting" (7s)
2. "Redis caching with 30-second TTL reduces API calls" (7s)
3. "Smart merging eliminates duplicates across sources" (8s)
4. "WebSocket pushes updates every 5 seconds" (8s)

---

### 2:00-2:10 - Wrap Up (10s)
**Screen:** GitHub repo or README
**Script:**
> "Everything is documented in the GitHub repo including deployment guides, tests, and Postman collection. Thanks for watching!"

**Show:**
- README.md with badges (if any)
- Documentation files list
- GitHub URL on screen

---

## Recording Tips

### Camera/Screen Setup
- Use 1080p or higher resolution
- Clear audio (use good microphone)
- 16:9 aspect ratio for YouTube

### Software Recommendations
- **macOS:** QuickTime Screen Recording
- **Windows:** OBS Studio
- **Linux:** SimpleScreenRecorder
- **Cross-platform:** Loom

### Terminal Settings
- Use large, readable font (14-16pt)
- Light or dark theme with good contrast
- Clear any sensitive information

### Browser Settings
- Hide bookmarks bar
- Close unnecessary tabs
- Use incognito/private mode for clean appearance

### Postman Settings
- Collapse request body by default
- Show response time prominently
- Keep collection organized

## Post-Recording Checklist

- [ ] Trim any dead air at start/end
- [ ] Add title screen (optional)
- [ ] Add background music (optional, keep it low)
- [ ] Add captions/subtitles
- [ ] Upload to YouTube as "Unlisted" or "Public"
- [ ] Add to README.md
- [ ] Test video link works

## Alternative: Quick Demo GIF

If video is too much, create an animated GIF:

```bash
# Install LICEcap (macOS/Windows)
# Or Peek (Linux)

# Record:
1. Demo page showing live updates (10s)
2. Multiple tabs updating (10s)
3. Postman requests (10s)
```

Add to README:
```markdown
![Demo](demo.gif)
```

## YouTube Description Template

```
Meme Coin Data Aggregator - Real-time DEX Data Service

A Node.js/TypeScript service that aggregates real-time meme coin data from multiple DEX sources (DexScreener, Jupiter) with efficient caching and WebSocket updates.

Features:
✅ Multi-source data aggregation
✅ Smart token merging & deduplication
✅ Redis caching (30s TTL)
✅ WebSocket real-time updates
✅ Rate limiting with exponential backoff
✅ REST API with filtering, sorting, pagination
✅ Comprehensive tests & documentation

Tech Stack:
- Node.js + TypeScript
- Express.js
- Socket.io
- Redis
- Docker

GitHub: [Your Repo URL]
Demo: [Deployed URL]

Timestamps:
0:00 - Introduction
0:10 - Live Demo Page
0:40 - API Performance
1:10 - WebSocket Updates
1:30 - Architecture Overview
2:00 - Documentation & Resources
```

## Thumbnail Ideas

Create a simple thumbnail with:
- Title: "Real-time DEX Aggregator"
- Tech logos: Node.js, Redis, Socket.io
- Screenshot of demo page
- "Live Demo" badge

Tools: Canva, Figma, Photoshop

