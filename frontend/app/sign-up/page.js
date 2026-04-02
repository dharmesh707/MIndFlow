"use client";

import { useEffect, useState } from "react";
import { useSignUp, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  async function redirectByRole(userId) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    let roleFromApi = "student";

    if (apiBase && userId) {
      const roleRes = await fetch(`${apiBase}/api/team/role/${userId}`);
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        roleFromApi = roleData?.role || "student";
      }
    }

    router.replace(
      roleFromApi === "manager" ? "/team-dashboard" : "/dashboard",
    );
  }

  useEffect(() => {
    if (!isUserLoaded) return;
    if (!user) return;

    redirectByRole(user.id).catch(() => {
      router.replace("/dashboard");
    });
  }, [isUserLoaded, user, router]);

  async function handleSignUp() {
    if (!isLoaded) {
      setError("Auth is still loading. Please wait a second and try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err) {
      const firstError = err?.errors?.[0];
      const isSessionExists =
        firstError?.code === "session_exists" ||
        String(firstError?.message || "")
          .toLowerCase()
          .includes("session already exists");

      if (isSessionExists && user?.id) {
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL;
          if (apiBase) {
            await fetch(`${apiBase}/api/team/set-role`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clerk_user_id: user.id,
                email: user?.primaryEmailAddress?.emailAddress || email,
                role,
              }),
            });
          }

          await redirectByRole(user.id);
          return;
        } catch {
          setError("You are already signed in. Please sign out and try again.");
          return;
        }
      }

      setError(err?.errors?.[0]?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!isLoaded) {
      setError("Auth is still loading. Please wait a second and try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status !== "complete") {
        setError("Verification is not complete yet.");
        return;
      }

      await setActive({ session: result.createdSessionId });

      const createdUserId = result.createdUserId || signUp.createdUserId;
      const apiBase = process.env.NEXT_PUBLIC_API_URL;

      if (apiBase && createdUserId) {
        const roleRes = await fetch(`${apiBase}/api/team/set-role`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerk_user_id: createdUserId,
            email,
            role,
          }),
        });

        if (!roleRes.ok) {
          const roleErr = await roleRes.text();
          throw new Error(roleErr || "Failed to save role");
        }
      }

      router.replace(role === "manager" ? "/team-dashboard" : "/dashboard");
    } catch (err) {
      setError(
        err?.errors?.[0]?.message || err?.message || "Verification failed",
      );
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
        <div className="mf-auth-sub">{"// create your account"}</div>

        {error && <div className="mf-error">{error}</div>}

        {!verifying ? (
          <>
            <label className="mf-label">I AM A</label>
            <div className="mf-role-row">
              <button
                type="button"
                className={`mf-role-btn ${role === "student" ? "active" : ""}`}
                onClick={() => setRole("student")}
              >
                <span className="mf-role-emoji">developer</span>
                student
              </button>
              <button
                type="button"
                className={`mf-role-btn ${role === "manager" ? "active" : ""}`}
                onClick={() => setRole("manager")}
              >
                <span className="mf-role-emoji">lead</span>
                manager
              </button>
            </div>

            <label className="mf-label">FIRST NAME</label>
            <input
              className="mf-input"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="your name"
            />

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
              placeholder="min 8 characters"
            />

            <button
              type="button"
              className="mf-btn"
              onClick={handleSignUp}
              disabled={loading || !email || !password || !firstName}
            >
              {loading ? "creating account..." : "create account"}
            </button>
          </>
        ) : (
          <>
            <label className="mf-label">VERIFICATION CODE</label>
            <div className="mf-auth-sub" style={{ marginBottom: "16px" }}>
              {"// check your email for the code"}
            </div>
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

        <div className="mf-signin-link">
          already have an account? <a href="/sign-in">sign in</a>
        </div>
      </div>
    </div>
  );
}
