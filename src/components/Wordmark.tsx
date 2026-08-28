import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const ACCENTS = ["accent-blue", "accent-red", "accent-yellow", "accent-green"] as const;

const MIN_SIZE = 24;
const MAX_SIZE = 208;

export function Wordmark({ text }: { text: string }) {
  const chars = useMemo(() => Array.from(text), [text]);
  const lastIndex = chars.length - 1;
  const [cycle, setCycle] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState(48);

  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setCycle((c) => c + 1), 700);
    return () => window.clearInterval(id);
  }, []);

  // Fit the wordmark to the available width and a share of the viewport height.
  const fit = useCallback(() => {
    const wrap = wrapRef.current;
    const el = textRef.current;
    if (!wrap || !el) return;

    const maxWidth = wrap.clientWidth;
    const maxHeight = Math.max(160, window.innerHeight * 0.55);
    if (maxWidth === 0) return;

    let low = MIN_SIZE;
    let high = MAX_SIZE;
    for (let i = 0; i < 12; i += 1) {
      const mid = (low + high) / 2;
      el.style.fontSize = `${mid}px`;
      const fits = el.scrollWidth <= maxWidth && el.scrollHeight <= maxHeight;
      if (fits) low = mid;
      else high = mid;
    }
    el.style.fontSize = "";
    setFontSize(Math.floor(low));
  }, []);

  useLayoutEffect(() => {
    fit();
    const wrap = wrapRef.current;
    const observer = new ResizeObserver(() => fit());
    if (wrap) observer.observe(wrap);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [fit]);

  // Group into words so a word never breaks mid-way when wrapping.
  const words = useMemo(() => {
    const out: Array<{ char: string; index: number }[]> = [[]];
    chars.forEach((char, index) => {
      if (char === " ") out.push([]);
      else out[out.length - 1]!.push({ char, index });
    });
    return out.filter((w) => w.length > 0);
  }, [chars]);

  return (
    <div ref={wrapRef} className="w-full">
      <h1
        ref={textRef}
        className="select-none text-center font-bold leading-[0.9] tracking-[-0.06em] text-foreground"
        style={{ fontSize: `${fontSize}px` }}
      >
        <span className="sr-only">{text}</span>
        <span aria-hidden="true" className="block">
          {words.map((word, wordIndex) => (
            <span key={`w-${wordIndex}`} className="inline-block whitespace-nowrap">
              {word.map(({ char, index }) => {
                const isLast = index === lastIndex;
                const accent = isLast
                  ? ACCENTS[cycle % ACCENTS.length]
                  : ACCENTS[index % ACCENTS.length];
                const active = isLast || hovered === index;
                return (
                  <span
                    key={`${char}-${index}`}
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered((h) => (h === index ? null : h))}
                    className="transition-colors duration-300"
                    style={{ color: active ? `var(--${accent})` : undefined }}
                  >
                    {char}
                  </span>
                );
              })}
              {wordIndex < words.length - 1 ? <span>&nbsp;</span> : null}
            </span>
          ))}
        </span>
      </h1>
    </div>
  );
}

export default Wordmark;
