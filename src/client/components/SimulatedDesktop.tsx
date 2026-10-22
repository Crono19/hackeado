import { simulationActions } from '../../shared/simulation';
import type { DemoSession, SimulationActionId } from '../../shared/types';

export function SimulatedDesktop({ session }: { session: DemoSession }) {
  const active = session.simulation.queue.find((item) => item.status === 'running');
  const has = (id: SimulationActionId) =>
    session.simulation.queue.some(
      (item) => item.actionId === id && ['running', 'completed'].includes(item.status),
    );
  const completed = session.simulation.queue.filter((item) => item.status === 'completed').length;

  return (
    <section className="sim-desktop" aria-label="Escritorio completamente ficticio">
      <header className="sim-desktop__bar">
        <span>DEMO_OS // ALEX-RIVERA</span>
        <strong>ENTORNO FICTICIO</strong>
        <time>10:37</time>
      </header>
      <div className="sim-desktop__surface">
        <div className="sim-icons" aria-hidden="true">
          <span>
            ▤<small>Tareas</small>
          </span>
          <span>
            ▧<small>Fotos_demo</small>
          </span>
          <span>
            ◇<small>Presupuesto</small>
          </span>
        </div>

        {(has('open_folder') || has('copy_files')) && (
          <article className="sim-window sim-window--files">
            <header>
              <i />
              <i />
              <i />
              <span>C:\Demo\Documentos_ficticios</span>
            </header>
            <div>
              {['Proyecto_final.pdf', 'Horario.png', 'Presupuesto_demo.xlsx', 'Notas.txt'].map(
                (file) => (
                  <p key={file}>▤ {file}</p>
                ),
              )}
            </div>
          </article>
        )}

        {has('open_budget') && (
          <article className="sim-window sim-window--budget">
            <header>
              <i />
              <i />
              <i />
              <span>PRESUPUESTO_DEMO.xlsx</span>
            </header>
            <strong>Q 2,480.00</strong>
            <p>Datos inventados para demostración</p>
          </article>
        )}

        {has('type_message') && (
          <article className="sim-terminal" role="status">
            <span>REMOTE_NOTE.TXT</span>
            <p>No tuve que romper la computadora.</p>
            <strong>
              ME PERMITISTE ENTRAR<span>_</span>
            </strong>
          </article>
        )}

        {has('foreign_login') && (
          <div className="sim-login-alert" role="alert">
            <i>!</i>
            <div>
              <small>NUEVO INICIO DE SESIÓN · FICTICIO</small>
              <strong>Ubicación desconocida</strong>
            </div>
          </div>
        )}

        <div className="sim-sensors">
          <span className={has('expose_microphone') ? 'is-on' : ''}>◖ MIC // SIM</span>
          <span className={has('expose_camera') ? 'is-on' : ''}>● CAM // SIM</span>
          <span className={has('copy_clipboard') ? 'is-on' : ''}>□ CLIP // SIM</span>
        </div>

        {(active || completed > 0) && (
          <div className="sim-exposure">
            <span>INFORMACIÓN EXPUESTA</span>
            <div>
              <i style={{ width: `${session.simulation.exposedPercent}%` }} />
            </div>
            <strong>{String(session.simulation.exposedPercent).padStart(2, '0')}%</strong>
          </div>
        )}

        {active && (
          <div className="sim-operation" aria-live="polite">
            <i /> EJECUTANDO SIMULACIÓN // {simulationActions[active.actionId].label}
          </div>
        )}
        <div className={`sim-cursor ${has('move_cursor') ? 'is-active' : ''}`} aria-hidden="true">
          <span>OPERADOR_SIM</span>
        </div>
      </div>
      <footer>NO LEE ARCHIVOS · NO ACTIVA SENSORES · NO EJECUTA COMANDOS</footer>
    </section>
  );
}
