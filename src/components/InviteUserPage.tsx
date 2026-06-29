import { useState, useEffect } from "react";
import { Mail, User, Phone, Shield, AlertCircle, CheckCircle, UserPlus, Eye } from "lucide-react";

interface InviteUserPageProps {
  userRole: number;
  onInviteSent?: () => void;
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

const ROLE_OPTIONS = [
  { value: 2, label: 'Admin', icon: Shield, color: '#6366F1', description: 'Can manage segments and analytics users' },
  { value: 3, label: 'Analytics', icon: Eye, color: '#10B981', description: 'View-only access to analytics and segments' },
];

export default function InviteUserPage({ userRole, onInviteSent }: InviteUserPageProps) {
  const [userEmail, setUserEmail] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<number>(3);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuper = userRole === 1;

  // Admin can only invite Analytics users
  const availableRoles = isSuper ? ROLE_OPTIONS : ROLE_OPTIONS.filter(r => r.value === 3);

  useEffect(() => {
    if (!isSuper && selectedRole === 2) {
      setSelectedRole(3);
    }
  }, [isSuper, selectedRole]);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!userEmail || !userFirstName || !userLastName || !userPhone) {
      setErrorMessage("All fields are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("skyguard-access-token");

      const response = await authFetch("/api/Authentication/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userEmail,
          userFirstName,
          userLastName,
          userPhone,
          isAdmin: selectedRole === 2,
        }),
      });

      if (!response.ok) {
        setErrorMessage(await getApiErrorMessage(response));
        return;
      }

      setSuccessMessage(`Invitation sent successfully to ${userFirstName} ${userLastName} as ${selectedRole === 2 ? 'Admin' : 'Analytics User'}!`);
      setUserEmail("");
      setUserFirstName("");
      setUserLastName("");
      setUserPhone("");
      setSelectedRole(3);
      onInviteSent?.();
    } catch (error) {
      console.error("Invite failed:", error);
      setErrorMessage("Unable to reach SkyGuard authentication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRoleConfig = ROLE_OPTIONS.find(r => r.value === selectedRole);
  const SelectedRoleIcon = selectedRoleConfig?.icon || Eye;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-slate-900/70 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/30">
            <UserPlus className="w-10 h-10 text-indigo-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-white">Invite User</h1>

        <p className="text-center text-slate-400 mt-2 mb-8">
          {isSuper
            ? 'Send an invitation to a new admin or analytics user'
            : 'Send an invitation to a new analytics user'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm text-slate-400 block mb-2">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={userFirstName}
                  onChange={(e) => setUserFirstName(e.target.value)}
                  placeholder="John"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={userLastName}
                  onChange={(e) => setUserLastName(e.target.value)}
                  placeholder="Doe"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="john@example.com"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="01535469561"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="text-sm text-slate-400 block">
              User Role
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableRoles.map((role) => {
                const RoleIcon = role.icon;
                const isSelected = selectedRole === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`flex items-center gap-3 p-4 border rounded-xl transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-indigo-500/20' : 'bg-slate-700/50'
                      }`}
                    >
                      <RoleIcon
                        className="w-5 h-5"
                        style={{ color: isSelected ? role.color : '#6B7280' }}
                      />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {role.label}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight">{role.description}</p>
                    </div>
                    {isSelected && (
                      <div className="ml-auto">
                        <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <SelectedRoleIcon className="w-4 h-4" />
            {isSubmitting ? "Sending Invitation..." : `Invite as ${selectedRoleConfig?.label}`}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-emerald-400">
          SYSTEM STATUS : ACTIVE
        </div>
      </div>
    </div>
  );
}
