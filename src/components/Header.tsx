import { useNearWallet } from '@/contexts/NearWalletContext';
import { useRouter } from 'next/router';

interface HeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  isMobile: boolean;
}

export default function Header({ isMenuOpen, onMenuToggle, isMobile }: HeaderProps) {
  const wallet = useNearWallet();
  const router = useRouter();

  // Calculate positioning based on sidebar state and screen size
  const getHeaderStyles = () => {
    if (isMobile) {
      // On mobile, header behaves as before (full width, fades out)
      return {
        left: '0',
        right: '0',
        opacity: isMenuOpen ? 0 : 1,
        width: 'auto'
      };
    } else {
      // On desktop, header slides to the right when sidebar opens
      if (isMenuOpen) {
        return {
          left: '200px', // Width of sidebar
          right: '0',
          opacity: 1,
          width: 'auto'
        };
      } else {
        return {
          left: '0',
          right: '0',
          opacity: 1,
          width: 'auto'
        };
      }
    }
  };

  const headerStyles = getHeaderStyles();

  // Show condensed content when navbar is open on desktop
  const showCondensedContent = isMenuOpen && !isMobile;

  return (
    <header 
      className="fixed top-0 z-20 h-14 bg-[rgba(8,35,17,0.95)] border-b border-[rgba(237,201,81,0.3)] backdrop-blur flex items-center justify-between px-3 transition-all duration-300"
      style={headerStyles}
    >
      {/* Left side - Menu toggle (hidden when condensed) */}
      {!showCondensedContent && (
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
        </button>
      )}

      {/* Wallet Section */}
      <div className={`flex items-center gap-3 ${showCondensedContent ? 'w-full justify-end' : ''}`}>
        {/* NEAR Wallet Section */}
        {wallet.isConnected ? (
          <div className="flex items-center gap-2">
            {/* Account ID and profile picture first */}
            <button
              onClick={() => router.push('/Profile')}
              className="flex items-center gap-2 hover:bg-[rgba(237,201,81,0.1)] rounded-lg px-2 py-1 transition-colors duration-200 group"
              title="View Profile"
            >
              <img 
                src={`https://i.near.social/magic/thumbnail/https://near.social/magic/img/account/${wallet.accountId}`}
                alt={wallet.accountId || ''}
                className="w-6 h-6 rounded-full border border-[rgba(237,201,81,0.5)] object-cover group-hover:border-[rgba(237,201,81,0.8)] transition-colors duration-200"
                onError={(e) => {
                  // Fallback to a default avatar if image fails to load
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(wallet.accountId || '')}&background=edc951&color=000&size=24`;
                }}
              />
              <span className="text-sm text-[rgb(237,201,81)] font-medium group-hover:text-[rgba(237,201,81,0.8)] transition-colors duration-200">
                {wallet.accountId || 'Unknown'}
              </span>
            </button>
            {/* Logout button after account info */}
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
