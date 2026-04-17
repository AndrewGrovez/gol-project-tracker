"use client";

import AvatarStack from "./AvatarStack";
import { formatRelative } from "./spotlight-config";

type Props = {
  progress: number;
  color: string;
  team: string[];
  owner: string | null;
  updatedAt: string;
};

export default function ProgressRingCard({ progress, color, team, owner, updatedAt }: Props) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className="flex items-center gap-[18px] rounded-2xl border border-white/10 p-[22px] backdrop-blur-xl"
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      <svg width={160} height={160} viewBox="0 0 160 160">
        <circle cx={80} cy={80} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
        <circle
          cx={80}
          cy={80}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          style={{ transition: "stroke-dashoffset 500ms ease-out" }}
        />
        <text
          x={80}
          y={78}
          textAnchor="middle"
          fill="white"
          fontSize={36}
          fontWeight={800}
          fontFamily='ui-monospace, "SF Mono", Menlo, monospace'
        >
          {Math.round(clamped)}
        </text>
        <text
          x={80}
          y={98}
          textAnchor="middle"
          fill="rgba(255,255,255,0.55)"
          fontSize={11}
          fontWeight={600}
          letterSpacing={2}
        >
          % COMPLETE
        </text>
      </svg>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] font-bold uppercase tracking-[1.5px] text-white/50">Team</div>
        <div className="mt-2">
          {team.length > 0 ? (
            <AvatarStack names={team} />
          ) : (
            <div className="text-[12.5px] text-white/60">No team yet</div>
          )}
        </div>
        {owner && (
          <div className="mt-2 text-[12.5px] text-white/75">
            Led by <strong className="text-white">{owner}</strong>
          </div>
        )}
        <div className="mt-1 text-[11px] text-white/45">updated {formatRelative(updatedAt)}</div>
      </div>
    </div>
  );
}
