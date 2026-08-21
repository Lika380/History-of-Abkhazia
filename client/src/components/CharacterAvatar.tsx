const AVATAR_COLORS = ['#3d7a44', '#c41e3a', '#8a5a2c', '#2c5f8a', '#6b3fa0', '#a04f7a']

export function avatarColor(colorIndex: number): string {
  return AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]
}

export default function CharacterAvatar({
  name,
  icon,
  colorIndex,
  size = 56,
}: {
  name: string
  icon?: string
  colorIndex: number
  size?: number
}) {
  if (icon) {
    return (
      <img
        src={icon}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: avatarColor(colorIndex), fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
