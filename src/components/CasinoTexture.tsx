const CasinoTexture = () => {

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Bazowa warstwa filcu - naturalna zieleń */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: '#0f2419',
          background: `
            linear-gradient(127deg, #0a1f0f 0%, #0f2419 25%, #14532d 50%, #1a5f35 75%, #0f2419 100%),
            radial-gradient(circle at 23% 67%, #052e16 0%, transparent 45%),
            radial-gradient(circle at 78% 23%, #166534 0%, transparent 35%),
            radial-gradient(circle at 45% 89%, #0a1f0f 0%, transparent 40%)
          `
        }}
      />

      {/* Delikatny czarny dym - warstwa 1 */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(ellipse 200px 100px at 20% 30%, rgba(0, 0, 0, 0.3) 0%, transparent 70%),
            radial-gradient(ellipse 150px 80px at 70% 60%, rgba(0, 0, 0, 0.25) 0%, transparent 80%),
            radial-gradient(ellipse 180px 120px at 50% 80%, rgba(0, 0, 0, 0.2) 0%, transparent 75%)
          `,
          filter: 'blur(3px)',
          mixBlendMode: 'multiply'
        }}
      />

      {/* Delikatny czarny dym - warstwa 2 */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background: `
            radial-gradient(ellipse 250px 150px at 80% 20%, rgba(0, 0, 0, 0.2) 0%, transparent 65%),
            radial-gradient(ellipse 120px 90px at 30% 70%, rgba(0, 0, 0, 0.25) 0%, transparent 85%),
            radial-gradient(ellipse 300px 100px at 60% 40%, rgba(0, 0, 0, 0.15) 0%, transparent 80%)
          `,
          filter: 'blur(5px)',
          mixBlendMode: 'soft-light'
        }}
      />

      {/* Delikatny czarny dym - warstwa 3 (najdelikatniejsza) */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `
            radial-gradient(ellipse 400px 200px at 40% 50%, rgba(0, 0, 0, 0.1) 0%, transparent 90%),
            radial-gradient(ellipse 180px 120px at 75% 25%, rgba(0, 0, 0, 0.15) 0%, transparent 85%),
            radial-gradient(ellipse 220px 180px at 25% 75%, rgba(0, 0, 0, 0.12) 0%, transparent 80%)
          `,
          filter: 'blur(8px)',
          mixBlendMode: 'darken'
        }}
      />

      {/* Włókna filcu - zachowane z oryginału */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background: `
            repeating-linear-gradient(23deg, transparent 0px, rgba(34, 197, 94, 0.05) 1px, transparent 2px, transparent 8px),
            repeating-linear-gradient(67deg, transparent 0px, rgba(21, 128, 61, 0.03) 1px, transparent 2px, transparent 12px),
            repeating-linear-gradient(143deg, transparent 0px, rgba(134, 239, 172, 0.02) 1px, transparent 3px, transparent 15px),
            repeating-linear-gradient(189deg, transparent 0px, rgba(15, 46, 22, 0.04) 1px, transparent 2px, transparent 9px)
          `
        }}
      />


    </div>
  );
};

export default CasinoTexture;
