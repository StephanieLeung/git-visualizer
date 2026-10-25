interface CommitTooltipProps {
  // Top-left corner of the card in graph coordinates; text is inset 10px
  x: number
  y: number
  borderColor: string
  borderWidth: number
  title: string
  branchLabel: string
  message: string
  action: string
  actionColor: string
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick?: () => void
}

// Hover card drawn inside the commit graph SVG for the HEAD and branch-tip commits
export function CommitTooltip({
  x,
  y,
  borderColor,
  borderWidth,
  title,
  branchLabel,
  message,
  action,
  actionColor,
  onMouseEnter,
  onMouseLeave,
  onClick
}: CommitTooltipProps) {
  const textX = x + 10

  return (
    <g onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <rect
        x={x}
        y={y}
        width="300"
        height="100"
        fill="white"
        stroke={borderColor}
        strokeWidth={borderWidth}
        rx="8"
        opacity="0.95"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))', cursor: 'pointer' }}
      />
      <text x={textX} y={y + 20} fontSize="11" fill="#333" fontWeight="bold" fontFamily="monospace">
        {title}
      </text>
      <text x={textX} y={y + 35} fontSize="10" fill="#666" fontWeight="600" fontFamily="sans-serif">
        Branch: {branchLabel}
      </text>
      <text x={textX} y={y + 50} fontSize="10" fill="#666" fontFamily="sans-serif">
        {message}
      </text>
      <text
        x={textX}
        y={y + 70}
        fontSize="10"
        fill={actionColor}
        fontWeight="bold"
        fontFamily="sans-serif"
        style={{ textDecoration: 'underline' }}
      >
        {action}
      </text>
    </g>
  )
}
