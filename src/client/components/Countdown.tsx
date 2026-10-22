export function Countdown({
  seconds,
  label = 'Tiempo restante',
}: {
  seconds: number;
  label?: string;
}) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const remainder = (safe % 60).toString().padStart(2, '0');
  return (
    <div className="countdown" aria-label={`${label}: ${minutes} minutos ${remainder} segundos`}>
      <span>{label}</span>
      <strong>
        {minutes}
        <b>:</b>
        {remainder}
      </strong>
    </div>
  );
}
