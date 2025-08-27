import { useMemo } from 'react';

const CasinoTexture = () => {
  // Memoize complex style calculations
  const baseLayerStyle = useMemo(() => ({
    backgroundColor: `rgb(var(--felt-black))`,
    background: `
      linear-gradient(127deg, 
        rgb(var(--felt-black)) 0%, 
        rgb(var(--felt-black-dark)) 25%, 
        rgb(var(--felt-black-light)) 50%, 
        rgb(var(--felt-black-light)) 75%, 
        rgb(var(--felt-black)) 100%
      ),
      radial-gradient(circle at 23% 67%, rgba(var(--gold-accent), 0.05) 0%, transparent 45%),
      radial-gradient(circle at 78% 23%, rgba(var(--gold-accent), 0.03) 0%, transparent 35%),
      radial-gradient(circle at 45% 89%, rgba(var(--gold-accent), 0.04) 0%, transparent 40%)
    `
  }), []);

  // Combine all smoke layers into a single optimized layer
  const smokeLayerStyle = useMemo(() => ({
    background: `
      radial-gradient(ellipse 200px 100px at 20% 30%, rgba(var(--gold-accent), 0.12) 0%, transparent 70%),
      radial-gradient(ellipse 250px 150px at 80% 20%, rgba(var(--gold-accent), 0.09) 0%, transparent 65%),
      radial-gradient(ellipse 400px 200px at 40% 50%, rgba(var(--gold-accent), 0.05) 0%, transparent 90%),
      radial-gradient(ellipse 150px 80px at 70% 60%, rgba(var(--gold-accent), 0.09) 0%, transparent 80%),
      radial-gradient(ellipse 120px 90px at 30% 70%, rgba(var(--card-orange), 0.06) 0%, transparent 85%),
      radial-gradient(ellipse 220px 180px at 25% 75%, rgba(var(--card-orange), 0.05) 0%, transparent 80%),
      radial-gradient(ellipse 500px 300px at 60% 30%, rgba(var(--cream-text), 0.03) 0%, transparent 95%),
      radial-gradient(ellipse 200px 150px at 20% 80%, rgba(var(--card-red), 0.03) 0%, transparent 90%)
    `,
    filter: 'blur(4px)',
    mixBlendMode: 'soft-light' as const
  }), []);

  // Optimize felt fibers pattern
  const fiberLayerStyle = useMemo(() => ({
    background: `
      repeating-linear-gradient(23deg, 
        transparent 0px, rgba(var(--gold-accent), 0.08) 1px, transparent 2px, transparent 8px
      ),
      repeating-linear-gradient(67deg, 
        transparent 0px, rgba(var(--gold-accent), 0.05) 1px, transparent 2px, transparent 12px
      ),
      repeating-linear-gradient(143deg, 
        transparent 0px, rgba(var(--card-orange), 0.04) 1px, transparent 3px, transparent 15px
      ),
      repeating-linear-gradient(189deg, 
        transparent 0px, rgba(var(--gold-accent), 0.06) 1px, transparent 2px, transparent 9px
      )
    `
  }), []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Base felt layer with gold accents */}
      <div className="absolute inset-0" style={baseLayerStyle} />
      
      {/* Combined smoke and atmospheric effects */}
      <div className="absolute inset-0 opacity-15" style={smokeLayerStyle} />
      
      {/* Felt fiber texture */}
      <div className="absolute inset-0 opacity-12" style={fiberLayerStyle} />
    </div>
  );
};

export default CasinoTexture;
