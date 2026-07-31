import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-dvh bg-white">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-950">
              <span className="text-sm font-bold text-accent-300 font-serif">TW</span>
            </div>
            <span className="text-xl font-bold text-brand-800">TruthWell</span>
          </a>
          <a href="/" className="text-sm font-medium text-text-secondary hover:text-brand-700 transition-colors">
            ← Back to Home
          </a>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-text-secondary">
            Start free. Upgrade when you're ready to go deeper.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-8 lg:grid-cols-2">
          {/* Free Tier */}
          <div className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-brand-800">Free</h3>
              <p className="mt-1 text-sm text-text-secondary">For daily readers who want a simple start</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-brand-900">$0</span>
              <span className="text-sm text-text-muted">/month</span>
            </div>
            <ul className="mb-8 space-y-3">
              {[
                "Daily verse with reflection prompt",
                "Browse limited themes",
                "Ad-free experience",
                "Shareable verse cards",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">{feature}</span>
                </li>
              ))}
              {["All 15 theme collections", "Audio readings", "Personal journal", "Offline access"].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-gray-300">
                  <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <a href="/signup" className="block w-full rounded-xl border-2 border-brand-200 py-3 text-center text-sm font-semibold text-brand-700 transition-all hover:border-brand-300 hover:bg-brand-50">
              Get Started Free
            </a>
          </div>

          {/* Premium */}
          <div className="relative rounded-2xl border-2 border-accent-400 bg-white p-8 shadow-xl shadow-accent-200/50">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex rounded-full gradient-accent px-4 py-1 text-xs font-bold uppercase tracking-wider text-brand-900">
                Most Popular
              </span>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-brand-800">Premium</h3>
              <p className="mt-1 text-sm text-text-secondary">For those ready to go deeper in Scripture</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-brand-900">$4.99</span>
              <span className="text-sm text-text-muted">/month</span>
              <p className="mt-1 text-sm text-text-muted">
                or <span className="font-semibold text-brand-700">$49/year</span> (save 18%)
              </p>
            </div>
            <ul className="mb-8 space-y-3">
              {[
                "Daily verse + devotional",
                "All 15 theme collections (80+ verses)",
                "Audio readings",
                "Personal verse journal",
                "Offline access",
                "Weekly emailed devotionals",
                "Shareable verse cards",
                "Ad-free experience",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-secondary">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-3">
              <a
                href="https://buy.stripe.com/6oU9ASdQh2Bw9LO1vR8EM0i"
                className="block w-full rounded-xl gradient-accent py-3 text-center text-sm font-bold text-brand-900 shadow-lg shadow-accent-300/50 transition-all hover:scale-[1.02] hover:shadow-xl"
              >
                Subscribe Monthly — $4.99/mo
              </a>
              <a
                href="https://buy.stripe.com/cNicN43bDcc63nq3DZ8EM0j"
                className="block w-full rounded-xl border-2 border-accent-300 bg-white py-3 text-center text-sm font-semibold text-brand-800 transition-all hover:border-accent-400 hover:bg-accent-50"
              >
                Subscribe Annually — $49/yr (save 18%)
              </a>
            </div>
            <p className="mt-3 text-center text-xs text-text-muted">Cancel anytime. No questions asked.</p>
          </div>
        </div>
      </div>
    </div>
  );
}