import React from 'react';

interface HolographicEffectProps {
  children: React.ReactNode;
  type?: 'text' | 'background' | 'border' | 'glow';
  intensity?: 'subtle' | 'normal' | 'strong' | 'glow';
  className?: string;
}

const HolographicEffect: React.FC<HolographicEffectProps> = ({
  children,
  type = 'text',
  intensity = 'normal',
  className = ''
}) => {
  const getHolographicClasses = () => {
    const baseClasses = className;
    
    if (type === 'text') {
      switch (intensity) {
        case 'subtle':
          return `${baseClasses} holographic-text-subtle`;
        case 'strong':
          return `${baseClasses} holographic-text-strong`;
        case 'glow':
          return `${baseClasses} holographic-glow`;
        default:
          return `${baseClasses} holographic-text`;
      }
    }
    
    if (type === 'background') {
      return `${baseClasses} bg-gradient-to-r from-[rgba(237,201,81,0.1)] via-[rgba(255,215,0,0.05)] to-[rgba(237,201,81,0.1)] border border-[rgba(237,201,81,0.2)]`;
    }
    
    if (type === 'border') {
      return `${baseClasses} border border-[rgba(237,201,81,0.3)] shadow-[0_0_10px_rgba(237,201,81,0.2)]`;
    }
    
    if (type === 'glow') {
      return `${baseClasses} shadow-[0_0_20px_rgba(237,201,81,0.3)] border border-[rgba(237,201,81,0.4)]`;
    }
    
    return baseClasses;
  };

  return (
    <div className={getHolographicClasses()}>
      {children}
    </div>
  );
};

export default HolographicEffect;
