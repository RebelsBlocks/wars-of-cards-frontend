import type { NextPage } from 'next';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import HolographicEffect from '../components/HolographicEffect';

// Typewriter effect component
const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 50 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset when text changes
  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

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
    "Web3 gaming platform with Vanessa, an interactive AI host.",
    "Player data stored with NEAR."
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
    <div className="min-h-screen flex items-center justify-center">
      {/* Kontener główny z centrowaniem tekstu na środku viewport */}
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6">
        <div 
          className={`text-center transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <HolographicEffect type="text" intensity="glow">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[rgba(237,201,81,0.95)] leading-tight leading-relaxed mx-auto text-center transition-all duration-300 max-w-3xl">
              <TypewriterText text={sections[currentSection]} speed={60} />
            </h1>
          </HolographicEffect>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
