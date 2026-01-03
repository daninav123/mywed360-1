import React, { useState, useEffect, useRef } from 'react';
import { X, Lightbulb, ArrowRight } from 'lucide-react';

/**
 * Tooltip Contextual - Sistema de ayuda inline
 * Se muestra automáticamente la primera vez que el usuario visita una sección
 */
const ContextualTooltip = ({ 
  id,
  title,
  content,
  position = 'bottom', // 'top', 'bottom', 'left', 'right'
  actionText,
  onAction,
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  const tooltipRef = useRef(null);
  const targetRef = useRef(null);

  useEffect(() => {
    // Verificar si el tooltip ya fue visto
    const seenKey = `tooltip_seen_${id}`;
    const seen = localStorage.getItem(seenKey);
    
    if (seen !== 'true') {
      // Mostrar el tooltip después de un breve delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setHasBeenSeen(true);
    }
  }, [id]);

  const handleDismiss = () => {
    setIsVisible(false);
    const seenKey = `tooltip_seen_${id}`;
    localStorage.setItem(seenKey, 'true');
    setHasBeenSeen(true);
  };

  const handleAction = () => {
    handleDismiss();
    onAction?.();
  };

  // Click fuera para cerrar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target) &&
        targetRef.current &&
        !targetRef.current.contains(event.target)
      ) {
        handleDismiss();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 -translate-x-1/2 border-t-purple-600 border-x-transparent border-b-transparent';
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-purple-600 border-x-transparent border-t-transparent';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-purple-600 border-y-transparent border-r-transparent';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-purple-600 border-y-transparent border-l-transparent';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-purple-600 border-x-transparent border-t-transparent';
    }
  };

  return (
    <div className="relative inline-block" ref={targetRef}>
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${getPositionClasses()}`}
          style={{ minWidth: '280px', maxWidth: '320px' }}
        >
          {/* Flecha */}
          <div 
            className={`absolute w-0 h-0 border-8 ${getArrowClasses()}`}
          />
          
          {/* Contenido del tooltip */}
          <div className="bg-purple-600 text-white rounded-lg shadow-xl p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Lightbulb className="h-5 w-5 text-yellow-300" />
              </div>
              <div className="flex-1">
                {title && (
                  <h4 className="font-semibold text-sm mb-1">{title}</h4>
                )}
                <p className="text-sm text-purple-50">{content}</p>
                
                {actionText && (
                  <button
                    onClick={handleAction}
                    className="mt-3 flex items-center gap-1 text-sm font-medium text-yellow-300 hover:text-yellow-200 transition-colors"
                  >
                    {actionText}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 hover:bg-purple-700 rounded transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Botón "Entendido" */}
            <div className="mt-3 pt-3 border-t border-purple-500">
              <button
                onClick={handleDismiss}
                className="w-full py-2 px-3 bg-purple-700 hover:bg-purple-800 rounded text-sm font-medium transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextualTooltip;
