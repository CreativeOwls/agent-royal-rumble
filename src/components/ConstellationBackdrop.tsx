import { useEffect, useRef } from "react";

type Dot = { x: number; y: number; vx: number; vy: number; r: number };

const DOT_DENSITY = 1 / 14000; // dots per px^2
const MAX_DOTS = 140;
const LINK_DIST = 140;
const CURSOR_RADIUS = 220;

export function ConstellationBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;

    // pointer in css px; parallax targets
    const pointer = { x: -9999, y: -9999 };
    const parallax = { x: 0, y: 0, tx: 0, ty: 0 };

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(MAX_DOTS, Math.round(width * height * DOT_DENSITY));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.4 + 0.7,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      parallax.x += (parallax.tx - parallax.x) * 0.05;
      parallax.y += (parallax.ty - parallax.y) * 0.05;

      if (!reduceMotion) {
        for (const d of dots) {
          d.x += d.vx;
          d.y += d.vy;
          if (d.x < -20) d.x = width + 20;
          if (d.x > width + 20) d.x = -20;
          if (d.y < -20) d.y = height + 20;
          if (d.y > height + 20) d.y = -20;
        }
      }

      const px = parallax.x;
      const py = parallax.y;

      // links
      for (let i = 0; i < dots.length; i++) {
        const a = dots[i]!;
        const ax = a.x + px;
        const ay = a.y + py;
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j]!;
          const bx = b.x + px;
          const by = b.y + py;
          const dx = ax - bx;
          const dy = ay - by;
          const dist = Math.hypot(dx, dy);
          if (dist > LINK_DIST) continue;

          const midX = (ax + bx) / 2;
          const midY = (ay + by) / 2;
          const near = Math.hypot(midX - pointer.x, midY - pointer.y);
          const boost = near < CURSOR_RADIUS ? 1 - near / CURSOR_RADIUS : 0;

          const alpha = (1 - dist / LINK_DIST) * (0.1 + boost * 0.28);
          ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }

      // dots
      for (const d of dots) {
        const dx = d.x + px;
        const dy = d.y + py;
        const near = Math.hypot(dx - pointer.x, dy - pointer.y);
        const boost = near < CURSOR_RADIUS ? 1 - near / CURSOR_RADIUS : 0;
        const alpha = 0.25 + boost * 0.5;
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(dx, dy, d.r + boost * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = window.requestAnimationFrame(draw);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      parallax.tx = (pointer.x / Math.max(rect.width, 1) - 0.5) * -30;
      parallax.ty = (pointer.y / Math.max(rect.height, 1) - 0.5) * -30;
    };

    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      parallax.tx = 0;
      parallax.ty = 0;
    };

    setup();
    raf = window.requestAnimationFrame(draw);

    const resizeObserver = new ResizeObserver(setup);
    resizeObserver.observe(canvas);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

export default ConstellationBackdrop;
