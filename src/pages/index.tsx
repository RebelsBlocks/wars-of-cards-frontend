import type { NextPage } from 'next';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import HolographicEffect from '../components/HolographicEffect';

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
      title: "Who made it?",
      content: "Rebels Blocks",
      isLink: true,
      link: "https://x.com/rebelsblocks"
    },
    {
      title: "Why is there a one-time deposit?",
      content: "Smart contracts need storage in NEAR tokens to keep player data. Players cover that cost once through a storage deposit, so afterwards they don't need to manually confirm every transaction."
    },
    {
      title: "Who trusted us?",
      content: "NEAR Horizon",
      isLink: true,
      link: "https://www.hzn.xyz/"
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

  const scrollToFAQ = () => {
    const faqSection = document.getElementById('faq-section');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Kontener główny z równym podziałem na 3 sekcje */}
      <div className="min-h-screen grid grid-rows-3">
        
        {/* Hero Section - Logo */}
        <div className="flex items-center justify-center px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Image
              src="/logo.png"
              alt="Wars of Cards Logo"
              width={600}
              height={450}
              priority
              className="w-full h-auto object-contain max-w-lg md:max-w-xl mx-auto"
            />
          </div>
        </div>

        {/* Description Section - Opis */}
        <div className="flex items-center justify-center px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <HolographicEffect type="text" intensity="glow">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[rgba(237,201,81,0.95)] leading-tight">
                Web3 gaming platform with Vanessa, an interactive AI host.
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
                    
                    {sections[currentSection].isLink ? (
                      <a 
                        href={sections[currentSection].link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block transition-transform hover:scale-105 duration-300 text-center"
                      >
                        <div className="flex flex-col items-center space-y-4">
                          <Image
                            src={sections[currentSection].title === "Who trusted us?" ? "/horizon.png" : "/rebelsblocks_logo.png"}
                            alt={sections[currentSection].content}
                            width={150}
                            height={150}
                            className="w-[150px] h-[150px] object-contain"
                          />
                          <HolographicEffect type="text" intensity="subtle">
                            <span className="text-xl md:text-2xl text-[rgba(237,201,81,0.85)] hover:text-[rgba(237,201,81,1)] transition-colors font-medium">
                              {sections[currentSection].content}
                            </span>
                          </HolographicEffect>
                        </div>
                      </a>
                    ) : (
                      <HolographicEffect type="text" intensity="subtle">
                        <p className="text-lg md:text-xl lg:text-2xl text-[rgba(237,201,81,0.8)] leading-relaxed mx-auto text-center transition-all duration-300 max-w-3xl">
                          {sections[currentSection].content}
                        </p>
                      </HolographicEffect>
                    )}
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
