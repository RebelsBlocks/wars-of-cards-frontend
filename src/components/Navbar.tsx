import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from './Header';
import TokenPriceDisplay from './TokenPriceDisplay';

export type MenuItem = 'home' | 'play' | 'community' | 'vanessa';

export default function Navbar() {
  const router = useRouter();
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItem>('home');
  const [useMobileHeader, setUseMobileHeader] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dispatch sidebar state changes to App.tsx
  const dispatchSidebarState = useCallback(() => {
    const event = new CustomEvent('sidebarStateChange', {
      detail: {
        isOpen: isMenuOpen,
        isCollapsed: false,
        isMobile: useMobileHeader
      }
    });
    window.dispatchEvent(event);
  }, [isMenuOpen, useMobileHeader]);

  // Map pathname to menu item
  const getActiveMenuItem = (): MenuItem => {
    const path = router.pathname;
    if (path === '/') return 'home';
    if (path === '/Play') return 'play';
    if (path === '/Community') return 'community';
    if (path === '/Vanessa') return 'vanessa';
    return 'home';
  };

  // Decide mobile behavior using MainLayout breakpoint
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      setUseMobileHeader(isMobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dispatch state changes when any state updates
  useEffect(() => {
    dispatchSidebarState();
  }, [dispatchSidebarState]);

  // Sync active menu item with route changes
  useEffect(() => {
    setActiveMenuItem(getActiveMenuItem());
    if (useMobileHeader) {
      setIsMenuOpen(false);
    }
  }, [router.pathname, useMobileHeader]);

  const handleMenuItemClick = (menuItem: MenuItem) => {
    setActiveMenuItem(menuItem);
    if (useMobileHeader) setIsMenuOpen(false);
  };

  const isActive = (menuItem: MenuItem) => activeMenuItem === menuItem;

  // Simplified styling without PNG icons
  const baseItem = 'rounded-md transition-all duration-300 flex items-center gap-3 px-3 py-2.5';
  const inactiveItem = 'text-[rgb(237,201,81)] hover:text-[rgba(237,201,81,0.8)] hover:bg-[rgba(237,201,81,0.1)]';
  const activeItem = 'text-[rgb(237,201,81)] bg-[rgba(237,201,81,0.15)] border-[rgba(237,201,81,0.3)]';

  const sidebarWidthClass = 'w-[240px]'; // Slightly wider for better readability

  // Icon components for menu items
  const HomeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  const PlayIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.4 C12 2.4, 6 8.4, 6 12 C6 14.88, 8.4 16.8, 12 15.6 C15.6 16.8, 18 14.88, 18 12 C18 8.4, 12 2.4, 12 2.4 Z M10.8 15.6 L10.8 19.2 L9.6 20.4 L14.4 20.4 L13.2 19.2 L13.2 15.6" />
    </svg>
  );



  const CommunityIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const ProfileIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const VanessaIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  return (
    <>
      {/* Header with toggle functionality */}
      <Header 
        isMenuOpen={isMenuOpen} 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        isMobile={useMobileHeader}
      />

      {/* Sidebar with toggle behavior */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-20 ${useMobileHeader ? 'w-[240px]' : sidebarWidthClass} bg-[rgba(0,0,0,0.95)] border-r border-[rgba(237,201,81,0.3)] backdrop-blur transition-all duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}
      >
        {/* Header spacer - matches header height */}
        <div className="h-14 border-b border-[rgba(237,201,81,0.3)] bg-[rgba(0,0,0,0.4)] flex-shrink-0 flex items-center justify-between px-3">
          {/* Toggle button - similar to Claude */}
          <button
            className="w-8 h-8 flex items-center justify-center text-[rgb(237,201,81)] hover:bg-[rgba(237,201,81,0.1)] rounded transition-all duration-200"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* App title */}
          <img src="/brief.png" alt="Wars of Cards" className="h-5 w-auto object-contain" />
          

        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Menu items with clean icons */}
          <nav className="flex flex-col gap-1 px-3 py-4 flex-shrink-0">
            <Link href="/" onClick={() => handleMenuItemClick('home')} className={`${baseItem} ${isActive('home') ? activeItem : inactiveItem}`}>
              <img src="/home.png" alt="Home" className="w-5 h-5 object-contain" />
              <span className="font-medium">Home</span>
            </Link>
            <Link href="/Vanessa" onClick={() => handleMenuItemClick('vanessa')} className={`${baseItem} ${isActive('vanessa') ? activeItem : inactiveItem}`}>
              <img src="/vanessa.png" alt="Vanessa AI" className="w-5 h-5 object-contain" />
              <span className="font-medium">Vanessa AI</span>
            </Link>
            <Link href="/Community" onClick={() => handleMenuItemClick('community')} className={`${baseItem} ${isActive('community') ? activeItem : inactiveItem}`}>
              <img src="/community.png" alt="Community" className="w-5 h-5 object-contain" />
              <span className="font-medium">Community</span>
            </Link>
            <Link href="/Play" onClick={() => handleMenuItemClick('play')} className={`${baseItem} ${isActive('play') ? activeItem : inactiveItem}`}>
              <img src="/blackjack.png" alt="Blackjack" className="w-5 h-5 object-contain" />
              <span className="font-medium">Blackjack</span>
            </Link>
          </nav>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Footer section */}
          <div className="flex-shrink-0">
            {/* Token prices section */}
            <div className="px-3 py-3 space-y-3">
              <TokenPriceDisplay />
            </div>

            {/* Social links footer */}
            <div className="px-3 py-3 pb-4 border-t border-[rgba(237,201,81,0.2)]">
              <div className="flex items-center justify-center gap-4">
                <a 
                  href="https://t.me/+-xPEx_2Kxuo5YmY0" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgba(237,201,81,0.1)] transition-all duration-200 group opacity-70 hover:opacity-100"
                >
                  <svg className="w-4 h-4 text-[rgb(237,201,81)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
                <a 
                  href="https://x.com/rebelsblocks" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgba(237,201,81,0.1)] transition-all duration-200 group opacity-70 hover:opacity-100"
                >
                  <svg className="w-4 h-4 text-[rgb(237,201,81)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Header spacer */}
      <div className="h-14" />

      {/* Overlay - only for mobile */}
      {useMobileHeader && isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-10 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}


