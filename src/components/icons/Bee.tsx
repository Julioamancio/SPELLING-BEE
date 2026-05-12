import React from 'react';

export function Bee(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      {/* Body */}
      <path d="M12 21a4.5 4.5 0 0 0 4.5-4.5v-6a4.5 4.5 0 0 0-9 0v6A4.5 4.5 0 0 0 12 21Z" />
      {/* Stripes */}
      <path d="M7.5 12h9" />
      <path d="M7.5 16h9" />
      {/* Sting */}
      <path d="M12 21v2" />
      {/* Wings */}
      <path d="M7.5 10c-2.5-1-4.5-3-4.5-6s4.5 2 4.5 6Z" />
      <path d="M16.5 10c2.5-1 4.5-3 4.5-6s-4.5 2-4.5 6Z" />
      {/* Antennae */}
      <path d="M10 7L8 3" />
      <path d="M14 7l2-4" />
    </svg>
  );
}
