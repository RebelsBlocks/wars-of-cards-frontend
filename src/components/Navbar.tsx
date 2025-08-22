import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Header from './Header';

export type MenuItem = 'home' | 'play' | 'chat' | 'mail' | 'profile';

export default function Navbar() {
  const router = useRouter();
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItem>('home');
  const [useMobileHeader, setUseMobileHeader] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false); // mobile: dropdown open

  // Dispatch sidebar state changes to App.tsx
  const dispatchSidebarState = useCallback(() => {
    const event = new CustomEvent('sidebarStateChange', {
      detail: {
        isOpen: isMenuOpen,
        isCollapsed: false, // Always full width now
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
    if (path === '/Chat') return 'chat';
    if (path === '/Mail') return 'mail';
    if (path === '/Profile') return 'profile';
    return 'home';
  };

  // Decide mobile behavior using MainLayout breakpoint
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      setUseMobileHeader(isMobile);
      if (!isMobile) {
        setIsMenuOpen(true); // Desktop: sidebar always open
      }
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
    // Close mobile menu on route change (but keep desktop sidebar open)
    if (useMobileHeader) {
      setIsMenuOpen(false);
    }
  }, [router.pathname, useMobileHeader]);

  const handleMenuItemClick = (menuItem: MenuItem) => {
    setActiveMenuItem(menuItem);
    if (useMobileHeader) setIsMenuOpen(false);
  };

  const isActive = (menuItem: MenuItem) => activeMenuItem === menuItem;

  const baseItem = 'rounded-md transition-all duration-300 nav-tile';
  const itemPadding = 'px-4 py-3 flex items-center justify-between min-h-[48px]';
  const inactiveItem = 'text-[rgb(237,201,81)] hover:text-[rgba(237,201,81,0.8)] hover:bg-[rgba(237,201,81,0.1)]';
  const activeItem = 'text-[rgb(237,201,81)] nav-tile-active bg-[rgba(237,201,81,0.15)] border-[rgba(237,201,81,0.5)]';

  const sidebarWidthClass = 'w-[200px]'; // Reduced width to eliminate green strips around logo

  // Universal layout - header always visible, sidebar for mobile and desktop
  return (
    <>
      {/* Header with fade animation - fades out when sidebar opens */}
      <Header 
        isMenuOpen={isMenuOpen} 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
      />

      {/* Universal sidebar - responsive for all screen sizes */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-20 ${useMobileHeader ? 'w-[220px]' : sidebarWidthClass} bg-[rgba(8,35,17,0.95)] border-r border-[rgba(237,201,81,0.3)] backdrop-blur transition-all duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}
      >
        {/* Logo section - responsive height */}
        <div className="relative border-b border-[rgba(237,201,81,0.3)] w-full h-[80px] sm:h-[100px] md:h-[140px] lg:h-[160px] bg-[rgba(8,35,17,0.4)] flex-shrink-0">
          {/* Close button - only show on mobile */}
          {useMobileHeader && (
            <button
              className="absolute top-2 right-2 z-10 w-6 h-6 bg-[rgba(8,35,17,0.8)] border border-[rgba(237,201,81,0.3)] rounded flex items-center justify-center hover:bg-[rgba(237,201,81,0.1)] transition-all duration-300"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              <span className="text-[rgb(237,201,81)] text-sm leading-none">×</span>
            </button>
          )}
          <Link href="/" onClick={() => handleMenuItemClick('home')} className="block w-full h-full cursor-pointer relative overflow-hidden">
            <Image
              src="/logo_load.png"
              alt="Wars of Cards"
              fill
              className="object-cover object-center hover:opacity-90 transition-opacity duration-200"
              priority
            />
          </Link>
        </div>

        {/* Main content area - grows to fill available space */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Menu - unified styling for all screen sizes */}
          <nav className={`flex flex-col gap-2 ${useMobileHeader ? 'pt-3 px-3' : 'px-3 py-2'} flex-shrink-0`}>
            <Link href="/Play" onClick={() => handleMenuItemClick('play')} className={`${baseItem} nav-img-play ${itemPadding} ${isActive('play') ? activeItem : inactiveItem}`}>
              <span className="font-semibold tracking-wide">Play</span>
            </Link>
            <Link href="/Chat" onClick={() => handleMenuItemClick('chat')} className={`${baseItem} nav-img-chat ${itemPadding} ${isActive('chat') ? activeItem : inactiveItem}`}>
              <span className="font-semibold tracking-wide">Chat</span>
            </Link>
            <Link href="/Mail" onClick={() => handleMenuItemClick('mail')} className={`${baseItem} nav-img-mail ${itemPadding} ${isActive('mail') ? activeItem : inactiveItem}`}>
              <span className="font-semibold tracking-wide">Mail</span>
            </Link>
            <Link href="/Profile" onClick={() => handleMenuItemClick('profile')} className={`${baseItem} nav-img-profile ${itemPadding} ${isActive('profile') ? activeItem : inactiveItem}`}>
              <span className="font-semibold tracking-wide">Profile</span>
            </Link>
          </nav>

          {/* Spacer to push footer down */}
          <div className="flex-1"></div>

          {/* Footer section - always at bottom */}
          <div className="flex-shrink-0">
            {/* Token prices section */}
            <div className="px-3 py-3 space-y-3">
              <div className="text-xs text-[rgba(237,201,81,0.7)] font-medium tracking-wider uppercase mb-2">Token Prices</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-[rgba(237,201,81,0.4)] bg-gradient-to-r from-[rgba(237,201,81,0.08)] to-[rgba(237,201,81,0.12)] px-3 py-2.5 hover:bg-gradient-to-r hover:from-[rgba(237,201,81,0.12)] hover:to-[rgba(237,201,81,0.16)] transition-all duration-200">
                  <span className="text-sm font-bold text-[rgb(237,201,81)] tracking-wide">NEAR</span>
                  <span className="text-sm text-[rgb(237,201,81)] font-semibold">$—</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[rgba(237,201,81,0.4)] bg-gradient-to-r from-[rgba(237,201,81,0.08)] to-[rgba(237,201,81,0.12)] px-3 py-2.5 hover:bg-gradient-to-r hover:from-[rgba(237,201,81,0.12)] hover:to-[rgba(237,201,81,0.16)] transition-all duration-200">
                  <span className="text-sm font-bold text-[rgb(237,201,81)] tracking-wide">CRANS</span>
                  <span className="text-sm text-[rgb(237,201,81)] font-semibold">—</span>
                </div>
              </div>
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
                  <Image src="/telegram.png" alt="Telegram" width={18} height={18} className="group-hover:scale-110 transition-transform duration-200" />
                </a>
                <a 
                  href="https://x.com/rebelsblocks" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgba(237,201,81,0.1)] transition-all duration-200 group opacity-70 hover:opacity-100"
                >
                  <Image src="/x.png" alt="X" width={16} height={16} className="group-hover:scale-110 transition-transform duration-200" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Header spacer so content is not under the header - always needed */}
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


