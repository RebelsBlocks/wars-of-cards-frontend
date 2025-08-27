import type { NextPage } from 'next';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const HomePage: NextPage = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleDotClick = (index: number) => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentSection(index);
      setIsVisible(true);
    }, 500);
  };

  const sections = [
    {
      title: "Why NEAR?",
      content: "Because NEAR is fast and cheap, making it easy for new players to join — perfect for casual gaming at scale."
    },
    {
      title: "Why is there a one-time deposit?",
      content: "Smart contracts need storage in NEAR tokens to keep player data. Players cover that cost once through a storage deposit, so afterwards they don't need to manually confirm every transaction."
    },
    {
      title: "Who made it?",
      content: "Developed by Rebels Blocks"
    },
    {
      title: "Partner",
      content: "NEAR Horizon",
      isLink: true,
      link: "https://www.hzn.xyz/"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentSection((prev) => (prev + 1) % sections.length);
        setIsVisible(true);
      }, 500); // Half second fade out
    }, 9000); // 9 seconds per section

    return () => clearInterval(interval);
  }, [sections.length]);

  return (
    <div className="mx-auto flex h-full max-w-5xl md:max-w-6xl flex-col items-center justify-between px-4 md:px-6 py-8">
      {/* Main Logo Section - Top */}
      <div className="flex flex-col md:flex-row items-center justify-center text-center md:text-left mb-12 gap-8 md:gap-12">
        <div className="flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Wars of Cards Logo"
            width={500}
            height={375}
            priority
            className="w-full h-auto object-contain max-w-md md:max-w-lg"
          />
        </div>
      </div>

      {/* FAQ Sections - Bottom */}
      <div 
        className={`bg-[rgba(0,0,0,0.3)] border border-[rgba(237,201,81,0.3)] rounded-lg p-8 max-w-3xl transition-opacity duration-500 shadow-lg backdrop-blur-sm ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="text-center px-6">
          <div className="flex flex-col items-center space-y-6">
            {/* Text content */}
            <div className="w-full max-w-3xl">
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-[rgba(237,201,81,0.95)] leading-tight transition-all duration-300">
                {sections[currentSection].title}
              </h3>
              
              {sections[currentSection].isLink ? (
                <a 
                  href={sections[currentSection].link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xl md:text-2xl text-[rgba(237,201,81,0.85)] hover:text-[rgba(237,201,81,1)] transition-colors font-medium block"
                >
                  {sections[currentSection].content}
                </a>
              ) : (
                <p className="text-lg md:text-xl text-[rgba(237,201,81,0.8)] leading-relaxed mx-auto text-center transition-all duration-300">
                  {sections[currentSection].content}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Navigation Dots */}
        <div className="flex justify-center mt-8 space-x-3">
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentSection
                  ? 'bg-[rgba(237,201,81,0.9)] scale-110'
                  : 'bg-[rgba(237,201,81,0.4)] hover:bg-[rgba(237,201,81,0.6)] hover:scale-105'
              }`}
              aria-label={`Go to section ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
