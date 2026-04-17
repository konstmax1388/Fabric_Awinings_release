type Props = {
  className?: string
}

/** Спокойный слой "ткань на ветру": шум + медленный дрейф. */
export function FabricDriftOverlay({ className = '' }: Props) {
  return (
    <div
      className={`fabric-drift pointer-events-none absolute inset-0 ${className}`}
      aria-hidden
    />
  )
}
