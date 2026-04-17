const PALETTE = ["#81bb26", "#3a8dbf", "#e8a53a", "#d9544b", "#b85ec9", "#1c3145"];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Props = {
  names: string[];
  size?: number;
  max?: number;
};

export default function AvatarStack({ names, size = 24, max = 4 }: Props) {
  const visible = names.slice(0, max);
  const overflow = names.length - visible.length;

  return (
    <div className="flex">
      {visible.map((name, i) => (
        <div
          key={`${name}-${i}`}
          className="grid place-items-center rounded-full text-white"
          style={{
            width: size,
            height: size,
            background: PALETTE[i % PALETTE.length],
            fontSize: size * 0.42,
            fontWeight: 600,
            letterSpacing: -0.2,
            boxShadow: "0 0 0 2px #13202e",
            marginLeft: i === 0 ? 0 : -8,
          }}
        >
          {initialsOf(name) || "·"}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="grid place-items-center rounded-full bg-white/10 text-white"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.42,
            fontWeight: 600,
            boxShadow: "0 0 0 2px #13202e",
            marginLeft: -8,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
