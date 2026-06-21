import { useState } from "react";
import { Shield, Lock, Mail } from "lucide-react";

interface LoginViewProps {
  onLogin: () => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    // API Call Here
    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-8 shadow-2xl">

          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/30">
              <Shield className="w-10 h-10 text-indigo-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-white">
            SkyGuard
          </h1>

          <p className="text-center text-slate-400 mt-2 mb-8">
            Secure Command Access
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="text-sm text-slate-400 block mb-2">
                Email Address
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@skyguard.ai"
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold text-white"
            >
              Authenticate
            </button>

          </form>

          <div className="mt-6 text-center text-xs text-emerald-400">
            ● SYSTEM STATUS : ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
}
