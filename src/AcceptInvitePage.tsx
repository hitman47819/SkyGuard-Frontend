import { useState } from "react";
import { Shield, Lock, Mail, Eye, EyeOff } from "lucide-react";

interface AcceptInvitePageProps {
  onSuccess: (accessToken?: string, refreshToken?: string) => void;
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
    return result.detail || result.title || "Request failed.";
  } catch {
    return "Request failed.";
  }
};

const getInvitationTokenFromUrl = () => {
  const hash = window.location.hash; // مثلا "#/accept-invite?token=xxxx"
  const queryString = hash.split("?")[1]; // ناخد الجزء بعد علامة الاستفهام
  if (!queryString) return "";
  const params = new URLSearchParams(queryString);
  return params.get("token") || "";
};


// ✅ دالة للتحقق من قوة الباسورد
const validatePassword = (password: string): string | null => {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  if (!/[!@#$%^&*]/.test(password)) return "Password must contain at least one special character (!@#$%^&*).";
  return null;
};

export default function AcceptInvitePage({ onSuccess }: AcceptInvitePageProps) {
  const [email, setEmail] = useState("");
  const [invitationToken] = useState(() => getInvitationTokenFromUrl()); // ✅ مش هيظهر في الفورم
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setErrorMessage("");

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

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

      const result = (await response.json()) as any;

      if (!result?.data?.accessToken) {
        setErrorMessage("Authentication did not return an access token.");
        return;
      }

      onSuccess(result.data.accessToken, result.data.refreshToken || undefined);
    } catch (error) {
      console.error("Accept invite failed:", error);
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
            Accept Invite
          </h1>

          <p className="text-center text-slate-400 mt-2 mb-8">
            Complete your account setup
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
                  placeholder="your@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* ✅ Token field اتشال */}

            <div>
              <label className="text-sm text-slate-400 block mb-2">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  required
                  className="w-full pl-11 pr-11 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">
                Confirm Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  className="w-full pl-11 pr-11 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-400"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
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
              {isSubmitting ? "Setting up..." : "Accept Invite & Create Account"}
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