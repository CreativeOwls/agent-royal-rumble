import { useEffect, useMemo, useState } from "react";

const ACCENTS = ["accent-blue", "accent-red", "accent-yellow", "accent-green"] as const;

export function Wordmark({ text }: { text: string }) {
  const chars = useMemo(() => Array.from(text), [text]);
  const lastIndex = chars.length - 1;
  const [cycle, setCycle] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setCycle((c) => c + 1), 700);
    return () => window.clearInterval(id);
  }, []);

  return (
    <h1
      className="select-none text-center font-bold leading-[0.85] tracking-[-0.06em] text-foreground"
      style={{ fontSize: "clamp(2.75rem, 13vw, 13rem)" }}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {chars.map((char, i) => {
          const isLast = i === lastIndex;
          const accent = isLast
            ? ACCENTS[cycle % ACCENTS.length]
            : ACCENTS[i % ACCENTS.length];
          const active = isLast || hovered === i;
          return (
            <span
              key={`${char}-${i}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
              className="transition-colors duration-300"
              style={{
                color: active ? `var(--${accent})` : undefined,
                whiteSpace: char === " " ? "pre" : undefined,
              }}
            >
              {char}
            </span>
          );
        })}
      </span>
    </h1>
  );
}

export default Wordmark;
