import React, { useEffect, useState } from 'react';
import './FallingPetals.css';

/**
 * Pétalos cayendo con animación CSS
 */
const FallingPetals = ({ count = 15, color = '#FFD1DC' }) => {
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    const newPetals = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 15 + Math.random() * 10,
      size: 10 + Math.random() * 15,
      rotation: Math.random() * 360,
    }));
    setPetals(newPetals);
  }, [count]);

  return (
    <div className="falling-petals-container" style={{ pointerEvents: 'none' }}>
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="petal"
          style={{
            left: `${petal.left}%`,
            animationDelay: `${petal.delay}s`,
            animationDuration: `${petal.duration}s`,
          }}
        >
          <svg
            width={petal.size}
            height={petal.size}
            viewBox="0 0 20 20"
            style={{ transform: `rotate(${petal.rotation}deg)` }}
          >
            <ellipse cx="10" cy="10" rx="5" ry="8" fill={color} opacity="0.6" />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default FallingPetals;
