"use client";
import {
  useState, useEffect, useCallback, useMemo, useRef, ReactNode,
} from "react";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart,
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  TrendingUp, Bell, ChevronLeft, ChevronRight, Zap, MapPin,
  Calendar, BarChart2, ArrowLeftRight, Database, Settings,
  Plus, User, AlertCircle, CheckCircle, RefreshCw, Activity,
  Package, Truck, Star, Filter, Download, Brain, CloudRain,
  Calculator, Lock, Globe, Key, Code, Shield, Eye, EyeOff,
  LogOut, Gavel,
} from "lucide-react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "./auth";
import {
  marketApi, priceApi, arbApi, predApi, bidApi,
  notifApi, agentApi, devApi, subApi,
  Market, Commodity, LivePrices, LiveWeather,
  ArbitrageOpportunity, MarketDayEvent, Bid,
  Notification, ApiKey, PriceHistory,
} from "./api";

// ─── UI helpers ───────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
*{box-sizing:border-box}
.mono{font-family:'JetBrains Mono',monospace}
.flash-up{animation:fu .7s ease}.flash-dn{animation:fd .7s ease}
@keyframes fu{0%,100%{background:transparent}40%{background:rgba(74,222,128,.2)}}
@keyframes fd{0%,100%{background:transparent}40%{background:rgba(248,113,113,.2)}}
.ticker-outer{overflow:hidden;white-space:nowrap}
.ticker-inner{display:inline-flex;animation:tick 60s linear infinite}
@keyframes tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.sms-slide{animation:ss .3s ease}
@keyframes ss{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:#18181b}
::-webkit-scrollbar-thumb{background:#3f3f46;border-radius:2px}
.card{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px}
.card-sm{background:#18181b;border:1px solid #27272a;border-radius:10px;padding:14px}
.card-hover:hover{border-color:#3f3f46}
.btn-green{background:#15803d;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:background .15s;white-space:nowrap}
.btn-green:hover{background:#16a34a}
.btn-green:disabled{opacity:.5;cursor:not-allowed}
.btn-outline{background:transparent;color:#86efac;border:1px solid #166534;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif}
.btn-outline:hover{background:#14532d}
.btn-amber{background:#92400e;color:#fef3c7;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif}
.btn-amber:hover{background:#b45309}
.btn-purple{background:#5b21b6;color:#ede9fe;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif}
.btn-purple:hover{background:#6d28d9}
.btn-ghost{background:transparent;color:#71717a;border:1px solid #3f3f46;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif}
.btn-ghost:hover{color:#e4e4e7;border-color:#71717a}
.btn-exec{background:#166534;color:#86efac;border:1px solid #14532d;border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer;font-weight:600}
.btn-exec:hover{background:#15803d}
.input{background:#18181b;border:1px solid #3f3f46;border-radius:8px;padding:9px 12px;color:#f4f4f5;font-family:'Inter',sans-serif;font-size:13px;outline:none;width:100%;transition:border-color .15s}
.input:focus{border-color:#22c55e}
select.input option{background:#18181b}
.dot-live{width:7px;height:7px;border-radius:50%;background:#22c55e;animation:pl 2s infinite}
@keyframes pl{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}
.tab{padding:6px 14px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;color:#71717a;transition:all .15s}
.tab:hover{color:#e4e4e7;background:#27272a}.tab.active{background:#14532d;color:#86efac}
.prem-badge{background:linear-gradient(90deg,#92400e,#b45309);color:#fef3c7;font-size:10px;padding:2px 7px;border-radius:4px;font-weight:700;letter-spacing:.05em;white-space:nowrap}
.price-cell{padding:8px 10px;text-align:right;font-size:13px;border-bottom:1px solid #1c1c1e;transition:background .3s;cursor:pointer}
.price-cell:hover{background:#1c1c1e}
.chart-tip{background:#1c1c1e;border:1px solid #27272a;border-radius:8px;padding:8px 12px;font-size:12px;color:#a1a1aa}
.bid-pulse{animation:bp 2s infinite}
@keyframes bp{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,.3)}50%{box-shadow:0 0 0 6px rgba(251,191,36,0)}}
.code-block{background:#0a0a0a;border:1px solid #27272a;border-radius:8px;padding:14px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#86efac;overflow-x:auto}
.auth-card{background:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px;max-width:480px;width:100%}
.skeleton{background:linear-gradient(90deg,#27272a 25%,#3f3f46 50%,#27272a 75%);background-size:200% 100%;animation:sk 1.5s infinite}
@keyframes sk{0%{background-position:200% 0}100%{background-position:-200% 0}}
`;

const TIER_COLORS: Record<string, string> = {
  basic: "#71717a", premium: "#f59e0b", enterprise: "#8b5cf6",
};
const TIER_PRICES: Record<string, string> = {
  basic: "Free", premium: "KES 1,200/mo", enterprise: "KES 8,500/mo",
};
const TIER_FEATURES: Record<string, string[]> = {
  basic: ["Market prices", "Price charts", "Calendar"],
  premium: ["All Basic", "Faida arbitrage", "AI prediction", "Weather overlay", "Trade calculator", "SMS alerts"],
  enterprise: ["All Premium", "API access", "Bulk bidding", "Priority alerts", "White-label data"],
};
const ROLES = ["Farmer", "Buyer", "Broker", "Agent", "Developer"] as const;
const ROLE_ICONS: Record<string, string> = {
  Farmer: "🌱", Buyer: "🏭", Broker: "🤝", Agent: "📍", Developer: "💻",
};
const ROLE_DESC: Record<string, string> = {
  Farmer: "View prices, get sell alerts, track your commodities",
  Buyer: "Place bids, bulk purchase, access supply data",
  Broker: "Monitor price gaps between regions for commission",
  Agent: "Log verified prices from physical markets",
  Developer: "API access, build on top of AgriTrade data",
};

// Haversine (client-side for UI calculations only; server does authoritative calc)
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, d = (x: number) => (x * Math.PI) / 180;
  const a =
    Math.sin(d(lat2 - lat1) / 2) ** 2 +
    Math.cos(d(lat1)) * Math.cos(d(lat2)) * Math.sin(d(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Linear regression forecast (client-side, for instant UX)
function localForecast(
  history: PriceHistory[],
  days = 14
): { date: string; predicted: number; upper: number; lower: number }[] {
  const prices = history.map((h) => h.price);
  const n = prices.length;
  if (n < 5) return [];
  const mx = (n - 1) / 2;
  const my = prices.reduce((s, p) => s + p, 0) / n;
  const num = prices.reduce((s, p, i) => s + (i - mx) * (p - my), 0);
  const den = prices.reduce((s, _, i) => s + (i - mx) ** 2, 0);
  const slope = num / den;
  const intercept = my - slope * mx;
  const res = prices.map((p, i) => p - (slope * i + intercept));
  const std = Math.sqrt(res.reduce((s, r) => s + r * r, 0) / n);
  return Array.from({ length: days }, (_, i) => {
    const pred = Math.max(0, slope * (n + i) + intercept);
    const dt = new Date();
    dt.setDate(dt.getDate() + i + 1);
    return {
      date: dt.toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
      predicted: +pred.toFixed(2),
      upper: +(pred + 1.6 * std).toFixed(2),
      lower: +Math.max(0, pred - 1.6 * std).toFixed(2),
    };
  });
}

const CT = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div className="chart-tip">
      <p className="font-semibold text-zinc-200 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || "#a1a1aa" }}>
          {p.name}: <span className="mono">KES {(+p.value).toFixed(2)}</span>
        </p>
      ))}
    </div>
  ) : null;

function Skeleton({ h = 4 }: { h?: number }) {
  return (
    <div className="skeleton rounded-lg w-full" style={{ height: `${h * 16}px` }} />
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function AgriTradeApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState("market-prices");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [prices, setPrices] = useState<LivePrices>({});
  const [weather, setWeather] = useState<LiveWeather>({});
  const [flash, setFlash] = useState<Record<string, "up" | "dn">>({});
  const [arbs, setArbs] = useState<ArbitrageOpportunity[]>([]);
  const [calEvents, setCalEvents] = useState<MarketDayEvent[]>([]);
  const [calMonth, setCalMonth] = useState(new Date());
  const [bids, setBids] = useState<Bid[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [smsAlert, setSmsAlert] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const [calcPayload, setCalcPayload] = useState<ArbitrageOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  const isPremium = user?.tier === "premium" || user?.tier === "enterprise";
  const isEnterprise = user?.tier === "enterprise";
  const isAgent = user?.role === "Agent";
  const unread = notifications.filter((n) => !n.read).length;

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    Promise.all([
      marketApi.getMarkets().then(setMarkets),
      marketApi.getCommodities().then(setCommodities),
      priceApi.getLivePrices().then(setPrices),
      priceApi.getLiveWeather().then(setWeather),
      bidApi.getBids().then(setBids),
      notifApi.getNotifications().then(setNotifications),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // ── Calendar ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    marketApi
      .getCalendar(calMonth.getMonth() + 1, calMonth.getFullYear())
      .then(setCalEvents)
      .catch(console.error);
  }, [user, calMonth]);

  // ── Arbitrage ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !isPremium) return;
    const fetch = () =>
      arbApi.getOpportunities().then(setArbs).catch(console.error);
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [user, isPremium]);

  // ── WebSocket pub/sub ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const WS = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000";
    const socket = io(WS, {
      auth: { token: localStorage.getItem("agritrade_token") },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("price_update", (data: {
      market_id: number; commodity_id: string;
      price: number; pct: number; change: number;
    }) => {
      setPrices((prev) => {
        const old = prev[data.market_id]?.[data.commodity_id]?.price || data.price;
        const next = {
          ...prev,
          [data.market_id]: {
            ...(prev[data.market_id] || {}),
            [data.commodity_id]: {
              price: data.price, prev: old,
              change: data.change, pct: data.pct,
            },
          },
        };
        setFlash((f) => ({ ...f, [`${data.market_id}-${data.commodity_id}`]: data.pct >= 0 ? "up" : "dn" }));
        setTimeout(() => setFlash((f) => { const n = { ...f }; delete n[`${data.market_id}-${data.commodity_id}`]; return n; }), 700);
        return next;
      });
    });

    socket.on("weather_update", (data: { market_id: number; weather: any }) => {
      setWeather((w) => ({ ...w, [data.market_id]: data.weather }));
    });

    socket.on("arbitrage_alert", (data: { message: string }) => {
      setSmsAlert(data.message);
      setTimeout(() => setSmsAlert(""), 8000);
      setNotifications((p) => [
        { id: Date.now(), type: "arb", msg: data.message, time: "just now", read: false },
        ...p.slice(0, 9),
      ]);
      if (isPremium) arbApi.getOpportunities().then(setArbs).catch(console.error);
    });

    socket.on("new_bid", (bid: Bid) => {
      setBids((p) => [bid, ...p.filter((b) => b.id !== bid.id)]);
      setNotifications((p) => [
        { id: Date.now(), type: "bid", msg: `💰 New bid: ${bid.buyer} · ${bid.commodity} KES ${bid.bid_price}/${bid.unit}`, time: "just now", read: false },
        ...p.slice(0, 9),
      ]);
    });

    socket.on("sms_alert", (data: { message: string }) => {
      setSmsAlert(data.message);
      setTimeout(() => setSmsAlert(""), 8000);
    });

    return () => { socket.disconnect(); };
  }, [user, isPremium]);

  // ── Ticker ────────────────────────────────────────────────────────────────
  const ticker = useMemo(
    () =>
      commodities.slice(0, 8).map((c) => ({
        ...c,
        p: prices[1]?.[c.id]?.price || c.hub_price,
        pct: prices[1]?.[c.id]?.pct || 0,
      })),
    [commodities, prices]
  );

  const NAV = [
    { id: "market-prices", icon: Globe, label: "Market prices", locked: false },
    { id: "faida", icon: ArrowLeftRight, label: "Faida", locked: !isPremium },
    { id: "prediction", icon: Brain, label: "AI prediction", locked: !isPremium },
    { id: "charts", icon: TrendingUp, label: "Price charts", locked: false },
    { id: "calendar", icon: Calendar, label: "Calendar", locked: false },
    { id: "marketplace", icon: Gavel, label: "Marketplace", locked: false },
    ...(isAgent ? [{ id: "dataentry", icon: Database, label: "Data entry", locked: false }] : []),
    { id: "portal", icon: User, label: user?.role === "Developer" ? "Dev portal" : "My portal", locked: false },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'Inter',sans-serif" }}>
      <style>{CSS}</style>

      {/* TOP BAR */}
      <div className="flex items-center h-12 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50 px-4 gap-3">
        <div className="flex items-center gap-2 min-w-44">
          <span className="text-green-400 font-bold text-sm tracking-tight">🌿 AgriTrade</span>
          <div className="dot-live" />
        </div>
        <div className="ticker-outer flex-1">
          <div className="ticker-inner gap-8">
            {[...ticker, ...ticker].map((c, i) => (
              <span key={i} className="flex items-center gap-2 text-xs">
                <span className="text-zinc-400">{c.emoji} {c.name}</span>
                <span className="mono font-semibold">{c.p.toFixed(2)}</span>
                <span className={c.pct >= 0 ? "text-green-400 mono" : "text-red-400 mono"}>
                  {c.pct >= 0 ? "▲" : "▼"}{Math.abs(c.pct).toFixed(2)}%
                </span>
                <span className="text-zinc-700 mx-1">|</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full" style={{
            background: (TIER_COLORS[user?.tier || "basic"] || "#71717a") + "22",
            color: TIER_COLORS[user?.tier || "basic"],
            border: `1px solid ${TIER_COLORS[user?.tier || "basic"]}44`,
          }}>
            {user?.tier?.charAt(0).toUpperCase()}{user?.tier?.slice(1)}
          </span>
          <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-1.5 hover:bg-zinc-800 rounded-md">
            <Bell size={15} className="text-zinc-400" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </button>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 cursor-pointer hover:bg-zinc-800" onClick={() => setPage("portal")}>
            <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center text-xs font-bold text-green-200">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-zinc-400">{user?.name}</span>
          </div>
        </div>
      </div>

      {/* SMS ALERT */}
      {smsAlert && (
        <div className="sms-slide bg-amber-950 border-b border-amber-700 px-4 py-2 flex items-start gap-3">
          <span>📱</span>
          <div className="flex-1">
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Live advisory</p>
            <p className="text-sm text-amber-100 mt-0.5">{smsAlert}</p>
          </div>
          <button onClick={() => setSmsAlert("")} className="text-amber-500 text-lg">✕</button>
        </div>
      )}

      {/* NOTIFICATIONS PANEL */}
      {showNotifs && (
        <div className="absolute right-4 top-14 z-50 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
            <span className="font-semibold text-sm">Notifications</span>
            <button onClick={() => {
              notifApi.markAllRead().catch(console.error);
              setNotifications((p) => p.map((n) => ({ ...n, read: true })));
            }} className="text-xs text-green-400">Mark all read</button>
          </div>
          {notifications.slice(0, 6).map((n) => (
            <div key={n.id} className={`px-4 py-3 border-b border-zinc-800 ${!n.read ? "bg-zinc-800" : ""}`}>
              <p className={`text-xs leading-relaxed ${!n.read ? "text-zinc-100" : "text-zinc-400"}`}>{n.msg}</p>
              <p className="text-zinc-600 text-xs mt-0.5">{n.time}</p>
            </div>
          ))}
          <div className="px-4 py-2 text-center">
            <button onClick={() => setShowNotifs(false)} className="text-xs text-zinc-500">Close</button>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* SIDEBAR */}
        <div className="bg-zinc-950 border-r border-zinc-800 flex flex-col py-3 sticky top-12 h-[calc(100vh-48px)] overflow-auto" style={{ minWidth: 176 }}>
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.locked && setPage(n.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all text-left ${
                page === n.id ? "bg-green-900 text-green-300"
                : n.locked ? "text-zinc-600 cursor-not-allowed"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <n.icon size={14} />
              <span className="flex-1 truncate">{n.label}</span>
              {n.locked && <Lock size={11} className="text-amber-600 flex-shrink-0" />}
              {!n.locked && ["faida", "prediction"].includes(n.id) && (
                <span className="text-xs bg-amber-900/60 text-amber-400 px-1 rounded font-bold flex-shrink-0">★</span>
              )}
            </button>
          ))}
          <div className="mt-auto px-3 py-3 border-t border-zinc-800 mx-2 space-y-1">
            <div className="flex items-center gap-2 text-xs"><div className="dot-live" /><span className="text-zinc-500">WebSocket live</span></div>
            <button onClick={logout} className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 w-full">
              <LogOut size={12} />Sign out
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-auto bg-zinc-950">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton h={8} /><Skeleton h={20} /><Skeleton h={12} />
            </div>
          ) : (
            <>
              {page === "market-prices" && <MarketPricesPage prices={prices} flash={flash} weather={weather} calEvents={calEvents} arbs={arbs} markets={markets} commodities={commodities} setPage={setPage} setCalcPayload={setCalcPayload} />}
              {page === "faida" && (isPremium ? <FaidaPage prices={prices} weather={weather} arbs={arbs} markets={markets} commodities={commodities} setCalcPayload={setCalcPayload} setPage={setPage} /> : <UpgradeWall feature="Faida Arbitrage" />)}
              {page === "prediction" && (isPremium ? <PredictionPage prices={prices} markets={markets} commodities={commodities} /> : <UpgradeWall feature="AI Price Prediction" />)}
              {page === "charts" && <ChartsPage prices={prices} markets={markets} commodities={commodities} />}
              {page === "calendar" && <CalendarPage events={calEvents} month={calMonth} setMonth={setCalMonth} weather={weather} markets={markets} />}
              {page === "marketplace" && <MarketplacePage bids={bids} setBids={setBids} prices={prices} commodities={commodities} setNotifications={setNotifications} />}
              {page === "dataentry" && isAgent && <DataEntryPage markets={markets} commodities={commodities} weather={weather} />}
              {page === "portal" && <PortalPage prices={prices} arbs={arbs} bids={bids} isPremium={isPremium} isEnterprise={isEnterprise} commodities={commodities} setCalcPayload={setCalcPayload} setPage={setPage} />}
              {page === "calculator" && <TradeCalculator payload={calcPayload} weather={weather} onBack={() => setPage("faida")} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── UPGRADE WALL ─────────────────────────────────────────────────────────────
function UpgradeWall({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 p-6 text-center">
      <Lock size={40} className="text-amber-500 mb-4" />
      <h2 className="text-xl font-semibold text-zinc-100 mb-2">{feature}</h2>
      <p className="text-zinc-500 text-sm mb-6 max-w-sm">
        This feature requires a Premium or Enterprise subscription.
      </p>
      <div className="flex gap-3">
        <button className="btn-amber">Upgrade to Premium — KES 1,200/mo</button>
        <button className="btn-purple">Enterprise — KES 8,500/mo</button>
      </div>
    </div>
  );
}

// ─── 1. MARKET PRICES ─────────────────────────────────────────────────────────
function MarketPricesPage({ prices, flash, weather, calEvents, arbs, markets, commodities, setPage, setCalcPayload }: {
  prices: LivePrices; flash: Record<string, "up" | "dn">; weather: LiveWeather;
  calEvents: MarketDayEvent[]; arbs: ArbitrageOpportunity[]; markets: Market[];
  commodities: Commodity[]; setPage: (p: string) => void; setCalcPayload: (p: ArbitrageOpportunity) => void;
}) {
  const [selCom, setSelCom] = useState("all");
  const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix");
  const today = new Date().getDate();
  const todayEvs = calEvents.filter((e) => e.day === today);

  const ranges = useMemo(() => {
    const r: Record<string, { min: number; max: number; avg: number }> = {};
    commodities.forEach((c) => {
      const vals = markets.map((m) => prices[m.id]?.[c.id]?.price || 0).filter((p) => p > 0);
      if (!vals.length) { r[c.id] = { min: 0, max: 1, avg: 0 }; return; }
      r[c.id] = { min: Math.min(...vals), max: Math.max(...vals), avg: vals.reduce((s, p) => s + p, 0) / vals.length };
    });
    return r;
  }, [prices, commodities, markets]);

  const heat = (cId: string, price: number) => {
    const { min, max } = ranges[cId] || { min: 0, max: 1 };
    const ratio = (price - min) / (max - min || 1);
    if (ratio > 0.72) return { bg: "rgba(239,68,68,.13)", text: "#f87171" };
    if (ratio > 0.42) return { bg: "rgba(251,191,36,.08)", text: "#fbbf24" };
    return { bg: "rgba(74,222,128,.1)", text: "#4ade80" };
  };

  const visComs = selCom === "all" ? commodities : commodities.filter((c) => c.id === selCom);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Market prices</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Live prices across Kenya — heat-mapped by spread · smart-priced by distance from production hubs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode((v) => v === "matrix" ? "list" : "matrix")} className="btn-ghost text-xs py-2 px-3">{viewMode === "matrix" ? "List view" : "Matrix view"}</button>
          <button className="btn-green text-xs py-2 px-3 flex items-center gap-1"><Download size={12} />Export</button>
        </div>
      </div>

      {/* Weather strip */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(markets.length, 10)}, 1fr)` }}>
        {markets.slice(0, 10).map((m) => {
          const wx = weather[m.id];
          return (
            <div key={m.id} className="card-sm text-center p-2">
              <p className="text-xs text-zinc-500 truncate font-medium">{m.name.split(" ")[0]}</p>
              <p className="text-2xl my-1">{wx?.icon || "☀️"}</p>
              <p className="text-xs text-zinc-300 font-medium">{wx?.tmp || 24}°C</p>
              <p className="text-xs text-zinc-500">{wx?.w}</p>
              {wx?.rain && <p className="text-xs text-amber-400 mt-0.5">+{Math.round((wx.prem || 0) * 100)}% tc</p>}
            </div>
          );
        })}
      </div>

      {todayEvs.length > 0 && (
        <div className="flex gap-2 items-center overflow-x-auto pb-1">
          <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Today's markets:</span>
          {todayEvs.map((e, i) => (
            <span key={i} className="text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium border border-zinc-700" style={{ background: `${e.color}18`, color: e.color }}>
              📅 {e.mkt} — {e.emoji} {e.commodity}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-1 flex-wrap">
        <button onClick={() => setSelCom("all")} className={`tab ${selCom === "all" ? "active" : ""}`}>All</button>
        {commodities.map((c) => (
          <button key={c.id} onClick={() => setSelCom(c.id)} className={`tab ${selCom === c.id ? "active" : ""}`}>{c.emoji} {c.name}</button>
        ))}
      </div>

      {viewMode === "matrix" ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 860 }}>
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-3 font-medium text-zinc-500 sticky left-0 bg-zinc-900 z-10" style={{ minWidth: 155 }}>Market · Weather</th>
                {visComs.map((c, ci) => (
                  <th key={c.id} className="text-right py-3 px-2.5 font-medium" style={{ minWidth: 88 }}>
                    <span className="block" style={{ color: `hsl(${ci * 36},65%,62%)` }}>{c.emoji} {c.name}</span>
                    <span className="text-zinc-600 font-normal">KES/{c.unit}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {markets.map((m) => {
                const wx = weather[m.id];
                const nextDay = calEvents.filter((e) => e.mktId === m.id).sort((a, b) => a.day - b.day)[0];
                return (
                  <tr key={m.id} className="hover:bg-zinc-900/50 border-b border-zinc-800/40">
                    <td className="py-2.5 px-3 sticky left-0 bg-zinc-950 z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{wx?.icon}</span>
                        <div>
                          <p className="font-semibold text-zinc-200">{m.name}</p>
                          <p className="text-zinc-500 text-xs">{m.region} · {wx?.w}</p>
                          {nextDay && <p className="text-green-400 text-xs">📅 Day {nextDay.day}</p>}
                        </div>
                      </div>
                    </td>
                    {visComs.map((c) => {
                      const entry = prices[m.id]?.[c.id];
                      const { bg, text } = heat(c.id, entry?.price || 0);
                      const fk = `${m.id}-${c.id}`;
                      return (
                        <td key={c.id} className={`price-cell ${flash[fk] === "up" ? "flash-up" : flash[fk] === "dn" ? "flash-dn" : ""}`} style={{ background: bg }}>
                          <p className="mono font-semibold" style={{ color: text }}>{(entry?.price || 0).toFixed(0)}</p>
                          <p className={`text-xs mono ${(entry?.pct || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {(entry?.pct || 0) >= 0 ? "▲" : "▼"}{Math.abs(entry?.pct || 0).toFixed(1)}%
                          </p>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-700">
                <td className="py-2 px-3 text-xs text-zinc-500 font-medium sticky left-0 bg-zinc-950">Network average</td>
                {visComs.map((c) => (
                  <td key={c.id} className="price-cell">
                    <p className="mono text-zinc-400 font-medium">{(ranges[c.id]?.avg || 0).toFixed(0)}</p>
                    <p className="text-xs text-zinc-600">avg</p>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
          <div className="flex gap-4 mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: "rgba(74,222,128,.25)" }} />Low · Hub price zone</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: "rgba(251,191,36,.25)" }} />Mid range</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: "rgba(239,68,68,.25)" }} />High · Demand premium</span>
            <span className="ml-auto">WebSocket live · Smart distance pricing</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {markets.map((m) => {
            const wx = weather[m.id];
            return (
              <div key={m.id} className="card card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{wx?.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{m.name}</h3>
                    <p className="text-xs text-zinc-500">{m.region} · {wx?.w} · {wx?.tmp}°C{wx?.rain && <span className="text-amber-400"> · Rain (+{Math.round((wx.prem || 0) * 100)}% transport)</span>}</p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {visComs.slice(0, 10).map((c) => {
                    const entry = prices[m.id]?.[c.id];
                    const fk = `${m.id}-${c.id}`;
                    const { bg, text } = heat(c.id, entry?.price || 0);
                    return (
                      <div key={c.id} className={`p-2 rounded-lg ${flash[fk] === "up" ? "flash-up" : flash[fk] === "dn" ? "flash-dn" : ""}`} style={{ background: bg }}>
                        <p className="text-xs text-zinc-500">{c.emoji} {c.name}</p>
                        <p className="mono font-bold text-sm" style={{ color: text }}>KES {(entry?.price || 0).toFixed(0)}</p>
                        <p className={`text-xs ${(entry?.pct || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {(entry?.pct || 0) >= 0 ? "▲" : "▼"}{Math.abs(entry?.pct || 0).toFixed(1)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {arbs.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><ArrowLeftRight size={14} className="text-green-400" /><span className="font-semibold text-sm">Live arbitrage from this matrix</span></div>
            <span className="prem-badge flex items-center gap-1"><Lock size={10} />Faida</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {arbs.slice(0, 3).map((a, i) => (
              <div key={i} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-zinc-200">{a.emoji} {a.com}</span>
                  <span className="mono text-green-400 font-bold text-sm">+{a.spread}%</span>
                </div>
                <p className="text-xs text-zinc-500">{a.buyMkt.name} → {a.sellMkt.name}</p>
                <p className="text-xs text-zinc-400 mt-1">Net: <span className="mono font-semibold text-zinc-200">+KES {a.net.toFixed(0)}/kg</span> · {a.dist} km</p>
                <button onClick={() => { setCalcPayload(a); setPage("calculator"); }} className="btn-exec mt-2 w-full py-1.5 text-xs">Trade calculator →</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 2. FAIDA ─────────────────────────────────────────────────────────────────
function FaidaPage({ prices, weather, arbs, markets, commodities, setCalcPayload, setPage }: {
  prices: LivePrices; weather: LiveWeather; arbs: ArbitrageOpportunity[];
  markets: Market[]; commodities: Commodity[]; setCalcPayload: (p: ArbitrageOpportunity) => void; setPage: (p: string) => void;
}) {
  const [form, setForm] = useState({ com: commodities[1]?.id || "", origin: markets[5]?.id || 0, target: markets[1]?.id || 0, vol: 15 });
  const [result, setResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const calc = async () => {
    setCalcLoading(true);
    try {
      const data = await arbApi.calcMargin({
        commodity_id: form.com,
        origin_market_id: +form.origin,
        target_market_id: +form.target,
        volume_mt: form.vol,
      });
      setResult({ ...data, com: commodities.find((c) => c.id === form.com), vol: form.vol, o: markets.find((m) => m.id === +form.origin), t: markets.find((m) => m.id === +form.target), wx: weather[+form.origin] });
    } catch (e: any) {
      console.error(e);
    } finally {
      setCalcLoading(false);
    }
  };

  const getAI = async () => {
    setAiLoading(true);
    const arbSummary = arbs.slice(0, 3).map((a) => `${a.com}: ${a.buyMkt.name} KES ${a.buyP.toFixed(0)} → ${a.sellMkt.name} KES ${a.sellP.toFixed(0)} (+${a.spread}%)`).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          messages: [{ role: "user", content: `Agricultural market analyst for East Africa. 3-paragraph actionable brief:\n${arbSummary}\nUse KES. Be specific.` }],
        }),
      });
      const d = await res.json();
      setAiText(d.content?.[0]?.text || "");
    } catch {
      setAiText("API key required for live AI analysis. Connect your Anthropic key in settings.");
    }
    setAiLoading(false);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><ArrowLeftRight size={18} className="text-green-400" />Faida — Arbitrage Engine</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Spatial price gap detection · weather-adjusted transport costs · net margin routing</p>
        </div>
        <span className="prem-badge flex items-center gap-1 py-1 px-2"><Lock size={10} />Premium</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {arbs.slice(0, 3).map((a, i) => (
          <div key={i} className={`card ${i === 0 ? "border-green-700" : ""}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{a.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm">{a.com}</span>
                  {i === 0 && <span className="text-xs bg-green-800 text-green-200 px-1.5 rounded font-bold">BEST</span>}
                </div>
                <p className="text-xs text-zinc-500">{a.buyMkt.name} → {a.sellMkt.name}</p>
              </div>
              <span className="mono font-bold text-green-400 text-xl">+{a.spread}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-zinc-900 p-2 rounded-lg">
                <p className="text-zinc-500">Buy @ {a.buyMkt.name.split(" ")[0]}</p>
                <p className="mono font-bold text-zinc-100">KES {a.buyP.toFixed(0)}/{a.unit}</p>
                <p className="mt-0.5">{a.wxOrigin?.icon} {a.wxOrigin?.w}</p>
              </div>
              <div className="bg-zinc-900 p-2 rounded-lg">
                <p className="text-zinc-500">Sell @ {a.sellMkt.name.split(" ")[0]}</p>
                <p className="mono font-bold text-zinc-100">KES {a.sellP.toFixed(0)}/{a.unit}</p>
                <p className="mt-0.5">{a.wxDest?.icon} {a.wxDest?.w}</p>
              </div>
            </div>
            <div className="space-y-1 text-xs border-t border-zinc-800 pt-2">
              <div className="flex justify-between"><span className="text-zinc-500 flex items-center gap-1"><MapPin size={10} />Distance</span><span className="mono text-zinc-300">{a.dist} km</span></div>
              <div className="flex justify-between"><span className="text-zinc-500 flex items-center gap-1"><Truck size={10} />Transport</span><span className="mono text-zinc-300">KES {a.tc.toFixed(2)}/kg</span></div>
              {a.wxOrigin?.rain && <div className="flex justify-between"><span className="text-amber-400 flex items-center gap-1"><CloudRain size={10} />Weather prem.</span><span className="mono text-amber-400">+{Math.round((a.wxOrigin?.prem || 0) * 100)}%</span></div>}
              <div className="flex justify-between font-semibold border-t border-zinc-800 pt-1.5"><span className="text-zinc-200">Net/kg</span><span className={`mono ${a.net > 0 ? "text-green-400" : "text-red-400"}`}>+KES {a.net.toFixed(2)}</span></div>
            </div>
            <button onClick={() => { setCalcPayload(a); setPage("calculator"); }} className="btn-exec w-full mt-3 py-2 text-xs">Execute → trade calculator</button>
          </div>
        ))}
        {arbs.length === 0 && <div className="col-span-3 card text-center py-8 text-zinc-500 text-sm">Scanning for arbitrage opportunities…</div>}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="card space-y-4">
          <p className="font-semibold text-sm flex items-center gap-2"><Filter size={14} className="text-green-400" />Route margin finder</p>
          <div><label className="text-xs text-zinc-500 block mb-1.5">Commodity</label>
            <select className="input" value={form.com} onChange={(e) => setForm((p) => ({ ...p, com: e.target.value }))}>
              {commodities.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-zinc-500 block mb-1.5">Origin</label>
            <select className="input" value={form.origin} onChange={(e) => setForm((p) => ({ ...p, origin: +e.target.value }))}>
              {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-zinc-500 block mb-1.5">Target market</label>
            <select className="input" value={form.target} onChange={(e) => setForm((p) => ({ ...p, target: +e.target.value }))}>
              {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-zinc-500 block mb-1.5">Volume (MT)</label>
            <input type="number" className="input" value={form.vol} onChange={(e) => setForm((p) => ({ ...p, vol: +e.target.value }))} />
          </div>
          {form.origin && weather[form.origin] && (
            <div className="bg-zinc-900 p-2.5 rounded-lg text-xs">
              <div className="flex justify-between"><span className="text-zinc-500">Origin weather</span><span>{weather[form.origin]?.icon} {weather[form.origin]?.w}</span></div>
              <div className="flex justify-between mt-1"><span className="text-zinc-500">Transport premium</span><span className={weather[form.origin]?.rain ? "text-amber-400" : "text-zinc-400"}>+{Math.round((weather[form.origin]?.prem || 0) * 100)}%</span></div>
            </div>
          )}
          <button onClick={calc} disabled={calcLoading} className="btn-green w-full">{calcLoading ? "Calculating…" : "Calculate margin"}</button>
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <div className={`card border ${result.ok ? "border-green-700" : "border-red-900"}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm">Net margin analysis</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${result.ok ? "bg-green-800 text-green-200" : "bg-red-900 text-red-200"}`}>{result.ok ? "EXECUTABLE" : "NOT VIABLE"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  {[
                    { l: "Buy total", v: `KES ${(result.lpu * result.vol).toFixed(0)}`, c: "text-zinc-100" },
                    { l: "Sell total", v: `KES ${(result.dpu * result.vol).toFixed(0)}`, c: "text-zinc-100" },
                    { l: "Transport", v: `-KES ${((result.dist || 0) * 1.9 / 100 * result.vol).toFixed(0)}`, c: "text-red-400" },
                    { l: "Net profit", v: `${result.ok ? "+" : ""}KES ${result.net}`, c: result.ok ? "text-green-400" : "text-red-400" },
                  ].map((s, i) => (
                    <div key={i} className="bg-zinc-900 p-2.5 rounded-lg">
                      <p className="text-zinc-500 mb-0.5">{s.l}</p>
                      <p className={`mono font-bold text-base ${s.c}`}>{s.v}</p>
                    </div>
                  ))}
                </div>
                {result.wx?.rain && <div className="bg-amber-950/40 border border-amber-900 rounded p-2 text-xs text-amber-300 mb-3">🌧️ Weather premium applied: +{Math.round((result.wx.prem || 0) * 100)}% to transport</div>}
                <button onClick={() => {
                  setCalcPayload({
                    com: result.com?.name, comId: result.com?.id, emoji: result.com?.emoji, unit: result.com?.unit,
                    buyMkt: result.o, buyP: result.lpu, sellMkt: result.t, sellP: result.dpu,
                    spread: result.spread, dist: result.dist, tc: 0, net: result.net / result.vol,
                    wxOrigin: result.wx, wxDest: weather[result.t?.id], action: "Execute",
                  });
                  setPage("calculator");
                }} className="btn-green w-full">Open trade calculator →</button>
              </div>
              {result.routes?.length > 0 && (
                <div className="card">
                  <p className="font-semibold text-xs mb-3">SACCO route options</p>
                  {result.routes.map((r: any, i: number) => (
                    <div key={i} className={`p-2.5 rounded-lg text-xs mb-1.5 ${r.status === "recommended" ? "bg-green-950/40 border border-green-800" : "bg-zinc-900"}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-200 font-medium">{r.name}</span>
                        {r.status === "recommended" && <span className="text-green-400 text-xs">✓ Best</span>}
                        {r.status === "traffic" && <span className="text-amber-400 text-xs">⚠ Traffic</span>}
                      </div>
                      <div className="flex gap-3 mt-1 text-zinc-500"><span>{r.dist_km} km</span><span>{r.est_time}</span><span className="mono">{r.rate}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <ArrowLeftRight size={32} className="text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm">Select commodity and markets,<br />then click Calculate margin</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Star size={14} className="text-amber-400" /><span className="font-semibold text-sm">AI market intelligence</span></div>
          <button onClick={getAI} disabled={aiLoading} className="btn-green text-xs py-1.5 px-3 flex items-center gap-1.5" style={{ opacity: aiLoading ? 0.7 : 1 }}>
            <RefreshCw size={12} className={aiLoading ? "animate-spin" : ""} />{aiLoading ? "Analyzing…" : "Generate brief"}
          </button>
        </div>
        {aiText ? <p className="text-sm text-zinc-300 leading-relaxed">{aiText}</p> : <p className="text-sm text-zinc-500 italic">Click "Generate brief" for a live AI market analysis.</p>}
      </div>
    </div>
  );
}

// ─── 3. TRADE CALCULATOR ──────────────────────────────────────────────────────
function TradeCalculator({ payload, weather, onBack }: { payload: ArbitrageOpportunity | null; weather: LiveWeather; onBack: () => void }) {
  const [kg, setKg] = useState(500);
  const [routeIdx, setRouteIdx] = useState(0);
  const [extra, setExtra] = useState(0);
  const [pkg, setPkg] = useState(2);
  const [loss, setLoss] = useState(5);

  const SACCOS = [
    { name: "A104 Direct (Rift Valley Trans)", baseRate: 2.1 },
    { name: "B3 via Naivasha (Western Exp.)", baseRate: 1.8 },
    { name: "C67 Bypass (Local SACCO)", baseRate: 1.9 },
    { name: "Easy Coach Freight", baseRate: 2.2 },
  ];

  if (!payload) return (
    <div className="p-6 flex items-center justify-center min-h-96">
      <div className="text-center">
        <Calculator size={40} className="text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-500">No trade selected. Go to Faida and click Execute.</p>
        <button onClick={onBack} className="btn-outline mt-4 text-sm">← Go to Faida</button>
      </div>
    </div>
  );

  const route = SACCOS[routeIdx];
  const wxP = payload.wxOrigin?.prem || 0;
  const dist = +(payload.dist || 50).toFixed(1);
  const tc = (dist * route.baseRate * (1 + wxP) / 1000) * kg;
  const pkgCost = pkg * kg;
  const sellable = kg * (1 - loss / 100);
  const gross = sellable * (payload.sellP || 0);
  const buyCost = kg * (payload.buyP || 0);
  const total = buyCost + tc + pkgCost + +extra;
  const net = gross - total;
  const margin = buyCost > 0 ? (net / buyCost) * 100 : 0;
  const be = total > 0 ? total / sellable : 0;

  const rows = [
    { l: "Gross revenue", v: `KES ${gross.toFixed(0)}`, note: `${sellable.toFixed(0)} kg × KES ${(payload.sellP || 0).toFixed(0)}/kg`, pos: true },
    { l: "Purchase cost", v: `-KES ${buyCost.toFixed(0)}`, note: `${kg} kg × KES ${(payload.buyP || 0).toFixed(0)}/kg`, pos: false },
    { l: "Transport (SACCO)", v: `-KES ${tc.toFixed(0)}`, note: `${dist}km · ${route.name}${wxP > 0 ? ` · +${Math.round(wxP * 100)}% rain prem.` : ""}`, pos: false, warn: wxP > 0 },
    { l: "Packaging/handling", v: `-KES ${pkgCost.toFixed(0)}`, note: `KES ${pkg}/kg`, pos: false },
    { l: "Post-harvest loss", v: `-KES ${(kg * loss / 100 * (payload.buyP || 0)).toFixed(0)}`, note: `${loss}% of volume`, pos: false },
    ...(+extra > 0 ? [{ l: "Other costs", v: `-KES ${extra}`, note: "Manual entry", pos: false }] : []),
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"><ChevronLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Calculator size={18} className="text-green-400" />Trade calculator</h1>
          <p className="text-sm text-zinc-500">{payload.emoji} {payload.com} · {payload.buyMkt?.name} → {payload.sellMkt?.name}</p>
        </div>
        <span className="ml-auto prem-badge flex items-center gap-1 py-1 px-2"><Lock size={10} />Premium</span>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-4">
          <div className="card">
            <p className="font-semibold text-sm mb-4 flex items-center gap-2"><Package size={13} className="text-green-400" />Trade parameters</p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1.5"><label className="text-xs text-zinc-500">Volume (kg)</label><span className="mono text-green-400 font-bold text-sm">{kg.toLocaleString()} kg</span></div>
                <input type="range" min={50} max={10000} step={50} value={kg} onChange={(e) => setKg(+e.target.value)} className="w-full accent-green-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1.5">SACCO route</label>
                {SACCOS.map((r, i) => (
                  <button key={i} onClick={() => setRouteIdx(i)} className={`w-full text-left text-xs p-2 rounded-lg mb-1 border transition-all ${routeIdx === i ? "border-green-700 bg-green-950/30 text-green-300" : "border-zinc-800 text-zinc-500 hover:border-zinc-600"}`}>
                    {r.name}<span className="float-right mono">KES {r.baseRate}/km</span>
                  </button>
                ))}
              </div>
              <div>
                <div className="flex justify-between mb-1.5"><label className="text-xs text-zinc-500">Post-harvest loss</label><span className="mono text-amber-400 text-sm">{loss}%</span></div>
                <input type="range" min={0} max={30} value={loss} onChange={(e) => setLoss(+e.target.value)} className="w-full accent-amber-500" />
              </div>
              <div><label className="text-xs text-zinc-500 block mb-1.5">Packaging (KES/kg)</label><input type="number" className="input" value={pkg} onChange={(e) => setPkg(+e.target.value)} /></div>
              <div><label className="text-xs text-zinc-500 block mb-1.5">Other costs (KES)</label><input type="number" className="input" placeholder="0" value={extra} onChange={(e) => setExtra(+e.target.value)} /></div>
            </div>
          </div>
          {payload.wxOrigin && (
            <div className="card border border-amber-900/50">
              <p className="font-semibold text-xs mb-2 flex items-center gap-1.5"><CloudRain size={13} className="text-amber-400" />Weather impact</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-2xl">{payload.wxOrigin.icon}</span>
                <div><p className="text-zinc-200 font-medium">{payload.wxOrigin.w}</p><p className="text-zinc-500">{payload.buyMkt?.region} · {payload.wxOrigin.tmp}°C</p></div>
              </div>
              {payload.wxOrigin.rain && <p className="text-xs text-amber-400 mt-2 bg-amber-950/30 p-2 rounded">⚠ Rain premium: +{Math.round(wxP * 100)}% added to transport</p>}
            </div>
          )}
        </div>
        <div className="col-span-2 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { l: "Net profit", v: `KES ${net.toFixed(0)}`, c: net >= 0 ? "text-green-400" : "text-red-400" },
              { l: "Margin", v: `${margin.toFixed(1)}%`, c: margin >= 15 ? "text-green-400" : margin >= 5 ? "text-amber-400" : "text-red-400" },
              { l: "Break-even", v: `KES ${be.toFixed(0)}/kg`, c: "text-zinc-200" },
              { l: "Revenue", v: `KES ${gross.toFixed(0)}`, c: "text-zinc-100" },
            ].map((s, i) => <div key={i} className="card-sm text-center"><p className="text-xs text-zinc-500 mb-1">{s.l}</p><p className={`mono font-bold text-base ${s.c}`}>{s.v}</p></div>)}
          </div>
          <div className="card">
            <p className="font-semibold text-sm mb-4">Profit & loss breakdown</p>
            {rows.map((r, i) => (
              <div key={i} className={`flex items-center justify-between py-3 border-b border-zinc-800 ${i === 0 ? "bg-zinc-900/40 -mx-5 px-5" : ""}`}>
                <div>
                  <p className={`text-sm font-medium ${i === 0 ? "text-zinc-100" : "text-zinc-300"}`}>{r.l}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{r.note}</p>
                  {(r as any).warn && <p className="text-xs text-amber-400 mt-0.5">🌧️ Weather adjusted</p>}
                </div>
                <p className={`mono font-semibold text-sm ${r.pos ? "text-green-400" : "text-red-400"}`}>{r.v}</p>
              </div>
            ))}
            <div className="flex items-center justify-between pt-4">
              <div><p className="font-bold text-base text-zinc-100">Net profit</p><p className="text-xs text-zinc-500">After all costs and losses</p></div>
              <div className="text-right">
                <p className={`mono font-bold text-2xl ${net >= 0 ? "text-green-400" : "text-red-400"}`}>{net >= 0 ? "+" : ""}{net.toFixed(0)} KES</p>
                <p className={`text-sm mono ${net >= 0 ? "text-green-500" : "text-red-500"}`}>{margin.toFixed(1)}% margin</p>
              </div>
            </div>
          </div>
          <div className={`card border ${net > 5000 ? "border-green-700" : net > 0 ? "border-amber-700" : "border-red-900"}`}>
            <p className="font-semibold text-sm mb-2">{net > 5000 ? "✅ Recommended" : net > 0 ? "⚠️ Marginal — review carefully" : "❌ Not viable at current prices"}</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {net > 5000 ? `Strong trade at ${margin.toFixed(1)}% margin. Book ${SACCOS[routeIdx].name} now to lock in current spread.` : net > 0 ? "Borderline profitable. Reduce post-harvest loss or negotiate SACCO rates." : "Spread has narrowed below logistics cost. Monitor and wait."}
            </p>
            {net > 0 && <button className="btn-green mt-3 text-sm">Confirm & book transport →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 4. AI PREDICTION ─────────────────────────────────────────────────────────
function PredictionPage({ prices, markets, commodities }: { prices: LivePrices; markets: Market[]; commodities: Commodity[] }) {
  const [selCom, setSelCom] = useState(commodities[1]?.id || "");
  const [selMkt, setSelMkt] = useState(markets[5]?.id || 0);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [serverPreds, setServerPreds] = useState<any[]>([]);
  const [trained, setTrained] = useState(false);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    if (!selCom || !selMkt) return;
    priceApi.getPriceHistory(selCom, selMkt, 60).then(setHistory).catch(console.error);
  }, [selCom, selMkt]);

  const clientPreds = useMemo(() => localForecast(history, 14), [history]);
  const preds = serverPreds.length > 0 ? serverPreds : clientPreds;

  const last30 = history.slice(-30);
  const combined = [
    ...last30,
    ...preds.map((p) => ({ date: p.date, price: null as any, predicted: p.predicted, upper: p.upper, lower: p.lower })),
  ];
  const slope = history.length > 1 ? (history[history.length - 1].price - history[0].price) / history.length : 0;

  const trainModel = async () => {
    setTraining(true);
    try {
      const data = await predApi.getForecast(selCom, selMkt);
      setServerPreds(data);
      setTrained(true);
    } catch {
      setTrained(true); // fallback to client-side
    } finally {
      setTraining(false);
    }
  };

  const com = commodities.find((c) => c.id === selCom);
  const col = `hsl(${commodities.findIndex((c) => c.id === selCom) * 36},65%,62%)`;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Brain size={18} className="text-purple-400" />AI price prediction</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Linear regression trained on 60-day history · 14-day forecast with confidence bands</p>
        </div>
        <button onClick={trainModel} disabled={training} className="btn-amber flex items-center gap-2 text-sm py-2 px-4">
          <RefreshCw size={14} className={training ? "animate-spin" : ""} />{training ? "Training…" : trained ? "Retrain" : "Train model"}
        </button>
      </div>
      <div className="flex gap-4">
        <div className="flex-1"><label className="text-xs text-zinc-500 block mb-1.5">Commodity</label>
          <select className="input" value={selCom} onChange={(e) => { setSelCom(e.target.value); setTrained(false); setServerPreds([]); }}>
            {commodities.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </div>
        <div className="flex-1"><label className="text-xs text-zinc-500 block mb-1.5">Market</label>
          <select className="input" value={selMkt} onChange={(e) => { setSelMkt(+e.target.value); setTrained(false); setServerPreds([]); }}>
            {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { l: "Training data", v: `${history.length} days` },
          { l: "Model", v: trained ? "Server ML" : "Linear regression", c: trained ? "text-purple-400" : "text-zinc-100" },
          { l: "Trend", v: slope > 0 ? "↑ Bullish" : "↓ Bearish", c: slope > 0 ? "text-green-400" : "text-red-400" },
          { l: "Source", v: trained ? "Server model" : "Client fallback", c: trained ? "text-amber-400" : "text-zinc-500" },
        ].map((s, i) => <div key={i} className="card-sm text-center"><p className="text-xs text-zinc-500 mb-1">{s.l}</p><p className={`font-bold text-sm ${(s as any).c || "text-zinc-100"}`}>{s.v}</p></div>)}
      </div>
      {combined.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full" style={{ background: col }} />
            <span className="font-semibold text-sm">{com?.emoji} {com?.name} — {markets.find((m) => m.id === selMkt)?.name} · 30d + 14d forecast</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={combined} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
              <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} /><stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} interval={7} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} width={52} />
              <Tooltip content={<CT />} />
              <Area type="monotone" dataKey="upper" fill="url(#pg)" stroke="transparent" name="Upper bound" />
              <Area type="monotone" dataKey="lower" fill="white" stroke="transparent" name="Lower bound" />
              <Line type="monotone" dataKey="price" stroke={col} strokeWidth={2} dot={false} name="Actual price" connectNulls={false} />
              <Line type="monotone" dataKey="predicted" stroke="#a855f7" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Predicted price" connectNulls={false} />
              {history.length > 0 && <ReferenceLine x={history.slice(-1)[0]?.date} stroke="#3f3f46" strokeDasharray="4 2" label={{ value: "Today", fill: "#71717a", fontSize: 10 }} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      {preds.length > 0 && (
        <div className="card">
          <p className="font-semibold text-sm mb-3">14-day forecast — {com?.emoji} {com?.name}</p>
          <table className="w-full text-xs">
            <thead><tr className="text-zinc-500 border-b border-zinc-800"><th className="text-left pb-2">Date</th><th className="text-right pb-2">Predicted</th><th className="text-right pb-2">Range</th><th className="text-right pb-2">Dir.</th></tr></thead>
            <tbody>
              {preds.map((p, i) => (
                <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                  <td className="py-2 text-zinc-400">{p.date}</td>
                  <td className="py-2 text-right mono font-semibold text-zinc-100">KES {p.predicted.toFixed(0)}</td>
                  <td className="py-2 text-right text-zinc-500 mono text-xs">{p.lower.toFixed(0)}–{p.upper.toFixed(0)}</td>
                  <td className="py-2 text-right"><span className={i > 0 && p.predicted > preds[i - 1].predicted ? "text-green-400" : "text-red-400"}>{i > 0 && p.predicted > preds[i - 1].predicted ? "↑" : "↓"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── 5. CHARTS ────────────────────────────────────────────────────────────────
function ChartsPage({ prices, markets, commodities }: { prices: LivePrices; markets: Market[]; commodities: Commodity[] }) {
  const [selCom, setSelCom] = useState(commodities[0]?.id || "");
  const [selMkt, setSelMkt] = useState(markets[0]?.id || 0);
  const [history, setHistory] = useState<PriceHistory[]>([]);

  useEffect(() => {
    if (!selCom || !selMkt) return;
    priceApi.getPriceHistory(selCom, selMkt, 60).then(setHistory).catch(console.error);
  }, [selCom, selMkt]);

  const com = commodities.find((c) => c.id === selCom);
  const avg = history.length ? +(history.reduce((s, d) => s + d.price, 0) / history.length).toFixed(2) : 0;
  const last = history[history.length - 1]?.price || 0;
  const first = history[0]?.price || 0;
  const change = first ? +((last - first) / first * 100).toFixed(2) : 0;
  const mktBars = markets.map((m) => ({ name: m.name.split(" ")[0], price: +(prices[m.id]?.[selCom]?.price || 0).toFixed(2) }));
  const col = `hsl(${commodities.findIndex((c) => c.id === selCom) * 36},65%,62%)`;

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-semibold">Price charts</h1>
      <div className="flex gap-1 flex-wrap">{commodities.map((c) => <button key={c.id} onClick={() => setSelCom(c.id)} className={`tab ${selCom === c.id ? "active" : ""}`}>{c.emoji} {c.name}</button>)}</div>
      <div className="flex gap-2 flex-wrap">{markets.map((m) => <button key={m.id} onClick={() => setSelMkt(m.id)} className={`tab ${selMkt === m.id ? "active" : ""}`}>{m.name.split(" ")[0]}</button>)}</div>
      {history.length === 0 ? <Skeleton h={20} /> : (
        <>
          <div className="grid grid-cols-4 gap-3">
            {[
              { l: `Current (${markets.find((m) => m.id === selMkt)?.name.split(" ")[0]})`, v: `KES ${(prices[selMkt]?.[selCom]?.price || 0).toFixed(2)}` },
              { l: "60-day change", v: `${change >= 0 ? "+" : ""}${change}%`, c: change >= 0 ? "text-green-400" : "text-red-400" },
              { l: "60-day high", v: `KES ${history.length ? Math.max(...history.map((d) => d.high)).toFixed(0) : 0}`, c: "text-amber-400" },
              { l: "60-day avg", v: `KES ${avg.toFixed(0)}`, c: "text-blue-400" },
            ].map((s, i) => <div key={i} className="card-sm"><p className="text-xs text-zinc-500 mb-1">{s.l}</p><p className={`mono text-lg font-bold ${(s as any).c || "text-zinc-100"}`}>{s.v}</p></div>)}
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><div className="w-3 h-3 rounded-full" style={{ background: col }} /><span className="font-semibold text-sm">{com?.emoji} {com?.name} — {markets.find((m) => m.id === selMkt)?.name} · 60-day</span></div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={history} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
                <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={col} stopOpacity={0.3} /><stop offset="95%" stopColor={col} stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} interval={9} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} width={52} />
                <Tooltip content={<CT />} />
                <ReferenceLine y={avg} stroke="#52525b" strokeDasharray="4 3" />
                <Area type="monotone" dataKey="price" stroke={col} strokeWidth={2} fill="url(#cg)" dot={false} name="Price" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <p className="font-semibold text-sm mb-4">Market comparison — {com?.name}</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={mktBars} margin={{ top: 5, right: 5, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} width={45} />
                <Tooltip content={<CT />} />
                <Bar dataKey="price" fill={col} radius={[4, 4, 0, 0]} opacity={0.85} name="Price" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

// ─── 6. CALENDAR ──────────────────────────────────────────────────────────────
function CalendarPage({ events, month, setMonth, weather, markets }: { events: MarketDayEvent[]; month: Date; setMonth: (d: Date) => void; weather: LiveWeather; markets: Market[] }) {
  const y = month.getFullYear(), mo = month.getMonth();
  const firstDay = new Date(y, mo, 1).getDay(), days = new Date(y, mo + 1, 0).getDate();
  const today = new Date();
  const [sel, setSel] = useState<number | null>(null);
  const evs = (d: number) => events.filter((e) => e.day === d);
  const upcoming = events.filter((e) => new Date(y, mo, e.day) >= today).sort((a, b) => a.day - b.day).slice(0, 5);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-semibold">Market calendar</h1>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{months[mo]} {y}</h2>
            <div className="flex gap-2">
              <button onClick={() => setMonth(new Date(y, mo - 1))} className="p-1 hover:bg-zinc-800 rounded"><ChevronLeft size={16} /></button>
              <button onClick={() => setMonth(new Date())} className="text-xs text-green-400 px-2">Today</button>
              <button onClick={() => setMonth(new Date(y, mo + 1))} className="p-1 hover:bg-zinc-800 rounded"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="text-center text-xs text-zinc-500 py-1 font-medium">{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} style={{ minHeight: 68 }} className="rounded-md bg-zinc-900/20" />)}
            {Array(days).fill(null).map((_, i) => {
              const d = i + 1; const de = evs(d);
              const isToday = today.getFullYear() === y && today.getMonth() === mo && today.getDate() === d;
              return (
                <div key={d} onClick={() => setSel(d === sel ? null : d)} style={{ minHeight: 68 }} className={`rounded-md p-1 cursor-pointer transition-all ${isToday ? "ring-1 ring-green-500 bg-green-950/20" : "hover:bg-zinc-800"} ${sel === d ? "bg-zinc-800" : ""}`}>
                  <span className={`text-xs font-medium ${isToday ? "text-green-400" : "text-zinc-300"}`}>{d}</span>
                  {de.slice(0, 2).map((e, j) => <div key={j} className="text-xs px-1 py-0.5 rounded mt-0.5 truncate" style={{ background: `${e.color}22`, color: e.color, fontSize: 10 }}>{e.emoji} {e.mkt.split(" ")[0]}</div>)}
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Upcoming market days</h3>
          {sel !== null && evs(sel).map((e, i) => (
            <div key={i} className="card-sm border border-green-800">
              <p className="font-semibold text-xs">{e.mkt}</p>
              <p className="text-xs mt-1" style={{ color: e.color }}>{e.emoji} {e.commodity} — {e.price}</p>
              <p className="text-xs text-zinc-500">Vol: {e.volume}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium mt-1.5 inline-block ${e.logistics.includes("High") ? "bg-amber-950 text-amber-400" : e.logistics.includes("Pre") ? "bg-blue-950 text-blue-400" : "bg-zinc-800 text-zinc-400"}`}>{e.logistics}</span>
            </div>
          ))}
          {upcoming.map((e, i) => (
            <div key={i} className="card-sm">
              <div className="flex justify-between mb-1"><span className="font-semibold text-xs">{e.mkt}</span><span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Day {e.day}</span></div>
              <p className="text-xs" style={{ color: e.color }}>{e.emoji} {e.commodity}</p>
              <p className="text-xs mono text-zinc-400 mt-0.5">{e.price}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium mt-1.5 inline-block ${e.logistics.includes("High") ? "bg-amber-950 text-amber-400" : "bg-zinc-800 text-zinc-400"}`}>{e.logistics}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 7. MARKETPLACE ────────────────────────────────────────────────────────────
function MarketplacePage({ bids, setBids, prices, commodities, setNotifications }: {
  bids: Bid[]; setBids: (fn: (p: Bid[]) => Bid[]) => void;
  prices: LivePrices; commodities: Commodity[];
  setNotifications: (fn: (p: Notification[]) => Notification[]) => void;
}) {
  const { user } = useAuth();
  const [myBidForm, setMyBidForm] = useState({ com: commodities[0]?.id || "", price: "", qty: "", expires: "2h", notes: "" });
  const [tab, setTab] = useState("active");
  const [posting, setPosting] = useState(false);
  const isBuyer = user?.role === "Buyer";
  const isFarmer = user?.role === "Farmer";
  const isBroker = user?.role === "Broker";

  const placeBid = async () => {
    if (!myBidForm.price || !myBidForm.qty) return;
    setPosting(true);
    try {
      const newBid = await bidApi.placeBid({
        commodity: myBidForm.com, bid_price: +myBidForm.price,
        qty: +myBidForm.qty, expires: myBidForm.expires, notes: myBidForm.notes,
      });
      setBids((p) => [newBid, ...p]);
      const c = commodities.find((x) => x.id === myBidForm.com);
      setNotifications((p) => [{ id: Date.now(), type: "bid", msg: `💰 Bid posted: ${c?.name} KES ${myBidForm.price}/${c?.unit}`, time: "just now", read: false }, ...p.slice(0, 9)]);
      setMyBidForm({ com: commodities[0]?.id || "", price: "", qty: "", expires: "2h", notes: "" });
    } catch (e: any) { console.error(e); }
    setPosting(false);
  };

  const acceptBid = async (bid: Bid) => {
    try {
      const updated = await bidApi.acceptBid(bid.id);
      setBids((p) => p.map((b) => (b.id === bid.id ? updated : b)));
      const c = commodities.find((x) => x.id === bid.commodity);
      setNotifications((p) => [{ id: Date.now(), type: "bid", msg: `✅ Accepted: ${c?.name} @ KES ${bid.bid_price}/${bid.unit} from ${bid.buyer}`, time: "just now", read: false }, ...p.slice(0, 9)]);
    } catch (e: any) { console.error(e); }
  };

  const visibleBids = bids.filter((b) => tab === "active" ? b.status === "open" : b.status === tab);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Gavel size={18} className="text-amber-400" />Marketplace</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Institutional buyer bids · Accept to sell · Real-time notifications</p>
        </div>
        {isBuyer && <span className="text-xs bg-amber-900/40 text-amber-300 border border-amber-800 px-3 py-1.5 rounded-lg font-medium">Buyer — you can place bids</span>}
        {isFarmer && <span className="text-xs bg-green-900/40 text-green-300 border border-green-800 px-3 py-1.5 rounded-lg font-medium">Farmer — accept bids to sell</span>}
        {isBroker && <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-800 px-3 py-1.5 rounded-lg font-medium">Broker — monitor and facilitate</span>}
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <div className="flex gap-1 mb-4">
            {["active","accepted","expired"].map((t) => <button key={t} onClick={() => setTab(t)} className={`tab ${tab === t ? "active" : ""}`}>{t.charAt(0).toUpperCase() + t.slice(1)} bids</button>)}
          </div>
          <div className="space-y-3">
            {visibleBids.map((b) => {
              const c = commodities.find((x) => x.id === b.commodity);
              const mktP = prices[1]?.[b.commodity]?.price || c?.hub_price || 0;
              const prem = mktP > 0 ? ((b.bid_price - mktP) / mktP * 100).toFixed(1) : "0";
              return (
                <div key={b.id} className={`card card-hover bid-pulse ${b.status === "open" ? "border-amber-900/50" : b.status === "accepted" ? "border-green-700" : "border-zinc-800"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-900/40 border border-amber-800 flex items-center justify-center text-lg">{c?.emoji}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{c?.name || b.commodity}</p>
                          {+prem > 0 && <span className="text-xs bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded">+{prem}% above market</span>}
                          {+prem < 0 && <span className="text-xs bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded">{prem}% below market</span>}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{b.buyer} · expires {b.expires}</p>
                        {b.notes && <p className="text-xs text-zinc-400 mt-0.5 italic">{b.notes}</p>}
                        {b.accepted_by && <p className="text-xs text-green-400 mt-0.5">✅ Accepted by {b.accepted_by}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="mono font-bold text-xl text-amber-400">KES {b.bid_price}/{b.unit}</p>
                      <p className="text-xs text-zinc-500">{b.qty.toLocaleString()} {b.unit}</p>
                      <p className="mono text-xs text-zinc-400">= KES {(b.bid_price * b.qty).toLocaleString()}</p>
                    </div>
                  </div>
                  {b.status === "open" && (isFarmer || isBroker) && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex gap-2">
                      <button onClick={() => acceptBid(b)} className="btn-green flex-1 text-sm py-2">✓ Accept this bid</button>
                      <button className="btn-ghost text-xs py-2 px-4">Negotiate</button>
                    </div>
                  )}
                </div>
              );
            })}
            {visibleBids.length === 0 && <div className="card text-center py-10 text-zinc-500 text-sm">No {tab} bids right now</div>}
          </div>
        </div>
        <div className="space-y-4">
          {isBuyer && (
            <div className="card">
              <p className="font-semibold text-sm mb-4 flex items-center gap-2"><Gavel size={14} className="text-amber-400" />Place new bid</p>
              <div className="space-y-3">
                <div><label className="text-xs text-zinc-500 block mb-1.5">Commodity</label>
                  <select className="input" value={myBidForm.com} onChange={(e) => setMyBidForm((p) => ({ ...p, com: e.target.value }))}>
                    {commodities.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-zinc-500 block mb-1.5">Bid price (KES/{commodities.find((c) => c.id === myBidForm.com)?.unit})</label>
                  <input type="number" className="input" placeholder="e.g. 42" value={myBidForm.price} onChange={(e) => setMyBidForm((p) => ({ ...p, price: e.target.value }))} />
                </div>
                {myBidForm.price && (
                  <div className="bg-zinc-900 p-2 rounded text-xs">
                    <span className="text-zinc-500">Market: </span>
                    <span className="mono text-zinc-300">KES {(prices[1]?.[myBidForm.com]?.price || 0).toFixed(0)}</span>
                    <span className={`ml-2 ${+myBidForm.price >= (prices[1]?.[myBidForm.com]?.price || 0) ? "text-green-400" : "text-amber-400"}`}>
                      {+myBidForm.price >= (prices[1]?.[myBidForm.com]?.price || 0) ? "↑ At/above market" : "↓ Below market"}
                    </span>
                  </div>
                )}
                <div><label className="text-xs text-zinc-500 block mb-1.5">Quantity ({commodities.find((c) => c.id === myBidForm.com)?.unit})</label>
                  <input type="number" className="input" placeholder="e.g. 10000" value={myBidForm.qty} onChange={(e) => setMyBidForm((p) => ({ ...p, qty: e.target.value }))} />
                </div>
                <div><label className="text-xs text-zinc-500 block mb-1.5">Expires in</label>
                  <select className="input" value={myBidForm.expires} onChange={(e) => setMyBidForm((p) => ({ ...p, expires: e.target.value }))}>
                    {["1h","2h","6h","12h","24h","48h"].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-zinc-500 block mb-1.5">Notes (optional)</label>
                  <input className="input" placeholder="Grade A only, delivery NRB..." value={myBidForm.notes} onChange={(e) => setMyBidForm((p) => ({ ...p, notes: e.target.value }))} />
                </div>
                <button onClick={placeBid} disabled={posting} className="btn-amber w-full">{posting ? "Posting…" : "Post bid"}</button>
              </div>
            </div>
          )}
          <div className="card">
            <p className="font-semibold text-sm mb-3">Market prices</p>
            {commodities.slice(0, 6).map((c) => {
              const p = prices[1]?.[c.id]?.price || 0;
              return <div key={c.id} className="flex justify-between py-2 border-b border-zinc-800/50 text-xs"><span className="text-zinc-400">{c.emoji} {c.name}</span><span className="mono text-zinc-200 font-semibold">KES {p.toFixed(0)}/{c.unit}</span></div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 8. DATA ENTRY (Agent only) ────────────────────────────────────────────────
function DataEntryPage({ markets, commodities, weather }: { markets: Market[]; commodities: Commodity[]; weather: LiveWeather }) {
  const { user } = useAuth();
  const [mkt, setMkt] = useState(markets[0]?.id || 0);
  const [com, setCom] = useState(commodities[0]?.id || "");
  const [price, setPrice] = useState("");
  const [grade, setGrade] = useState("A");
  const [routeId, setRouteId] = useState(0);
  const [rate, setRate] = useState("");
  const [log, setLog] = useState<{ time: string; msg: string; detail: string; ok: boolean }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const SACCOS_NAMES = ["A104 Direct (Rift Valley Trans)","B3 via Naivasha","C67 Bypass","Easy Coach","Matatu / Boda"];

  const validate = () => {
    const c = commodities.find((x) => x.id === com);
    const m = markets.find((x) => x.id === mkt);
    if (!c || !m || !price) return { ok: false, msg: "Fill all fields" };
    const dist = haversine(c.hub_lat, c.hub_lon, m.lat, m.lon);
    const expected = c.hub_price * (1 + dist * 0.035 / 100) * (m.climate === "coastal" ? 1.18 : 1);
    const dev = Math.abs(+price - expected) / expected;
    if (dev > 0.6) return { ok: false, msg: `KES ${price} is ${+price > expected ? "too high" : "too low"} for ${m.name} (expected ~KES ${expected.toFixed(0)})` };
    return { ok: true, msg: null };
  };
  const v = validate();

  const submit = async () => {
    if (!v.ok) return;
    setSubmitting(true);
    try {
      await agentApi.submitPrice({ market_id: mkt, commodity_id: com, price: +price, grade });
      const c = commodities.find((x) => x.id === com), m = markets.find((x) => x.id === mkt);
      setLog((p) => [{ time: new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }), msg: `${c?.name} logged`, detail: `${m?.name} · Grade ${grade} · KES ${price}`, ok: true }, ...p.slice(0, 9)]);
      setPrice("");
    } catch (e: any) {
      setLog((p) => [{ time: new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }), msg: "Submission failed", detail: e.message, ok: false }, ...p.slice(0, 9)]);
    }
    setSubmitting(false);
  };

  const submitRate = async () => {
    if (!rate) return;
    try {
      await agentApi.updateLogisticsRate({ sacco_name: SACCOS_NAMES[routeId], rate_per_km_mt: +rate });
      setLog((p) => [{ time: new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }), msg: "Route rate updated", detail: `${SACCOS_NAMES[routeId]} · KES ${rate}/km/MT`, ok: true }, ...p.slice(0, 9)]);
      setRate("");
    } catch (e: any) {
      console.error(e);
    }
  };

  const selC = commodities.find((x) => x.id === com), selM = markets.find((x) => x.id === mkt);
  const expectedPrice = selC && selM ? selC.hub_price * (1 + haversine(selC.hub_lat, selC.hub_lon, selM.lat, selM.lon) * 0.035 / 100) * (selM.climate === "coastal" ? 1.18 : 1) : 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">Ground truth entry</h1><p className="text-sm text-zinc-500">Authenticated agent portal</p></div>
        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-950/40 border border-green-800 px-3 py-1.5 rounded-lg"><Shield size={12} />{user?.name} · Agent</div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-5">
          <div className="card">
            <p className="font-semibold text-sm mb-4 flex items-center gap-2"><Package size={14} className="text-green-400" />New price entry</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-zinc-500 block mb-1.5">Market</label><select className="input" value={mkt} onChange={(e) => setMkt(+e.target.value)}>{markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              <div><label className="text-xs text-zinc-500 block mb-1.5">Value chain</label><select className="input" value={com} onChange={(e) => setCom(e.target.value)}>{commodities.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}</select></div>
            </div>
            <div className="mt-3 bg-zinc-900 p-2.5 rounded-lg text-xs">
              <div className="flex justify-between"><span className="text-zinc-500">Smart expected range</span><span className="mono text-zinc-300">KES {(expectedPrice * 0.7).toFixed(0)} – {(expectedPrice * 1.4).toFixed(0)}</span></div>
              <div className="flex justify-between mt-0.5"><span className="text-zinc-500">Distance from hub</span><span className="text-zinc-400">{selC && selM ? haversine(selC.hub_lat, selC.hub_lon, selM.lat, selM.lon).toFixed(0) : 0} km</span></div>
              {weather[mkt]?.rain && <div className="flex justify-between mt-0.5"><span className="text-amber-400">Rain premium active</span><span className="text-amber-400">+{Math.round((weather[mkt]?.prem || 0) * 100)}%</span></div>}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div><label className="text-xs text-zinc-500 block mb-1.5">Spot price (KES)</label><input type="number" className="input" placeholder="e.g. 45" value={price} onChange={(e) => setPrice(e.target.value)} style={{ borderColor: price && !v.ok ? "#ef4444" : "" }} /></div>
              <div><label className="text-xs text-zinc-500 block mb-1.5">Grade</label><div className="flex gap-2">{["A","B","C"].map((g) => <button key={g} onClick={() => setGrade(g)} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${grade === g ? "bg-green-900 border-green-700 text-green-300" : "border-zinc-700 text-zinc-500 hover:border-zinc-500"}`}>{g}</button>)}</div></div>
            </div>
            {price && !v.ok && <div className="mt-2 bg-red-950/40 border border-red-900 rounded p-2 text-xs text-red-300">⚠ {v.msg}</div>}
            {price && v.ok && <div className="mt-2 bg-green-950/40 border border-green-900 rounded p-2 text-xs text-green-300">✓ Price is reasonable for this market</div>}
            <button onClick={submit} disabled={!v.ok || submitting} className="btn-green w-full mt-3 flex items-center justify-center gap-2" style={{ opacity: v.ok ? 1 : 0.5 }}>
              {submitting ? "Submitting…" : <><Plus size={14} />Submit price data</>}
            </button>
          </div>
          <div className="card">
            <p className="font-semibold text-sm mb-4 flex items-center gap-2"><Truck size={14} className="text-green-400" />Logistics rate</p>
            <div className="space-y-3">
              <div><label className="text-xs text-zinc-500 block mb-1.5">SACCO / Route</label><select className="input" value={routeId} onChange={(e) => setRouteId(+e.target.value)}>{SACCOS_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}</select></div>
              <div><label className="text-xs text-zinc-500 block mb-1.5">New rate (KES/km/MT)</label><input type="number" className="input" placeholder="e.g. 2.1" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
            </div>
            <button onClick={submitRate} className="btn-outline w-full mt-4 flex items-center justify-center gap-2"><RefreshCw size={14} />Update rate</button>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4"><p className="font-semibold text-sm flex items-center gap-2"><Activity size={14} className="text-green-400" />Session activity</p><div className="flex items-center gap-1.5 text-xs text-green-400"><div className="dot-live" />Live</div></div>
          <div className="space-y-2">
            {log.length === 0 && <p className="text-xs text-zinc-600 italic">No activity yet this session</p>}
            {log.map((l, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-900/50">
                {l.ok ? <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between"><p className="text-xs font-medium text-zinc-200">{l.msg}</p><span className="mono text-xs text-zinc-600">{l.time}</span></div>
                  <p className="text-xs text-zinc-500 mt-0.5">{l.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 9. PORTAL ────────────────────────────────────────────────────────────────
function PortalPage({ prices, arbs, bids, isPremium, isEnterprise, commodities, setCalcPayload, setPage }: {
  prices: LivePrices; arbs: ArbitrageOpportunity[]; bids: Bid[]; isPremium: boolean; isEnterprise: boolean;
  commodities: Commodity[]; setCalcPayload: (p: ArbitrageOpportunity) => void; setPage: (p: string) => void;
}) {
  const { user, setUser } = useAuth();
  const isDev = user?.role === "Developer";
  const isFarmer = user?.role === "Farmer";
  const isBroker = user?.role === "Broker";
  const [tab, setTab] = useState(isDev ? "apikeys" : "overview");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(user?.api_keys || []);
  const [apiKeyName, setApiKeyName] = useState("");
  const [showKey, setShowKey] = useState<Record<number, boolean>>({});
  const [usage, setUsage] = useState<any>(null);
  const [radius, setRadius] = useState(100);
  const [subSaving, setSubSaving] = useState(false);

  useEffect(() => {
    if (isDev) {
      devApi.getKeys().then(setApiKeys).catch(console.error);
      devApi.getUsage().then(setUsage).catch(console.error);
    }
  }, [isDev]);

  const addKey = async () => {
    if (!apiKeyName) return;
    try {
      const k = await devApi.createKey(apiKeyName);
      setApiKeys((p) => [...p, k]);
      setApiKeyName("");
    } catch (e: any) { console.error(e); }
  };

  const revokeKey = async (id: number) => {
    try {
      await devApi.revokeKey(id);
      setApiKeys((p) => p.filter((k) => k.id !== id));
    } catch (e: any) { console.error(e); }
  };

  const saveSubscriptions = async (coms: string[]) => {
    setSubSaving(true);
    try { await subApi.updateSubscriptions(coms, radius); } catch (e: any) { console.error(e); }
    setSubSaving(false);
  };

  const openBids = bids.filter((b) => b.status === "open");
  const myArbs = arbs.filter((a) => !user?.subscribed_commodities?.length || user.subscribed_commodities.includes(a.comId));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-800 flex items-center justify-center text-xl font-bold text-green-200">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <h1 className="text-xl font-semibold">{user?.name}</h1>
            <p className="text-sm text-zinc-500">{user?.role} · <span style={{ color: TIER_COLORS[user?.tier || "basic"] }}>{user?.tier?.charAt(0).toUpperCase()}{user?.tier?.slice(1)}</span> · {user?.email}</p>
          </div>
        </div>
        {!isPremium && <button className="btn-amber text-sm">Upgrade to Premium →</button>}
      </div>

      <div className="flex gap-1 flex-wrap">
        {[
          { id: "overview", l: "Overview" },
          ...(isFarmer || isBroker ? [{ id: "opportunities", l: "My opportunities" }] : []),
          ...(isDev ? [{ id: "apikeys", l: "API keys" }, { id: "docs", l: "API docs" }] : []),
          { id: "settings", l: "Settings" },
        ].map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={`tab ${tab === t.id ? "active" : ""}`}>{t.l}</button>)}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[{ l: "Open bids", v: openBids.length, c: "text-amber-400" }, { l: "Live opportunities", v: myArbs.length, c: "text-green-400" }, { l: "Alert radius", v: `${radius} km`, c: "text-blue-400" }].map((s, i) => (
                <div key={i} className="card-sm text-center"><p className="text-xs text-zinc-500 mb-1">{s.l}</p><p className={`mono font-bold text-xl ${s.c}`}>{s.v}</p></div>
              ))}
            </div>
            {openBids.slice(0, 3).length > 0 && (
              <div className="card">
                <p className="font-semibold text-sm mb-3 flex items-center gap-2"><Gavel size={14} className="text-amber-400" />Active buyer bids</p>
                {openBids.slice(0, 3).map((b, i) => {
                  const c = commodities.find((x) => x.id === b.commodity);
                  return (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-zinc-800/50 text-sm">
                      <div><p className="font-medium text-zinc-200">{c?.emoji} {c?.name} — {b.buyer}</p><p className="text-xs text-zinc-500">{b.qty.toLocaleString()} {b.unit} · expires {b.expires}</p></div>
                      <div className="text-right"><p className="mono font-bold text-amber-400">KES {b.bid_price}/{b.unit}</p></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="card">
              <p className="font-semibold text-sm mb-3">My plan</p>
              <div className="p-3 rounded-xl border" style={{ borderColor: TIER_COLORS[user?.tier || "basic"] + "44", background: TIER_COLORS[user?.tier || "basic"] + "11" }}>
                <p className="font-bold" style={{ color: TIER_COLORS[user?.tier || "basic"] }}>{user?.tier?.charAt(0).toUpperCase()}{user?.tier?.slice(1)}</p>
                <p className="text-xs text-zinc-400 mt-1">{TIER_PRICES[user?.tier || "basic"]}</p>
                <div className="mt-3 space-y-1">
                  {(TIER_FEATURES[user?.tier || "basic"] || []).map((f) => (
                    <p key={f} className="text-xs text-zinc-300 flex items-center gap-1.5"><CheckCircle size={11} className="text-green-400" />{f}</p>
                  ))}
                </div>
              </div>
              {!isPremium && <button className="btn-amber w-full mt-3 text-sm">Upgrade →</button>}
            </div>
            {isDev && usage && (
              <div className="card">
                <p className="font-semibold text-sm mb-2">API status</p>
                <div className="space-y-2 text-xs">
                  {[["Requests today", usage.today?.toLocaleString()], ["Rate limit", usage.rate_limit], ["Uptime", usage.uptime], ["Avg latency", usage.latency]].map(([k, v]) => (
                    <div key={k} className="flex justify-between"><span className="text-zinc-500">{k}</span><span className="mono text-zinc-300">{v}</span></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "opportunities" && (
        <div className="space-y-4">
          <div className="card-sm flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1"><span className="text-sm font-medium">Alert radius</span><span className="mono text-green-400 font-bold">{radius} km</span></div>
              <input type="range" min={10} max={300} value={radius} onChange={(e) => setRadius(+e.target.value)} className="w-full accent-green-500" />
            </div>
          </div>
          {myArbs.length === 0 ? <p className="text-zinc-500 text-sm italic p-4">No matching opportunities. Prices update in real-time via WebSocket.</p> : myArbs.map((a, i) => (
            <div key={i} className={`card ${i === 0 ? "border-green-700" : ""}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1"><span className="text-lg">{a.emoji}</span><span className="font-semibold">{a.com}</span>{i === 0 && <span className="text-xs bg-green-800 text-green-200 px-1.5 rounded font-bold">BEST</span>}</div>
                  <p className="text-xs text-zinc-400">{a.buyMkt.name} → {a.sellMkt.name} · {a.dist} km</p>
                  {a.wxOrigin?.rain && <p className="text-xs text-amber-400 mt-0.5">🌧️ Rain: +{Math.round((a.wxOrigin?.prem || 0) * 100)}% transport</p>}
                </div>
                <div className="text-right"><p className="mono font-bold text-green-400 text-xl">+{a.spread}%</p><p className="text-xs text-zinc-500">+KES {a.net.toFixed(0)}/kg net</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                <div><p className="text-zinc-500">Buy price</p><p className="mono text-zinc-200 font-semibold">KES {a.buyP.toFixed(0)}/{a.unit}</p></div>
                <div><p className="text-zinc-500">Sell price</p><p className="mono text-zinc-200 font-semibold">KES {a.sellP.toFixed(0)}/{a.unit}</p></div>
              </div>
              <button onClick={() => { setCalcPayload(a); setPage("calculator"); }} className="btn-exec w-full mt-3 py-2 text-xs">Open trade calculator →</button>
            </div>
          ))}
        </div>
      )}

      {tab === "apikeys" && isDev && (
        <div className="space-y-5">
          <div className="card">
            <p className="font-semibold text-sm mb-4 flex items-center gap-2"><Key size={14} className="text-green-400" />API keys</p>
            <div className="space-y-3">
              {apiKeys.map((k) => (
                <div key={k.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <div className="flex items-center justify-between mb-2"><p className="font-semibold text-sm">{k.name}</p><span className="text-xs text-zinc-500">Created {k.created_at?.slice(0, 10)}</span></div>
                  <div className="flex items-center gap-2">
                    <div className="code-block flex-1 text-xs py-2 px-3">{showKey[k.id] ? (k.full_key || k.key_preview) : k.key_preview + "•".repeat(16)}</div>
                    <button onClick={() => setShowKey((p) => ({ ...p, [k.id]: !p[k.id] }))} className="p-2 hover:bg-zinc-800 rounded text-zinc-400">{showKey[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-zinc-500">
                    <span>{k.call_count.toLocaleString()} API calls</span>
                    <button onClick={() => revokeKey(k.id)} className="text-red-400 hover:text-red-300">Revoke</button>
                  </div>
                </div>
              ))}
              {apiKeys.length === 0 && <p className="text-xs text-zinc-600 italic">No keys yet. Generate one below.</p>}
            </div>
            <div className="flex gap-2 mt-4">
              <input className="input flex-1" placeholder="Key name e.g. Production" value={apiKeyName} onChange={(e) => setApiKeyName(e.target.value)} />
              <button onClick={addKey} className="btn-green flex-shrink-0">Generate key</button>
            </div>
          </div>
          {usage && (
            <div className="grid grid-cols-3 gap-3">
              {[{ l: "Requests today", v: usage.today?.toLocaleString(), c: "text-green-400" }, { l: "Rate limit", v: usage.rate_limit, c: "text-zinc-100" }, { l: "Avg latency", v: usage.latency, c: "text-blue-400" }].map((s, i) => (
                <div key={i} className="card-sm text-center"><p className="text-xs text-zinc-500 mb-1">{s.l}</p><p className={`mono font-bold text-lg ${s.c}`}>{s.v}</p></div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "docs" && isDev && (
        <div className="space-y-5">
          <div className="card">
            <p className="font-semibold text-sm mb-4 flex items-center gap-2"><Code size={14} className="text-green-400" />Developer API reference</p>
            <p className="text-xs text-zinc-400 mb-4">Base URL: <span className="mono text-green-400">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}</span> · Auth: <span className="mono text-amber-400">Authorization: Bearer &lt;token&gt;</span></p>
            {[
              { method: "GET", path: "/prices/live", desc: "Live prices across all markets and commodities (WebSocket preferred)", resp: `{"1":{"tomatoes":{"price":78.50,"pct":2.3}}}` },
              { method: "POST", path: "/arbitrage/calculate", desc: "Calculate net margin for a commodity route", body: `{"commodity_id":"maize","origin_market_id":6,"target_market_id":2,"volume_mt":15}`, resp: `{"spread":34.2,"net":240.0,"ok":true,"routes":[...]}` },
              { method: "GET", path: "/predict/forecast?commodity=maize&market=6", desc: "Server-side ML 14-day price forecast", resp: `[{"date":"May 07","predicted":34.5,"upper":38.2,"lower":30.8}]` },
              { method: "GET", path: "/markets/calendar?month=5&year=2026", desc: "Upcoming market day events", resp: `[{"day":8,"mkt":"Wangige","commodity":"Tomatoes","price":"KES 70-88/kg"}]` },
              { method: "GET", path: "/bids", desc: "Active marketplace bids from institutional buyers", resp: `[{"id":1,"buyer":"Brookside","commodity":"milk","bid_price":42,"qty":10000}]` },
              { method: "POST", path: "/bids/:id/accept", desc: "Accept a bid (Farmer/Broker only)", body: null, resp: `{"id":1,"status":"accepted","accepted_by":"Alice Kamau"}` },
            ].map((e, i) => (
              <div key={i} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded mono ${e.method === "GET" ? "bg-blue-900 text-blue-300" : "bg-green-900 text-green-300"}`}>{e.method}</span>
                  <span className="mono text-zinc-200 text-sm">{e.path}</span>
                </div>
                <p className="text-xs text-zinc-500 mb-2">{e.desc}</p>
                {e.body && <><p className="text-xs text-zinc-600 mb-1">Request:</p><div className="code-block text-xs mb-2">{e.body}</div></>}
                <p className="text-xs text-zinc-600 mb-1">Response:</p>
                <div className="code-block text-xs">{e.resp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card space-y-4">
            <p className="font-semibold text-sm">Commodity subscriptions</p>
            <div className="grid grid-cols-2 gap-1.5">
              {commodities.map((c) => {
                const subbed = user?.subscribed_commodities?.includes(c.id);
                return (
                  <button key={c.id} className={`text-xs py-1.5 px-2 rounded-lg font-medium border transition-all text-left ${subbed ? "border-green-700 bg-green-900/30 text-green-300" : "border-zinc-700 text-zinc-500 hover:border-zinc-500"}`}>
                    {c.emoji} {c.name}
                  </button>
                );
              })}
            </div>
            <div>
              <div className="flex justify-between mb-1"><span className="text-sm">Alert radius</span><span className="mono text-green-400 font-bold">{radius} km</span></div>
              <input type="range" min={10} max={300} value={radius} onChange={(e) => setRadius(+e.target.value)} className="w-full accent-green-500" />
            </div>
            <button onClick={() => saveSubscriptions(user?.subscribed_commodities || [])} disabled={subSaving} className="btn-green w-full text-sm">{subSaving ? "Saving…" : "Save preferences"}</button>
          </div>
          <div className="card space-y-4">
            <p className="font-semibold text-sm">Account details</p>
            {[{ l: "Name", v: user?.name }, { l: "Email", v: user?.email }, { l: "Phone", v: user?.phone || "+254 —" }, { l: "Location", v: user?.location || "Kenya" }, { l: "Role", v: user?.role }, { l: "Plan", v: user?.tier }].map((s, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-zinc-800/50 text-sm">
                <span className="text-zinc-500">{s.l}</span>
                <span className="text-zinc-200" style={s.l === "Plan" ? { color: TIER_COLORS[user?.tier || "basic"] } : {}}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
