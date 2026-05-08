"use client";
import { useState } from "react";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuth } from "./auth";
import { authApi } from "./api";

const TIER_COLORS: Record<string, string> = {
  basic: "#71717a", premium: "#f59e0b", enterprise: "#8b5cf6",
};

const TIERS = {
  basic:     { name: "Basic",      price: "Free",             features: ["Market prices", "Price charts", "Calendar"] },
  premium:   { name: "Premium",    price: "KES 1,200/mo",     features: ["All Basic", "Faida arbitrage", "AI prediction", "Weather overlay", "Trade calculator", "SMS alerts"] },
  enterprise:{ name: "Enterprise", price: "KES 8,500/mo",     features: ["All Premium", "API access", "Bulk bidding", "Priority alerts", "White-label data"] },
};

const ROLES = ["Farmer","Buyer","Broker","Agent","Developer"] as const;
const ROLE_ICONS: Record<string, string> = { Farmer:"🌱", Buyer:"🏭", Broker:"🤝", Agent:"📍", Developer:"💻" };
const ROLE_DESC: Record<string, string> = {
  Farmer:    "View prices, get sell alerts, track your commodities",
  Buyer:     "Place bids, bulk purchase, access supply data",
  Broker:    "Monitor price gaps between regions for commission",
  Agent:     "Log verified prices from physical markets",
  Developer: "API access, build on top of AgriTrade data",
};

const COMMODITIES_STATIC = [
  { id: "tomatoes", name: "Tomatoes", emoji: "🍅" },
  { id: "maize",    name: "Maize",    emoji: "🌽" },
  { id: "milk",     name: "Milk",     emoji: "🥛" },
  { id: "wheat",    name: "Wheat",    emoji: "🌾" },
  { id: "coffee",   name: "Coffee",   emoji: "☕" },
  { id: "avocado",  name: "Avocado",  emoji: "🥑" },
  { id: "potatoes", name: "Potatoes", emoji: "🥔" },
  { id: "beans",    name: "Beans",    emoji: "🫘" },
  { id: "tilapia",  name: "Tilapia",  emoji: "🐟" },
  { id: "sukuma",   name: "Sukuma",   emoji: "🥬" },
];

const DEMO_ACCOUNTS = [
  { name: "Alice Kamau",   email: "farmer@demo.ke",    password: "demo1234", role: "Farmer",    tier: "premium"     },
  { name: "James Ochieng", email: "buyer@demo.ke",     password: "demo1234", role: "Buyer",     tier: "enterprise"  },
  { name: "Mary Njeri",    email: "broker@demo.ke",    password: "demo1234", role: "Broker",    tier: "premium"     },
  { name: "Kevin Mutai",   email: "agent@demo.ke",     password: "demo1234", role: "Agent",     tier: "basic"       },
  { name: "Dev Corp",      email: "dev@demo.ke",        password: "demo1234", role: "Developer", tier: "enterprise"  },
];

// Shared CSS injected once
const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
*{box-sizing:border-box}
.auth-card{background:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px;max-width:480px;width:100%}
.input{background:#18181b;border:1px solid #3f3f46;border-radius:8px;padding:9px 12px;color:#f4f4f5;font-family:'Inter',sans-serif;font-size:13px;outline:none;width:100%;transition:border-color .15s}
.input:focus{border-color:#22c55e}
.btn-green{background:#15803d;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:background .15s;width:100%}
.btn-green:hover{background:#16a34a}
.btn-green:disabled{opacity:.5;cursor:not-allowed}
.btn-ghost{background:transparent;color:#71717a;border:1px solid #3f3f46;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;flex:1}
.btn-ghost:hover{color:#e4e4e7;border-color:#71717a}
`;

export function LoginPage({ setAuthPage }: { setAuthPage: (p: string) => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doLogin = async (e2?: string, p2?: string) => {
    setLoading(true); setError("");
    try {
      await login(e2 || email, p2 || password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4" style={{ fontFamily: "'Inter',sans-serif" }}>
      <style>{AUTH_CSS}</style>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌿</div>
          <h1 className="text-2xl font-bold text-zinc-100">AgriTrade Terminal</h1>
          <p className="text-zinc-500 text-sm mt-1">Kenya Agricultural Intelligence Platform</p>
        </div>

        <div className="auth-card space-y-4">
          <h2 className="font-semibold text-zinc-200 text-base">Sign in</h2>
          <div>
            <label className="text-xs text-zinc-500 block mb-1.5">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1.5">Password</label>
            <div className="relative">
              <input className="input" type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} style={{ paddingRight: 40 }} />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-zinc-500" type="button">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded p-2">{error}</p>}
          <button onClick={() => doLogin()} disabled={loading || !email || !password} className="btn-green">{loading ? "Signing in…" : "Sign in"}</button>
          <p className="text-center text-xs text-zinc-500">Don't have an account? <button onClick={() => setAuthPage("register")} className="text-green-400 hover:text-green-300 cursor-pointer">Register</button></p>
        </div>

        <div className="mt-6">
          <p className="text-xs text-zinc-600 text-center mb-3">Quick demo access</p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((d, i) => (
              <button key={i} onClick={() => doLogin(d.email, d.password)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all text-left w-full">
                <div className="w-7 h-7 rounded-full bg-green-800 flex items-center justify-center text-xs font-bold text-green-200 flex-shrink-0">{d.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{d.name}</p>
                  <p className="text-xs text-zinc-500">{d.role} · {d.email}</p>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: TIER_COLORS[d.tier] + "22", color: TIER_COLORS[d.tier] }}>
                  {d.tier.charAt(0).toUpperCase()}{d.tier.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage({ setAuthPage }: { setAuthPage: (p: string) => void }) {
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "",
    tier: "basic", phone: "", location: "", commodities: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const done = async () => {
    setLoading(true); setError("");
    try {
      await authApi.register({
        name: form.name, email: form.email, password: form.password,
        role: form.role, tier: form.tier, phone: form.phone,
        location: form.location, subscribed_commodities: form.commodities,
      });
      await login(form.email, form.password);
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };

  const toggle = (id: string) =>
    setForm((p) => ({ ...p, commodities: p.commodities.includes(id) ? p.commodities.filter((x) => x !== id) : [...p.commodities, id] }));

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4" style={{ fontFamily: "'Inter',sans-serif" }}>
      <style>{AUTH_CSS}</style>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div className="text-center mb-6">
          <div className="text-3xl mb-1">🌿</div>
          <h1 className="text-xl font-bold text-zinc-100">Create Account</h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="h-1.5 rounded-full transition-all" style={{ width: s <= step ? 40 : 24, background: s <= step ? "#22c55e" : "#3f3f46" }} />
            ))}
          </div>
        </div>

        <div className="auth-card">
          {error && <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded p-2 mb-4">{error}</p>}

          {/* Step 1: Role */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-zinc-200">Who are you?</h2>
              <p className="text-xs text-zinc-500">Your role determines features and notifications you receive.</p>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <button key={r} onClick={() => setForm((p) => ({ ...p, role: r }))}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left w-full"
                    style={{ borderColor: form.role === r ? "#16a34a" : "#3f3f46", background: form.role === r ? "rgba(22,163,74,.08)" : "transparent" }}>
                    <span className="text-xl">{ROLE_ICONS[r]}</span>
                    <div>
                      <p className="font-semibold text-sm text-zinc-200">{r}</p>
                      <p className="text-xs text-zinc-500">{ROLE_DESC[r]}</p>
                    </div>
                    {form.role === r && <CheckCircle size={16} className="text-green-400 ml-auto flex-shrink-0" />}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} disabled={!form.role} className="btn-green" style={{ opacity: form.role ? 1 : 0.5 }}>Continue →</button>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-zinc-200">Your details</h2>
              {[
                { l: "Full name", k: "name", t: "text", ph: "e.g. Alice Kamau" },
                { l: "Email", k: "email", t: "email", ph: "you@example.com" },
                { l: "Phone (for SMS alerts)", k: "phone", t: "tel", ph: "+254 7XX XXX XXX" },
                { l: "Location / County", k: "location", t: "text", ph: "e.g. Nakuru County" },
              ].map((f) => (
                <div key={f.k}>
                  <label className="text-xs text-zinc-500 block mb-1.5">{f.l}</label>
                  <input className="input" type={f.t} placeholder={f.ph} value={(form as any)[f.k]} onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="text-xs text-zinc-500 block mb-1.5">Password</label>
                <input className="input" type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="btn-ghost">← Back</button>
                <button onClick={() => setStep(3)} disabled={!form.name || !form.email || form.password.length < 8}
                  className="btn-green" style={{ flex: 1, opacity: form.name && form.email && form.password.length >= 8 ? 1 : 0.5 }}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3: Plan */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-zinc-200">Choose your plan</h2>
              <p className="text-xs text-zinc-500">You can upgrade anytime. Start free to explore.</p>
              {Object.entries(TIERS).map(([key, t]) => (
                <button key={key} onClick={() => setForm((p) => ({ ...p, tier: key }))}
                  className="w-full text-left p-4 rounded-xl border transition-all"
                  style={{ borderColor: form.tier === key ? "#22c55e" : "#3f3f46", background: form.tier === key ? "rgba(22,163,74,.05)" : "transparent" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold" style={{ color: TIER_COLORS[key] }}>{t.name}</span>
                    <span className="text-zinc-200 font-bold text-sm">{t.price}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.features.map((f) => <span key={f} className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">{f}</span>)}
                  </div>
                  {form.tier === key && <p className="mt-2 text-green-400 text-xs font-medium">✓ Selected</p>}
                </button>
              ))}
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="btn-ghost">← Back</button>
                <button onClick={() => setStep(4)} className="btn-green" style={{ flex: 1 }}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 4: Commodities */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-zinc-200">Subscribe to value chains</h2>
              <p className="text-xs text-zinc-500">Get alerts when prices move for your chosen commodities.</p>
              <div className="grid grid-cols-2 gap-2">
                {COMMODITIES_STATIC.map((c) => (
                  <button key={c.id} onClick={() => toggle(c.id)}
                    className="text-left px-3 py-2.5 rounded-lg border text-sm transition-all"
                    style={{
                      borderColor: form.commodities.includes(c.id) ? "#166534" : "#3f3f46",
                      background: form.commodities.includes(c.id) ? "rgba(22,101,52,.2)" : "transparent",
                      color: form.commodities.includes(c.id) ? "#86efac" : "#71717a",
                    }}>
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
              <div className="p-3 bg-zinc-900 rounded-lg text-xs text-zinc-500">
                <p className="font-semibold text-zinc-300 mb-1">Summary</p>
                <p>Role: <span className="text-zinc-200">{form.role}</span> · Plan: <span style={{ color: TIER_COLORS[form.tier] }}>{TIERS[form.tier as keyof typeof TIERS]?.name}</span></p>
                <p className="mt-0.5">Subscribed to {form.commodities.length} value chain{form.commodities.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(3)} className="btn-ghost">← Back</button>
                <button onClick={done} disabled={loading} className="btn-green" style={{ flex: 1, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Creating account…" : "Create account →"}
                </button>
              </div>
              <p className="text-center text-xs text-zinc-500">Already have an account? <button onClick={() => setAuthPage("login")} className="text-green-400 cursor-pointer">Sign in</button></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
