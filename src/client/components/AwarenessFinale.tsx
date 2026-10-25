export const finalAwarenessMessage =
  'La confianza no se concede por urgencia. Verifica quién pide acceso antes de entregar el control.';

export function AwarenessFinale() {
  return (
    <section className="awareness-finale" aria-labelledby="awareness-finale-title">
      <div className="awareness-finale__signal" aria-hidden="true">
        <i />
        <span>SESSION://CLOSED</span>
      </div>
      <p className="eyebrow">ACCESO REVOCADO · EQUIPO RECUPERADO</p>
      <h2 id="awareness-finale-title">
        EL CONTROL EMPIEZA
        <br />
        <span>CON UNA DECISIÓN.</span>
      </h2>
      <p className="awareness-finale__message">{finalAwarenessMessage}</p>
      <div className="awareness-finale__rule">
        <span>DETENTE</span>
        <i />
        <span>VERIFICA</span>
        <i />
        <span>LIMITA</span>
        <i />
        <span>REPORTA</span>
      </div>
    </section>
  );
}
