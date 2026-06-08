import React from 'react';

interface DecorativeShapesProps {
  children: React.ReactNode;
  className?: string;
}

export default function DecorativeLayout({ children, className = "" }: DecorativeShapesProps) {
  return (
    <div className={`main-content-bg relative ${className}`}>
      <div className="shape-1" />
      <div className="shape-2" />
      <div className="shape-3" />
      <div className="shape-4" />
      {children}
    </div>
  );
}
