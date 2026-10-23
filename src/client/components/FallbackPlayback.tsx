export function FallbackPlayback({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`fallback-playback ${compact ? 'is-compact' : ''}`} aria-live="polite">
      <header>
        <div>
          <span>CONTINGENCY://LOCAL_MEDIA</span>
          <strong>ENLACE REAL INTERRUMPIDO</strong>
        </div>
        <b>SIM</b>
      </header>
      <video controls playsInline preload="metadata" src="/fallback/hackeado-respaldo.webm">
        Tu navegador no puede reproducir vídeo de respaldo.
      </video>
      <p>
        Control remoto revocado. Reproducción local permite terminar explicación sin reactivar
        entrada.
      </p>
    </section>
  );
}
