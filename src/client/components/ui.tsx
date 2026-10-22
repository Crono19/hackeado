import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  return <button className={`ui-button ui-button--${variant} ${className}`} {...props} />;
}

export function Panel({
  children,
  className = '',
  label,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode; label?: string }) {
  return (
    <section className={`ui-panel ${className}`} {...props}>
      {label && <span className="ui-panel__label">{label}</span>}
      {children}
    </section>
  );
}

export function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'ok' | 'warning' | 'danger' | 'neutral' | 'info';
  children: ReactNode;
}) {
  return (
    <span className={`status-badge status-badge--${tone}`}>
      <i aria-hidden="true" />
      {children}
    </span>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <span>SECURE://DIALOG</span>
          <Button variant="ghost" onClick={onClose} aria-label="Cerrar">
            ×
          </Button>
        </header>
        <h2 id="modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}
