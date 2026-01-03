import React from 'react';

export default function CoupleIllustration({ className = "" }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 400 400" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fondo circular suave */}
      <circle cx="200" cy="200" r="180" fill="url(#gradient1)" opacity="0.1"/>
      <circle cx="200" cy="200" r="140" fill="url(#gradient2)" opacity="0.1"/>
      
      {/* Novia - Lado izquierdo */}
      <g id="bride">
        {/* Vestido */}
        <path 
          d="M140 280 L120 380 L180 380 L160 280 Z" 
          fill="#FFFFFF" 
          stroke="#F8B4D9" 
          strokeWidth="2"
        />
        {/* Torso */}
        <ellipse cx="150" cy="240" rx="30" ry="45" fill="#FFF5F7"/>
        {/* Cuello */}
        <rect x="145" y="220" width="10" height="20" fill="#FFE5EC" rx="2"/>
        {/* Cabeza */}
        <circle cx="150" cy="200" r="35" fill="#FFE5EC"/>
        {/* Cabello */}
        <path 
          d="M115 195 Q115 170 135 165 Q145 160 150 160 Q155 160 165 165 Q185 170 185 195 L185 210 Q180 215 170 218 Q160 220 150 220 Q140 220 130 218 Q120 215 115 210 Z" 
          fill="#8B4513"
        />
        {/* Velo */}
        <path 
          d="M130 170 Q120 175 115 190 L115 240 Q115 260 120 280 L180 280 Q185 260 185 240 L185 190 Q180 175 170 170" 
          fill="#FFFFFF" 
          opacity="0.6"
        />
        {/* Flores en el cabello */}
        <circle cx="130" cy="175" r="6" fill="#FFB6C1"/>
        <circle cx="145" cy="170" r="5" fill="#FFC0CB"/>
        <circle cx="160" cy="172" r="6" fill="#FFB6C1"/>
        {/* Ojos */}
        <circle cx="140" cy="200" r="3" fill="#4A4A4A"/>
        <circle cx="160" cy="200" r="3" fill="#4A4A4A"/>
        {/* Sonrisa */}
        <path d="M140 210 Q150 215 160 210" stroke="#FF69B4" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* Brazos */}
        <path d="M120 250 L100 280" stroke="#FFE5EC" strokeWidth="8" strokeLinecap="round"/>
        <path d="M180 250 L200 280" stroke="#FFE5EC" strokeWidth="8" strokeLinecap="round"/>
        {/* Ramo de flores */}
        <ellipse cx="150" cy="290" rx="25" ry="15" fill="#FFB6C1"/>
        <circle cx="140" cy="285" r="8" fill="#FF69B4"/>
        <circle cx="150" cy="283" r="9" fill="#FFB6C1"/>
        <circle cx="160" cy="287" r="7" fill="#FFC0CB"/>
      </g>
      
      {/* Novio - Lado derecho */}
      <g id="groom">
        {/* Pantalones */}
        <path 
          d="M240 280 L230 380 L260 380 L250 280 Z" 
          fill="#2C3E50"
        />
        <path 
          d="M260 280 L270 380 L300 380 L290 280 Z" 
          fill="#2C3E50"
        />
        {/* Chaqueta */}
        <path 
          d="M210 240 Q210 260 215 280 L285 280 Q290 260 290 240 L290 220 Q285 215 280 215 L270 215 L270 240 L265 240 L265 215 L235 215 L235 240 L230 240 L230 215 L220 215 Q215 215 210 220 Z" 
          fill="#1A1A2E"
        />
        {/* Camisa blanca */}
        <rect x="235" y="220" width="30" height="25" fill="#FFFFFF" rx="2"/>
        {/* Corbata */}
        <path 
          d="M248 220 L245 245 L250 250 L255 245 L252 220 Z" 
          fill="#C9184A"
        />
        {/* Cuello */}
        <rect x="245" y="215" width="10" height="10" fill="#FFE5D9" rx="2"/>
        {/* Cabeza */}
        <circle cx="250" cy="195" r="35" fill="#FFE5D9"/>
        {/* Cabello */}
        <path 
          d="M215 190 Q215 165 235 160 Q245 155 250 155 Q255 155 265 160 Q285 165 285 190 L285 200 Q280 205 270 205 Q260 205 250 205 Q240 205 230 205 Q220 205 215 200 Z" 
          fill="#2C1810"
        />
        {/* Ojos */}
        <circle cx="240" cy="195" r="3" fill="#4A4A4A"/>
        <circle cx="260" cy="195" r="3" fill="#4A4A4A"/>
        {/* Sonrisa */}
        <path d="M240 205 Q250 210 260 205" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* Brazos */}
        <path d="M210 250 L190 280" stroke="#1A1A2E" strokeWidth="10" strokeLinecap="round"/>
        <path d="M290 250 L310 280" stroke="#1A1A2E" strokeWidth="10" strokeLinecap="round"/>
        {/* Manos */}
        <circle cx="190" cy="280" r="8" fill="#FFE5D9"/>
        <circle cx="310" cy="280" r="8" fill="#FFE5D9"/>
      </g>
      
      {/* Corazones flotantes */}
      <path d="M200 150 L205 145 Q210 140 215 145 Q220 150 215 155 L205 165 L195 155 Q190 150 195 145 Q200 140 205 145 Z" fill="#FF69B4" opacity="0.7"/>
      <path d="M180 130 L183 127 Q186 124 189 127 Q192 130 189 133 L183 139 L177 133 Q174 130 177 127 Q180 124 183 127 Z" fill="#FFB6C1" opacity="0.6"/>
      <path d="M220 135 L223 132 Q226 129 229 132 Q232 135 229 138 L223 144 L217 138 Q214 135 217 132 Q220 129 223 132 Z" fill="#FFC0CB" opacity="0.6"/>
      
      {/* Gradientes */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB6C1" />
          <stop offset="100%" stopColor="#FFC0CB" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF69B4" />
          <stop offset="100%" stopColor="#FFB6C1" />
        </linearGradient>
      </defs>
    </svg>
  );
}
