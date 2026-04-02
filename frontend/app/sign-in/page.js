"use client";

import { useEffect, useState } from "react";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function redirectByRole(userId) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    let role = "student";

    if (apiBase && userId) {
      const roleRes = await fetch(`${apiBase}/api/team/role/${userId}`);
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        role = roleData?.role || "student";
      }
    }

    router.replace(role === "manager" ? "/team-dashboard" : "/dashboard");
  }

  useEffect(() => {
    if (!isUserLoaded) return;
    if (!user) return;

    redirectByRole(user.id).catch(() => {
      router.replace("/dashboard");
    });
  }, [isUserLoaded, user, router]);

  async function handleSignIn() {
    console.log("[MindFlow][SignIn] handleSignIn fired", {
      email,
      isLoaded,
      hasPassword: Boolean(password),
    });

    if (!isLoaded) {
      setError("Auth is still loading. Please wait a second and try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("[MindFlow][SignIn] calling signIn.create");
      const result = await signIn.create({
        identifier: email,
        password,
      });

      console.log("[MindFlow][SignIn] signIn.create result", {
        status: result?.status,
        createdUserId: result?.createdUserId,
      });

      if (result.status !== "complete") {
        setError("Sign in requires additional steps.");
        return;
      }

      await setActive({ session: result.createdSessionId });

      console.log("[MindFlow][SignIn] session active, redirecting by role");
      await redirectByRole(result.createdUserId);
    } catch (err) {
      console.error("[MindFlow][SignIn] sign in failed", err);
      setError(err?.errors?.[0]?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mf-auth-bg">
      <div className="mf-auth-card">
        <div className="mf-auth-logo">
          Mind<span>Flow</span>
        </div>
        <div className="mf-auth-sub">{"// welcome back"}</div>

        {error && <div className="mf-error">{error}</div>}

        <label className="mf-label">EMAIL</label>
        <input
          className="mf-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label className="mf-label">PASSWORD</label>
        <input
          className="mf-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="your password"
          onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
        />

        <button
          type="button"
          className="mf-btn"
          onClick={handleSignIn}
          disabled={loading || !email || !password}
        >
          {loading ? "signing in..." : "sign in"}
        </button>

        <div className="mf-signup-link">
          no account yet? <a href="/sign-up">sign up</a>
        </div>
      </div>
    </div>
  );
}
