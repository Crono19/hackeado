import type { CSSProperties } from 'react';
import type { RiskState } from '../../shared/types';

const labels: Array<[keyof RiskState, string]> = [
  ['privacy', 'Privacidad'],
  ['deviceControl', 'Control'],
  ['accounts', 'Cuentas'],
  ['files', 'Archivos'],
  ['recoverability', 'Recuperación'],
];

export function RiskMeter({ risk }: { risk: RiskState }) {
  const exposure = Math.round(
    (risk.privacy + risk.deviceControl + risk.accounts + risk.files + (100 - risk.recoverability)) /
      5,
  );
  return (
    <div className="risk-meter">
      <div
        className="risk-meter__dial"
        style={{ '--risk': `${exposure * 3.6}deg` } as CSSProperties}
      >
        <strong>{exposure}</strong>
        <span>/100</span>
      </div>
      <div className="risk-meter__rows">
        {labels.map(([key, label]) => (
          <div key={key}>
            <span>{label}</span>
            <i>
              <b style={{ width: `${risk[key]}%` }} />
            </i>
            <em>{risk[key]}</em>
          </div>
        ))}
      </div>
      <small>Índice narrativo educativo · no medición técnica</small>
    </div>
  );
}
