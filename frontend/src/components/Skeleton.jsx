import React from 'react';

/**
 * Premium Skeleton Loading Component
 * 
 * @param {Object} props
 * @param {string} props.className - Additional Tailwind classes for sizing (e.g. 'w-full h-32')
 * @param {boolean} props.circle - If true, applies full border radius
 */
export default function Skeleton({ className = '', circle = false }) {
  return (
    <div
      className={`skeleton ${circle ? 'rounded-full' : 'rounded-xl'} ${className}`}
      aria-hidden="true"
    />
  );
}
