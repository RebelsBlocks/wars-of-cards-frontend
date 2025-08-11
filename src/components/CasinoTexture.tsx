const CasinoTexture = () => {
  // Subtle sparkle points
  const sparkles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${2 + Math.random() * 2.5}s`
  }));

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Base background using felt green colors */}
      <div className="absolute inset-0" style={{backgroundColor: 'rgb(var(--felt-green))'}}></div>



      {/* Sparkles */}
      <div className="absolute inset-0">
        {sparkles.map((s) => (
          <div
            key={s.id}
            className="absolute w-[3px] h-[3px] bg-white rounded-full"
            style={{
              top: s.top,
              left: s.left,
              boxShadow:
                '0 0 10px 4px rgba(255,255,255,0.7), 0 0 18px 8px rgba(var(--gold-accent),0.25)',
              animation: `sparkle ${s.duration} ease-in-out infinite ${s.delay}`
            }}
          />
        ))}
      </div>



      <style jsx>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CasinoTexture;