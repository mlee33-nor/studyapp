# 🌱 Quick Start Guide

## Run the App Locally

Just run this command in your terminal:

```bash
npm run dev
```

Then open your browser to: **http://localhost:5173**

That's it! 🎉

---

## What You Get

✅ **Gamified Pomodoro Timer** with draggable time selector (5-60 minutes)
✅ **4 Character Evolution Stages** - Bean → Pear → Bloom → Transcendent
✅ **XP System** - Earn XP based on study time (minutes × 10)
✅ **4 Unlockable Themes** - Morning, Twilight, Golden, Midnight
✅ **Study Streak Tracking** with fire emoji badges
✅ **Confetti Celebrations** when you complete sessions
✅ **100% Mobile Optimized** - No scrolling needed on Timer screen
✅ **Stats, Avatar, and Settings** tabs

---

## Features Breakdown

### Timer Screen
- **Drag the purple handle** around the timer ring to set minutes (5-60)
- **XP preview** shows how much XP you'll earn
- **Start/Pause/Complete** buttons
- **Character grows** as you level up
- **Navigation** integrated at bottom

### Stats Screen
- Weekly activity chart
- Total sessions completed
- Study streak tracker 🔥

### Avatar Screen
- View your character evolution
- See XP progress bar
- Unlock evolution stages at levels 1, 10, 20, 30

### Settings Screen
- **Theme selector** - Unlock themes as you level up:
  - 🌅 Morning (default)
  - 🌆 Twilight (Level 10+)
  - 🌇 Golden (Level 20+)
  - 🌌 Midnight (Level 30+)
- **Developer Tools** - Force level for testing (1-50)
- Dark mode toggle (coming soon)

---

## Tech Stack

- **React 19** + TypeScript
- **Vite** (fast dev server)
- **Framer Motion** (smooth animations)
- **Canvas Confetti** (celebrations)
- **Tailwind CSS** concepts with inline styles
- **localStorage** (data persistence)

---

## Tips

1. **Test Evolution**: Use the dev tools slider in Settings to jump to any level
2. **Mobile View**: Resize your browser to mobile width to see the adaptive scaling
3. **Unlock Themes**: Reach level 10, 20, or 30 to unlock new themes
4. **Max XP**: Set timer to 60 minutes for 600 XP per session!

---

## Project Structure

```
studyapp/
├── src/
│   └── App.tsx          # Entire app in one file!
├── index.html           # Entry point
├── package.json         # Dependencies
└── vite.config.ts       # Build config
```

---

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

---

**Made with 💜 and lots of Quicksand font**
