import type { CSSProperties } from "react";

type AmbientLightsProps = {
  tone?: "default" | "indigo";
};

type AmbientVars = CSSProperties & {
  "--ambient-drift-x": string;
  "--ambient-drift-y": string;
  "--ambient-pulse-duration": string;
  "--ambient-drift-duration": string;
  "--ambient-delay": string;
  "--ambient-opacity": string;
};

const lights = [
  { left: "8%", top: "14%", size: "12px", dx: "24px", dy: "10px", pulse: "7.5s", drift: "14s", delay: "-2s", opacity: "0.2" },
  { left: "18%", top: "42%", size: "8px", dx: "-16px", dy: "18px", pulse: "9.8s", drift: "17s", delay: "-5s", opacity: "0.14" },
  { left: "26%", top: "78%", size: "10px", dx: "18px", dy: "-22px", pulse: "8.4s", drift: "15.5s", delay: "-3.5s", opacity: "0.18" },
  { left: "38%", top: "20%", size: "6px", dx: "12px", dy: "20px", pulse: "6.8s", drift: "13.5s", delay: "-1.2s", opacity: "0.16" },
  { left: "48%", top: "60%", size: "14px", dx: "-20px", dy: "14px", pulse: "10.2s", drift: "19s", delay: "-6s", opacity: "0.22" },
  { left: "58%", top: "28%", size: "9px", dx: "16px", dy: "-18px", pulse: "8.8s", drift: "16.5s", delay: "-4.4s", opacity: "0.16" },
  { left: "68%", top: "74%", size: "7px", dx: "22px", dy: "-14px", pulse: "7.2s", drift: "14.8s", delay: "-2.6s", opacity: "0.14" },
  { left: "76%", top: "18%", size: "11px", dx: "-18px", dy: "24px", pulse: "9.4s", drift: "18.2s", delay: "-5.4s", opacity: "0.19" },
  { left: "84%", top: "52%", size: "13px", dx: "14px", dy: "-18px", pulse: "8.1s", drift: "15.2s", delay: "-3.1s", opacity: "0.18" },
  { left: "90%", top: "84%", size: "8px", dx: "-14px", dy: "12px", pulse: "6.9s", drift: "12.8s", delay: "-1.8s", opacity: "0.15" },
];

export function AmbientLights({ tone = "default" }: AmbientLightsProps) {
  const ringPrimary = tone === "indigo" ? "border-indigo-500/15" : "border-white/10";
  const ringSecondary = tone === "indigo" ? "border-indigo-300/10" : "border-white/5";
  const lineTone = tone === "indigo" ? "via-indigo-300/20" : "via-white/15";
  const glowTone = tone === "indigo" ? "bg-indigo-500/10" : "bg-white/5";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className={`absolute left-[8%] top-24 h-40 w-40 rounded-full border ${ringPrimary}`} />
      <div className={`absolute right-[10%] top-20 h-64 w-64 rounded-full border ${ringSecondary}`} />
      <div className={`absolute bottom-16 left-1/2 h-px w-[70vw] -translate-x-1/2 bg-gradient-to-r from-transparent ${lineTone} to-transparent`} />
      <div className={`absolute left-1/3 top-16 h-44 w-44 rounded-full blur-3xl ${glowTone}`} />

      {lights.map((light, index) => {
        const style: AmbientVars = {
          left: light.left,
          top: light.top,
          width: light.size,
          height: light.size,
          "--ambient-drift-x": light.dx,
          "--ambient-drift-y": light.dy,
          "--ambient-pulse-duration": light.pulse,
          "--ambient-drift-duration": light.drift,
          "--ambient-delay": light.delay,
          "--ambient-opacity": light.opacity,
        };

        return <span key={index} className="ambient-light" style={style} />;
      })}
    </div>
  );
}
