import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import "./App.css";

// ─────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────
const T = {
  bg: "#07030f",
  bg1: "#0d0820",
  bg2: "#120d28",
  bg3: "#1a1035",
  card: "#150f2a",
  cardBorder: "#2d1f5e",
  purple: "#7c3aed",
  purpleLight: "#a855f7",
  green: "#10d98a",
  red: "#ef4444",
  text: "#e2d9f3",
  textDim: "#9d8ec4",
  textMuted: "#5a4a7a",
  bull: "#10d98a",
  bear: "#ef4444",
  grid: "#1a1040",
  glow: "0 0 20px rgba(124,58,237,0.4)",
  glowGreen: "0 0 15px rgba(16,217,138,0.3)",
};

// ─────────────────────────────────────────────────────────────
// INSTRUMENTS
// ─────────────────────────────────────────────────────────────
const INSTRUMENTS = {
  NQ:        { name: "Nasdaq 100 Futures",   base: 19450, vol: 45,     cat: "Futures",      pip: 0.25   },
  ES:        { name: "S&P 500 Futures",       base: 5280,  vol: 12,     cat: "Futures",      pip: 0.25   },
  YM:        { name: "Dow Jones Futures",     base: 39800, vol: 80,     cat: "Futures",      pip: 1      },
  RTY:       { name: "Russell 2000 Futures",  base: 2090,  vol: 8,      cat: "Futures",      pip: 0.1    },
  MNQ:       { name: "Micro Nasdaq Futures",  base: 19450, vol: 45,     cat: "Futures",      pip: 0.25   },
  MES:       { name: "Micro S&P Futures",     base: 5280,  vol: 12,     cat: "Futures",      pip: 0.25   },
  GC:        { name: "Gold Futures",          base: 2320,  vol: 6,      cat: "Commodities",  pip: 0.1    },
  CL:        { name: "Crude Oil Futures",     base: 78,    vol: 0.8,    cat: "Commodities",  pip: 0.01   },
  NG:        { name: "Natural Gas Futures",   base: 2.4,   vol: 0.04,   cat: "Commodities",  pip: 0.001  },
  "EUR/USD": { name: "Euro / US Dollar",      base: 1.085, vol: 0.0008, cat: "Forex",        pip: 0.0001 },
  "GBP/USD": { name: "British Pound / USD",   base: 1.265, vol: 0.001,  cat: "Forex",        pip: 0.0001 },
  "USD/JPY": { name: "US Dollar / Yen",       base: 151.5, vol: 0.3,    cat: "Forex",        pip: 0.01   },
  "AUD/USD": { name: "Australian Dollar/USD", base: 0.648, vol: 0.0006, cat: "Forex",        pip: 0.0001 },
  "USD/CAD": { name: "USD / Canadian Dollar", base: 1.355, vol: 0.0007, cat: "Forex",        pip: 0.0001 },
  "EUR/GBP": { name: "Euro / British Pound",  base: 0.857, vol: 0.0005, cat: "Forex",        pip: 0.0001 },
  "BTC/USD": { name: "Bitcoin / USD",         base: 67500, vol: 400,    cat: "Crypto",       pip: 1      },
  "ETH/USD": { name: "Ethereum / USD",        base: 3450,  vol: 30,     cat: "Crypto",       pip: 0.01   },
  "SOL/USD": { name: "Solana / USD",          base: 175,   vol: 3,      cat: "Crypto",       pip: 0.01   },
  "XRP/USD": { name: "Ripple / USD",          base: 0.58,  vol: 0.008,  cat: "Crypto",       pip: 0.0001 },
  SPX:       { name: "S&P 500 Index",         base: 5280,  vol: 12,     cat: "Indices",      pip: 0.01   },
  NDX:       { name: "Nasdaq 100 Index",      base: 18300, vol: 40,     cat: "Indices",      pip: 0.01   },
  VIX:       { name: "Volatility Index",      base: 15,    vol: 0.3,    cat: "Indices",      pip: 0.01   },
  DXY:       { name: "US Dollar Index",       base: 104.2, vol: 0.15,   cat: "Indices",      pip: 0.01   },
};

const CATS = ["All","Futures","Forex","Crypto","Commodities","Indices"];

const TF_LIST = ["1s","5s","15s","30s","1m","3m","5m","15m","30m","1H","2H","4H","1D","1W","1M"];

const CHART_TYPES = ["Candlestick","Heikin Ashi","Line","Area","Bar","Hollow Candle"];

const DRAWING_TOOLS = [
  { id:"cursor",    icon:"↖", label:"Cursor",              group:"cursor"  },
  { id:"crosshair", icon:"⊕", label:"Crosshair",           group:"cursor"  },
  { id:"trend",     icon:"╱", label:"Trend Line",          group:"lines"   },
  { id:"ray",       icon:"→", label:"Ray",                 group:"lines"   },
  { id:"extended",  icon:"↔", label:"Extended Line",       group:"lines"   },
  { id:"hline",     icon:"─", label:"Horizontal Line",     group:"lines"   },
  { id:"vline",     icon:"│", label:"Vertical Line",       group:"lines"   },
  { id:"channel",   icon:"⋮", label:"Parallel Channel",    group:"channel" },
  { id:"pitchfork", icon:"ψ", label:"Andrews Pitchfork",   group:"channel" },
  { id:"fib_ret",   icon:"ƒ", label:"Fib Retracement",     group:"fib"     },
  { id:"fib_ext",   icon:"ℱ", label:"Fib Extension",       group:"fib"     },
  { id:"fib_fan",   icon:"⌂", label:"Fib Fan",             group:"fib"     },
  { id:"fib_tz",    icon:"⏱", label:"Fib Time Zone",       group:"fib"     },
  { id:"fib_arc",   icon:"◒", label:"Fib Arc",             group:"fib"     },
  { id:"gann_box",  icon:"⊞", label:"Gann Box",            group:"gann"    },
  { id:"gann_fan",  icon:"◁", label:"Gann Fan",            group:"gann"    },
  { id:"rect",      icon:"▭", label:"Rectangle",           group:"shapes"  },
  { id:"ellipse",   icon:"○", label:"Ellipse",             group:"shapes"  },
  { id:"triangle",  icon:"△", label:"Triangle",            group:"shapes"  },
  { id:"arrow_up",  icon:"↑", label:"Arrow Up",            group:"shapes"  },
  { id:"arrow_dn",  icon:"↓", label:"Arrow Down",          group:"shapes"  },
  { id:"text",      icon:"T", label:"Text Label",          group:"text"    },
  { id:"note",      icon:"✎", label:"Sticky Note",         group:"text"    },
  { id:"callout",   icon:"💬",label:"Callout",             group:"text"    },
  { id:"brush",     icon:"✏", label:"Brush",               group:"draw"    },
  { id:"highlighter",icon:"✦",label:"Highlighter",         group:"draw"    },
  { id:"eraser",    icon:"⌫", label:"Eraser",              group:"draw"    },
];

// ─────────────────────────────────────────────────────────────
// DATA GENERATION
// ─────────────────────────────────────────────────────────────
const dataCache = {};
function genData(sym, count = 600) {
  const key = `${sym}_${count}`;
  if (dataCache[key]) return dataCache[key];
  const { base, vol } = INSTRUMENTS[sym];
  const bars = [];
  let price = base;
  const now = Date.now();
  const gap = 5 * 60 * 1000;
  for (let i = count; i >= 0; i--) {
    const o = price;
    const drift = (Math.random() - 0.488) * vol;
    const c = Math.max(0.001, o + drift);
    const rng = Math.abs(drift) + Math.random() * vol * 0.7;
    const h = Math.max(o, c) + Math.random() * rng * 0.6;
    const l = Math.min(o, c) - Math.random() * rng * 0.6;
    bars.push({ t: now - i * gap, o, h, l: Math.max(0.001, l), c, v: Math.floor(Math.random() * 8000 + 2000) });
    price = c;
  }
  dataCache[key] = bars;
  return bars;
}

function toHeikinAshi(data) {
  const ha = [];
  for (let i = 0; i < data.length; i++) {
    const d = data[i]; const pc = ha[i-1];
    const haC = (d.o + d.h + d.l + d.c) / 4;
    const haO = pc ? (pc.o + pc.c) / 2 : (d.o + d.c) / 2;
    ha.push({ ...d, o: haO, c: haC, h: Math.max(d.h, haO, haC), l: Math.min(d.l, haO, haC) });
  }
  return ha;
}

function fmtTime(ts) {
  const d = new Date(ts);
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

// ─────────────────────────────────────────────────────────────
// STARFIELD
// ─────────────────────────────────────────────────────────────
function Starfield({ style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    c.width = c.offsetWidth || window.innerWidth;
    c.height = c.offsetHeight || window.innerHeight;
    const ctx = c.getContext("2d");
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(), da: (Math.random() - 0.5) * 0.004,
      col: Math.random() > 0.92 ? "#a855f7" : Math.random() > 0.8 ? "#10d98a" : "#e2d9f3"
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      stars.forEach(s => {
        s.a = Math.max(0.1, Math.min(1, s.a + s.da));
        if (s.a <= 0.1 || s.a >= 1) s.da *= -1;
        ctx.globalAlpha = s.a * 0.8;
        ctx.fillStyle = s.col;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", ...style }} />;
}

// ─────────────────────────────────────────────────────────────
// CANVAS CHART
// ─────────────────────────────────────────────────────────────
function CandlestickChart({ data, chartType, replayIdx, drawings, activeTool, onAddDrawing }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [view, setView] = useState({ start: 0, end: 80, init: false });
  const [mouse, setMouse] = useState(null);
  const [tmpDraw, setTmpDraw] = useState(null);
  const priceRef = useRef({ min: 0, max: 1 });
  const drag = useRef(null);

  const visData = useMemo(() => {
    const d = replayIdx !== null ? data.slice(0, replayIdx + 1) : data;
    if (chartType === "Heikin Ashi") return toHeikinAshi(d);
    return d;
  }, [data, replayIdx, chartType]);

  // Init view
  useEffect(() => {
    if (!view.init && visData.length > 0) {
      const e = visData.length;
      setView({ start: Math.max(0, e - 100), end: e, init: true });
    }
  }, [visData, view.init]);

  // Sync view end when replay advances
  useEffect(() => {
    if (replayIdx !== null) {
      setView(v => {
        const len = v.end - v.start;
        const newEnd = Math.min(visData.length, replayIdx + 1);
        const newStart = Math.max(0, newEnd - len);
        return { ...v, start: newStart, end: newEnd };
      });
    }
  }, [replayIdx, visData.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visData.length || !view.init) return;
    const wrap = wrapRef.current;
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
    drawChart(canvas, visData, view, mouse, chartType, [...drawings, ...(tmpDraw ? [tmpDraw] : [])]);
  });

  function drawChart(canvas, vd, view, mouse, chartType, allDrawings) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const PR = 72, PB = 30, PL = 6;
    const cW = W - PR - PL, cH = H - PB;
    const slice = vd.slice(view.start, view.end);
    if (!slice.length) return;

    const minP = Math.min(...slice.map(b => b.l)) * 0.9994;
    const maxP = Math.max(...slice.map(b => b.h)) * 1.0006;
    priceRef.current = { min: minP, max: maxP };

    const toX = i => PL + ((i + 0.5) / slice.length) * cW;
    const toY = p => cH - ((p - minP) / (maxP - minP)) * cH;
    const toI = x => Math.floor(((x - PL) / cW) * slice.length);
    const toP = y => minP + ((cH - y) / cH) * (maxP - minP);

    // BG
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = T.grid; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 8; i++) {
      const p = minP + ((maxP - minP) * i) / 8;
      const y = toY(p);
      ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(W - PR, y); ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const x = PL + (cW * i) / 6;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cH); ctx.stroke();
    }

    // Volume bars
    const maxV = Math.max(...slice.map(b => b.v));
    const maxVolH = cH * 0.18;
    slice.forEach((b, i) => {
      const x = toX(i);
      const bw = Math.max(1, (cW / slice.length) * 0.6);
      const vh = (b.v / maxV) * maxVolH;
      ctx.fillStyle = b.c >= b.o ? "rgba(16,217,138,0.15)" : "rgba(239,68,68,0.15)";
      ctx.fillRect(x - bw / 2, cH - vh, bw, vh);
    });

    // Candles
    const cw = Math.max(1, (cW / slice.length) * 0.72);
    if (chartType === "Line" || chartType === "Area") {
      if (chartType === "Area") {
        const grad = ctx.createLinearGradient(0, 0, 0, cH);
        grad.addColorStop(0, "rgba(124,58,237,0.35)");
        grad.addColorStop(1, "rgba(124,58,237,0)");
        ctx.beginPath();
        slice.forEach((b, i) => { i === 0 ? ctx.moveTo(toX(i), toY(b.c)) : ctx.lineTo(toX(i), toY(b.c)); });
        ctx.lineTo(toX(slice.length - 1), cH);
        ctx.lineTo(toX(0), cH);
        ctx.fillStyle = grad; ctx.fill();
      }
      ctx.strokeStyle = T.purpleLight; ctx.lineWidth = 2;
      ctx.beginPath();
      slice.forEach((b, i) => { i === 0 ? ctx.moveTo(toX(i), toY(b.c)) : ctx.lineTo(toX(i), toY(b.c)); });
      ctx.stroke();
    } else if (chartType === "Bar") {
      slice.forEach((b, i) => {
        const x = toX(i); const col = b.c >= b.o ? T.bull : T.bear;
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, cw * 0.12);
        ctx.beginPath(); ctx.moveTo(x, toY(b.h)); ctx.lineTo(x, toY(b.l)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - cw * 0.35, toY(b.o)); ctx.lineTo(x, toY(b.o)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, toY(b.c)); ctx.lineTo(x + cw * 0.35, toY(b.c)); ctx.stroke();
      });
    } else {
      slice.forEach((b, i) => {
        const x = toX(i); const col = b.c >= b.o ? T.bull : T.bear;
        const top = toY(Math.max(b.o, b.c));
        const bot = toY(Math.min(b.o, b.c));
        const bh = Math.max(1, bot - top);
        ctx.strokeStyle = col; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, toY(b.h)); ctx.lineTo(x, top); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, bot); ctx.lineTo(x, toY(b.l)); ctx.stroke();
        if (chartType === "Hollow Candle" && b.c >= b.o) {
          ctx.strokeStyle = col; ctx.lineWidth = 1.5;
          ctx.strokeRect(x - cw/2, top, cw, bh);
        } else {
          ctx.fillStyle = col; ctx.fillRect(x - cw/2, top, cw, bh);
        }
      });
    }

    // Drawings
    allDrawings.forEach(d => renderDrawing(ctx, d, view.start, slice, toX, toY, cH, W, PR));

    // Price scale
    ctx.fillStyle = "#0a0618";
    ctx.fillRect(W - PR, 0, PR, H);
    ctx.strokeStyle = T.cardBorder; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W - PR, 0); ctx.lineTo(W - PR, H); ctx.stroke();
    ctx.fillStyle = T.textDim; ctx.font = "11px 'JetBrains Mono', monospace"; ctx.textAlign = "left";
    for (let i = 0; i <= 8; i++) {
      const p = minP + ((maxP - minP) * i) / 8;
      ctx.fillText(p.toFixed(2), W - PR + 4, toY(p) + 4);
    }

    // Time scale
    ctx.fillStyle = "#0a0618";
    ctx.fillRect(0, cH, W, PB);
    ctx.strokeStyle = T.cardBorder;
    ctx.beginPath(); ctx.moveTo(0, cH); ctx.lineTo(W, cH); ctx.stroke();
    ctx.fillStyle = T.textMuted; ctx.font = "10px monospace"; ctx.textAlign = "center";
    for (let i = 0; i <= 6; i++) {
      const idx = Math.min(Math.floor((slice.length * i) / 6), slice.length - 1);
      if (slice[idx]) ctx.fillText(fmtTime(slice[idx].t), PL + (cW * i) / 6, cH + 20);
    }

    // Crosshair + OHLCV
    if (mouse && mouse.x > PL && mouse.x < W - PR && mouse.y > 0 && mouse.y < cH) {
      ctx.strokeStyle = "rgba(168,85,247,0.5)"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(mouse.x, 0); ctx.lineTo(mouse.x, cH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PL, mouse.y); ctx.lineTo(W - PR, mouse.y); ctx.stroke();
      ctx.setLineDash([]);
      const p = toP(mouse.y);
      ctx.fillStyle = T.purple;
      ctx.fillRect(W - PR, mouse.y - 11, PR, 22);
      ctx.fillStyle = "#fff"; ctx.font = "bold 11px monospace"; ctx.textAlign = "left";
      ctx.fillText(p.toFixed(2), W - PR + 4, mouse.y + 4);
      const ci = Math.min(toI(mouse.x), slice.length - 1);
      const cb = slice[ci < 0 ? 0 : ci];
      if (cb) {
        ctx.fillStyle = "rgba(13,8,32,0.92)";
        ctx.fillRect(PL, 4, 350, 24);
        ctx.fillStyle = cb.c >= cb.o ? T.bull : T.bear;
        ctx.font = "11px 'JetBrains Mono', monospace"; ctx.textAlign = "left";
        ctx.fillText(`O:${cb.o.toFixed(2)} H:${cb.h.toFixed(2)} L:${cb.l.toFixed(2)} C:${cb.c.toFixed(2)} V:${cb.v.toLocaleString()}`, PL + 6, 20);
      }
    }
  }

  function renderDrawing(ctx, d, startOffset, slice, toX, toY, cH, W, PR) {
    if (!d || !d.p1) return;
    const absToRel = (barIndex) => barIndex - startOffset;
    const getCoord = (p) => ({ x: toX(absToRel(p.barIndex)), y: toY(p.price) });
    ctx.save();
    ctx.strokeStyle = d.color || T.purpleLight;
    ctx.lineWidth = 1.5; ctx.setLineDash([]);
    const c1 = getCoord(d.p1);
    const c2 = d.p2 ? getCoord(d.p2) : null;

    if (d.tool === "trend" || d.tool === "ray" || d.tool === "extended") {
      if (!c2) { ctx.restore(); return; }
      ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.stroke();
      // dots at endpoints
      [c1, c2].forEach(p => { ctx.fillStyle = d.color || T.purpleLight; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill(); });
    } else if (d.tool === "hline") {
      ctx.beginPath(); ctx.moveTo(0, c1.y); ctx.lineTo(W - PR, c1.y); ctx.stroke();
      ctx.fillStyle = T.textDim; ctx.font = "10px monospace"; ctx.textAlign = "left";
      ctx.fillText(d.p1.price.toFixed(2), 4, c1.y - 3);
    } else if (d.tool === "vline") {
      ctx.beginPath(); ctx.moveTo(c1.x, 0); ctx.lineTo(c1.x, cH); ctx.stroke();
    } else if (d.tool === "rect") {
      if (!c2) { ctx.restore(); return; }
      ctx.strokeRect(c1.x, c1.y, c2.x - c1.x, c2.y - c1.y);
      ctx.fillStyle = "rgba(124,58,237,0.07)"; ctx.fillRect(c1.x, c1.y, c2.x - c1.x, c2.y - c1.y);
    } else if (d.tool === "ellipse") {
      if (!c2) { ctx.restore(); return; }
      ctx.beginPath();
      ctx.ellipse((c1.x+c2.x)/2,(c1.y+c2.y)/2,Math.abs(c2.x-c1.x)/2,Math.abs(c2.y-c1.y)/2,0,0,Math.PI*2);
      ctx.stroke();
    } else if (d.tool === "triangle") {
      if (!c2) { ctx.restore(); return; }
      const mx = (c1.x + c2.x) / 2;
      ctx.beginPath(); ctx.moveTo(mx, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c1.x, c2.y); ctx.closePath(); ctx.stroke();
    } else if (d.tool === "fib_ret") {
      if (!c2) { ctx.restore(); return; }
      const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
      const cols   = ["#10d98a","#7c3aed","#a855f7","#f59e0b","#a855f7","#7c3aed","#ef4444"];
      levels.forEach((lvl, li) => {
        const y = c1.y + (c2.y - c1.y) * lvl;
        ctx.strokeStyle = cols[li]; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(c1.x, y); ctx.lineTo(W - PR - 2, y); ctx.stroke();
        ctx.fillStyle = cols[li]; ctx.font = "10px monospace"; ctx.textAlign = "right";
        ctx.fillText(`${(lvl*100).toFixed(1)}%  ${(d.p1.price + (d.p2.price - d.p1.price) * lvl).toFixed(2)}`, W - PR - 4, y - 2);
      });
    } else if (d.tool === "fib_fan") {
      if (!c2) { ctx.restore(); return; }
      const fanLevels = [0.382, 0.5, 0.618];
      fanLevels.forEach((lvl, li) => {
        const cols2 = ["#7c3aed","#a855f7","#10d98a"];
        const dy = (c2.y - c1.y) * lvl;
        ctx.strokeStyle = cols2[li]; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(W - PR, c1.y + (W - PR - c1.x) * (dy / (c2.x - c1.x || 1))); ctx.stroke();
      });
    } else if (d.tool === "gann_box") {
      if (!c2) { ctx.restore(); return; }
      ctx.strokeStyle = "rgba(124,58,237,0.5)"; ctx.lineWidth = 0.8;
      for (let i = 1; i <= 8; i++) {
        const x = c1.x + (c2.x - c1.x) * i / 8;
        const y = c1.y + (c2.y - c1.y) * i / 8;
        ctx.beginPath(); ctx.moveTo(c1.x, y); ctx.lineTo(c2.x, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, c1.y); ctx.lineTo(x, c2.y); ctx.stroke();
      }
      ctx.strokeStyle = T.purpleLight; ctx.lineWidth = 1.5;
      ctx.strokeRect(c1.x, c1.y, c2.x - c1.x, c2.y - c1.y);
      ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c2.x, c1.y); ctx.lineTo(c1.x, c2.y); ctx.stroke();
    } else if (d.tool === "channel") {
      if (!c2) { ctx.restore(); return; }
      ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.stroke();
      const offset = (c2.y - c1.y) * 0.15;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(c1.x, c1.y + offset); ctx.lineTo(c2.x, c2.y + offset); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c1.x, c1.y - offset); ctx.lineTo(c2.x, c2.y - offset); ctx.stroke();
      ctx.setLineDash([]);
    } else if (d.tool === "arrow_up" || d.tool === "arrow_dn") {
      const dir = d.tool === "arrow_up" ? -1 : 1;
      const ax = c1.x, ay = c1.y;
      ctx.fillStyle = d.color || T.green;
      ctx.beginPath();
      ctx.moveTo(ax, ay - 14 * dir);
      ctx.lineTo(ax + 8, ay); ctx.lineTo(ax - 8, ay);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = d.color || T.green; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + 20 * dir); ctx.stroke();
    } else if (d.tool === "text" && d.text) {
      ctx.font = "13px Inter"; ctx.fillStyle = d.color || T.text;
      ctx.textAlign = "left"; ctx.fillText(d.text, c1.x, c1.y);
    }
    ctx.restore();
  }

  // Wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.12 : 0.9;
    setView(v => {
      const len = v.end - v.start;
      const nl = Math.max(15, Math.min(visData.length, Math.floor(len * delta)));
      const c = Math.floor((v.start + v.end) / 2);
      const ns = Math.max(0, c - Math.floor(nl / 2));
      return { ...v, start: ns, end: Math.min(visData.length, ns + nl) };
    });
  }, [visData.length]);

  const getCanvasCoords = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const mouseToBarPrice = (x, y) => {
    const W = canvasRef.current.width, H = canvasRef.current.height;
    const PR = 72, PL = 6, PB = 30;
    const cW = W - PR - PL, cH = H - PB;
    const slice = visData.slice(view.start, view.end);
    const ci = Math.min(Math.max(0, Math.floor(((x - PL) / cW) * slice.length)), slice.length - 1) + view.start;
    const price = priceRef.current.min + ((cH - y) / cH) * (priceRef.current.max - priceRef.current.min);
    return { barIndex: ci, price };
  };

  const onMouseDown = (e) => {
    const { x, y } = getCanvasCoords(e);
    if (activeTool === "cursor" || activeTool === "crosshair") {
      drag.current = { x: e.clientX, sv: { ...view } };
      return;
    }
    if (activeTool === "eraser") {
      // erase handled on click, skip
      return;
    }
    const p1 = mouseToBarPrice(x, y);
    setTmpDraw({ tool: activeTool, p1, color: T.purpleLight });
  };

  const onMouseMove = (e) => {
    const { x, y } = getCanvasCoords(e);
    setMouse({ x, y });
    if (tmpDraw) {
      const p2 = mouseToBarPrice(x, y);
      setTmpDraw(d => ({ ...d, p2 }));
    }
    if (drag.current && (activeTool === "cursor" || activeTool === "crosshair")) {
      const dx = e.clientX - drag.current.x;
      const { sv } = drag.current;
      const len = sv.end - sv.start;
      const shift = Math.floor(-dx / 7);
      const ns = Math.max(0, Math.min(visData.length - len, sv.start + shift));
      setView({ ...sv, start: ns, end: ns + len });
    }
  };

  const onMouseUp = () => {
    drag.current = null;
    if (tmpDraw && onAddDrawing) onAddDrawing(tmpDraw);
    setTmpDraw(null);
  };

  return (
    <div ref={wrapRef} style={{ flex: 1, position: "relative", overflow: "hidden", background: T.bg }} onWheel={onWheel}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", cursor: activeTool === "cursor" ? "default" : "crosshair" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
        onMouseLeave={() => { setMouse(null); drag.current = null; }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DRAWING PANEL
// ─────────────────────────────────────────────────────────────
function DrawingPanel({ active, onSelect }) {
  const groups = [...new Set(DRAWING_TOOLS.map(t => t.group))];
  return (
    <div style={{ width: 46, background: T.bg1, borderRight: `1px solid ${T.cardBorder}`, display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0", gap: 1, overflowY: "auto", flexShrink: 0 }}>
      {groups.map((g, gi) => (
        <div key={g} style={{ display: "contents" }}>
          {gi > 0 && <div style={{ width: 28, height: 1, background: T.cardBorder, margin: "5px auto" }} />}
          {DRAWING_TOOLS.filter(t => t.group === g).map(t => (
            <button key={t.id} title={t.label} onClick={() => onSelect(t.id)} style={{
              width: 34, height: 34, borderRadius: 7, border: "none", cursor: "pointer",
              background: active === t.id ? "rgba(124,58,237,0.3)" : "transparent",
              color: active === t.id ? T.purpleLight : T.textMuted,
              fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: active === t.id ? "0 0 8px rgba(124,58,237,0.35)" : "none",
              transition: "all 0.12s"
            }}>
              {t.icon}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INSTRUMENT SELECTOR
// ─────────────────────────────────────────────────────────────
function InstrumentSelector({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: open ? "rgba(124,58,237,0.2)" : T.bg3, border: `1px solid ${T.cardBorder}`, color: T.text, padding: "5px 12px", borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800 }}>
        <span>{current}</span>
        <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 400 }}>{INSTRUMENTS[current]?.cat}</span>
        <span style={{ fontSize: 9, color: T.textMuted }}>▼</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: 340, background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, zIndex: 200, boxShadow: "0 24px 60px rgba(0,0,0,0.6)", overflow: "hidden" }}>
          <div style={{ padding: 10, borderBottom: `1px solid ${T.cardBorder}` }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search markets..." autoFocus
              style={{ width: "100%", background: T.bg3, border: `1px solid ${T.cardBorder}`, borderRadius: 8, padding: "7px 12px", color: T.text, fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 5, padding: "7px 10px", borderBottom: `1px solid ${T.cardBorder}`, flexWrap: "wrap" }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{ padding: "3px 9px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, background: filter === c ? T.purple : T.bg3, color: filter === c ? "#fff" : T.textDim, fontWeight: filter === c ? 700 : 400 }}>{c}</button>
            ))}
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {Object.entries(INSTRUMENTS)
              .filter(([k, v]) => (filter === "All" || v.cat === filter) && (search === "" || k.toLowerCase().includes(search.toLowerCase()) || v.name.toLowerCase().includes(search.toLowerCase())))
              .map(([k, v]) => (
                <button key={k} onClick={() => { onChange(k); setOpen(false); setSearch(""); }}
                  style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: k === current ? "rgba(124,58,237,0.15)" : "transparent", border: "none", cursor: "pointer", color: T.text, borderBottom: `1px solid rgba(45,31,94,0.25)`, transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = k === current ? "rgba(124,58,237,0.15)" : "transparent"}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{k}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{v.name}</div>
                  </div>
                  <span style={{ fontSize: 10, color: T.textDim, background: T.bg3, padding: "2px 7px", borderRadius: 5 }}>{v.cat}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ORDER PANEL
// ─────────────────────────────────────────────────────────────
function OrderPanel({ sym, data, replayIdx, balance, positions, onOrder, onClose }) {
  const [side, setSide] = useState("long");
  const [qty, setQty] = useState(1);
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [orderType, setOrderType] = useState("market");
  const price = data[replayIdx ?? (data.length - 1)]?.c || 0;
  const inst = INSTRUMENTS[sym];

  return (
    <div style={{ width: 210, background: T.bg1, borderLeft: `1px solid ${T.cardBorder}`, display: "flex", flexDirection: "column", padding: 10, gap: 9, overflowY: "auto", flexShrink: 0 }}>

      {/* Market info */}
      <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(16,217,138,0.05))", border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>PRICE</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: T.text, fontFamily: "monospace" }}>{price.toFixed(inst?.pip < 0.01 ? 4 : 2)}</div>
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{sym} · {inst?.cat}</div>
      </div>

      {/* Side */}
      <div style={{ display: "flex", gap: 6 }}>
        {["long","short"].map(s => (
          <button key={s} onClick={() => setSide(s)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", background: side === s ? (s==="long"?`linear-gradient(135deg,#065f46,${T.bull})`:`linear-gradient(135deg,#7f1d1d,${T.bear})`): T.bg3, color: "#fff", fontWeight: 700, fontSize: 12, opacity: side === s ? 1 : 0.45, transition: "all 0.15s" }}>
            {s === "long" ? "▲ BUY" : "▼ SELL"}
          </button>
        ))}
      </div>

      {/* Order type */}
      <div style={{ display: "flex", gap: 4 }}>
        {["market","limit","stop"].map(ot => (
          <button key={ot} onClick={() => setOrderType(ot)} style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: "none", cursor: "pointer", background: orderType===ot ? T.purple : T.bg3, color: orderType===ot ? "#fff" : T.textDim, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>
            {ot}
          </button>
        ))}
      </div>

      {/* Qty */}
      <div>
        <label style={{ fontSize: 10, color: T.textMuted, display: "block", marginBottom: 3, letterSpacing: 0.5 }}>QUANTITY</label>
        <input type="number" value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))} min={1}
          style={{ width: "100%", background: T.bg3, border: `1px solid ${T.cardBorder}`, borderRadius: 8, padding: "7px 10px", color: T.text, fontSize: 14, boxSizing: "border-box" }} />
      </div>

      {/* SL TP */}
      <div style={{ display: "flex", gap: 5 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: T.bear, display: "block", marginBottom: 3 }}>STOP LOSS</label>
          <input value={sl} onChange={e => setSl(e.target.value)} placeholder="—"
            style={{ width: "100%", background: T.bg3, border: "1px solid rgba(239,68,68,0.3)", borderRadius: 7, padding: "6px 8px", color: T.text, fontSize: 12, boxSizing: "border-box" }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: T.bull, display: "block", marginBottom: 3 }}>TAKE PROFIT</label>
          <input value={tp} onChange={e => setTp(e.target.value)} placeholder="—"
            style={{ width: "100%", background: T.bg3, border: "1px solid rgba(16,217,138,0.3)", borderRadius: 7, padding: "6px 8px", color: T.text, fontSize: 12, boxSizing: "border-box" }} />
        </div>
      </div>

      {/* Execute */}
      <button onClick={() => onOrder({ side, qty, price, sl: parseFloat(sl)||null, tp: parseFloat(tp)||null, sym, time: Date.now() })}
        style={{ background: side==="long"?"linear-gradient(135deg,#065f46,#10d98a)":"linear-gradient(135deg,#7f1d1d,#ef4444)", border: "none", color: "#fff", padding: "11px", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 14, letterSpacing: 0.3, boxShadow: side==="long"?T.glowGreen:"0 0 14px rgba(239,68,68,0.3)", transition: "all 0.15s" }}>
        {side==="long"?"▲ BUY NOW":"▼ SELL NOW"}
      </button>

      {/* Positions */}
      {positions.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>Open Positions</div>
          {positions.map((p, i) => {
            const pnl = (p.side==="long"?price-p.price:p.price-price)*p.qty;
            return (
              <div key={i} style={{ background: T.bg3, border: `1px solid ${pnl>=0?"rgba(16,217,138,0.25)":"rgba(239,68,68,0.2)"}`, borderRadius: 9, padding: 8, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: p.side==="long"?T.bull:T.bear, fontWeight: 700 }}>{p.side==="long"?"▲":"▼"} {p.sym}</span>
                  <span style={{ color: pnl>=0?T.bull:T.bear, fontWeight: 800, fontFamily: "monospace" }}>{pnl>=0?"+":""}{pnl.toFixed(2)}</span>
                </div>
                <div style={{ color: T.textMuted, fontSize: 11 }}>{p.qty}x @ {p.price.toFixed(2)}</div>
                <button onClick={() => onClose(i, price)} style={{ marginTop: 5, width: "100%", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: T.bear, borderRadius: 6, padding: "4px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                  Close @ {price.toFixed(2)}
                </button>
              </div>
            );
          })}
        </>
      )}

      {/* Balance */}
      <div style={{ marginTop: "auto", background: "linear-gradient(135deg,rgba(16,217,138,0.08),rgba(124,58,237,0.08))", border: `1px solid rgba(16,217,138,0.2)`, borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>BALANCE</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: T.green, fontFamily: "monospace" }}>${balance.toLocaleString("en-US",{minimumFractionDigits:2})}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REPLAY CONTROLS
// ─────────────────────────────────────────────────────────────
function ReplayControls({ data, idx, playing, speed, onToggle, onStep, onSetSpeed, onSetIdx }) {
  const bar = data[idx] || {};
  return (
    <div style={{ height: 54, background: T.bg1, borderTop: `1px solid ${T.cardBorder}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 14, flexShrink: 0 }}>
      {/* Transport buttons */}
      <div style={{ display: "flex", gap: 3 }}>
        {[
          { icon:"⏮", tip:"First",    act:() => onSetIdx(0) },
          { icon:"⏪", tip:"Back 10",  act:() => onStep(-10) },
          { icon:"◀",  tip:"Back 1",   act:() => onStep(-1) },
          { icon: playing?"⏸":"▶", tip:playing?"Pause":"Play", act:onToggle, hi:true },
          { icon:"▶",  tip:"Fwd 1",    act:() => onStep(1) },
          { icon:"⏩", tip:"Fwd 10",   act:() => onStep(10) },
          { icon:"⏭", tip:"Last",      act:() => onSetIdx(data.length-1) },
        ].map(b => (
          <button key={b.tip} title={b.tip} onClick={b.act} style={{ width:30,height:30,borderRadius:7,border:"none",cursor:"pointer", background: b.hi&&playing?"rgba(16,217,138,0.2)":"rgba(124,58,237,0.12)", color: b.hi?(playing?T.green:T.purpleLight):T.textDim, fontSize:13, display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.1s" }}>
            {b.icon}
          </button>
        ))}
      </div>

      {/* Speed */}
      <div style={{ display:"flex",gap:4,alignItems:"center" }}>
        <span style={{ fontSize:10,color:T.textMuted,letterSpacing:0.5 }}>SPEED</span>
        {[0.5,1,2,5,10].map(s => (
          <button key={s} onClick={() => onSetSpeed(s)} style={{ padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:10, background:speed===s?T.purple:T.bg3, color:speed===s?"#fff":T.textDim, fontWeight:speed===s?700:400 }}>
            {s}x
          </button>
        ))}
      </div>

      {/* Scrubber */}
      <div style={{ flex:1,display:"flex",alignItems:"center",gap:10 }}>
        <input type="range" min={0} max={Math.max(0,data.length-1)} value={idx} onChange={e => onSetIdx(Number(e.target.value))} style={{ flex:1 }} />
        <span style={{ fontSize:11,color:T.textDim,fontFamily:"monospace",minWidth:120 }}>{bar.t?fmtTime(bar.t):"—"}</span>
        <span style={{ fontSize:10,color:T.textMuted }}>{idx+1}/{data.length}</span>
      </div>

      {/* OHLCV */}
      {bar.o && (
        <div style={{ display:"flex",gap:10,fontSize:11,fontFamily:"monospace",flexShrink:0 }}>
          <span style={{ color:T.textMuted }}>O:<span style={{ color:T.text }}>{bar.o.toFixed(2)}</span></span>
          <span style={{ color:T.textMuted }}>H:<span style={{ color:T.bull }}>{bar.h.toFixed(2)}</span></span>
          <span style={{ color:T.textMuted }}>L:<span style={{ color:T.bear }}>{bar.l.toFixed(2)}</span></span>
          <span style={{ color:T.textMuted }}>C:<span style={{ color:bar.c>=bar.o?T.bull:T.bear }}>{bar.c.toFixed(2)}</span></span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TRADING PLATFORM
// ─────────────────────────────────────────────────────────────
function TradingPlatform({ user, onProfile, onLogout }) {
  const [sym, setSym] = useState("NQ");
  const [tf, setTf] = useState("5m");
  const [chartType, setChartType] = useState("Candlestick");
  const [activeTool, setActiveTool] = useState("cursor");
  const [drawings, setDrawings] = useState([]);
  const [replayIdx, setReplayIdx] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [balance, setBalance] = useState(user?.balance || 100000);
  const [chartMenu, setChartMenu] = useState(false);
  const [indicators, setIndicators] = useState([]);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
  const playRef = useRef(null);
  const data = useMemo(() => genData(sym), [sym]);

  // Reset on sym change
  useEffect(() => { setReplayIdx(null); setPlaying(false); setDrawings([]); }, [sym]);

  // Replay engine
  useEffect(() => {
    if (playRef.current) clearInterval(playRef.current);
    if (!playing) return;
    playRef.current = setInterval(() => {
      setReplayIdx(prev => {
        const cur = prev ?? data.length - 1;
        if (cur >= data.length - 1) { setPlaying(false); return data.length - 1; }
        return cur + 1;
      });
    }, Math.max(40, 500 / speed));
    return () => clearInterval(playRef.current);
  }, [playing, speed, data]);

  const handleOrder = (order) => setPositions(p => [...p, order]);
  const handleClose = (i, closePrice) => {
    const pos = positions[i];
    const pnl = (pos.side==="long"?closePrice-pos.price:pos.price-closePrice)*pos.qty;
    setBalance(b => b + pnl);
    setTrades(t => [...t, { ...pos, closePrice, pnl, closeTime: Date.now() }]);
    setPositions(p => p.filter((_,idx) => idx !== i));
  };

  const curIdx = replayIdx ?? (data.length - 1);

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:T.bg, color:T.text, fontFamily:"Inter,sans-serif", overflow:"hidden" }}>

      {/* TOP NAV */}
      <div style={{ height:50, background:T.bg1, borderBottom:`1px solid ${T.cardBorder}`, display:"flex", alignItems:"center", padding:"0 10px", gap:10, flexShrink:0, zIndex:10 }}>

        {/* Logo */}
        <div style={{ display:"flex",alignItems:"center",gap:7,paddingRight:12,borderRight:`1px solid ${T.cardBorder}`,flexShrink:0 }}>
          <div style={{ width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,#7c3aed,#10d98a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,boxShadow:T.glow }}>⚡</div>
          <span style={{ fontSize:14,fontWeight:900,letterSpacing:0.5 }}>
            <span style={{ color:"#fff" }}>VALOR</span><span style={{ color:T.green }}>REPLAY</span>
          </span>
        </div>

        {/* Instrument */}
        <InstrumentSelector current={sym} onChange={s => setSym(s)} />

        {/* Timeframe */}
        <div style={{ display:"flex",gap:1,flexShrink:0 }}>
          {TF_LIST.map(t => (
            <button key={t} onClick={() => setTf(t)} style={{ padding:"3px 6px",borderRadius:5,border:"none",cursor:"pointer",fontSize:10.5, background:tf===t?T.purple:"transparent", color:tf===t?"#fff":T.textDim, fontWeight:tf===t?700:400 }}>{t}</button>
          ))}
        </div>

        {/* Chart type */}
        <div style={{ position:"relative",flexShrink:0 }}>
          <button onClick={() => setChartMenu(o=>!o)} style={{ background:T.bg3,border:`1px solid ${T.cardBorder}`,color:T.textDim,padding:"4px 10px",borderRadius:8,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",gap:5 }}>
            📊 {chartType} ▾
          </button>
          {chartMenu && (
            <div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:10,zIndex:100,overflow:"hidden",minWidth:160 }}>
              {CHART_TYPES.map(ct => (
                <button key={ct} onClick={() => { setChartType(ct); setChartMenu(false); }} style={{ display:"block",width:"100%",textAlign:"left",padding:"8px 14px",background:ct===chartType?"rgba(124,58,237,0.15)":"transparent",border:"none",color:T.text,cursor:"pointer",fontSize:13 }}>{ct}</button>
              ))}
            </div>
          )}
        </div>

        {/* Indicators placeholder */}
        <button onClick={() => setShowIndicatorMenu(o=>!o)} style={{ background:T.bg3,border:`1px solid ${T.cardBorder}`,color:T.textDim,padding:"4px 10px",borderRadius:8,cursor:"pointer",fontSize:11,flexShrink:0 }}>
          ƒ Indicators
        </button>

        <div style={{ flex:1 }} />

        {/* Replay badge */}
        {replayIdx !== null && (
          <div style={{ background:"rgba(16,217,138,0.12)",border:"1px solid rgba(16,217,138,0.3)",color:T.green,padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:600,flexShrink:0 }}>⏱ REPLAY</div>
        )}

        {drawings.length > 0 && (
          <button onClick={() => setDrawings([])} style={{ background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)",color:T.bear,padding:"3px 10px",borderRadius:7,cursor:"pointer",fontSize:10,flexShrink:0 }}>✕ Clear</button>
        )}

        {/* User */}
        <button onClick={onProfile} style={{ display:"flex",alignItems:"center",gap:7,background:T.bg3,border:`1px solid ${T.cardBorder}`,borderRadius:9,padding:"4px 10px",cursor:"pointer",color:T.text,flexShrink:0 }}>
          <div style={{ width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#10d98a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800 }}>
            {(user?.name||"T")[0].toUpperCase()}
          </div>
          <span style={{ fontSize:12,fontWeight:600 }}>{user?.name||"Trader"}</span>
        </button>
        <button onClick={onLogout} title="Sign Out" style={{ background:"transparent",border:`1px solid ${T.cardBorder}`,color:T.textMuted,padding:"4px 8px",borderRadius:7,cursor:"pointer",fontSize:12,flexShrink:0 }}>⏏</button>
      </div>

      {/* MAIN ROW */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <DrawingPanel active={activeTool} onSelect={setActiveTool} />

        <CandlestickChart
          data={data} chartType={chartType} replayIdx={replayIdx}
          drawings={drawings} activeTool={activeTool}
          onAddDrawing={d => setDrawings(prev => [...prev, d])}
        />

        <OrderPanel
          sym={sym} data={data} replayIdx={curIdx}
          balance={balance} positions={positions}
          onOrder={handleOrder} onClose={handleClose}
        />
      </div>

      {/* REPLAY CONTROLS */}
      <ReplayControls
        data={data} idx={curIdx} playing={playing} speed={speed}
        onToggle={() => { if(replayIdx===null){setReplayIdx(0);setPlaying(true);}else setPlaying(p=>!p); }}
        onStep={n => setReplayIdx(i => Math.max(0, Math.min(data.length-1,(i??data.length-1)+n)))}
        onSetSpeed={setSpeed}
        onSetIdx={i => setReplayIdx(i)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SPLASH PAGE
// ─────────────────────────────────────────────────────────────
function SplashPage({ onEnter }) {
  const [hov, setHov] = useState(null);
  const features = [
    { icon:"⏱", title:"Precision Replay",    desc:"Rewind any market to any date. Replay tick-by-tick at your own pace with full transport control." },
    { icon:"📊", title:"Every Major Market",   desc:"NQ, ES, YM, Gold, Crude, 15+ Forex pairs, Crypto, Indices. One platform, every edge." },
    { icon:"✏️", title:"All Drawing Tools",    desc:"Trend lines, Fibonacci, Gann, pitchforks, channels, shapes, text — everything from TradingView." },
    { icon:"👤", title:"Profile Tracking",     desc:"Track every trade, session, and decision. Watch your win rate and edge sharpen over time." },
    { icon:"⚡", title:"Instant Execution",    desc:"Market, limit, and stop orders with simulated fills. Test your exact execution discipline." },
    { icon:"🌌", title:"Built for Valor World", desc:"Natively integrated with the Valor World trading community. Your server's edge — now a platform." },
  ];

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg,#07030f 0%,#0f0520 55%,#07030f 100%)`, color:T.text, fontFamily:"Inter,sans-serif", position:"relative", overflow:"hidden" }}>
      <Starfield />
      <div style={{ position:"fixed",top:"5%",left:"10%",width:600,height:600,background:"radial-gradient(circle,rgba(124,58,237,0.1) 0%,transparent 65%)",pointerEvents:"none",zIndex:0 }} />
      <div style={{ position:"fixed",bottom:"15%",right:"8%",width:500,height:500,background:"radial-gradient(circle,rgba(16,217,138,0.07) 0%,transparent 65%)",pointerEvents:"none",zIndex:0 }} />

      <div style={{ position:"relative",zIndex:1 }}>
        {/* Nav */}
        <nav style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 60px",borderBottom:"1px solid rgba(124,58,237,0.12)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#7c3aed,#10d98a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,boxShadow:T.glow }}>⚡</div>
            <span style={{ fontSize:20,fontWeight:900,letterSpacing:0.5 }}>
              <span style={{ color:"#fff" }}>VALOR</span><span style={{ color:T.green }}>REPLAY</span>
            </span>
            <span style={{ background:"rgba(124,58,237,0.15)",color:T.purpleLight,fontSize:9,padding:"2px 8px",borderRadius:20,border:"1px solid rgba(124,58,237,0.25)",letterSpacing:1.5,fontWeight:700 }}>VALOR WORLD</span>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={() => onEnter("login")} style={{ background:"transparent",border:"1px solid rgba(124,58,237,0.35)",color:T.textDim,padding:"7px 18px",borderRadius:8,cursor:"pointer",fontSize:13 }}>Sign In</button>
            <button onClick={() => onEnter("signup")} style={{ background:"linear-gradient(135deg,#7c3aed,#5b21b6)",border:"none",color:"#fff",padding:"7px 18px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,boxShadow:T.glow }}>Start Free</button>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ textAlign:"center",padding:"90px 40px 70px" }} className="fade-in">
          <div style={{ display:"inline-block",background:"rgba(16,217,138,0.1)",border:"1px solid rgba(16,217,138,0.3)",color:T.green,padding:"5px 16px",borderRadius:20,fontSize:11,letterSpacing:2,marginBottom:26,fontWeight:700 }}>
            ⚡ POWERED BY VALOR WORLD
          </div>
          <h1 style={{ fontSize:"clamp(38px,5.5vw,78px)",fontWeight:900,lineHeight:1.1,margin:"0 auto 22px",maxWidth:900,letterSpacing:-2 }}>
            <span style={{ color:"#fff" }}>Master the Market.</span><br />
            <span style={{ background:"linear-gradient(135deg,#a855f7 0%,#10d98a 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>Own Your Edge.</span>
          </h1>
          <p style={{ fontSize:17,color:T.textDim,maxWidth:520,margin:"0 auto 44px",lineHeight:1.75 }}>
            The most powerful backtesting and replay platform for serious traders. Replay history. Perfect your process. Dominate the market.
          </p>
          <div style={{ display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap" }}>
            <button onClick={() => onEnter("signup")} onMouseEnter={() => setHov("cta")} onMouseLeave={() => setHov(null)}
              style={{ background:hov==="cta"?"linear-gradient(135deg,#8b5cf6,#10d98a)":"linear-gradient(135deg,#7c3aed,#5b21b6)",border:"none",color:"#fff",padding:"15px 38px",borderRadius:12,cursor:"pointer",fontSize:16,fontWeight:800,boxShadow:hov==="cta"?"0 0 44px rgba(124,58,237,0.65)":T.glow,transition:"all 0.3s",transform:hov==="cta"?"translateY(-3px)":"none" }}>
              🚀 Launch Free Session
            </button>
            <button onClick={() => onEnter("platform")} onMouseEnter={() => setHov("demo")} onMouseLeave={() => setHov(null)}
              style={{ background:"transparent",border:"1px solid rgba(124,58,237,0.45)",color:T.text,padding:"15px 38px",borderRadius:12,cursor:"pointer",fontSize:16,fontWeight:600,transition:"all 0.3s",transform:hov==="demo"?"translateY(-3px)":"none" }}>
              Demo Platform →
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display:"flex",justifyContent:"center",gap:52,padding:"22px 40px",borderTop:"1px solid rgba(124,58,237,0.1)",borderBottom:"1px solid rgba(124,58,237,0.1)",marginBottom:72 }}>
          {[["22+","Markets"],["All","Timeframes"],["28+","Drawing Tools"],["Real-time","Replay Engine"]].map(([n,l]) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:26,fontWeight:900,color:T.purpleLight }}>{n}</div>
              <div style={{ fontSize:12,color:T.textMuted,marginTop:3,letterSpacing:0.5 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ maxWidth:1100,margin:"0 auto",padding:"0 40px 80px" }}>
          <h2 style={{ textAlign:"center",fontSize:34,fontWeight:900,marginBottom:52,color:"#fff" }}>
            Everything you need to{" "}
            <span style={{ color:T.purpleLight }}>level up your edge</span>
          </h2>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:22 }}>
            {features.map(f => (
              <div key={f.title} style={{ background:"rgba(21,15,42,0.7)",border:"1px solid rgba(124,58,237,0.18)",borderRadius:16,padding:"26px 22px",backdropFilter:"blur(8px)",transition:"all 0.25s",cursor:"default" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(124,58,237,0.5)"; e.currentTarget.style.boxShadow=T.glow; e.currentTarget.style.transform="translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(124,58,237,0.18)"; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="none"; }}>
                <div style={{ fontSize:30,marginBottom:14 }}>{f.icon}</div>
                <h3 style={{ fontSize:17,fontWeight:700,marginBottom:9,color:"#fff" }}>{f.title}</h3>
                <p style={{ fontSize:14,color:T.textDim,lineHeight:1.7,margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA bottom */}
        <div style={{ textAlign:"center",padding:"56px 40px 72px",borderTop:"1px solid rgba(124,58,237,0.1)" }}>
          <h2 style={{ fontSize:34,fontWeight:900,marginBottom:14,color:"#fff" }}>Ready to dominate the replay?</h2>
          <p style={{ color:T.textDim,marginBottom:30,fontSize:15 }}>Join the Valor World community. Build your edge. Track your growth.</p>
          <button onClick={() => onEnter("platform")} style={{ background:"linear-gradient(135deg,#7c3aed,#10d98a)",border:"none",color:"#fff",padding:"17px 50px",borderRadius:14,cursor:"pointer",fontSize:17,fontWeight:800,boxShadow:"0 0 44px rgba(124,58,237,0.45)" }}>
            Enter ValorReplay ⚡
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTH MODAL
// ─────────────────────────────────────────────────────────────
function AuthModal({ mode, onClose, onSuccess }) {
  const [tab, setTab] = useState(mode);
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(4,2,14,0.88)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(7px)" }}>
      <div className="fade-in" style={{ background:T.bg2,border:`1px solid rgba(124,58,237,0.3)`,borderRadius:20,padding:38,width:420,position:"relative",boxShadow:"0 0 70px rgba(124,58,237,0.25)" }}>
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <div style={{ fontSize:34,marginBottom:6 }}>⚡</div>
          <div style={{ fontSize:21,fontWeight:900 }}><span style={{ color:"#fff" }}>VALOR</span><span style={{ color:T.green }}>REPLAY</span></div>
        </div>
        <div style={{ display:"flex",background:T.bg3,borderRadius:10,padding:4,marginBottom:26 }}>
          {["login","signup"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",background:tab===t?T.purple:"transparent",color:tab===t?"#fff":T.textDim,fontWeight:tab===t?700:400,fontSize:14,transition:"all 0.2s" }}>
              {t==="login"?"Sign In":"Sign Up"}
            </button>
          ))}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:13 }}>
          {tab==="signup" && <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Display Name" style={{ background:T.bg3,border:`1px solid ${T.cardBorder}`,borderRadius:9,padding:"11px 15px",color:T.text,fontSize:14 }} />}
          <input value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="Email" style={{ background:T.bg3,border:`1px solid ${T.cardBorder}`,borderRadius:9,padding:"11px 15px",color:T.text,fontSize:14 }} />
          <input type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="Password" style={{ background:T.bg3,border:`1px solid ${T.cardBorder}`,borderRadius:9,padding:"11px 15px",color:T.text,fontSize:14 }} />
          <button onClick={() => onSuccess({ name:form.name||"Valor Trader",email:form.email||"trader@valorworld.gg",balance:100000 })}
            style={{ background:"linear-gradient(135deg,#7c3aed,#5b21b6)",border:"none",color:"#fff",padding:"13px",borderRadius:10,cursor:"pointer",fontSize:15,fontWeight:800,boxShadow:T.glow,marginTop:4 }}>
            {tab==="login"?"Enter the Arena →":"Create Account →"}
          </button>
        </div>
        <button onClick={onClose} style={{ position:"absolute",top:14,right:14,background:"transparent",border:"none",color:T.textMuted,cursor:"pointer",fontSize:18,lineHeight:1 }}>✕</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE PAGE
// ─────────────────────────────────────────────────────────────
function ProfilePage({ user, trades, balance, onBack }) {
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl <= 0).length;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : "0.0";
  const avgWin = wins > 0 ? (trades.filter(t=>t.pnl>0).reduce((s,t)=>s+t.pnl,0)/wins).toFixed(2) : "0.00";
  const avgLoss = losses > 0 ? (Math.abs(trades.filter(t=>t.pnl<=0).reduce((s,t)=>s+t.pnl,0))/losses).toFixed(2) : "0.00";
  const pf = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "∞";
  const equityCurve = useMemo(() => {
    let eq = balance - totalPnl;
    return [{ n:"Start", v:eq }, ...trades.map((t,i) => { eq+=t.pnl; return { n:`T${i+1}`, v:parseFloat(eq.toFixed(2)) }; })];
  }, [trades, balance, totalPnl]);

  const stats = [
    { label:"Total P&L",     val:`$${totalPnl.toFixed(2)}`,    col:totalPnl>=0?T.bull:T.bear },
    { label:"Win Rate",      val:`${winRate}%`,                 col:parseFloat(winRate)>=50?T.bull:T.bear },
    { label:"Total Trades",  val:trades.length,                 col:T.purpleLight },
    { label:"Profit Factor", val:pf,                            col:parseFloat(pf)>=1?T.bull:T.bear },
    { label:"Avg Win",       val:`$${avgWin}`,                  col:T.bull },
    { label:"Avg Loss",      val:`-$${avgLoss}`,                col:T.bear },
    { label:"Wins",          val:wins,                          col:T.bull },
    { label:"Losses",        val:losses,                        col:T.bear },
  ];

  return (
    <div style={{ minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Inter,sans-serif" }}>
      <div style={{ position:"fixed",inset:0,pointerEvents:"none" }}><Starfield /></div>
      <div style={{ position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:24 }}>

        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:28 }}>
          <button onClick={onBack} style={{ background:T.bg2,border:`1px solid ${T.cardBorder}`,color:T.textDim,padding:"7px 14px",borderRadius:9,cursor:"pointer",fontSize:13 }}>← Platform</button>
          <div style={{ flex:1 }} />
          <span style={{ fontSize:18,fontWeight:900 }}><span style={{ color:"#fff" }}>VALOR</span><span style={{ color:T.green }}>REPLAY</span> <span style={{ color:T.textDim,fontSize:13,fontWeight:400 }}>/ Profile</span></span>
        </div>

        {/* Profile card */}
        <div className="fade-in" style={{ background:`linear-gradient(135deg,${T.bg2},rgba(124,58,237,0.08))`,border:`1px solid ${T.cardBorder}`,borderRadius:20,padding:26,marginBottom:22,display:"flex",alignItems:"center",gap:22,boxShadow:T.glow }}>
          <div style={{ width:68,height:68,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#10d98a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:900,flexShrink:0,boxShadow:T.glow }}>
            {(user?.name||"T")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:22,fontWeight:800,marginBottom:3 }}>{user?.name||"Valor Trader"}</div>
            <div style={{ color:T.textMuted,fontSize:13 }}>{user?.email||"trader@valorworld.gg"}</div>
            <div style={{ marginTop:8,display:"flex",gap:8 }}>
              <span style={{ background:"rgba(124,58,237,0.18)",color:T.purpleLight,padding:"3px 11px",borderRadius:20,fontSize:10,fontWeight:700,letterSpacing:0.5 }}>⚡ VALOR WORLD</span>
              <span style={{ background:"rgba(16,217,138,0.1)",color:T.green,padding:"3px 11px",borderRadius:20,fontSize:10,fontWeight:700 }}>Active Trader</span>
            </div>
          </div>
          <div style={{ flex:1 }} />
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:30,fontWeight:900,color:T.green,fontFamily:"monospace" }}>${balance.toLocaleString("en-US",{minimumFractionDigits:2})}</div>
            <div style={{ fontSize:12,color:T.textMuted }}>Sim Balance</div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background:T.bg2,border:`1px solid ${T.cardBorder}`,borderRadius:14,padding:"16px 18px",transition:"all 0.2s",cursor:"default" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(124,58,237,0.45)"; e.currentTarget.style.boxShadow=T.glow; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=T.cardBorder; e.currentTarget.style.boxShadow="none"; }}>
              <div style={{ fontSize:11,color:T.textMuted,marginBottom:7,textTransform:"uppercase",letterSpacing:0.5 }}>{s.label}</div>
              <div style={{ fontSize:22,fontWeight:900,color:s.col,fontFamily:"monospace" }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Equity curve */}
        <div style={{ background:T.bg2,border:`1px solid ${T.cardBorder}`,borderRadius:20,padding:"22px 18px",marginBottom:22 }}>
          <div style={{ fontSize:15,fontWeight:700,marginBottom:18,color:"#fff" }}>📈 Equity Curve</div>
          {equityCurve.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.grid} />
                <XAxis dataKey="n" stroke={T.textMuted} tick={{ fontSize:10, fill:T.textMuted }} />
                <YAxis stroke={T.textMuted} tick={{ fontSize:10, fill:T.textMuted }} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:10,color:T.text,fontSize:12 }} formatter={v=>[`$${v.toLocaleString()}`,"Equity"]} />
                <Area type="monotone" dataKey="v" stroke={T.purpleLight} fill="url(#grad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:200,display:"flex",alignItems:"center",justifyContent:"center",color:T.textMuted,fontSize:14 }}>Place some trades to see your equity curve</div>
          )}
        </div>

        {/* Trade history */}
        <div style={{ background:T.bg2,border:`1px solid ${T.cardBorder}`,borderRadius:20,padding:"22px 18px" }}>
          <div style={{ fontSize:15,fontWeight:700,marginBottom:18,color:"#fff" }}>📋 Trade History ({trades.length})</div>
          {trades.length === 0 ? (
            <div style={{ textAlign:"center",padding:"40px 0",color:T.textMuted,fontSize:14 }}>No trades yet — start the platform and place your first trade!</div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:600 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${T.cardBorder}` }}>
                    {["#","Symbol","Side","Qty","Entry","Exit","P&L","Result"].map(h => (
                      <th key={h} style={{ padding:"7px 12px",textAlign:"left",color:T.textMuted,fontWeight:600,textTransform:"uppercase",fontSize:10,letterSpacing:0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.slice().reverse().map((t, i) => (
                    <tr key={i} style={{ borderBottom:"1px solid rgba(45,31,94,0.25)",transition:"background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background="rgba(124,58,237,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"9px 12px",color:T.textMuted,fontFamily:"monospace" }}>{trades.length-i}</td>
                      <td style={{ padding:"9px 12px",fontWeight:700 }}>{t.sym}</td>
                      <td style={{ padding:"9px 12px",color:t.side==="long"?T.bull:T.bear,fontWeight:700 }}>{t.side==="long"?"▲ LONG":"▼ SHORT"}</td>
                      <td style={{ padding:"9px 12px",fontFamily:"monospace" }}>{t.qty}</td>
                      <td style={{ padding:"9px 12px",fontFamily:"monospace" }}>{t.price?.toFixed(2)}</td>
                      <td style={{ padding:"9px 12px",fontFamily:"monospace" }}>{t.closePrice?.toFixed(2)}</td>
                      <td style={{ padding:"9px 12px",fontWeight:800,color:t.pnl>=0?T.bull:T.bear,fontFamily:"monospace" }}>{t.pnl>=0?"+":""}{t.pnl?.toFixed(2)}</td>
                      <td style={{ padding:"9px 12px" }}>
                        <span style={{ background:t.pnl>=0?"rgba(16,217,138,0.15)":"rgba(239,68,68,0.15)",color:t.pnl>=0?T.bull:T.bear,padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:700 }}>
                          {t.pnl>=0?"WIN":"LOSS"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("splash");
  const [authMode, setAuthMode] = useState(null);
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [balance, setBalance] = useState(100000);

  const handleEnter = (mode) => {
    if (mode === "platform") {
      if (!user) setUser({ name:"Valor Trader", email:"trader@valorworld.gg", balance:100000 });
      setPage("platform");
    } else {
      setAuthMode(mode);
    }
  };

  return (
    <div style={{ background:T.bg, minHeight:"100vh" }}>
      {page === "splash" && <SplashPage onEnter={handleEnter} />}
      {page === "platform" && <TradingPlatform user={user} onProfile={() => setPage("profile")} onLogout={() => { setPage("splash"); }} />}
      {page === "profile" && <ProfilePage user={user} trades={trades} balance={balance} onBack={() => setPage("platform")} />}
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSuccess={u => { setUser(u); setBalance(u.balance||100000); setAuthMode(null); setPage("platform"); }} />}
    </div>
  );
}
