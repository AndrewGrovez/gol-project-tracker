"use client"

import { useState } from "react"
import { login } from "./actions"
import { Loader2 } from "lucide-react"

interface LoginResult {
  error?: string
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = (await login(formData)) as LoginResult
      if (result?.error) {
        setError(result.error)
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09162a]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#09162a] via-[#09162a]/70 to-transparent" />
      <div
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage: "url('/7aside pitch.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-[2.5rem] border border-white/10 bg-white/5 p-2">
          <div className="flex w-full flex-col gap-10 rounded-3xl bg-[#09162a]/70 p-10 shadow-2xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-xl">
            <div>
              <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
              <p className="mt-2 text-sm text-white/70">Log in to get stuff done.</p>
            </div>

            <form action={handleSubmit} className="space-y-6">
              {error ? (
                <div className="rounded-2xl border border-rose-400/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-sm text-white placeholder:text-white/70 transition-all focus-visible:border-white/20 focus-visible:outline-none focus-visible:-translate-y-px focus-visible:ring-2 focus-visible:ring-[#81bb26]/60"
                  placeholder="you@golcentres.com"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-sm text-white placeholder:text-white/70 transition-all focus-visible:border-white/20 focus-visible:outline-none focus-visible:-translate-y-px focus-visible:ring-2 focus-visible:ring-[#81bb26]/60"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#09162a] text-sm font-semibold text-white transition-all hover:bg-[#0f223d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#81bb26]/60 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>

              <p className="text-xs text-white/60">
                Trouble logging in? <a href="mailto:andrew@golcentres.co.uk" className="text-[#81bb26] underline-offset-4 transition hover:underline">Contact support</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
