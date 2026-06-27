import { useState, useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface TechViewProps {
  onEnterC2: () => void;
}

export default function TechnologyView({ onEnterC2 }: TechViewProps) {
  const [radialAngle, setRadialAngle] = useState(0);
  const [currentScanningFreq, setCurrentScanningFreq] = useState(2400.0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Radar sweep angle effect
  useEffect(() => {
    const rInterval = setInterval(() => {
      setRadialAngle((prev) => (prev + 3) % 360);
      setCurrentScanningFreq((prev) => {
        const next = prev + 15.75;
        return next > 5800 ? 2400 : next;
      });
    }, 40);
    return () => clearInterval(rInterval);
  }, []);

  // Animating a gorgeous 60fps custom digital spectrograph on canvas
  useEffect(() => {
    let animationId: number;
    let offset = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear canvas with deep transparent slate
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw faint blue background grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw random noise frequency wave peaks
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#06b6d4';

      const points = canvas.width;
      for (let i = 0; i < points; i++) {
        // Base sine waves + high-frequency noise
        const frequencyComponent1 = Math.sin(i * 0.02 + offset) * 15;
        const frequencyComponent2 = Math.cos(i * 0.05 - offset * 1.5) * 8;
        const randomNoise = (Math.random() - 0.5) * 6;
        
        // Add random massive peak blocks to simulate active drone telemetry spikes
        let threatSpike = 0;
        if (i > points * 0.3 && i < points * 0.35) {
          threatSpike = Math.sin((i - points * 0.3) * 0.15) * 45;
        }
        if (i > points * 0.65 && i < points * 0.7) {
          threatSpike = Math.sin((i - points * 0.65) * 0.15) * 35;
        }

        const y = (canvas.height / 2) + frequencyComponent1 + frequencyComponent2 + randomNoise - threatSpike;
        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          ctx.lineTo(i, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Waterfall effect on bottom half
      offset += 0.05;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="w-full relative py-20 min-h-[90vh]">
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none"></div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Detailed Info left (Passive Spectrum Intelligence indicators) */}
          <div className="lg:col-span-6 space-y-6">
            <span className="font-mono text-xs text-brand-cyan tracking-widest uppercase font-bold">
              Technical Analysis
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Passive Spectrum Intelligence
            </h2>
            <p className="font-sans text-on-surface-variant text-base leading-relaxed">
              Our military-approved technology acts as a virtual web, tracking raw signal fluctuations and intercepting threats without betraying its position or coordinates.
            </p>

            <div className="space-y-6 pt-4">
              {/* Item 1 */}
              <div className="flex gap-4 group">
                <div className="w-12 h-12 flex-shrink-0 bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center font-mono text-brand-cyan font-bold rounded-sm group-hover:bg-brand-cyan/20 transition-all">
                  01
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-display text-white font-bold text-lg">RF Pattern Recognition</h4>
                  <p className="font-sans text-on-surface-variant text-sm leading-relaxed">
                    Custom modular networks analyze millions of packets per millisecond to distinguish drone transmitters from generic, heavy commercial and municipal signals.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex gap-4 group">
                <div className="w-12 h-12 flex-shrink-0 bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center font-mono text-brand-cyan font-bold rounded-sm group-hover:bg-brand-cyan/20 transition-all">
                  02
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-display text-white font-bold text-lg">Low Latency Telemetry</h4>
                  <p className="font-sans text-on-surface-variant text-sm leading-relaxed">
                    Local computing at the modular station guarantees signal processing times under 200ms, immediately dispatching alerts to tactical response assets on site.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex gap-4 group">
                <div className="w-12 h-12 flex-shrink-0 bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center font-mono text-brand-cyan font-bold rounded-sm group-hover:bg-brand-cyan/20 transition-all">
                  03
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-display text-white font-bold text-lg">Secure API Integration</h4>
                  <p className="font-sans text-on-surface-variant text-sm leading-relaxed">
                    Instantly broadcast encrypted detection telemetry to active air-defense systems and municipal security stations via standard communication protocols.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tactical High-fi Simulation Panel right */}
          <div className="lg:col-span-6 space-y-6">
            <div className="hud-border bg-brand-slate p-6 rounded-sm relative overflow-hidden group">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-brand-cyan shadow-[0_0_8px_#06b6d4]"></div>

              {/* Overlay telemetry telemetry indicators */}
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <div className="font-mono text-[9px] text-brand-cyan uppercase tracking-widest font-bold">Telemetry Sweep</div>
                  <div className="font-mono text-sm text-white font-medium">FREQUENCY: {currentScanningFreq.toFixed(2)} MHz</div>
                </div>
                <button 
                  onClick={onEnterC2}
                  className="flex items-center gap-1 font-mono text-[10px] text-brand-cyan hover:text-white uppercase font-bold tracking-wider cursor-pointer bg-transparent border-none"
                >
                  Launch C2 Live Portal
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Spectacular moving Radar sweep graphic */}
              <div className="relative aspect-video w-full bg-brand-bg rounded-sm border border-white/5 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 cyber-grid opacity-10"></div>
                <div className="absolute inset-0 scanline"></div>

                {/* Radar target sweep layout */}
                <div className="relative w-44 h-44 rounded-full border border-brand-cyan/10 flex items-center justify-center">
                  <div className="absolute w-32 h-32 rounded-full border border-brand-cyan/15 flex items-center justify-center">
                    <div className="absolute w-16 h-16 rounded-full border border-brand-cyan/20"></div>
                  </div>
                  {/* Sweep line */}
                  <div
                    className="absolute inset-0 rounded-full transition-transform ease-linear duration-100"
                    style={{ transform: `rotate(${radialAngle}deg)` }}
                  >
                    <div className="w-1/2 h-full border-r border-brand-cyan bg-gradient-to-l from-brand-cyan/10 to-transparent origin-right transform rotate-90"></div>
                  </div>
                  {/* Dot target indicator peaks inside sweep */}
                  <span className="absolute top-8 left-12 w-1.5 h-1.5 rounded-full bg-[#f43f5e] animate-ping opacity-75"></span>
                  <span className="absolute top-8 left-12 w-1.5 h-1.5 rounded-full bg-[#f43f5e]"></span>
                  
                  <span className="absolute bottom-12 right-10 w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></span>
                  <span className="absolute bottom-12 right-10 w-1.5 h-1.5 rounded-full bg-brand-cyan"></span>
                </div>

                {/* Overlays metadata indicator boxes in corners */}
                <div className="absolute top-4 left-4 p-2.5 bg-brand-bg/85 border border-brand-cyan/20 font-mono text-[9px] text-brand-cyan/90 uppercase tracking-wide leading-relaxed rounded-sm backdrop-blur-md">
                  SWEEP RANGE: 5.0KM<br />
                  AZIMUTH: 240.5°<br />
                  ELEVATION: 15.2°
                </div>

                <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#f43f5e] uppercase tracking-wider bg-brand-bg/95 px-2.5 py-1.5 border border-[#f43f5e]/30 rounded-sm font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] animate-pulse"></span>
                  Target 01 Identified
                </div>
              </div>

              {/* 60fps moving canvas spectrogram */}
              <div className="space-y-2 mt-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">
                    Waterfall analysis (2.4GHz)
                  </span>
                  <span className="font-mono text-[9px] text-brand-cyan uppercase font-bold tracking-wider">
                    Uplink Live
                  </span>
                </div>
                <div className="w-full h-24 bg-brand-bg border border-white/5 rounded-sm overflow-hidden">
                  <canvas ref={canvasRef} className="w-full h-full" width="500" height="96"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
