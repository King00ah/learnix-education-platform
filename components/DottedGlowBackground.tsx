
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';

type DottedGlowBackgroundProps = {
  className?: string;
  gap?: number;
  radius?: number;
  color?: string;
  glowColor?: string;
  opacity?: number;
  speedScale?: number;
};

export default function DottedGlowBackground({
  className,
  gap = 24,
  radius = 1.5,
  color = "rgba(255,255,255,0.06)",
  glowColor = "rgba(20, 184, 166, 0.6)",
  opacity = 1,
  speedScale = 0.5,
}: DottedGlowBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouse = useRef({ x: -1000, y: -1000 });
  const targetMouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const ctx = el.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stopped = false;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      el.width = Math.max(1, Math.floor(width * dpr));
      el.height = Math.max(1, Math.floor(height * dpr));
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      regenDots();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouse.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseLeave = () => {
      targetMouse.current = { x: -1000, y: -1000 };
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    let dots: { x: number; y: number; originalX: number; originalY: number; phase: number; speed: number }[] = [];

    const regenDots = () => {
      dots = [];
      const { width, height } = container.getBoundingClientRect();
      const cols = Math.ceil(width / gap) + 2;
      const rows = Math.ceil(height / gap) + 2;
      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * gap + (j % 2 === 0 ? 0 : gap * 0.5);
          const y = j * gap;
          dots.push({
            x,
            y,
            originalX: x,
            originalY: y,
            phase: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 0.5,
          });
        }
      }
    };

    const draw = (now: number) => {
      if (stopped) return;
      const { width, height } = container.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      
      const time = (now / 1000) * speedScale;

      // Smooth mouse transition (lerp)
      mouse.current.x += (targetMouse.current.x - mouse.current.x) * 0.08;
      mouse.current.y += (targetMouse.current.y - mouse.current.y) * 0.08;

      dots.forEach((d) => {
        // Floating motion
        const driftX = Math.sin(time * d.speed + d.phase) * 3;
        const driftY = Math.cos(time * d.speed * 0.8 + d.phase) * 3;
        
        const currentX = d.originalX + driftX;
        const currentY = d.originalY + driftY;

        // Proximity calculation
        const dx = mouse.current.x - currentX;
        const dy = mouse.current.y - currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 180;
        
        // Intensity from 0 to 1 based on mouse proximity
        let proximityIntensity = 0;
        if (dist < maxDist) {
          proximityIntensity = (1 - dist / maxDist) ** 2;
        }

        // Base dot intensity (subtle breathing)
        const baseIntensity = 0.4 + Math.sin(time + d.phase) * 0.1;

        ctx.beginPath();
        ctx.arc(currentX, currentY, radius + (proximityIntensity * 1), 0, Math.PI * 2);
        
        if (proximityIntensity > 0) {
          // Interactive glow state
          const alpha = Math.min(1, (proximityIntensity * 0.8 + baseIntensity * 0.2) * opacity);
          ctx.fillStyle = glowColor.replace('0.6', alpha.toString());
          
          if (proximityIntensity > 0.4) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10 * proximityIntensity;
          } else {
            ctx.shadowBlur = 0;
          }
        } else {
          // Static background state
          ctx.fillStyle = color;
          ctx.shadowBlur = 0;
          ctx.globalAlpha = baseIntensity * 0.4;
        }
        
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [gap, radius, color, glowColor, opacity, speedScale]);

  return (
    <div ref={containerRef} className={className} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
