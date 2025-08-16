import React, { useEffect, useRef, useState, useCallback } from "react";

/* -------- Inline animation keyframes (no Tailwind config needed) -------- */
const AnimStyles = () => (
  <style>{`
    @keyframes wiggle { 0%,100% { transform: rotate(-5deg) } 50% { transform: rotate(5deg) } }
    .animate-wiggle { animation: wiggle 0.6s ease-in-out; }

    @keyframes floaty { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
    .animate-float { animation: floaty 3s ease-in-out infinite; }

    /* Clouds drift from left (-20vw) to right (120vw) once, then stop */
    @keyframes drift { from { transform: translateX(-20vw) } to { transform: translateX(120vw) } }
    .animate-drift { animation: drift linear forwards; }

    @keyframes glow { 0%,100% { box-shadow: 0 0 10px rgba(251,191,36,.8) } 50% { box-shadow: 0 0 22px rgba(245,158,11,.9) } }
    .animate-glow { animation: glow 2s ease-in-out infinite; }
  `}</style>
);

/* -------- Cloud SVG (sky-blue) -------- */
const Cloud = ({ style, className = "" }) => (
  <svg viewBox="0 0 64 32" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path
      d="M10 22c-4.5 0-8-3.6-8-8s3.5-8 8-8c2 0 3.8.7 5.2 1.9C16.4 4.3 19 3 22 3c5 0 9 4 9 9 0 .3 0 .6-.1.9C34.2 12.3 38 16 38 20c0 4.4-3.6 8-8 8H10z"
      fill="#87CEEB"
    />
  </svg>
);

/* -------- Quotes -------- */
const quotes = [
  "Ab me itna bhi kuch khaas nahi 😁",
  "Mera naam Shinchan Nohara hai 😇",
  "Buri Buri 😜",
  "Kya aapko shimla mirch pasand hai? 🤕",
  "kazama mere dost! 😙"
];

export default function App() {
  /* -------- UI state -------- */
  const [clicks, setClicks] = useState(0);
  const [quote, setQuote] = useState(quotes[0]);
  const [isWiggling, setIsWiggling] = useState(false);
  const [musicOn, setMusicOn] = useState(false);

  /* -------- Audio refs (music + laugh) -------- */
  const musicRef = useRef(null);
  const laughRef = useRef(null);

  useEffect(() => {
    musicRef.current = new Audio("/shinchan-theme.mp3");
    musicRef.current.loop = true;
    musicRef.current.volume = 0.35;

    laughRef.current = new Audio("/shinchan-laugh.mp3");
    laughRef.current.volume = 0.8;

    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
      laughRef.current = null;
    };
  }, []);

  const toggleMusic = async () => {
    if (!musicRef.current) return;
    try {
      if (musicOn) {
        musicRef.current.pause();
        setMusicOn(false);
      } else {
        await musicRef.current.play(); // requires user interaction in most browsers
        setMusicOn(true);
      }
    } catch {
      /* autoplay may be blocked until user interacts */
    }
  };

  const handleShinchanClick = async () => {
    setClicks((c) => c + 1);
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 600);
    try {
      await laughRef.current?.play();
    } catch {}
  };

  const newQuote = () => {
    let next;
    do {
      next = quotes[Math.floor(Math.random() * quotes.length)];
    } while (next === quote);
    setQuote(next);
  };

  /* -------- Positioning (restrict inside box) -------- */
  const playRef = useRef(null);
  const shinchanRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const getPlayAreaSize = useCallback(() => {
    const area = playRef.current;
    if (!area) return { w: window.innerWidth, h: window.innerHeight };
    return { w: area.offsetWidth, h: area.offsetHeight };
  }, []);

  const centerInsideBox = useCallback(() => {
    if (!shinchanRef.current) return;
    const imgW = shinchanRef.current.offsetWidth || 0;
    const imgH = shinchanRef.current.offsetHeight || 0;
    const { w, h } = getPlayAreaSize();
    setPos({ x: Math.max(0, (w - imgW) / 2), y: Math.max(0, (h - imgH) / 2) });
  }, [getPlayAreaSize]);

  useEffect(() => {
    const onResize = () => centerInsideBox();
    window.addEventListener("resize", onResize);
    centerInsideBox();
    return () => window.removeEventListener("resize", onResize);
  }, [centerInsideBox]);

  const handleImgLoad = () => centerInsideBox();

  const dodge = () => {
    if (!shinchanRef.current) return;
    const imgW = shinchanRef.current.offsetWidth || 0;
    const imgH = shinchanRef.current.offsetHeight || 0;
    const { w, h } = getPlayAreaSize();

    const maxX = Math.max(0, w - imgW);
    const maxY = Math.max(0, h - imgH);

    const margin = 6; // keep away from edges
    const x = Math.random() * (maxX - margin * 2) + margin;
    const y = Math.random() * (maxY - margin * 2) + margin;

    setPos({ x, y });
  };

  /* -------- Dynamic clouds that auto-remove -------- */
  const [clouds, setClouds] = useState([]);

  useEffect(() => {
    const timeouts = [];
    let mounted = true;

    const spawnCloud = () => {
      const size = 80 + Math.random() * 120;       // 80–200px
      const top = Math.random() * 80;              // 0–80vh
      const duration = 40 + Math.random() * 60;    // 40–100s
      const opacity = 0.3 + Math.random() * 0.4;   // 0.3–0.7
      const delay = -Math.random() * duration * 0.9; // negative offset up to 90% of duration
      const id = Date.now() + Math.random();

      const newCloud = { id, size, top, duration, opacity, delay };

      if (mounted) {
        setClouds((prev) => [...prev, newCloud]);
      }

      // Calculate remaining lifetime:
      // if delay >= 0 → wait (delay) then animate (duration)
      // if delay < 0  → animation already progressed by -delay, so remaining = duration + delay
      const lifetime = delay >= 0 ? delay + duration : Math.max(2, duration + delay);

      const t = setTimeout(() => {
        if (mounted) setClouds((prev) => prev.filter((c) => c.id !== id));
      }, lifetime * 1000);
      timeouts.push(t);
    };

    // initial batch
    for (let i = 0; i < 10; i++) spawnCloud();

    // keep spawning
    const interval = setInterval(spawnCloud, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-yellow-200 via-orange-200 to-red-200 text-slate-800">
      <AnimStyles />

      {/* Dynamic drifting clouds */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {clouds.map((cloud) => (
          <Cloud
            key={cloud.id}
            className="absolute animate-drift"
            style={{
              /* start at left:0; transform handles drift from -20vw */
              left: 0,
              top: `${cloud.top}vh`,
              width: `${cloud.size}px`,
              opacity: cloud.opacity,
              animationDuration: `${cloud.duration}s`,
              animationDelay: `${cloud.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <nav className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <h1 className="select-none text-2xl font-extrabold text-red-700 drop-shadow">
          Shinchan: The Real Hero
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMusic}
            className={`rounded-full px-4 py-2 font-semibold text-white shadow transition active:scale-95 ${
              musicOn ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {musicOn ? "Pause Music" : "Play Music"}
          </button>
          <button
            onClick={newQuote}
            className="rounded-full bg-amber-400 px-4 py-2 font-semibold shadow hover:bg-amber-500 active:scale-95 transition"
          >
            New Quote
          </button>
        </div>
      </nav>

      {/* Main stage */}
      <main className="relative z-10 mx-auto grid max-w-5xl grid-cols-1 items-start gap-8 px-5 pb-16 pt-6 md:grid-cols-[1.1fr_.9fr]">
        {/* Shinchan area (restricted box) */}
        <section className="relative h-[580px] w-full rounded-3xl bg-pink/60 p-4 shadow-xl backdrop-blur">
          {/* Play area = inner box without padding, so math is easy */}
          <div ref={playRef} className="absolute inset-4">
            {/* Shinchan positioned inside play area */}
            <div
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y,
                transition: "left 280ms ease, top 280ms ease",
              }}
            >
              <img
                ref={shinchanRef}
                src="/shinchan.png"
                alt="Shinchan"
                onLoad={handleImgLoad}
                onClick={handleShinchanClick}
                onMouseEnter={dodge}
                className={`w-32 sm:w-40 md:w-48 cursor-pointer select-none drop-shadow-lg transition-transform hover:scale-110 ${
                  isWiggling ? "animate-wiggle" : "animate-float"
                }`}
                draggable={false}
              />
            </div>
          </div>

          {/* HUD */}
          <div className="absolute bottom-4 left-4 rounded-2xl bg-white/80 p-3 shadow">
            <p className="text-sm font-semibold">
              Clicks: <span className="text-red-600">{clicks}</span>
            </p>
            <p className="text-xs text-slate-600">Catch Shinchan using the cursor... he dodges😉 Click on him to hear his cute laugh</p>
          </div>
        </section>

        {/* Quote + controls */}
        <section className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-white/70 p-6 text-center shadow-xl backdrop-blur">
          <div className="animate-glow rounded-3xl bg-gradient-to-br from-white to-amber-100 p-5 shadow-inner">
            <p className="text-lg font-bold">💭 {quote}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setClicks(0)}
              className="rounded-full bg-slate-800 px-4 py-2 text-white shadow hover:bg-slate-900 active:scale-95 transition"
            >
              Reset Clicks
            </button>
            <button
              onClick={async () => {
                try { await laughRef.current?.play(); } catch {}
              }}
              className="rounded-full bg-pink-500 px-4 py-2 font-semibold text-white shadow hover:bg-pink-600 active:scale-95 transition"
            >
              Play Laugh
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-600">
            Lets see how many times you catch Shinchan before resetting the click😉
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-6 text-center text-sm text-slate-700">
        © MISHKAT FATMA
      </footer>
    </div>
  );
}
