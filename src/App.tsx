import { NearWalletProvider } from '@/contexts/NearWalletContext';
import CasinoTexture from '@/components/CasinoTexture';
import Navbar from '@/components/Navbar';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';

export default function App({ children }: { children: ReactNode }) {
  const [sidebarState, setSidebarState] = useState({ isOpen: false, isMobile: false });

  useEffect(() => {
    // Listen for sidebar state changes
    const handleSidebarChange = (event: CustomEvent) => {
      setSidebarState(event.detail);
    };

    window.addEventListener('sidebarStateChange', handleSidebarChange as EventListener);
    return () => window.removeEventListener('sidebarStateChange', handleSidebarChange as EventListener);
  }, []);

  // Calculate margin based on sidebar state
  const getMainMargin = () => {
    if (sidebarState.isMobile) {
      return 'ml-0'; // Mobile doesn't push content
    }
    if (sidebarState.isOpen) {
      return 'ml-[220px]'; // Always full width
    }
    return 'ml-0';
  };

  return (
    <NearWalletProvider>
      <div className="relative min-h-screen overflow-x-hidden">
        <CasinoTexture />
        <div className="relative z-10">
          <Navbar />
          <main className={`min-h-screen bg-transparent transition-all duration-300 ${getMainMargin()}`}>
            {children}
          </main>
        </div>
      </div>
    </NearWalletProvider>
  );
}
