import type { SessionSummary } from '../../shared/types';

export function ScoreSummary({ summary }: { summary: SessionSummary }) {
  return (
    <section className="score-summary" aria-labelledby="score-title">
      <div className="score-summary__number">
        <small>PUNTUACIÓN EDUCATIVA</small>
        <strong>{summary.score}</strong>
        <span>/ {summary.maxScore}</span>
      </div>
      <div className="score-summary__copy">
        <span className={`outcome-stamp outcome-stamp--${summary.outcome}`}>{summary.outcome}</span>
        <h2 id="score-title">{summary.headline}</h2>
        <p>{summary.keyMoment}</p>
      </div>
      <div className="score-feedback">
        {summary.feedback.map((item) => (
          <article key={item.id} className={item.achieved ? 'is-achieved' : ''}>
            <i>{item.achieved ? '✓' : '·'}</i>
            <div>
              <strong>{item.label}</strong>
              <small>{item.explanation}</small>
            </div>
            <b>{item.achieved ? `+${item.points}` : '—'}</b>
          </article>
        ))}
      </div>
    </section>
  );
}
