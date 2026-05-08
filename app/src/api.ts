// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "Farmer" | "Buyer" | "Broker" | "Agent" | "Developer";
  tier: "basic" | "premium" | "enterprise";
  location?: string;
  subscribed_commodities?: string[];
  api_keys?: ApiKey[];
}

export interface ApiKey {
  id: number;
  name: string;
  key_preview: string;
  full_key?: string;
  created_at: string;
  call_count: number;
}

export interface Market {
  id: number;
  name: string;
  region: string;
  lat: number;
  lon: number;
  climate: string;
}

export interface Commodity {
  id: string;
  name: string;
  unit: string;
  emoji: string;
  hub_lat: number;
  hub_lon: number;
  hub_price: number;
  volatility: number;
  max_multiplier: number;
}

export interface PriceTick {
  price: number;
  prev: number;
  change: number;
  pct: number;
  grade?: string;
  updated_at?: string;
}

export interface LivePrices {
  [marketId: number]: {
    [commodityId: string]: PriceTick;
  };
}

export interface WeatherCondition {
  w: string;
  icon: string;
  tmp: number;
  rain: boolean;
  prem: number;
}

export interface LiveWeather {
  [marketId: number]: WeatherCondition;
}

export interface ArbitrageOpportunity {
  com: string;
  comId: string;
  emoji: string;
  unit: string;
  buyMkt: Market;
  buyP: number;
  sellMkt: Market;
  sellP: number;
  spread: number;
  dist: number;
  tc: number;
  net: number;
  wxOrigin?: WeatherCondition;
  wxDest?: WeatherCondition;
  action: string;
}

export interface MarketDayEvent {
  day: number;
  mkt: string;
  mktId: number;
  commodity: string;
  emoji: string;
  unit: string;
  color: string;
  price: string;
  volume: string;
  logistics: string;
}

export interface Bid {
  id: number;
  buyer: string;
  buyer_id?: number;
  commodity: string;
  unit: string;
  bid_price: number;
  qty: number;
  expires: string;
  status: "open" | "accepted" | "expired";
  notes?: string;
  accepted_by?: string;
  created_at: string;
}

export interface PriceHistory {
  date: string;
  price: number;
  high: number;
  low: number;
}

export interface Notification {
  id: number;
  type: string;
  msg: string;
  time: string;
  read: boolean;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── API Client ───────────────────────────────────────────────────────────────
const BASE = "https://api.agritrade.gidraf.dev/api";
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("agritrade_token");
}

async function req<T>(
  path: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: {
    name: string; email: string; password: string;
    role: string; tier: string; phone?: string;
    location?: string; subscribed_commodities?: string[];
  }) => req<AuthTokens>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    req<AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => req<User>("/auth/me", {}, true),

  logout: () => {
    if (typeof window !== "undefined") localStorage.removeItem("agritrade_token");
  },
};

// ─── Markets & Commodities ────────────────────────────────────────────────────
export const marketApi = {
  getMarkets: () => req<Market[]>("/markets"),
  getCommodities: () => req<Commodity[]>("/commodities"),
  getCalendar: (month: number, year: number) =>
    req<MarketDayEvent[]>(`/calendar?month=${month}&year=${year}`),
};

// ─── Live Prices (SSE/WebSocket fallback) ─────────────────────────────────────
export const priceApi = {
  getLivePrices: () => req<LivePrices>("/prices/live"),
  getPriceHistory: (commodityId: string, marketId: number, days = 60) =>
    req<PriceHistory[]>(`/prices/history?commodity=${commodityId}&market=${marketId}&days=${days}`),
  getLiveWeather: () => req<LiveWeather>("/weather/live"),
};

// ─── Arbitrage ────────────────────────────────────────────────────────────────
export const arbApi = {
  getOpportunities: () => req<ArbitrageOpportunity[]>("/arbitrage/opportunities", {}, true),
  calcMargin: (data: {
    commodity_id: string; origin_market_id: number;
    target_market_id: number; volume_mt: number;
  }) => req<{
    spread: number; net: number; routes: any[]; ok: boolean;
    lpu: number; dpu: number; dist: number;
  }>("/arbitrage/calculate", { method: "POST", body: JSON.stringify(data) }, true),
};

// ─── Predictions ──────────────────────────────────────────────────────────────
export const predApi = {
  getForecast: (commodityId: string, marketId: number) =>
    req<{ date: string; predicted: number; upper: number; lower: number }[]>(
      `/predict/forecast?commodity=${commodityId}&market=${marketId}`, {}, true
    ),
};

// ─── Bids / Marketplace ───────────────────────────────────────────────────────
export const bidApi = {
  getBids: () => req<Bid[]>("/bids"),
  placeBid: (data: {
    commodity: string; bid_price: number; qty: number; expires: string; notes?: string;
  }) => req<Bid>("/bids", { method: "POST", body: JSON.stringify(data) }, true),
  acceptBid: (bidId: number) =>
    req<Bid>(`/bids/${bidId}/accept`, { method: "POST" }, true),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifApi = {
  getNotifications: () => req<Notification[]>("/notifications", {}, true),
  markRead: (id: number) =>
    req<void>(`/notifications/${id}/read`, { method: "POST" }, true),
  markAllRead: () =>
    req<void>("/notifications/read-all", { method: "POST" }, true),
};

// ─── Data Entry (Agent) ────────────────────────────────────────────────────────
export const agentApi = {
  submitPrice: (data: {
    market_id: number; commodity_id: string; price: number; grade: string;
  }) => req<{ id: number }>("/agent/prices", { method: "POST", body: JSON.stringify(data) }, true),

  updateLogisticsRate: (data: {
    sacco_name: string; rate_per_km_mt: number;
  }) => req<{ id: number }>("/agent/logistics", { method: "POST", body: JSON.stringify(data) }, true),
};

// ─── Developer / API Keys ─────────────────────────────────────────────────────
export const devApi = {
  getKeys: () => req<ApiKey[]>("/dev/keys", {}, true),
  createKey: (name: string) =>
    req<ApiKey>("/dev/keys", { method: "POST", body: JSON.stringify({ name }) }, true),
  revokeKey: (id: number) =>
    req<void>(`/dev/keys/${id}`, { method: "DELETE" }, true),
  getUsage: () => req<{ today: number; rate_limit: string; uptime: string; latency: string }>(
    "/dev/usage", {}, true
  ),
};

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subApi = {
  updateSubscriptions: (commodities: string[], radius_km: number) =>
    req<void>("/user/subscriptions", {
      method: "PUT",
      body: JSON.stringify({ commodities, radius_km }),
    }, true),
};
