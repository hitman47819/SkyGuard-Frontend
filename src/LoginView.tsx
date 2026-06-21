import { useState } from "react";
import { Shield, Lock, Mail, KeyRound } from "lucide-react";

interface LoginViewProps {
  onLogin: (accessToken?: string, refreshToken?: string) => void;
}

interface AuthenticationResponse {
  accessToken?: string | null;
  refreshToken?: string | null;
}

interface ProblemDetails {
  title?: string;
  detail?: string;
}

const getApiErrorMessage = async (response: Response) => {
  try {
    const result = (await response.json()) as ProblemDetails;
    return result.detail || result.title || "Authentication failed.";
  } catch {
    return "Authentication failed.";
  }
};

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [invitationToken, setInvitationToken] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/Authentication/password-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          invitationToken,
          newPassword: password,
        }),
      });

      if (!response.ok) {
        setErrorMessage(await getApiErrorMessage(response));
        return;
      }

      const result = (await response.json()) as AuthenticationResponse;

      if (!result.accessToken) {
        setErrorMessage("Authentication did not return an access token.");
        return;
      }

      onLogin(result.accessToken, result.refreshToken || undefined);
    } catch (error) {
      console.error("Password setup failed:", error);
      setErrorMessage("Unable to reach SkyGuard authentication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
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
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">
                Invitation Token
              </label>

              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />

                <input
                  type="text"
                  value={invitationToken}
                  onChange={(e) => setInvitationToken(e.target.value)}
                  placeholder="Paste invitation token"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">
                New Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Authenticating..." : "Accept Invite"}
            </button>

          </form>

          <div className="mt-6 text-center text-xs text-emerald-400">
            SYSTEM STATUS : ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
}
