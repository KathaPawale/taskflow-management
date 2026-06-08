"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { token, isLoading, initAuth, setAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && token) {
      router.replace("/dashboard");
    }
  }, [token, isLoading, router]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Exchange access token for user info then our JWT
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();

        // We need an ID token - use the implicit flow instead
        // The access_token flow requires a different backend endpoint
        toast.loading("Signing you in...", { id: "login" });

        // Call backend with access token (backend verifies via Google userinfo)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google-access`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        const data = await res.json();

        if (data.token) {
          setAuth(data.user, data.token);
          toast.success("Welcome to TaskFlow!", { id: "login" });
          router.push("/dashboard");
        } else {
          toast.error(data.error || "Login failed", { id: "login" });
        }
      } catch (err) {
        toast.error("Login failed. Please try again.", { id: "login" });
      }
    },
    onError: () => toast.error("Google login failed"),
    flow: "implicit",
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-5">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="3" y="3" width="10" height="10" rx="2" fill="#6366f1" />
              <rect x="15" y="3" width="10" height="10" rx="2" fill="#6366f1" opacity="0.5" />
              <rect x="3" y="15" width="10" height="10" rx="2" fill="#6366f1" opacity="0.5" />
              <rect x="15" y="15" width="10" height="10" rx="2" fill="#6366f1" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">TaskFlow</h1>
          <p className="text-zinc-400 text-sm">Collaborative task management for modern teams</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-white mb-1">Sign in to continue</h2>
          <p className="text-zinc-500 text-sm mb-8">Use your Google account to get started</p>

          <button
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-medium text-sm transition-all duration-150 active:scale-[0.98] shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path
                d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.78h5.4a4.6 4.6 0 01-2 3.03v2.5h3.23c1.9-1.74 2.97-4.31 2.97-7.31z"
                fill="#4285F4"
              />
              <path
                d="M10 20c2.7 0 4.97-.9 6.63-2.43l-3.23-2.5c-.9.6-2.04.96-3.4.96-2.6 0-4.82-1.76-5.6-4.13H1.05v2.58A10 10 0 0010 20z"
                fill="#34A853"
              />
              <path
                d="M4.4 11.9A6.02 6.02 0 014.18 10c0-.66.11-1.3.22-1.9V5.52H1.05A10 10 0 000 10c0 1.61.38 3.14 1.05 4.48L4.4 11.9z"
                fill="#FBBC05"
              />
              <path
                d="M10 3.97c1.47 0 2.8.5 3.84 1.5l2.87-2.87C14.96.9 12.7 0 10 0A10 10 0 001.05 5.52L4.4 8.1C5.18 5.73 7.4 3.97 10 3.97z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-xs">secure login</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {["Assign Tasks", "Email Alerts", "Collaborate"].map((feature) => (
              <div key={feature} className="text-center p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <p className="text-zinc-400 text-xs font-medium">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
