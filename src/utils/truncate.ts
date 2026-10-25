// Shortens `text` to `max` characters, ending with an ellipsis when cut
export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
