import { useState } from 'react';
import type { FormEvent } from 'react';
import { Lock, Send, Phone, Mail, Globe, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ContactFormView() {
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [sector, setSector] = useState('Defense');
  const [message, setMessage] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'tunneling' | 'compressing' | 'dispatched'>('idle');
  const [transmissionID, setTransmissionID] = useState('');

  const handleTransmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !message) return;

    setSubmitState('tunneling');
    
    // Simulate high-tech multi-stage transmission routing
    setTimeout(() => {
      setSubmitState('compressing');
      setTimeout(() => {
        setSubmitState('dispatched');
        setTransmissionID('TX-' + Math.floor(100000 + Math.random() * 900000) + '-DE');
      }, 1500);
    }, 1500);
  };

  const handleReset = () => {
    setName('');
    setOrg('');
    setSector('Defense');
    setMessage('');
    setSubmitState('idle');
    setTransmissionID('');
  };

  return (
    <div className="w-full relative py-20 min-h-[90vh]">
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none"></div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16">
        {/* Header Title */}
        <header className="mb-12 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-brand-cyan/30 bg-brand-cyan/5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
            <span className="font-mono text-[9px] tracking-widest text-brand-cyan uppercase font-bold">
              Secure Communication Uplink
            </span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white">
            Protocol: Secure Inquiry
          </h1>
          <p className="font-sans text-on-surface-variant text-base sm:text-lg leading-relaxed max-w-2xl">
            Establish direct coordination with SkyGuard command for government procurement, strategic infrastructure defense, and high-level enterprise security architecture.
          </p>
        </header>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inquiry Form Card (col-span-8) */}
          <section className="lg:col-span-8 bg-brand-slate/40 border border-brand-cyan/20 p-6 sm:p-8 rounded-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-8 h-1 bg-brand-cyan"></div>
            <div className="absolute top-0 left-0 w-1 h-8 bg-brand-cyan"></div>

            {submitState === 'idle' && (
              <form onSubmit={handleTransmit} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">
                      Full Name
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Authorized Personnel"
                      className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-on-surface p-4 text-sm tracking-wide transition-all outline-none rounded-sm placeholder:opacity-30 placeholder:font-mono"
                    />
                  </div>

                  {/* Organization field */}
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">
                      Organization
                    </label>
                    <input
                      type="text"
                      value={org}
                      onChange={(e) => setOrg(e.target.value)}
                      placeholder="Agency or Entity Name"
                      className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-on-surface p-4 text-sm tracking-wide transition-all outline-none rounded-sm placeholder:opacity-30 placeholder:font-mono"
                    />
                  </div>
                </div>

                {/* Sector Classification buttons */}
                <div className="space-y-3">
                  <label className="font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">
                    Sector Classification
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Defense', 'Infrastructure', 'Commercial'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSector(opt)}
                        className={`flex items-center gap-3 p-4 border transition-all cursor-pointer rounded-sm text-left ${
                          sector === opt
                            ? 'border-brand-cyan bg-brand-cyan/5 text-brand-cyan font-bold shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]'
                            : 'border-white/10 bg-brand-slate/25 text-on-surface-variant hover:border-white/20'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                          sector === opt ? 'border-brand-cyan' : 'border-white/30'
                        }`}>
                          {sector === opt && <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan"></span>}
                        </span>
                        <span className="font-sans text-sm font-medium">{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Encrypted message textarea */}
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">
                    Encrypted Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Specify operational requirements or tactical inquiry details..."
                    className="w-full bg-brand-bg border border-white/15 focus:border-brand-cyan text-on-surface p-4 text-sm tracking-wide transition-all outline-none rounded-sm placeholder:opacity-30 placeholder:font-mono"
                  />
                </div>

                {/* Submit layout */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-on-surface-variant font-mono text-[10px] tracking-widest font-bold">
                    <Lock className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />
                    256-BIT SECURE ENCRYPTION ACTIVE
                  </div>
                  <button
                    type="submit"
                    className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-bg font-sans px-8 py-3.5 font-bold tracking-wider text-xs uppercase transition-all duration-300 flex items-center gap-2 border border-brand-cyan cursor-pointer rounded-sm w-full sm:w-auto justify-center"
                  >
                    Initialize Transmission
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* High Tech submission processing screens */}
            {submitState !== 'idle' && (
              <div className="flex flex-col items-center justify-center py-12 text-center relative z-10 space-y-6 min-h-[300px]">
                {submitState === 'tunneling' && (
                  <div className="space-y-4 max-w-md">
                    <RefreshCw className="w-12 h-12 text-brand-cyan animate-spin mx-auto" />
                    <h3 className="font-mono text-xs tracking-widest uppercase text-brand-cyan font-bold">
                      Establishing Tunnel Connection
                    </h3>
                    <div className="font-mono text-[11px] text-on-surface-variant/80 bg-brand-bg p-4 border border-brand-cyan/20 rounded-sm text-left leading-relaxed">
                      <p className="text-brand-cyan">&gt; CALLING SECURE_UP: PENDING...</p>
                      <p>&gt; SECURE ENCRYPTION WRAPPERS INJECTED... [OK]</p>
                      <p>&gt; ROTATING SECURE CERTIFICATE CHAINS...</p>
                    </div>
                  </div>
                )}

                {submitState === 'compressing' && (
                  <div className="space-y-4 max-w-md">
                    <Lock className="w-12 h-12 text-brand-cyan animate-pulse mx-auto" />
                    <h3 className="font-mono text-xs tracking-widest uppercase text-brand-cyan font-bold">
                      Compacting Encrypted Payload
                    </h3>
                    <div className="font-mono text-[11px] text-on-surface-variant/80 bg-brand-bg p-4 border border-brand-cyan/20 rounded-sm text-left leading-relaxed">
                      <p className="text-emerald-400">&gt; TUNNEL ROUTED SECURELY ON IPSec VPN [OK]</p>
                      <p className="text-brand-cyan">&gt; FRAGMENTING MASS MESSAGE DATA... [STABLE]</p>
                      <p>&gt; ENCRYPTING PACKET INTEGRITY CHECKSUMS...</p>
                    </div>
                  </div>
                )}

                {submitState === 'dispatched' && (
                  <div className="space-y-5 max-w-md animate-fade-in">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-lg text-white">
                        Transmission Dispatch Confirmed
                      </h3>
                      <p className="font-mono text-[10px] text-brand-cyan font-medium">UPLINK SUCCESSFUL // ID: {transmissionID}</p>
                    </div>
                    <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
                      Thank you, <span className="text-white font-semibold">{name}</span>. Your encrypted inquiry for the <span className="text-brand-cyan font-semibold">{sector}</span> sector has been received by SkyGuard Command. We will reply via secure channels immediately.
                    </p>
                    <button
                      onClick={handleReset}
                      className="border border-brand-cyan/40 hover:border-brand-cyan text-brand-cyan font-sans px-6 py-2 text-xs tracking-wider uppercase transition-all duration-300 hover:bg-brand-cyan/10 cursor-pointer rounded-sm"
                    >
                      New Transmission Protocol
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Secure channels sidebar (col-span-4) */}
          <aside className="lg:col-span-4 space-y-6 w-full text-left">
            <div className="bg-brand-slate/40 border border-brand-cyan/10 p-6 rounded-sm space-y-4">
              <h3 className="font-display text-white font-bold text-lg flex items-center gap-3">
                <Lock className="w-5 h-5 text-brand-cyan" />
                Secure Channels
              </h3>
              <p className="font-sans text-on-surface-variant text-xs leading-relaxed">
                Connect directly with defense liaisons using encrypted data pipelines or point-to-point voice arrays.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 bg-brand-bg/50 border border-white/5 flex items-center gap-4 group cursor-pointer hover:border-brand-cyan/30 transition-colors rounded-sm">
                  <Phone className="w-5 h-5 text-brand-cyan group-hover:scale-105 transition-transform" />
                  <div>
                    <p className="font-mono text-[9px] text-on-surface-variant tracking-wider uppercase font-bold">DIRECT_UPLINK</p>
                    <p className="font-mono text-brand-cyan font-bold text-sm">+1 (555) SKY-GUARD</p>
                  </div>
                </div>

                <div className="p-4 bg-brand-bg/50 border border-white/5 flex items-center gap-4 group cursor-pointer hover:border-brand-cyan/30 transition-colors rounded-sm">
                  <Mail className="w-5 h-5 text-brand-cyan group-hover:scale-105 transition-transform" />
                  <div>
                    <p className="font-mono text-[9px] text-on-surface-variant tracking-wider uppercase font-bold">SECURE_MAIL</p>
                    <p className="font-mono text-brand-cyan font-bold text-sm">ops@skyguard.defense</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Global operations preview */}
            <div className="relative h-64 border border-brand-cyan/20 rounded-sm overflow-hidden group">
              <div className="absolute inset-0 bg-brand-cyan/10 pointer-events-none z-10 transition-colors group-hover:bg-brand-cyan/5"></div>
              <div className="absolute inset-0 grayscale contrast-125 brightness-50 z-0">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQ8dgPf8k1QiZf9IEWIRqGDoXo4vUBDYNy-t0048uUJmFu3dIIiLb2mHm374WdvEM1P_cv2sbEuCCiQ7ffgn0t0uqYZ8f6oHQifnEDZALuEbOKYat1HWx9PhpkSTB16r8f5-yVjzbKzkluYTNpxW3sgOJ_GqVOpBunEz9EaPnoNiwLa2Qa8eekVl-gPbfmRdP_-LB3rOR2IcOi0O3CDIltAQr_tMb94XNLZ0oAklihATTzfWQZjGCkZlJRXMOWkd2FMhcAxmSornBZ"
                  alt="Global presence grid"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center p-6 space-y-2 bg-gradient-to-t from-brand-bg/90 via-brand-bg/25 to-transparent">
                <Globe className="w-8 h-8 text-brand-cyan animate-pulse" />
                <p className="font-mono text-[10px] tracking-widest text-white uppercase font-bold">
                  Global Operations Active
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Global HQ division location grid bottom */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-brand-slate/25 border-t-2 border-brand-cyan/40 rounded-sm">
            <p className="font-mono text-[9px] text-brand-cyan tracking-widest uppercase font-bold mb-1">
              NORTH AMERICA HQ
            </p>
            <h4 className="font-display font-bold text-lg text-white mb-2">Arlington, VA</h4>
            <p className="font-mono text-xs text-on-surface-variant leading-relaxed">
              1200 Defense Tech Pkwy<br />
              Level 4 Secure Zone<br />
              United States
            </p>
          </div>

          <div className="p-6 bg-brand-slate/25 border-t-2 border-white/15 hover:border-brand-cyan/40 transition-colors rounded-sm">
            <p className="font-mono text-[9px] text-on-surface-variant tracking-widest uppercase font-bold mb-1">
              EUROPE ZONE Hub
            </p>
            <h4 className="font-display font-bold text-lg text-white mb-2">Berlin, DE</h4>
            <p className="font-mono text-xs text-on-surface-variant leading-relaxed">
              Kurfürstendamm Sector 7<br />
              Intelligence Hub A-12<br />
              Germany
            </p>
          </div>

          <div className="p-6 bg-brand-slate/25 border-t-2 border-white/15 hover:border-brand-cyan/40 transition-colors rounded-sm">
            <p className="font-mono text-[9px] text-on-surface-variant tracking-widest uppercase font-bold mb-1">
              APAC DIVISION
            </p>
            <h4 className="font-display font-bold text-lg text-white mb-2">Singapore, SG</h4>
            <p className="font-mono text-xs text-on-surface-variant leading-relaxed">
              One North Gateway<br />
              Nexus Tower North<br />
              Singapore
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
