import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  href?: string;
  to?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export function Button({ variant = 'primary', href, to, className = '', children, ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-sm transition-all duration-300 focus:outline-none px-6 py-3 text-sm";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5",
    secondary: "bg-metallic border border-silver/30 text-ink shadow-sm hover:border-silver/60 hover:-translate-y-0.5",
    ghost: "bg-transparent text-primary hover:bg-silver-light/50",
  };

  const combinedStyles = `${baseStyles} ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combinedStyles}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedStyles} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
        {children}
      </a>
    );
  }

  return (
    <button className={combinedStyles} {...props}>
      {children}
    </button>
  );
}
