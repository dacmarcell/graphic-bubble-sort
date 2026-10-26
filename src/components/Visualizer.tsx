import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Item = { id: number; v: number };

type Step = {
  order: Item[];
  a: number | null;
  b: number | null;
  swapped: boolean;
  pass: number;
  comps: number;
  swaps: number;
  settled: number;
  done: boolean;
  note: string;
};

const MAX_ITEMS = 12;
const DEFAULT_INPUT = "5, 1, 4, 2, 8, 7, 3, 6";
const TICK_MS = 700;

// The card's band: a row of circles that are already sorted, smallest first.
const BAND: [number, number][] = (() => {
  const out: [number, number][] = [];
  let x = 0;
  for (let k = 0; k < 12; k++) {
    const r = 5 + k * 1.9;
    x += (k ? out[k - 1][1] : 0) + r + (k ? 8 : 0);
    out.push([x, r]);
  }
  return out;
})();

function parse(raw: string): { values?: number[]; error?: string } {
  const parts = raw.split(/[\s,;]+/).filter(Boolean);
  if (parts.length < 2) return { error: "Type at least two numbers." };
  if (parts.length > MAX_ITEMS) return { error: `That is ${parts.length} numbers; the column holds ${MAX_ITEMS}.` };
  const values = parts.map(Number);
  const bad = parts.find((_, i) => Number.isNaN(values[i]));
  if (bad !== undefined) return { error: `“${bad}” is not a number.` };
  return { values };
}

function buildSteps(values: number[]): Step[] {
  const n = values.length;
  const order: Item[] = values.map((v, id) => ({ id, v }));
  let comps = 0;
  let swaps = 0;
  let pass = 0;
  let settled = 0;
  const steps: Step[] = [
    { order: [...order], a: null, b: null, swapped: false, pass, comps, swaps, settled, done: false, note: "Ready. The bottom of the column is the start of the list." },
  ];

  for (let p = 0; p < n - 1; p++) {
    pass = p + 1;
    let any = false;
    for (let j = 0; j < n - 1 - p; j++) {
      comps++;
      const x = order[j].v;
      const y = order[j + 1].v;
      steps.push({ order: [...order], a: j, b: j + 1, swapped: false, pass, comps, swaps, settled, done: false, note: `Pass ${pass}: comparing ${x} and ${y}.` });
      if (x > y) {
        [order[j], order[j + 1]] = [order[j + 1], order[j]];
        swaps++;
        any = true;
        steps.push({ order: [...order], a: j, b: j + 1, swapped: true, pass, comps, swaps, settled, done: false, note: `${x} is bigger than ${y}, so it rises.` });
      }
    }
    settled = any ? p + 1 : n;
    if (!any) break;
  }

  steps.push({
    order: [...order],
    a: null,
    b: null,
    swapped: false,
    pass,
    comps,
    swaps,
    settled: n,
    done: true,
    note: `Sorted in ${pass} ${pass === 1 ? "pass" : "passes"}: ${comps} comparisons, ${swaps} swaps.`,
  });
  return steps;
}

/** Diameters and heights in container units (cqh) of the column. */
function layout(order: Item[]) {
  const n = order.length;
  const vals = order.map((o) => o.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const raw = new Map(order.map((o) => [o.id, 0.5 + (0.5 * (o.v - min)) / (max - min || 1)]));
  const gap = 1.6;
  const sumRaw = Array.from(raw.values()).reduce((s, r) => s + r, 0);
  const scale = Math.min((100 - gap * (n - 1)) / sumRaw, 24);
  const total = sumRaw * scale + gap * (n - 1);
  let y = (100 - total) / 2;
  const pos = new Map<number, { d: number; y: number }>();
  for (const o of order) {
    const d = (raw.get(o.id) as number) * scale;
    pos.set(o.id, { d, y });
    y += d + gap;
  }
  return pos;
}

export default function Visualizer({ intro }: { intro: ReactNode }) {
  const [text, setText] = useState(DEFAULT_INPUT);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>(() => buildSteps(parse(DEFAULT_INPUT).values as number[]));
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = steps[at];
  const last = at >= steps.length - 1;
  const ids = useMemo(() => [...steps[0].order].sort((p, q) => p.id - q.id), [steps]);
  const pos = useMemo(() => layout(step.order), [step]);
  const index = useMemo(() => new Map(step.order.map((o, i) => [o.id, i])), [step]);
  const n = step.order.length;

  // Start once on load, unless the visitor asked for less motion.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setTimeout(() => setPlaying(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (last) {
      setPlaying(false);
      return;
    }
    timer.current = setTimeout(() => setAt((i) => i + 1), TICK_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, at, last]);

  const load = useCallback((values: number[], play: boolean) => {
    setSteps(buildSteps(values));
    setAt(0);
    setPlaying(play);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = parse(text);
    if (r.error) {
      setError(r.error);
      return;
    }
    setError(null);
    load(r.values as number[], true);
  };

  const shuffle = () => {
    const values = Array.from({ length: 9 }, () => 1 + Math.floor(Math.random() * 60));
    setText(values.join(", "));
    setError(null);
    load(values, true);
  };

  const toggle = () => {
    if (last) {
      setAt(0);
      setPlaying(true);
    } else setPlaying((p) => !p);
  };

  return (
    <>
      <div className="hero-card">
        <svg className="card-band" viewBox="0 0 462 56" preserveAspectRatio="xMinYMid meet" aria-hidden="true">
          {BAND.map(([cx, r], k) => (
            <circle key={k} cx={cx} cy={28} r={r} />
          ))}
        </svg>
        {intro}
      <form className="sorter" onSubmit={submit} noValidate>
        <label htmlFor="numbers" className="sorter-label">
          Your numbers
        </label>
        <div className="sorter-row">
          <input
            id="numbers"
            name="numbers"
            inputMode="decimal"
            autoComplete="off"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-describedby="numbers-hint"
            aria-invalid={error ? true : undefined}
          />
          <button type="submit" className="btn btn-solid">
            Sort these
          </button>
        </div>
        <p id="numbers-hint" className={error ? "hint is-error" : "hint"} role={error ? "alert" : undefined}>
          {error ?? `Two to ${MAX_ITEMS} numbers, separated by commas or spaces.`}
        </p>
      </form>

      <div className="controls" aria-label="Playback">
        <button type="button" className="btn btn-ghost" onClick={toggle}>
          {playing ? "Pause" : last ? "Replay" : "Play"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => { setPlaying(false); setAt((i) => Math.min(i + 1, steps.length - 1)); }} disabled={last}>
          Step
        </button>
        <button type="button" className="btn btn-ghost" onClick={shuffle}>
          Shuffle
        </button>
      </div>

      <div className="counters" aria-live="off">
        <p>
          <span className="count">{step.pass}</span> {step.pass === 1 ? "pass" : "passes"}
        </p>
        <p>
          <span className="count">{step.comps}</span> {step.comps === 1 ? "comparison" : "comparisons"}
        </p>
        <p>
          <span className="count">{step.swaps}</span> {step.swaps === 1 ? "swap" : "swaps"}
        </p>
      </div>
      </div>

      <div className="stage">
        <span className="stage-disc" aria-hidden="true" />
        <svg
          className="column"
          viewBox="-32 0 64 100"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Column of ${n} bubbles, bottom to top: ${step.order.map((o) => o.v).join(", ")}`}
        >
          {ids.map((item) => {
            const p = pos.get(item.id) as { d: number; y: number };
            const i = index.get(item.id) as number;
            const active = i === step.a || i === step.b;
            const settled = i >= n - step.settled;
            const drift = (((item.id * 37) % 11) - 5) * 0.9;
            const r = p.d / 2;
            return (
              <g key={item.id} className="bubble-pos" style={{ transform: `translate(${drift}px, ${100 - p.y - r}px)` }}>
                <g className={`bubble${active ? " is-active" : ""}${active && step.swapped ? " is-swap" : ""}${settled ? " is-settled" : ""}`}>
                  <circle r={r} />
                  <text dy="0.35em" fontSize={Math.max(p.d * 0.36, 3)}>
                    {item.v}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
        <p className="stage-note" aria-live="polite">
          {step.note}
        </p>
      </div>
    </>
  );
}
