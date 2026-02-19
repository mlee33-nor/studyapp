# Plan: Eliminate Bottom White Bar - 100% Coverage

## Root Cause Analysis

After auditing every layer of the rendering stack, there are **5 independent sources** that can produce the white bar. ALL must be fixed:

### Source 1: `useEffect` overrides `#root` background to `transparent` at runtime
**File:** `src/App.tsx` line 1019
The `useEffect` runs `root.style.backgroundColor = 'transparent'` on every theme change, undoing the CSS `background: #1E1B4B` we set on `#root`. When ANY scroll or subpixel gap occurs, transparent `#root` reveals whatever is behind it.

### Source 2: Content wrapper creates overflow that forces `#root` to scroll
**File:** `src/App.tsx` lines 1894-1917
The content wrapper has `paddingTop: env(safe-area-inset-top)` (~44px on notched iPhones). The inner content uses `height: 100dvh`. Total content = 100dvh + 44px > viewport height. This forces `#root` (which has `overflow-y: auto`) to scroll, and overscroll at the bottom reveals whatever background is behind.

### Source 3: MeadowScreen paints its own near-white background
**File:** `src/screens/MeadowScreen.tsx` line 499
Sets `background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)'` — practically white. This doesn't extend into the safe area at the bottom, creating a visible gap.

### Source 4: StatsPage has its own scroll container with opaque background
**File:** `src/components/StatsPage.tsx` lines 220-226
Has `maxHeight: '100vh'`, `overflowY: 'auto'`, and `background: colors.background`. The `minHeight: 100vh` + `padding: 120px bottom` causes the stats content to exceed its container, creating another scroll surface where gaps can appear.

### Source 5: Native iOS WebView background may not be synced
The `capacitor.config.ts` changes (backgroundColor, contentInset) only take effect after running `npx cap sync`. If this hasn't been run, the native WebView still uses its default white background.

---

## Fix Plan (5 steps)

### Step 1: Fix the `useEffect` that overrides `#root` to transparent
**File:** `src/App.tsx` ~line 1017-1020

Change:
```js
const root = document.getElementById('root');
if (root) {
  root.style.backgroundColor = 'transparent';
}
```
To:
```js
const root = document.getElementById('root');
if (root) {
  root.style.background = gradient;
  root.style.backgroundAttachment = 'fixed';
}
```
This makes `#root` show the matching theme gradient instead of being transparent.

### Step 2: Fix the content wrapper to not cause overflow
**File:** `src/App.tsx` ~lines 1894-1917

Remove the `paddingTop: env(safe-area-inset-top)` from the outer content wrapper. Instead, add the safe area padding to the **inner** content div. This prevents the outer wrapper from being taller than the viewport.

For the Timer tab (which uses `height: 100dvh`), change to `height: calc(100dvh - env(safe-area-inset-top, 0px))` so it accounts for the top safe area.

### Step 3: Make MeadowScreen's background transparent
**File:** `src/screens/MeadowScreen.tsx` line 499

Remove the opaque near-white `background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)'` from MeadowScreen's root div. The theme gradient behind it provides the actual background. This eliminates any white/light background that could peek through at the bottom.

### Step 4: Fix StatsPage scroll container
**File:** `src/components/StatsPage.tsx` ~line 220-226

Remove `maxHeight: '100vh'` and `overflowY: 'auto'` from the StatsPage root. Let the parent `#root` handle scrolling. Remove the opaque `background: colors.background` and let the theme gradient show through. This prevents a second scroll container with its own background.

### Step 5: Run Capacitor sync to apply native config
Run `npx cap sync` to ensure the native iOS project picks up:
- `backgroundColor: '#1E1B4B'`
- `contentInset: 'never'`

This sets the native WebView's background to dark, eliminating the last possible white surface.

---

## Verification

After all 5 fixes, the rendering stack from back to front will be:
1. **Native WebView** → `#1E1B4B` (dark, from cap sync)
2. **html/body** → theme gradient (from useEffect)
3. **#root** → theme gradient (from fixed useEffect)
4. **Fixed gradient div** → theme gradient with aurora orbs (extends 50px past edges)
5. **Content** → transparent (shows gradient through)

There will be **zero white or transparent surfaces** in the entire chain.
