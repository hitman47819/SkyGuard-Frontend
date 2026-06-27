import { useState, useEffect } from 'react';
import { ArrowRight, Play, EyeOff, Search, Network, Cpu, Zap } from 'lucide-react';
import type { ActiveTab } from '../types';

interface FeaturesViewProps {
  onEnterC2: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

const HERO_SLIDES = [
  {
    id: 1,
    title: "Silent Watch, Unmatched Security.",
    description: "Next-generation passive RF technology for invisible drone detection and airspace protection. Secure your perimeter without alerting the intruder.",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLvd3AnONI11olqWZoARyiXXFAZs-itkivxEVG70foK538OEExjd8L8QNV-BngPXZbW8LqGu98eIUgFJsREuZOv1BpGokdUjqCEiXnPldNp1bdceJHysU9nGXF4wB_WbULj8QoE9nfx59BH4MbTR5nWNHUavf3ivt9sN4Dg-U_D4jYElznNwatpsn1AWfpdEthYV9ew52xTK9wKZqbrNUhd7RmlPzwS42u5IEdldP8apeZMBZe9Fwh4Z9XY",
    statusText: "System Status: Active",
    statusColor: "text-brand-accent",
    systemLog: "SWEEPING FREQUENCY BAND... OK"
  },
  {
    id: 2,
    title: "Military-Grade Passive Sensors.",
    description: "Rigid multi-aperture sensor deployment ready for extreme maritime and dry terrain zones. Advanced weather and noise filtration algorithms build accurate signal spectrum locks.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBFvXSZqIzmf1RZ-OXS0bYiLj5saCrtmU5PfB1ZUJs3fx49sKu79sl02n5j1RU3AaGm3g3w9INi8WSPymRt6EgDFoJWfIYHu2khaULVKFsbt-IrE-dpQQtmPEZnc5ltyCddWozcNZLv_DnRAEg7PTr-uYsbSzhTODeys9mkb9akR_TTc4S4zRpi5nhI6nygU5tvBzZO-PMbTju1kjNZdfop94_PkiZH3OCMGGyOrQXsfsPDrv1YNvzkvi2J1KDCL18DM1PwfpX4-zam",
    statusText: "Sensors Online: Optimal",
    statusColor: "text-emerald-400",
    systemLog: "ANTENNA MATRIX TUNED AT 12.4 GHZ"
  },
  {
    id: 3,
    title: "Global Airspace Triangulation.",
    description: "Instant pinpointing of drone flight paths and operator ground spots through advanced distributed multi-sensor arrays and coordinate translation protocols.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDE8laKqd9QmGZZfPRef7ggIZFeEcVNipe3OsO_GIiIOih-0I4Empw31AWAJQatybxJlQMeF5C_-eEpNkXabbZk_HEKf5tW0P8zJ6d64XMtK4UhQKotlZh-_ybmlvcHdcBKxWkofUyYH2k4hMBGRsOTB1zAC4gQMfsyQpPUskYiTRvAeW2LPQT5_A6KGngGqpxXbCXglZH7jpX4BxoMRK13WC3l9HxuyIPJz4Vy1QoYBa96tYCeIVEfNS7E7gtzwOPmJ5aQyFzn6IQ",
    statusText: "UPLINK LEVEL: SECURED",
    statusColor: "text-[#4cd7f6]",
    systemLog: "CILS GROUND STATION TR-41 CONNECTED"
  }
];

export default function FeaturesView({ onEnterC2, setActiveTab }: FeaturesViewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full relative">
      {/* 1. Cinematic Hero Slider Section */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0 bg-brand-bg">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                idx === currentSlide ? 'opacity-50 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={slide.img}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
              />
            </div>
          ))}
          {/* High-tech overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/30 to-brand-bg/60 z-20"></div>
          <div className="absolute inset-0 cyber-grid opacity-20 z-20"></div>
          <div className="absolute inset-0 scanline z-20"></div>
        </div>

        {/* Hero Slider Interface Structure */}
        <div className="relative z-30 max-w-[1440px] mx-auto px-6 lg:px-12 w-full mt-8">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-6">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 hud-border bg-brand-cyan/5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_#4cd7f6]"></span>
                <span className="font-mono text-[10px] tracking-widest text-brand-cyan uppercase font-bold">
                  {HERO_SLIDES[currentSlide].statusText}
                </span>
              </div>

              {/* Slider Title with Motion Highlights */}
              <h1 className="font-display font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] transition-all duration-500">
                {HERO_SLIDES[currentSlide].title.split(', ')[0]} <br />
                <span className="text-brand-cyan">
                  {HERO_SLIDES[currentSlide].title.split(', ')[1]}
                </span>
              </h1>

              {/* Slider Description */}
              <p className="font-sans text-on-surface-variant text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed">
                {HERO_SLIDES[currentSlide].description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4 z-40 relative">
                <button
                  onClick={onEnterC2}
                  className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-bg font-sans px-8 py-3.5 font-bold tracking-wider text-xs lg:text-sm uppercase transition-all duration-300 hover:brightness-110 flex items-center gap-2 border border-brand-cyan cursor-pointer rounded-sm"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('technology')}
                  className="border border-brand-cyan/40 hover:border-brand-cyan text-brand-cyan font-sans px-8 py-3.5 font-bold tracking-wider text-xs lg:text-sm uppercase transition-all duration-300 hover:bg-brand-cyan/10 flex items-center gap-2 cursor-pointer rounded-sm"
                >
                  <Play className="w-4 h-4 fill-brand-cyan/20" />
                  Technical Analysis
                </button>
              </div>
            </div>

            {/* Slider HUD Overlays (Absolute Right side elements) */}
            <div className="lg:col-span-4 hidden lg:block space-y-4">
              <div className="hud-border bg-brand-slate/40 p-5 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.05)] rounded-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-mono text-[10px] text-brand-cyan uppercase tracking-wider font-bold">Signal Accuracy</span>
                  <span className="font-mono text-xs text-brand-cyan font-bold">98.2%</span>
                </div>
                <div className="w-full bg-brand-slate-light/50 h-1 rounded-full overflow-hidden">
                  <div className="bg-brand-cyan h-full transition-all duration-1000" style={{ width: '98.2%' }}></div>
                </div>
              </div>

              <div className="hud-border bg-brand-slate/40 p-5 backdrop-blur-sm font-mono text-[10px] text-on-surface-variant/90 space-y-1.5 rounded-sm">
                <p className="text-brand-cyan/70 font-semibold">&gt; INITIATING SPECTRUM SWEEP...</p>
                <p>&gt; FREQUENCY RANGE: 2.4GHz - 5.8GHz</p>
                <p>&gt; ACTIVE CHANNELS SECURED: 16</p>
                <p className="text-emerald-400 font-semibold">&gt; {HERO_SLIDES[currentSlide].systemLog}</p>
                <p className="text-brand-cyan/60 animate-pulse">&gt; SYS_DAEMON_OK :: ACQUISITION MODULES READY</p>
              </div>
            </div>
          </div>

          {/* Slider Indicators Bottom */}
          <div className="flex gap-2 mt-12 items-center justify-start">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  idx === currentSlide
                    ? 'w-10 bg-brand-cyan'
                    : 'w-4 bg-brand-slate-light hover:bg-brand-cyan/45'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Key Capabilities Section */}
      <section className="py-20 bg-brand-slate/40 border-y border-white/5 relative">
        <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div className="max-w-2xl space-y-2">
              <span className="font-mono text-xs text-brand-cyan tracking-widest uppercase font-bold">Core Capabilities</span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Passive Perimeter Architecture
              </h2>
              <p className="font-sans text-on-surface-variant text-sm sm:text-base leading-relaxed">
                Utilizing state-of-the-art passive radio frequency surveillance to identify and isolate multi-band signals before physical breaches occur.
              </p>
            </div>
            <div className="font-mono text-brand-cyan/60 text-xs font-bold tracking-widest uppercase">
              SPECIFICATION // V2.4
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Class Card 1 */}
            <div className="group border border-white/5 bg-brand-slate/30 hover:bg-brand-slate/60 hover:border-brand-cyan/30 transition-all duration-300 p-8 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-0 bg-brand-cyan group-hover:h-full transition-all duration-500"></div>
              <div className="bg-brand-cyan/10 text-brand-cyan w-12 h-12 flex items-center justify-center rounded-sm mb-6 border border-brand-cyan/20">
                <EyeOff className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-white mb-3 uppercase tracking-tight">
                Zero Emission Detection
              </h3>
              <p className="font-sans text-on-surface-variant text-sm leading-relaxed">
                Our technology operates entirely without transmissions. It is 100% invisible to electronic detectors, jammers, and missile telemetry intercept networks.
              </p>
            </div>

            {/* Class Card 2 */}
            <div className="group border border-white/5 bg-brand-slate/30 hover:bg-brand-slate/60 hover:border-brand-cyan/30 transition-all duration-300 p-8 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-0 bg-brand-cyan group-hover:h-full transition-all duration-500"></div>
              <div className="bg-brand-cyan/10 text-brand-cyan w-12 h-12 flex items-center justify-center rounded-sm mb-6 border border-brand-cyan/20">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-white mb-3 uppercase tracking-tight">
                Real-Time Tracking
              </h3>
              <p className="font-sans text-on-surface-variant text-sm leading-relaxed">
                High-speed microprocessors compute arrival time difference estimates in real-time, instantly resolving drone velocities and pilot positions on coordinates.
              </p>
            </div>

            {/* Class Card 3 */}
            <div className="group border border-white/5 bg-brand-slate/30 hover:bg-brand-slate/60 hover:border-brand-cyan/30 transition-all duration-300 p-8 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-0 bg-brand-cyan group-hover:h-full transition-all duration-500"></div>
              <div className="bg-brand-cyan/10 text-brand-cyan w-12 h-12 flex items-center justify-center rounded-sm mb-6 border border-brand-cyan/20">
                <Network className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-white mb-3 uppercase tracking-tight">
                Scalable Network Grid
              </h3>
              <p className="font-sans text-on-surface-variant text-sm leading-relaxed">
                Distribute standard tactical sensor cases across military facilities or critical municipality networks. Synchronous operation ensures blanket protection nodes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sensor Fusion / Multi-Modal Section */}
      <section className="py-20 relative">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Visualization Block left */}
            <div className="lg:col-span-6 relative">
              <div className="hud-border bg-brand-slate/40 p-2.5 rounded-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-brand-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuByX_naWgBrH7Sfg3-BPzwsJxGcqxWedpbHcpbe1cr4wduEhbmVcZj9Ud3ThntDSnMW5F3JfDsj7Hud_NSeZnD-GdHWveJZV45KuHfsOff7JyTcb_Dzcn7Zy2WSZoHUF71xBqDgWqG96LfcGBxJN5Cmh8Zguthb4Cp9whvWyv-aBaODzPWUAYhtDlGrZH0PuE0gq96ytEne5rXj6MaySvzxihveYK9Qjh68a9hliHz9WVlc1CnpnpLw1936TlmafEfG3VFJiXAjVwV2"
                  alt="Computer Vision and STFT Analysis"
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 scanline"></div>
                <div className="absolute top-6 left-6 bg-brand-bg/90 border border-brand-cyan/30 px-3 py-1 font-mono text-[9px] text-brand-cyan uppercase tracking-wider rounded-sm backdrop-blur-md">
                  ANALYSIS_STREAM: MULTI-MODAL_V4
                </div>
              </div>
            </div>

            {/* Information Block right */}
            <div className="lg:col-span-6 space-y-6">
              <span className="font-mono text-xs text-brand-cyan tracking-widest uppercase font-bold">Sensor Fusion</span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Multi-Modal Detection Matrix
              </h2>
              <p className="font-sans text-on-surface-variant text-base leading-relaxed">
                Beyond basic amplitude readings, SkyGuard features dual-layered verification architecture configured to eliminate false errors and secure targets with absolute authority.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-5 border border-white/5 bg-brand-slate/20 rounded-sm hover:border-brand-cyan/20 transition-all">
                  <h4 className="font-display text-white font-bold text-base flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-brand-cyan" />
                    STFT Signal Analysis
                  </h4>
                  <p className="font-sans text-on-surface-variant text-xs leading-normal">
                    Short-Time Fourier Transform technology dissects raw radio frequency noise down to microsecond intervals to capture frequency hopping patterns matching modern drone links.
                  </p>
                </div>

                <div className="p-5 border border-white/5 bg-brand-slate/20 rounded-sm hover:border-brand-cyan/20 transition-all">
                  <h4 className="font-display text-white font-bold text-base flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-brand-cyan" />
                    Computer Vision Confirmation
                  </h4>
                  <p className="font-sans text-on-surface-variant text-xs leading-normal">
                    AI-driven visual tracking targets telemetry coordinate feeds, automatically slewing ultra-high speed optical and thermal imagery for immediate threat confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Stats Counter Section */}
      <section className="py-16 bg-brand-slate/20 border-y border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-1">
              <div className="font-display text-4xl sm:text-5xl font-extrabold text-white">500+</div>
              <div className="font-mono text-brand-cyan/80 text-[10px] tracking-widest uppercase font-bold">
                Deployments Globally
              </div>
            </div>
            <div className="text-center space-y-1">
              <div className="font-display text-4xl sm:text-5xl font-extrabold text-brand-cyan">0.2s</div>
              <div className="font-mono text-on-surface-variant text-[10px] tracking-widest uppercase font-bold">
                Detection Latency
              </div>
            </div>
            <div className="text-center space-y-1">
              <div className="font-display text-4xl sm:text-5xl font-extrabold text-white">99.8%</div>
              <div className="font-mono text-brand-cyan/80 text-[10px] tracking-widest uppercase font-bold">
                Signal Accuracy
              </div>
            </div>
            <div className="text-center space-y-1">
              <div className="font-display text-4xl sm:text-5xl font-extrabold text-brand-cyan">24/7</div>
              <div className="font-mono text-on-surface-variant text-[10px] tracking-widest uppercase font-bold">
                Autonomous Vigilance
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
