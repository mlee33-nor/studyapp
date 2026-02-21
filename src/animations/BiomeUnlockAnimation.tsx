import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill } from 'remotion';
import Lottie from 'lottie-react';

interface AnimalLottieData {
  data: any;
  scale?: number;
}

interface BiomeUnlockAnimationProps {
  biomeId: string;
  biomeName: string;
  biomeEmoji: string;
  primaryColor: string;
  biomeImageUrl: string;
  animalLotties: AnimalLottieData[];
}

const BIOME_PALETTES: Record<string, { glow: string; ring: string; accent: string }> = {
  safari:   { glow: '#F59E0B', ring: '#FFB300', accent: '#FDE68A' },
  forest:   { glow: '#059669', ring: '#10B981', accent: '#A7F3D0' },
  ocean:    { glow: '#0284C7', ring: '#06B6D4', accent: '#BAE6FD' },
  arctic:   { glow: '#60A5FA', ring: '#93C5FD', accent: '#DBEAFE' },
  mountain: { glow: '#8B5CF6', ring: '#A78BFA', accent: '#EDE9FE' },
  meadow:   { glow: '#10B981', ring: '#34D399', accent: '#D1FAE5' },
};

// Precomputed animal burst positions — each animal flies out to a unique spot
const ANIMAL_BURST = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2 - Math.PI / 2; // start from top
  const radius = 100 + ((i * 37) % 60);
  return {
    angle,
    targetX: Math.cos(angle) * radius,
    targetY: Math.sin(angle) * radius,
    delay: i * 3, // stagger each animal by 3 frames
    rotation: ((i * 47) % 40) - 20, // random-ish rotation
    scale: 1.0 + ((i * 13) % 30) / 100, // 1.0 to 1.3
  };
});

// ─── Precomputed deterministic arrays ─────────────────────────────────────────
const ORBIT_DOTS = Array.from({ length: 12 }, (_, i) => ({
  phase: (i / 12) * Math.PI * 2,
  size: 6 + ((i * 7) % 5),
}));

const SPARKLES = Array.from({ length: 20 }, (_, i) => {
  const a = (i / 20) * Math.PI * 2;
  const r = 80 + ((i * 43) % 80);
  return {
    x: Math.cos(a) * r,
    y: Math.sin(a) * r,
    delay: ((i * 23) % 100) / 100 * 30,
    size: 2 + ((i * 11) % 5),
  };
});

const RING_WAVE_DELAYS = [0, 8, 16];

// Gold coin particles (smaller, behind the animals)
const COIN_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  angle: (i / 24) * Math.PI * 2 + ((i * 11) % 20) / 100,
  speed: 80 + ((i * 37 + 7) % 100) * 1.0,
  size: 10 + ((i * 19) % 8),
  delay: ((i * 13) % 100) / 100 * 8,
}));

// God ray gradient helper
const GOD_RAY_COUNT = 14;
const makeGodRayGradient = (rotation: number, color: string, opacity: number) => {
  const stops = Array.from({ length: GOD_RAY_COUNT }, (_, i) => {
    const base = (i / GOD_RAY_COUNT) * 360;
    const intensity = Math.round((i % 2 === 0 ? 0.1 : 0.04) * opacity * 255)
      .toString(16).padStart(2, '0');
    return `transparent ${base}deg, ${color}${intensity} ${base + 6}deg, transparent ${base + 14}deg`;
  }).join(', ');
  return `conic-gradient(from ${rotation}deg at 50% 50%, ${stops})`;
};

// ─── MAIN ANIMATION  (330f = 11.0s @ 30fps) ─────────────────────────────────
//
//   Phase 1:   0–45    Void — energy pulses build from center
//   Phase 2:  45–130   Portal — biome photo revealed through expanding circle
//   Phase 3: 130–160   Breakthrough — explosive snap to fullscreen
//   Phase 4: 160–290   Celebration — animals burst out, text, god rays (longer!)
//   Phase 5: 290–330   Exit — graceful fade out
//
export const BiomeUnlockAnimation: React.FC<BiomeUnlockAnimationProps> = ({
  biomeId, biomeName, biomeImageUrl, primaryColor, animalLotties,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const pal = BIOME_PALETTES[biomeId] ?? { glow: primaryColor, ring: primaryColor, accent: '#FDE68A' };
  const refDiag = Math.sqrt((width * width + height * height) / 2);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHASE 1 — VOID  (0–45f)
  // ═══════════════════════════════════════════════════════════════════════════
  const coreGlowSize = interpolate(frame, [0, 40], [0, 56], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const coreGlowOp = interpolate(frame, [0, 12, 36, 48], [0, 1, 1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const makeRingOp = (delay: number) => {
    const lf = Math.max(0, frame - delay);
    const p = spring({ frame: lf, fps, config: { damping: 28, stiffness: 50 } });
    const sz = interpolate(p, [0, 1], [10, 900]);
    const op = interpolate(lf, [0, 4, 26, 48], [0, 0.85, 0.3, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
    return { sz, op };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHASE 2 — PORTAL  (45–130f)
  // ═══════════════════════════════════════════════════════════════════════════
  const portalSp = spring({ frame: Math.max(0, frame - 45), fps,
    config: { damping: 26, stiffness: 30, mass: 3.2 },
  });
  const portalPct = interpolate(portalSp, [0, 1], [0, 38]);
  const portalPxR = (portalPct / 100) * refDiag;
  const ringVis = interpolate(frame, [45, 58, 125, 145], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const orbitSpd = interpolate(Math.min(frame, 135), [45, 135], [0.012, 0.2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const breathe = frame >= 90 && frame < 130
    ? 1 + Math.sin(((frame - 90) / 40) * Math.PI * 2) * 0.05
    : 1;

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHASE 3 — BREAKTHROUGH  (130–160f)
  // ═══════════════════════════════════════════════════════════════════════════
  const flySp = spring({ frame: Math.max(0, frame - 130), fps,
    config: { damping: 34, stiffness: 480, mass: 0.35 },
  });
  const flyPct = interpolate(flySp, [0, 1], [38, 240]);
  const clipPct = frame >= 130 ? flyPct : portalPct;

  const shakeIntensity = interpolate(frame, [131, 152], [14, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const shakeX = frame >= 131 && frame <= 152
    ? Math.sin((frame - 131) * 5.3) * shakeIntensity : 0;
  const shakeY = frame >= 131 && frame <= 152
    ? Math.cos((frame - 131) * 4.1) * shakeIntensity * 0.7 : 0;

  const blur = interpolate(frame, [130, 137, 150], [0, 18, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const flash = interpolate(frame, [136, 142, 146, 154], [0, 1, 0.4, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const voidBg = interpolate(frame, [140, 158], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHASE 4 — CELEBRATION  (160–290f) — extended!
  // ═══════════════════════════════════════════════════════════════════════════

  const photoZoom =
    frame < 130 ? 1 :
    frame < 158 ? interpolate(frame, [130, 158], [1, 1.15], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }) :
    frame < 290 ? 1.13 :
                  interpolate(frame, [290, 326], [1.13, 0.88], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // God rays
  const godRayOp = interpolate(frame, [152, 172, 280, 296], [0, 0.85, 0.7, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const godRayRot = frame >= 152 ? (frame - 152) * 0.25 : 0;

  // Edge vignette glow
  const edgeGlowOp = frame >= 158 && frame < 292
    ? interpolate(frame, [158, 175], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' })
      * (0.6 + Math.abs(Math.sin(((frame - 158) / 134) * Math.PI * 3)) * 0.4)
    : 0;

  // Biome name — bouncy overshoot
  const nameSp = spring({ frame: Math.max(0, frame - 168), fps,
    config: { damping: 9, stiffness: 180, mass: 1.5 },
  });
  const nameScale = interpolate(nameSp, [0, 1], [0, 1]);
  const nameOp = interpolate(frame, [168, 180], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const nameLS = interpolate(nameSp, [0, 1], [-8, 14]);

  // "BIOME UNLOCKED" badge
  const badgeSp = spring({ frame: Math.max(0, frame - 190), fps,
    config: { damping: 11, stiffness: 240, mass: 1.0 },
  });
  const badgeScale = interpolate(badgeSp, [0, 1], [0.3, 1]);
  const badgeOp = interpolate(frame, [190, 204], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Shine sweep
  const shineX = interpolate(frame, [198, 232], [-200, width + 80], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Glow pulse behind text
  const glowPulse = frame >= 160 && frame < 292
    ? 0.45 + Math.abs(Math.sin(((frame - 160) / 130) * Math.PI * 2.5)) * 0.55
    : 0;

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHASE 5 — EXIT  (290–330f)
  // ═══════════════════════════════════════════════════════════════════════════
  const globalOp = interpolate(frame, [290, 326], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <AbsoluteFill style={{ background: 'transparent', opacity: globalOp }}>
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>

        {/* ── Black void ── */}
        <div style={{ position: 'absolute', inset: 0, background: '#000' }} />

        {/* ── Energy rings (Phase 1) ── */}
        {frame < 130 && [0, 14, 28].map((delay, i) => {
          const r = makeRingOp(delay);
          return r.op > 0 ? (
            <div key={i} style={{
              position: 'absolute', left: '50%', top: '50%',
              width: r.sz, height: r.sz,
              transform: 'translate(-50%, -50%)', borderRadius: '50%',
              border: `2px solid ${pal.glow}`,
              boxShadow: `0 0 18px 5px ${pal.glow}88`,
              opacity: r.op, pointerEvents: 'none',
            }} />
          ) : null;
        })}

        {/* ── Core glow pulse ── */}
        {coreGlowOp > 0 && (
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            width: coreGlowSize, height: coreGlowSize,
            transform: 'translate(-50%, -50%)', borderRadius: '50%',
            background: pal.glow,
            boxShadow: `0 0 80px 40px ${pal.glow}CC, 0 0 160px 80px ${pal.glow}44`,
            opacity: coreGlowOp,
          }} />
        )}

        {/* ── Black fill behind portal ── */}
        {voidBg > 0 && (
          <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: voidBg }} />
        )}

        {/* ── Biome photo (clipped to portal circle) ── */}
        {clipPct > 0.05 && (
          <AbsoluteFill style={{
            clipPath: `circle(${clipPct}% at 50% 50%)`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${biomeImageUrl})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              transform: `scale(${photoZoom})`, transformOrigin: '50% 50%',
            }} />
          </AbsoluteFill>
        )}

        {/* ── God rays ── */}
        {godRayOp > 0 && (
          <div style={{
            position: 'absolute',
            left: '-35%', top: '-35%', right: '-35%', bottom: '-35%',
            background: makeGodRayGradient(godRayRot, pal.glow, godRayOp),
            filter: 'blur(16px)',
            opacity: godRayOp,
            pointerEvents: 'none',
          }} />
        )}

        {/* ── Edge vignette glow ── */}
        {edgeGlowOp > 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            boxShadow: `inset 0 0 110px 35px ${pal.glow}88, inset 0 0 220px 80px ${pal.glow}33`,
            opacity: edgeGlowOp, pointerEvents: 'none',
          }} />
        )}

        {/* ── Portal ring + orbiting dots ── */}
        {ringVis > 0 && portalPxR > 4 && (
          <>
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              width: portalPxR * 2 - 20, height: portalPxR * 2 - 20,
              transform: `translate(-50%, -50%) scale(${breathe})`, borderRadius: '50%',
              background: `radial-gradient(circle, transparent 55%, ${pal.glow}30 80%, ${pal.glow}60 100%)`,
              opacity: ringVis, pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              width: portalPxR * 2, height: portalPxR * 2,
              transform: `translate(-50%, -50%) scale(${breathe})`, borderRadius: '50%',
              border: `6px solid ${pal.ring}`,
              boxShadow: [
                `0 0 28px 10px ${pal.ring}CC`,
                `0 0 56px 22px ${pal.glow}88`,
                `0 0 100px 40px ${pal.glow}44`,
                `inset 0 0 28px 10px ${pal.ring}44`,
              ].join(', '),
              opacity: ringVis, pointerEvents: 'none',
            }} />
            {ORBIT_DOTS.map((dot, i) => {
              const a = dot.phase + frame * orbitSpd;
              const r = (portalPxR + 8) * breathe;
              return (
                <div key={i} style={{
                  position: 'absolute', left: '50%', top: '50%',
                  width: dot.size, height: dot.size, borderRadius: '50%',
                  background: pal.ring,
                  boxShadow: `0 0 12px 4px ${pal.ring}AA`,
                  transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r}px))`,
                  opacity: ringVis, pointerEvents: 'none',
                }} />
              );
            })}
          </>
        )}

        {/* ── Shockwave rings ── */}
        {frame >= 134 && frame < 200 && RING_WAVE_DELAYS.map((d, i) => {
          const lf = Math.max(0, frame - 134 - d);
          const sp = spring({ frame: lf, fps, config: { damping: 26, stiffness: 45 } });
          const sz = interpolate(sp, [0, 1], [0, Math.max(width, height) * 1.8]);
          const op = interpolate(lf, [0, 5, 24, 48], [0, 0.7, 0.2, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          return op > 0 ? (
            <div key={i} style={{
              position: 'absolute', left: '50%', top: '50%',
              width: sz, height: sz, transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: `3px solid ${pal.ring}`,
              boxShadow: `0 0 20px ${pal.glow}44`,
              opacity: op, pointerEvents: 'none',
            }} />
          ) : null;
        })}

        {/* ── White flash ── */}
        {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash }} />}

        {/* ── Gold coin particles (behind animals) ── */}
        {frame >= 152 && frame < 280 && COIN_PARTICLES.map((c, i) => {
          const lf = Math.max(0, frame - 152 - c.delay);
          const t = lf / 30;
          const dist = Math.min(lf * (c.speed / 30), c.speed * 1.8);
          const x = Math.cos(c.angle) * dist;
          const y = Math.sin(c.angle) * dist + 100 * t * t;
          const op = interpolate(lf, [0, 3, 40, 90], [0, 1, 0.7, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const sc = interpolate(lf, [0, 3, 60], [0, 1.5, 0.3], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          return op > 0 ? (
            <div key={i} style={{
              position: 'absolute', left: '50%', top: '50%',
              fontSize: c.size,
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${sc})`,
              opacity: op, pointerEvents: 'none',
              filter: `drop-shadow(0 0 6px ${pal.glow}AA)`,
            }}>
              🪙
            </div>
          ) : null;
        })}

        {/* ── ANIMAL LOTTIE BURST — real animated animals pop out from center ── */}
        {frame >= 155 && animalLotties.length > 0 && animalLotties.map((animal, i) => {
          const burst = ANIMAL_BURST[i % ANIMAL_BURST.length];
          const lf = Math.max(0, frame - 155 - burst.delay);

          // Spring for the outward burst
          const burstSp = spring({ frame: lf, fps,
            config: { damping: 10, stiffness: 160, mass: 1.2 },
          });

          const x = interpolate(burstSp, [0, 1], [0, burst.targetX]);
          const y = interpolate(burstSp, [0, 1], [0, burst.targetY]);
          const sc = interpolate(burstSp, [0, 1], [0, burst.scale]);
          const rot = interpolate(burstSp, [0, 1], [0, burst.rotation]);

          // Gentle floating after landing
          const floatY = lf > 20 ? Math.sin((lf - 20) * 0.08) * 6 : 0;
          const floatRot = lf > 20 ? Math.sin((lf - 20) * 0.06 + i) * 4 : 0;

          // Fade in then hold, fade out near exit
          const op = interpolate(lf, [0, 4, 100, 130], [0, 1, 1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

          const animalSize = 80 * (animal.scale ?? 1);

          return op > 0 ? (
            <div key={`animal-${i}`} style={{
              position: 'absolute', left: '50%', top: '45%',
              width: animalSize, height: animalSize,
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y + floatY}px)) scale(${sc}) rotate(${rot + floatRot}deg)`,
              opacity: op,
              pointerEvents: 'none',
              filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.4)) drop-shadow(0 0 16px ${pal.glow}66)`,
              zIndex: 10,
            }}>
              <Lottie
                animationData={animal.data}
                loop
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          ) : null;
        })}

        {/* ── TEXT OVERLAY — properly centered ── */}
        {nameOp > 0 && (
          <AbsoluteFill style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            {/* Glow orb behind text */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              width: 420, height: 320,
              transform: 'translate(-50%, -50%)', borderRadius: '50%',
              background: `radial-gradient(ellipse, ${pal.glow}55 0%, transparent 65%)`,
              opacity: glowPulse, filter: 'blur(30px)',
            }} />

            {/* Sparkles */}
            {frame >= 186 && SPARKLES.map((sp, i) => {
              const lf = Math.max(0, frame - 186 - sp.delay);
              const cyc = lf % 34;
              const sOp = interpolate(cyc, [0, 6, 20, 34], [0, 1, 0.4, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
              return sOp > 0 ? (
                <div key={i} style={{
                  position: 'absolute', left: '50%', top: '50%',
                  width: sp.size, height: sp.size, borderRadius: '50%',
                  background: pal.accent, boxShadow: `0 0 10px 3px ${pal.accent}`,
                  transform: `translate(calc(-50% + ${sp.x}px), calc(-50% + ${sp.y}px))`,
                  opacity: sOp,
                }} />
              ) : null;
            })}

            {/* ── BIOME NAME ── */}
            <div style={{
              transform: `scale(${nameScale})`,
              opacity: nameOp,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <div style={{
                fontSize: 68, fontWeight: 900, color: '#FFFFFF',
                fontFamily: "'Quicksand', 'Arial Black', sans-serif",
                letterSpacing: nameLS, textTransform: 'uppercase', lineHeight: 1,
                textShadow: [
                  `0 0 50px ${pal.glow}`,
                  `0 0 100px ${pal.glow}88`,
                  '0 4px 24px rgba(0,0,0,0.9)',
                  '0 0 8px rgba(0,0,0,0.7)',
                ].join(', '),
                textAlign: 'center',
              }}>
                {biomeName}
              </div>

              {/* Shine sweep */}
              {shineX > -200 && (
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: shineX, width: 160,
                  background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent)',
                }} />
              )}
            </div>

            {/* ── BIOME UNLOCKED badge ── */}
            {badgeOp > 0 && (
              <div style={{
                transform: `scale(${badgeScale})`,
                opacity: badgeOp,
                marginTop: 28,
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 22, fontWeight: 900, color: '#FFFFFF',
                  fontFamily: "'Quicksand', 'Arial Black', sans-serif",
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                  textShadow: [
                    `0 0 36px ${pal.glow}`,
                    `0 0 72px ${pal.glow}99`,
                    '0 3px 16px rgba(0,0,0,0.85)',
                    '0 0 5px rgba(0,0,0,0.6)',
                  ].join(', '),
                  padding: '14px 34px',
                  border: '2.5px solid rgba(255,255,255,0.6)',
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${pal.glow}44 0%, ${pal.ring}33 100%)`,
                  backdropFilter: 'blur(6px)',
                  boxShadow: [
                    `0 0 36px 8px ${pal.glow}55`,
                    'inset 0 1px 0 rgba(255,255,255,0.25)',
                  ].join(', '),
                  display: 'inline-block',
                }}>
                  BIOME UNLOCKED
                </div>
              </div>
            )}
          </AbsoluteFill>
        )}

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
