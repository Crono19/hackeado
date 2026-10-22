import { permissionDefinitions } from '../../../shared/permissions';
import { exposureIndex } from '../../../shared/risk';
import type { DemoSession } from '../../../shared/types';
import { Countdown } from '../../components/Countdown';
import { RiskMeter } from '../../components/RiskMeter';
import { RecoveryChallenge } from '../../components/RecoveryChallenge';
import { ScoreSummary } from '../../components/ScoreSummary';
import { SimulatedDesktop } from '../../components/SimulatedDesktop';
import { Timeline } from '../../components/Timeline';
import { Panel, StatusBadge } from '../../components/ui';

const revealedPhases = new Set(['reveal', 'containment', 'recovery', 'result', 'emergency']);

export function AudienceExperience({ session }: { session: DemoSession }) {
  if (!revealedPhases.has(session.phase)) return <Mystery session={session} />;
  return <Reveal session={session} />;
}

function Mystery({ session }: { session: DemoSession }) {
  return (
    <main className="audience-stage audience-mystery" aria-live="polite">
      <div className="mystery-orbit" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <p className="eyebrow">TRANSMISIÓN PÚBLICA // INFORMACIÓN RETENIDA</p>
      <h2>
        UNA DECISIÓN
        <br />
        <span>CAMBIA TODO.</span>
      </h2>
      <p>Observa. Busca presión, identidad dudosa y permisos excesivos.</p>
      <div className="mystery-lock">
        <span>◈</span>
        <strong>EL OTRO LADO SIGUE OCULTO</strong>
      </div>
      <Countdown seconds={session.timer.remainingSeconds} label="Tiempo de experiencia" />
      <footer>
        <i /> ESCENA SIN SPOILERS · ESPERANDO REVELACIÓN
      </footer>
    </main>
  );
}

function Reveal({ session }: { session: DemoSession }) {
  const exposure = exposureIndex(session.risk);
  const granted = session.permissions.filter((item) => item.status === 'granted');
  return (
    <main className="audience-stage audience-reveal">
      <header className="reveal-impact">
        <div>
          <p className="eyebrow">REVELACIÓN // LO QUE OCURRÍA DETRÁS</p>
          <h2>
            ALGUIEN
            <br />
            <span>ESTABA DENTRO.</span>
          </h2>
        </div>
        <div className="reveal-index">
          <small>EXPOSICIÓN NARRATIVA</small>
          <strong>{exposure}</strong>
          <span>/100</span>
        </div>
      </header>

      <section className="data-flow" aria-label="Flujo ficticio de información">
        <article>
          <small>01 · VÍCTIMA</small>
          <strong>WINDOWS</strong>
          <span>Decisión + permisos</span>
        </article>
        <div className="data-flow__beam">
          <i />
          <b>DATOS FICTICIOS</b>
        </div>
        <article>
          <small>02 · OTRO LADO</small>
          <strong>OPERADOR</strong>
          <span>Puede observar consecuencias</span>
        </article>
      </section>

      <div className="reveal-grid">
        <Panel className="reveal-compare" label="DUAL://PERSPECTIVE">
          <div className="section-heading">
            <div>
              <span>MISMA DECISIÓN · DOS REALIDADES</span>
              <h3>Víctima vs. atacante</h3>
            </div>
          </div>
          <div className="perspective-pair">
            <article>
              <small>LO QUE VIO LA VÍCTIMA</small>
              <strong>“Soporte quiere ayudarme”</strong>
              <p>Mensaje urgente, caso técnico y botones confiables.</p>
            </article>
            <article>
              <small>LO QUE OBTUVO EL OTRO LADO</small>
              <strong>{granted.length} permisos concedidos</strong>
              <p>Pantalla, control y datos dependen de cada autorización.</p>
            </article>
          </div>
        </Panel>

        <Panel className="reveal-permissions" label="ACCESS://CHAIN">
          <div className="section-heading">
            <div>
              <span>CADA SÍ AMPLIÓ EL ALCANCE</span>
              <h3>Cadena de permisos</h3>
            </div>
          </div>
          <div className="public-permission-map">
            {session.permissions.map((permission, index) => (
              <article key={permission.key} className={`is-${permission.status}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <i>{permissionDefinitions[permission.key].icon}</i>
                <div>
                  <strong>{permissionDefinitions[permission.key].shortLabel}</strong>
                  <small>{permission.status}</small>
                </div>
                <b>{permission.nature === 'real' ? 'REAL*' : 'SIM'}</b>
              </article>
            ))}
          </div>
          <p className="real-footnote">
            * “Real” significa video WebRTC consentido; el control se limita a HACKEADO.
          </p>
        </Panel>

        <Panel className="reveal-desktop" label="SIMULATION://SAFE">
          <SimulatedDesktop session={session} />
        </Panel>

        <Panel className="reveal-risk" label="IMPACT://EXPLAINED">
          <div className="section-heading">
            <div>
              <span>RIESGO NARRATIVO</span>
              <h3>Qué quedó expuesto</h3>
            </div>
            <StatusBadge tone="danger">NO ES ESCANEO REAL</StatusBadge>
          </div>
          <RiskMeter risk={session.risk} />
        </Panel>

        <Panel className="reveal-timeline" label="INCIDENT://FORENSICS">
          <div className="section-heading">
            <div>
              <span>CAUSA → PERMISO → CONSECUENCIA</span>
              <h3>Cronología del incidente</h3>
            </div>
            <StatusBadge tone="info">{session.timeline.length} EVENTOS</StatusBadge>
          </div>
          <Timeline events={session.timeline} />
        </Panel>
      </div>

      {session.phase === 'recovery' && <RecoveryChallenge session={session} readOnly />}

      {session.summary && <ScoreSummary summary={session.summary} />}
      <footer className="reveal-lesson">
        <span>¿CUÁNDO COMENZÓ?</span>
        <strong>Cuando se concedió acceso sin verificar.</strong>
        <p>Verifica identidad · limita permisos · detén y reporta</p>
      </footer>
    </main>
  );
}
