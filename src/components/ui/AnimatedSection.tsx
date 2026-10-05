import React from 'react';


interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  key?: React.Key;
}

export function AnimatedSection({ 
  children, 
  className = '', 
  style,
  delay = 0,
  direction = 'up'
}: AnimatedSectionProps) {
  
  const getAosAnimation = () => {
    switch (direction) {
      case 'up': return 'fade-up';
      case 'down': return 'fade-down';
      case 'left': return 'fade-left';
      case 'right': return 'fade-right';
      case 'none': return 'fade';
      default: return 'fade-up';
    }
  };

  return (
    <div
      data-aos={getAosAnimation()}
      data-aos-delay={delay ? delay * 1000 : 0}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}
