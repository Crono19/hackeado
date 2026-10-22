import type { TimelineEvent } from '../../shared/types';

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="timeline" aria-label="Cronología del incidente">
      {events.length === 0 ? (
        <li className="timeline__empty">Esperando primera señal…</li>
      ) : (
        events.slice(-6).map((event, index) => (
          <li key={event.id} className={`timeline__event timeline__event--${event.actor}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <small>
                <b className={`timeline__nature timeline__nature--${event.nature}`}>
                  {event.nature}
                </b>{' '}
                · {event.actor}
              </small>
              <p>{event.message}</p>
            </div>
          </li>
        ))
      )}
    </ol>
  );
}
