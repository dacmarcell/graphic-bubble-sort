// Disorder, then the pass that squeezes neighbours together, then order:
// one shape, many bubbles, read left to right (top to bottom on a phone).

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Dot = { x: number; y: number; r: number; tone: "pale" | "paler" | "mid" | "ink" };

function dots(vertical: boolean): Dot[] {
  const rand = rng(1956);
  const out: Dot[] = [];
  // Long axis 0..1200, short axis 0..267 (swapped when vertical).
  const put = (a: number, b: number, r: number, tone: Dot["tone"]) =>
    out.push(vertical ? { x: b, y: a, r, tone } : { x: a, y: b, r, tone });

  for (let k = 0; k < 48; k++) {
    put(24 + rand() * 340, 24 + rand() * 219, 4 + rand() * 6, rand() > 0.5 ? "pale" : "paler");
  }
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 16; col++) {
      put(440 + col * 21.5, 112 + row * 21, 7, "mid");
    }
  }
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 12; col++) {
      put(842 + col * 30, 66 + row * 45, 3 + col * 0.95, "ink");
    }
  }
  return out;
}

const fill = { pale: "var(--tint-2)", paler: "var(--tint-1)", mid: "var(--muted)", ink: "var(--ink)" };

export default function PassDiagram() {
  return (
    <>
      <svg className="pass-diagram is-wide" viewBox="0 0 1200 267" role="img" aria-label="Scattered bubbles are squeezed into a tight ribbon, then leave it in neat rows, smallest to largest.">
        {dots(false).map((d, k) => (
          <circle key={k} cx={d.x} cy={d.y} r={d.r} fill={fill[d.tone]} />
        ))}
      </svg>
      <svg className="pass-diagram is-tall" viewBox="0 0 267 1200" role="img" aria-label="Scattered bubbles are squeezed into a tight ribbon, then leave it in neat rows, smallest to largest.">
        {dots(true).map((d, k) => (
          <circle key={k} cx={d.x} cy={d.y} r={d.r} fill={fill[d.tone]} />
        ))}
      </svg>
    </>
  );
}
