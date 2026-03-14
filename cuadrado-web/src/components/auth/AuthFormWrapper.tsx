import type { ReactNode } from 'react';

interface AuthFormWrapperProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthFormWrapper({
  title,
  subtitle,
  children,
  footer,
}: AuthFormWrapperProps) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">Cuadrado</div>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        <div className="auth-body">{children}</div>
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </div>
  );
}
