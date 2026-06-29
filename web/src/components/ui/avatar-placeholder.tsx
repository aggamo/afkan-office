function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function colorFromName(name: string) {
  const colors = ["#0b6b3a", "#c8a951", "#2f6b8a", "#8a4f2f", "#5a3b8a"];
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[sum % colors.length];
}

export function AvatarPlaceholder({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center font-semibold text-white ${className ?? ""}`}
      style={{ backgroundColor: colorFromName(name) }}
    >
      {initials(name)}
    </div>
  );
}
