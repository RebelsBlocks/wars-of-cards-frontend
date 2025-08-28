import type { NextPage } from 'next';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import HolographicEffect from '../components/HolographicEffect';

// Typewriter effect component
const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 50 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, speed]);

  return (
    <span>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

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
      title: "Why is there a one-time deposit?",
      content: "Smart contracts need storage in NEAR tokens to keep player data. Players cover that cost once through a storage deposit, so afterwards they don't need to manually confirm every transaction."
    },
    {
      title: "Why NEAR?",
      content: "Because it's fast and cheap, making it easy for new players to join — perfect for casual gaming at scale."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentSection((prev) => (prev + 1) % sections.length);
        setIsVisible(true);
      }, 500);
    }, 9000);

    return () => clearInterval(interval);
  }, [sections.length]);

  return (
    <div className="min-h-screen">
      {/* Kontener główny z równym podziałem na 2 sekcje */}
      <div className="min-h-screen grid grid-rows-2">
        
        {/* Description Section - Opis */}
        <div className="flex items-center justify-center px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <HolographicEffect type="text" intensity="glow">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[rgba(237,201,81,0.95)] leading-tight">
                <TypewriterText text="Web3 gaming platform with Vanessa, an interactive AI host." speed={60} />
              </h1>
            </HolographicEffect>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq-section" className="flex items-center justify-center px-4 md:px-6">
          <div className="relative w-full max-w-4xl">
            <div 
              className={`bg-[rgba(0,0,0,0.3)] border border-[rgba(237,201,81,0.3)] rounded-lg p-8 md:p-12 mx-auto transition-opacity duration-500 shadow-lg backdrop-blur-sm ${
                isVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="text-center">
                <div className="flex flex-col items-center space-y-6">
                  {/* Zawartość tekstowa */}
                  <div className="w-full">
                    <HolographicEffect type="text" intensity="normal">
                      <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-[rgba(237,201,81,0.95)] leading-tight transition-all duration-300">
                        {sections[currentSection].title}
                      </h3>
                    </HolographicEffect>
                    
                    <HolographicEffect type="text" intensity="subtle">
                      <p className="text-lg md:text-xl lg:text-2xl text-[rgba(237,201,81,0.8)] leading-relaxed mx-auto text-center transition-all duration-300 max-w-3xl">
                        {sections[currentSection].content}
                      </p>
                    </HolographicEffect>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
