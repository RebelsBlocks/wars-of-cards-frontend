import { useNearWallet } from '@/contexts/NearWalletContext';

interface HeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export default function Header({ isMenuOpen, onMenuToggle }: HeaderProps) {
  const wallet = useNearWallet();

  // Calculate opacity based on sidebar state - fade out when sidebar opens
  const headerOpacity = isMenuOpen ? 0 : 1;

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-20 h-14 bg-[rgba(8,35,17,0.95)] border-b border-[rgba(237,201,81,0.3)] backdrop-blur flex items-center justify-between px-3 transition-opacity duration-300"
      style={{ opacity: headerOpacity }}
    >
      {/* Stylowy hamburger menu toggle */}
      <button
        className="flex items-center gap-3 text-[rgb(237,201,81)] hover:text-[rgba(237,201,81,0.8)] transition-colors duration-200 group"
        onClick={onMenuToggle}
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {/* Casino-style hamburger icon */}
        <div className="relative w-8 h-8 flex flex-col justify-center items-center bg-[rgba(13,56,27,0.6)] border border-[rgba(237,201,81,0.4)] rounded-md group-hover:border-[rgba(237,201,81,0.6)] group-hover:bg-[rgba(13,56,27,0.8)] transition-all duration-200">
          <div className="w-5 h-0.5 bg-[rgb(237,201,81)] rounded-full mb-1 group-hover:shadow-sm transition-all duration-200"></div>
          <div className="w-5 h-0.5 bg-[rgb(237,201,81)] rounded-full mb-1 group-hover:shadow-sm transition-all duration-200"></div>
          <div className="w-5 h-0.5 bg-[rgb(237,201,81)] rounded-full group-hover:shadow-sm transition-all duration-200"></div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(237,201,81,0.1)] to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </div>
        <span className="font-semibold tracking-wide">Wars of Cards</span>
      </button>

      {/* Right side - Wallet */}
      <div className="flex items-center gap-3">
        {/* NEAR Wallet Section */}
        {wallet.isConnected ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[rgb(237,201,81)] font-medium">
              {wallet.accountId}
            </span>
            <button
              onClick={wallet.disconnect}
              className="px-3 py-1 text-xs bg-[rgba(237,201,81,0.1)] border border-[rgba(237,201,81,0.3)] rounded hover:bg-[rgba(237,201,81,0.2)] transition-colors duration-200 text-[rgb(237,201,81)]"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={wallet.connect}
            className="px-3 py-1 text-sm bg-[rgb(237,201,81)] text-[rgb(8,35,17)] rounded hover:bg-[rgba(237,201,81,0.9)] transition-colors duration-200 font-medium"
          >
            Connect NEAR
          </button>
        )}


      </div>
    </header>
  );
}
