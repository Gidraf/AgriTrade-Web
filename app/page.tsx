"use client";
import { useState } from "react";
import AgriTradeApp from "./src/App";
import { useAuth, AuthProvider } from "./src/auth";
import { LoginPage, RegisterPage } from "./src/AuthPages";

function Root() {
  const { user, loading } = useAuth();
  const [authPage, setAuthPage] = useState("login");

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🌿</div>
          <p className="text-zinc-500 text-sm">Loading AgriTrade…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return authPage === "login"
      ? <LoginPage setAuthPage={setAuthPage} />
      : <RegisterPage setAuthPage={setAuthPage} />;
  }

  return <AgriTradeApp />;
}

export default function Page() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
