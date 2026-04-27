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
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

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
    redirectByRole(user.id).catch(() => router.replace("/dashboard"));
  }, [isUserLoaded, user]);

  async function handleSignIn() {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        await redirectByRole(result.createdUserId);
        return;
      }

      // Needs email verification
      const emailFactor = result.supportedFirstFactors?.find(
        (f) => f.strategy === "email_code",
      );
      if (emailFactor) {
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailFactor.emailAddressId,
        });
        setVerifying(true);
        return;
      }

      setError("Sign in requires additional steps.");
    } catch (err) {
      setError(err?.errors?.[0]?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code,
      });
      if (result.status !== "complete") {
        setError("Verification incomplete.");
        return;
      }
      await setActive({ session: result.createdSessionId });
      await redirectByRole(result.createdUserId);
    } catch (err) {
      setError(err?.errors?.[0]?.message || "Verification failed");
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

        {!verifying ? (
          <>
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
          </>
        ) : (
          <>
            <div className="mf-auth-sub" style={{ marginBottom: "16px" }}>
              {"// check your email for the verification code"}
            </div>
            <label className="mf-label">VERIFICATION CODE</label>
            <input
              className="mf-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="enter 6-digit code"
            />
            <button
              type="button"
              className="mf-btn"
              onClick={handleVerify}
              disabled={loading || !code}
            >
              {loading ? "verifying..." : "verify"}
            </button>
          </>
        )}
        <div className="mf-signup-link">
          no account yet? <a href="/sign-up">sign up</a>
        </div>
      </div>
    </div>
  );
}
