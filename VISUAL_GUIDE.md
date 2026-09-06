# Visual Guide - SpeedTest v3.0 UI

## 🎨 Screen Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER SECTION                                             │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │ TITLE & DESCRIPTION   │  │  CONTROL PANEL              │  │
│  │ • Gaming Speed Test   │  │  • Status Indicator        │  │
│  │ • Optimized analyzer  │  │  • 4-control grid          │  │
│  └─────────────────────┘  │  • START/STOP buttons      │  │
│                           └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CONNECTION STRIP                                           │
│  [YOUR ISP] ←── TESTING ─→ [SERVER CLOUDFLARE]             │
│  ● Client Info           ● Route Animation                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MAIN STAGE (2 columns)                                     │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────────────────┐     │
│  │ SPEED GAUGE     │  │ LIVE THROUGHPUT CHART       │     │
│  │                 │  │                              │     │
│  │    ⚡ 50.25     │  │  ████████████ Download      │     │
│  │    Mbps         │  │  █████████   Upload         │     │
│  │                 │  │                              │     │
│  │ Confidence: High│  │                              │     │
│  └─────────────────┘  └─────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  KEY METRICS GRID (6 cards)                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │Download│Upload│Latency│Jitter│Loss│Throughput│      │
│  │ ⚡↓   │ ⚡↑   │ 📍    │ 🔄   │ ❌  │ 📊     │      │
│  │50.25  │12.3  │8.5ms  │2.1ms │0%   │48.7    │      │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  GAMING & STREAMING SECTION                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Select Game: [War Thunder ▼] | Size: [70 GB]       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Game: War Thunder  │ Time: 45 min │ Online: Good   │   │
│  │ Steam: 6.2 MB/s    │ Cloud: 1080p │ Stability: Low │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Download Times Table                               │   │
│  │ Game          │ Size   │ Time                      │   │
│  │ War Thunder   │ 70 GB  │ 45 minutes                │   │
│  │ CS2           │ 40 GB  │ 25 minutes                │   │
│  │ GTA V         │ 110 GB │ 70 minutes                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  REGION CHECKER                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Preset: [All Targets ▼]  │ Samples: [4 ▼]          │   │
│  │ ┌────────────┬──────────┬──────────┬────────────┐  │   │
│  │ │ Best Game  │ Best CDN │ Overall  │             │  │   │
│  │ │ Singapore  │ SG CDN   │ Excellent│             │  │   │
│  │ └────────────┴──────────┴──────────┴────────────┘  │   │
│  │                                                     │   │
│  │ Results Table                                       │   │
│  │ Target    │ Region │ Lat │ Jitter │ Loss │ Verdict │   │
│  │ MLBB-ID   │ Jakarta│ 42  │ 3.2    │ 0%   │ Good    │   │
│  │ Steam-SG  │ SG     │ 38  │ 2.8    │ 0%   │ Great   │   │
│  │ WT-EU     │ Frankfurt│142│ 12.5   │ 0.2% │ Fair    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DETAILS SECTION (2 columns)                                │
│                                                             │
│  ┌───────────────────┐  ┌─────────────────────────────┐   │
│  │ ENGINE RESULTS    │  │ CONNECTION INFO             │   │
│  │                   │  │                             │   │
│  │ Engine    │ Down │  │ Your IP:  192.168.1.100     │   │
│  │ Cloudflare│ 50.2 │  │ LAN URL:  http://192.168... │   │
│  │ M-Lab     │ 48.7 │  │ Server:   cloudflare.com    │   │
│  │           │      │  │ Mode:     Primary           │   │
│  │           │      │  │                             │   │
│  │           │      │  │ Event Log:                  │   │
│  │           │      │  │ [14:23:45] Test started     │   │
│  │           │      │  │ [14:23:50] Downloading...   │   │
│  └───────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Color Scheme Usage

### Primary Colors
- **Blue (#0ea5e9)**: Download, primary actions, speed display
- **Green (#22c55e)**: Upload, success states, good ratings
- **Amber (#f59e0b)**: Warning, latency indicators
- **Red (#ef4444)**: Packet loss, error states, bad ratings
- **Purple (#8b5cf6)**: Jitter, special metrics

### Background Gradients
- Cards: Semi-transparent slate with blur
- Buttons: Blue gradient (primary) / Slate gradient (secondary)
- Active states: Glowing effects with color match

## 📏 Element Sizes

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Gauge | 360×360 | 280×280 | 220×220 |
| Chart | Full width | Full width | Full width |
| Button | 44px height | 44px height | 48px (touch) |
| Card padding | 24px | 20px | 16px |
| Font size base | 16px | 15px | 14px |

## 🔥 Visual Effects

### Glass Effect
```css
background: rgba(30, 41, 59, 0.7);
backdrop-filter: blur(10px);
border: 1px solid rgba(51, 65, 85, 0.5);
```

### Glow Effects
- **Speed meter**: Cyan glow during test
- **Status dot**: Pulse animation
- **Live badge**: Blink indicator
- **Active buttons**: Shadow increase on hover

### Animations
1. **Pulse** (status): 2s cycle, opacity variation
2. **Blink** (live): 1s cycle, indicator
3. **Lift** (hover): Transform Y -2px + shadow
4. **Smooth** (transitions): 200ms ease-in-out

## 📱 Mobile Adaptation

### Stacked Layout (< 768px)
```
Header → Control Panel (stacked controls)
Connection Strip → Vertical stack
Stage → Single column (gauge top, chart bottom)
Metrics → 2-column grid
Gaming → Single column sections
Region → Stacked summary cards
Details → Stack tables vertically
```

### Touch Optimization
- Minimum button: 48px height
- Touch targets: 44×44px minimum
- No hover-dependent interactions
- Scroll-friendly panels
- Prevent accidental zoom

## ✨ Interactive States

### Status Dot
- **Ready (green)**: Slow pulse (2s)
- **Busy (blue)**: Fast pulse (1s), "Testing..." text
- **Error (red)**: Static, error message shown
- **Stopped (gray)**: Dimmed, "Stopped" text

### Buttons
- **Idle**: Normal appearance
- **Hover**: Lift + glow effect
- **Active**: Press-down effect
- **Disabled**: Reduced opacity + no hover

### Form Controls
- **Normal**: Dark background, muted border
- **Hover**: Brighter border color
- **Focus**: Colored border + ring shadow
- **Value**: Light text on dark background

## 🎭 Typography Scale

| Type | Size | Weight | Use Case |
|------|------|--------|----------|
| Title | 3.5rem | 900 | Main heading |
| H1 | 2rem | 700 | Section header |
| H2 | 1rem | 600 | Panel title |
| Body | 1rem | 400 | Paragraphs |
| Small | 0.85rem | 500 | Labels/muted |
| Tiny | 0.7rem | 700 | Caps/overline |
| Giant | 4rem | 900 | Speed number |

## 🖼️ Icon Library

Using emoji icons (Unicode) for universal compatibility:
- ⚡ Lightning (fast/power)
- 🔬 Microscope (test/engine)
- 🚀 Rocket (performance)
- 📍 Pin (location)
- 📊 Bar chart (stats)
- 🎮 Controller (gaming)
- 🏠 Home (local)
- 🌐 Globe (network)
- 🔔 Bell (notifications)
- ✓ Checkmark (success)
- ❌ Cross (error)
- ⚠️ Exclamation (warning)
- ↕️ Arrows (download/upload)

---

**UI Version**: 3.0  
**Design System**: Glassmorphism v1.0  
**Author**: zak3123  
**Last Updated**: November 2024
