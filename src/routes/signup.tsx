import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { signup, getSession } from "~/lib/auth";
import { useState } from "react";

// Server function for signup
const signupFn = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string; name?: string }) => d)
  .handler(async ({ data }) => {
    return signup(data.email, data.password, data.name);
  });

// Server function to check existing session
const checkSession = createServerFn({ method: "GET" })
  .validator((token: string) => token)
  .handler(async ({ data: token }) => {
    return getSession(token);
  });

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  beforeLoad: async () => {
    // We'll check session on initial load. If already logged in, redirect.
    // This requires reading cookies - for now skip in loader and handle client-side
  },
});

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signupFn({ data: { email, password, name: name || undefined } });
      if (result.success && result.sessionToken) {
        // Store session token in cookie
        document.cookie = `truthwell_session=${result.sessionToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        setSuccess(true);
        // Redirect to home after brief delay
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-dvh gradient-hero flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white">Welcome to TruthWell!</h1>
          <p className="mt-4 text-white/70">Your account has been created. You're being signed in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh gradient-hero flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/95 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-950">
              <span className="text-base font-bold text-accent-300 font-serif">TW</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-brand-900">Create your account</h1>
            <p className="mt-1 text-sm text-text-secondary">Start your daily journey with Scripture</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-brand-800">
                Name <span className="text-text-muted">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-text-primary outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-800">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-text-primary outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-800">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm text-text-primary outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || password.length < 6}
              className="w-full rounded-xl gradient-accent py-3 text-sm font-bold text-brand-900 shadow-lg shadow-accent-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Free Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-text-muted">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-brand-700 hover:text-brand-800 underline">Terms</a> and{" "}
            <a href="#" className="text-brand-700 hover:text-brand-800 underline">Privacy Policy</a>.
          </p>

          <p className="mt-4 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-brand-700 hover:text-brand-800 underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}