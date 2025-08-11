import { NearWalletProvider } from '@/contexts/NearWalletContext';
import CasinoTexture from '@/components/CasinoTexture';
import Navbar from '@/components/Navbar';
import type { ReactNode } from 'react';

export default function App({ children }: { children: ReactNode }) {
  return (
    <NearWalletProvider>
      <div className="relative min-h-screen overflow-x-hidden">
        <CasinoTexture />
        <div className="relative z-10">
          <Navbar />
          <main className="min-h-screen bg-transparent">
            {children}
          </main>
        </div>
      </div>
    </NearWalletProvider>
  );
}


