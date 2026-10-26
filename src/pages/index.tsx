import Head from "next/head";
import { useEffect } from "react";
import Visualizer from "@/components/Visualizer";
import PassDiagram from "@/components/PassDiagram";

const REPO = "https://github.com/dacmarcell/graphic-bubble-sort";

const CODE = `function bubbleSort(list: number[]): number[] {
  const a = [...list];
  for (let pass = 0; pass < a.length - 1; pass++) {
    let swapped = false;
    for (let j = 0; j < a.length - 1 - pass; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    if (!swapped) break; // nothing moved: already sorted
  }
  return a;
}`;

const TRACE = [
  {
    pass: 1,
    before: "5 1 4 2 8",
    after: "1 4 2 5 8",
    comps: 4,
    swaps: 3,
    note: "5 rises past 1, 4 and 2, then stops under 8. 8 is in place.",
  },
  {
    pass: 2,
    before: "1 4 2 5 8",
    after: "1 2 4 5 8",
    comps: 3,
    swaps: 1,
    note: "4 rises past 2. 5 is in place.",
  },
  {
    pass: 3,
    before: "1 2 4 5 8",
    after: "1 2 4 5 8",
    comps: 2,
    swaps: 0,
    note: "Nothing moves, so the list is sorted. Stop.",
  },
];

const SPEED = [10, 100, 1000].map((n) => ({
  n,
  worst: (n * (n - 1)) / 2,
  best: n - 1,
}));
const fmt = (x: number) => x.toLocaleString("en-US");

// Reveal the parts of each section once, in reading order. Without script, everything is simply there.
function useReveal() {
  useEffect(() => {
    const root = document.documentElement;
    if (!("IntersectionObserver" in window)) return;
    root.classList.add("js-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const kids = e.target.querySelectorAll<HTMLElement>("[data-r]");
          kids.forEach((k, i) => k.style.setProperty("--d", `${i * 75}ms`));
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
}

// The signature move: the large bubble in the band slowly changes picture.
function useCrossfade() {
  useEffect(() => {
    const frames = Array.from(
      document.querySelectorAll<HTMLElement>(".fade-frame"),
    );
    if (
      frames.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let k = 0;
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id) return;
      id = setInterval(() => {
        frames[k].classList.remove("is-on");
        k = (k + 1) % frames.length;
        frames[k].classList.add("is-on");
      }, 6000);
    };
    const stop = () => {
      if (id) clearInterval(id);
      id = null;
    };
    const vis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", vis);
    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);
}

export default function Home() {
  useReveal();
  useCrossfade();

  return (
    <>
      <Head>
        <title>Bubble sort, one swap at a time</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="nav wrap">
        <a className="wordmark" href="#top">
          <svg viewBox="0 0 30 20" aria-hidden="true">
            <circle cx="4" cy="14" r="4" />
            <circle cx="13" cy="12" r="6" />
            <circle cx="22" cy="10" r="8" />
          </svg>
          Bubble sort
        </a>
        <nav aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#cost">Cost</a>
          <a href="#history">History</a>
        </nav>
        <a className="btn btn-solid btn-small" href={REPO}>
          Source
        </a>
      </header>

      <main id="top">
        <section className="hero wrap" aria-labelledby="title">
          <Visualizer
            intro={
              <>
                <h1 id="title">Bubble sort, one swap at a time</h1>
                <p className="lead">
                  Type up to twelve numbers. Each pass compares neighbours,
                  swaps any pair in the wrong order, and floats the largest to
                  the top.
                </p>
              </>
            }
          />
        </section>

        <section
          id="how"
          className="how wrap section"
          data-reveal
          aria-labelledby="how-title"
        >
          <div className="how-head">
            <div className="how-text">
              <h2 id="how-title" data-r>
                Neighbours trade places
              </h2>
              <p data-r>
                Bubble sort only ever looks at two items side by side. If the
                lower one is bigger, they swap. Walk the whole list like that
                and the biggest item ends up at the top. Walk it again, one step
                shorter each time, until a pass goes by with no swaps at all.
              </p>
            </div>
            <pre className="code" data-r aria-label="Bubble sort in TypeScript">
              <code>{CODE}</code>
            </pre>
          </div>

          <div className="diagram" data-r>
            <PassDiagram />
            <ol className="phases">
              <li>
                <h3>Compare</h3>
                <p>
                  Take the first two items. Is the lower one bigger than the one
                  above it?
                </p>
              </li>
              <li>
                <h3>Swap</h3>
                <p>
                  If it is, exchange them. The bigger item moves up one place
                  and is compared again.
                </p>
              </li>
              <li>
                <h3>Settle</h3>
                <p>
                  After each pass the largest unsorted item is at the top, and
                  the next pass stops below it.
                </p>
              </li>
            </ol>
          </div>

          <div className="trace" data-r>
            <h3>Sorting 5 1 4 2 8 by hand</h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">Pass</th>
                  <th scope="col">Before</th>
                  <th scope="col">After</th>
                  <th scope="col">Comparisons</th>
                  <th scope="col">Swaps</th>
                  <th scope="col">What happened</th>
                </tr>
              </thead>
              <tbody>
                {TRACE.map((t) => (
                  <tr key={t.pass}>
                    <th scope="row">{t.pass}</th>
                    <td className="num" data-label="Before">
                      {t.before}
                    </td>
                    <td className="num" data-label="After">
                      {t.after}
                    </td>
                    <td className="num" data-label="Comparisons">
                      {t.comps}
                    </td>
                    <td className="num" data-label="Swaps">
                      {t.swaps}
                    </td>
                    <td className="what">{t.note}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  <td className="empty" />
                  <td className="empty" />
                  <td className="num" data-label="Comparisons">
                    9
                  </td>
                  <td className="num" data-label="Swaps">
                    4
                  </td>
                  <td className="what">
                    Three passes, and the third only proves the list is done.
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section
          id="cost"
          className="cost wrap section"
          data-reveal
          aria-labelledby="cost-title"
        >
          <div className="tile tile-tall" data-r>
            <p className="figure">{fmt(SPEED[1].worst)}</p>
            <p className="caption">
              comparisons to sort 100 items that start in reverse order: n × (n
              − 1) ÷ 2. Double the list and the work goes up four times.
            </p>
          </div>
          <div className="cost-notch" data-r>
            <h2 id="cost-title">What it costs</h2>
            <p>
              Fine for a handful of numbers, slow for a warehouse of them. When
              the list is already in order, one pass with no swaps settles it:{" "}
              {fmt(SPEED[1].best)} comparisons for 100 items.
            </p>
          </div>
          <div className="tile tile-ink" data-r>
            <p className="figure">{fmt(SPEED[0].worst)}</p>
            <p className="caption">
              comparisons at most for ten items, like the column above
            </p>
          </div>
          <div className="tile tile-photo" data-r>
            <img
              src="/assets/ibm-card-storage-nara.jpg"
              width={1920}
              height={1516}
              alt="Stacks of boxed IBM record cards filling a federal records warehouse, 1959"
              loading="lazy"
            />
            <p className="figure">{fmt(SPEED[2].worst)}</p>
            <p className="caption">comparisons for 1,000 items</p>
          </div>
        </section>

        <section
          className="band section-band"
          data-reveal
          aria-labelledby="name-title"
        >
          <div className="wrap band-grid">
            <div className="band-text">
              <h2 id="name-title" data-r>
                Why it is called bubble sort
              </h2>
              <p data-r>
                Large values drift up through the list the way bubbles rise
                through a glass: each pass lifts one more to the surface, and it
                stays there.
              </p>
            </div>
            <figure className="disc disc-big" data-r>
              <div className="disc-mask">
                <img
                  className="fade-frame is-on"
                  src="/assets/the-soap-bubbles.jpg"
                  width={1920}
                  height={1856}
                  alt="Chardin’s painting of a young man blowing a soap bubble through a straw"
                  loading="lazy"
                />
                <img
                  className="fade-frame"
                  src="/assets/lipid-islands-on-soap-bubble.jpg"
                  width={1920}
                  height={2878}
                  alt="Close-up of a soap bubble’s surface: round islands of soap floating on a thin film of water"
                  loading="lazy"
                />
              </div>
              <figcaption>
                Soap Bubbles, Jean-Siméon Chardin, about 1733; and the skin of a
                real bubble, close up
              </figcaption>
            </figure>
            <figure className="disc disc-mid" data-r>
              <div className="disc-mask">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="/assets/bubbles-in-champagne-poster.jpg"
                  width={608}
                  height={1080}
                  aria-hidden="true"
                >
                  <source
                    src="/assets/bubbles-in-champagne.webm"
                    type="video/webm"
                  />
                </video>
              </div>
              <figcaption>Bubbles rising in a glass of champagne</figcaption>
            </figure>
            <figure className="disc disc-small" data-r>
              <div className="disc-mask">
                <img
                  src="/assets/ibm-80-card-sorter.jpg"
                  width={1920}
                  height={1280}
                  alt="An IBM Type 80 punched-card sorter with its row of output pockets"
                  loading="lazy"
                />
              </div>
              <figcaption>
                IBM Type 80 card sorter, the machine lists were sorted on before
                programs did it
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          id="history"
          className="history section"
          data-reveal
          aria-labelledby="history-title"
        >
          <div className="panel">
            <h2 id="history-title" data-r>
              Named in 1962, used since 1956
            </h2>
            <div className="history-text">
              <div data-r>
                <h3>Sorting by exchange</h3>
                <p>
                  Edward Friend described the method in 1956, in “Sorting on
                  Electronic Computer Systems”, when lists lived on punched
                  cards and magnetic tape and every pass meant reading the tape
                  again.
                </p>
              </div>
              <div data-r>
                <h3>A catchy name</h3>
                <p>
                  Kenneth Iverson used the name bubble sort in 1962. Donald
                  Knuth later wrote that it “seems to have nothing to recommend
                  it, except a catchy name”. It is still the first sort most
                  people learn.
                </p>
              </div>
              <a className="btn btn-light" href="#top" data-r>
                Sort your own list
              </a>
            </div>
            <figure className="portrait" data-r>
              <img
                src="/assets/univac-i-census-dedication.jpg"
                width={1920}
                height={1397}
                alt="Two operators at the UNIVAC I console and tape drives, 1951"
                loading="lazy"
              />
              <figcaption>UNIVAC I at the U.S. Census Bureau, 1951</figcaption>
            </figure>
          </div>
        </section>

        <a className="cta" href={REPO}>
          <span className="cta-line">
            The code is on GitHub. Take it, slow it down, sort something else.
          </span>
          <svg className="cta-arrow" viewBox="0 0 48 48" aria-hidden="true">
            <path
              d="M12 36 36 12M16 12h20v20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
            />
          </svg>
          <span className="cta-word">Get the code</span>
        </a>
      </main>

      <footer className="footer">
        <div className="wrap">
          <svg
            className="footer-mark"
            viewBox="0 0 1200 220"
            role="img"
            aria-label="Bubble sort"
          >
            {Array.from({ length: 9 }, (_, k) => {
              const r = 18 + k * 11;
              const prev = Array.from(
                { length: k },
                (_, q) => 2 * (18 + q * 11) + 4,
              ).reduce((s, x) => s + x, 0);
              return <circle key={k} cx={prev + r} cy={220 - r} r={r} />;
            })}
          </svg>
          <div className="footer-cols">
            <div>
              <h2>This page</h2>
              <a href="#how">How it works</a>
              <a href="#cost">What it costs</a>
              <a href="#history">History</a>
            </div>
            <div>
              <h2>Source</h2>
              <a href={REPO}>Repository</a>
              <a href={`${REPO}/issues`}>Report a problem</a>
            </div>
            <div className="footer-credits">
              <h2>Pictures</h2>
              <p>
                <a href="https://commons.wikimedia.org/wiki/File:Soap_Bubbles_MET_DP356133.jpg">
                  “The Soap Bubbles”
                </a>
                , Jean-Siméon Chardin,{" "}
                <a href="https://creativecommons.org/publicdomain/zero/1.0/deed.en">
                  CC0
                </a>
                ;{" "}
                <a href="https://commons.wikimedia.org/wiki/File:Lipid_Islands_on_Soap_Bubble.jpg">
                  “Lipid Islands on Soap Bubble”
                </a>
                , KarlGaff,{" "}
                <a href="https://creativecommons.org/licenses/by/4.0">
                  CC BY 4.0
                </a>
                ;{" "}
                <a href="https://commons.wikimedia.org/wiki/File:Bubbles_in_champagne.webm">
                  “Bubbles in champagne”
                </a>
                , Subhashish Panigrahi,{" "}
                <a href="https://creativecommons.org/licenses/by-sa/4.0">
                  CC BY-SA 4.0
                </a>
                ;{" "}
                <a href="https://commons.wikimedia.org/wiki/File:IBM_80_Card_Sorter.jpg">
                  “IBM 80 Card Sorter”
                </a>
                , leighklotz,{" "}
                <a href="https://creativecommons.org/licenses/by/2.0">
                  CC BY 2.0
                </a>
                ;{" "}
                <a href="https://commons.wikimedia.org/wiki/File:IBM_card_storage.NARA.jpg">
                  “IBM card storage”
                </a>
                , NARA, public domain;{" "}
                <a href="https://commons.wikimedia.org/wiki/File:Univac_I_Census_dedication.jpg">
                  “Univac I Census dedication”
                </a>
                , U.S. Census Bureau, public domain. All via Wikimedia Commons.
              </p>
            </div>
          </div>
          <div className="footer-last">
            <p>
              Made by <a href="https://github.com/dacmarcell">Marcell Dactes</a>
            </p>
            <a className="btn btn-light btn-small" href="#top">
              Back to the top
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
