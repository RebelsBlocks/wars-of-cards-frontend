import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

export type MenuItem = 'play' | 'chat' | 'mail' | 'profile';

export default function Navbar() {
  const router = useRouter();
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItem>('play');
  const [useMobileHeader, setUseMobileHeader] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // desktop: collapsed sidebar
  const [isMenuOpen, setIsMenuOpen] = useState(false); // mobile: dropdown open

  // Map pathname to menu item
  const getActiveMenuItem = (): MenuItem => {
    const path = router.pathname;
    if (path === '/') return 'play';
    if (path === '/Play') return 'play';
    if (path === '/Chat') return 'chat';
    if (path === '/Mail') return 'mail';
    if (path === '/Profile') return 'profile';
    return 'play';
  };

  // Decide header vs sidebar using width and height
  useEffect(() => {
    const decideLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Use header on small width or small height (landscape phones/tablets)
      setUseMobileHeader(width <= 960 || height <= 600);
    };
    decideLayout();
    window.addEventListener('resize', decideLayout);
    return () => window.removeEventListener('resize', decideLayout);
  }, []);

  // Sync active menu item with route changes
  useEffect(() => {
    setActiveMenuItem(getActiveMenuItem());
    // Close mobile menu on route change
    setIsMenuOpen(false);
  }, [router.pathname]);

  const handleMenuItemClick = (menuItem: MenuItem) => {
    setActiveMenuItem(menuItem);
    if (useMobileHeader) setIsMenuOpen(false);
  };

  const isActive = (menuItem: MenuItem) => activeMenuItem === menuItem;

  const baseItem = 'rounded-md transition-all duration-300 nav-tile';
  const expandedItemPadding = 'px-3 py-3 flex items-center justify-between min-h-[48px]';
  const collapsedItemPadding = 'nav-tile-collapsed';
  const inactiveItem = 'text-[rgba(237,201,81,0.95)] hover:text-[rgb(237,201,81)]';
  const activeItem = 'text-[rgb(237,201,81)] nav-tile-active';

  // Desktop sidebar variant
  if (!useMobileHeader) {
    const sidebarWidthClass = isCollapsed ? 'w-28' : 'w-[220px]';
    return (
      <>
        <aside
          className={`fixed left-0 top-0 bottom-0 z-20 ${sidebarWidthClass} bg-[rgba(8,35,17,0.95)] border-r border-[rgba(237,201,81,0.3)] backdrop-blur transition-all duration-300`}
        >
          {/* Logo acts as collapse toggle on desktop */}
          <button
            className={`relative border-b border-[rgba(237,201,81,0.3)] w-full transition-all duration-300 hover:bg-[rgba(237,201,81,0.05)] overflow-hidden`}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand menu' : 'Collapse menu'}
            style={{ height: isCollapsed ? `${sidebarWidthClass === 'w-28' ? '112px' : '80px'}` : '220px', aspectRatio: '1/1' }}
          >
            <Image
              src="/logo.png"
              alt="Wars of Cards"
              fill
              className="object-cover"
              priority
              sizes={isCollapsed ? "112px" : "220px"}
            />
          </button>

          {/* Menu */}
          <nav className="flex flex-col gap-2 p-2">
            
            <Link href="/Play" onClick={() => handleMenuItemClick('play')} className={`${baseItem} nav-img-play ${isCollapsed ? collapsedItemPadding : expandedItemPadding} ${isActive('play') ? activeItem : inactiveItem}`}>
              {!isCollapsed && <span className="font-semibold tracking-wide">Play</span>}
            </Link>
            <Link href="/Chat" onClick={() => handleMenuItemClick('chat')} className={`${baseItem} nav-img-chat ${isCollapsed ? collapsedItemPadding : expandedItemPadding} ${isActive('chat') ? activeItem : inactiveItem}`}>
              {!isCollapsed && <span className="font-semibold tracking-wide">Chat</span>}
            </Link>
            <Link href="/Mail" onClick={() => handleMenuItemClick('mail')} className={`${baseItem} nav-img-mail ${isCollapsed ? collapsedItemPadding : expandedItemPadding} ${isActive('mail') ? activeItem : inactiveItem}`}>
              {!isCollapsed && <span className="font-semibold tracking-wide">Mail</span>}
            </Link>
            <Link href="/Profile" onClick={() => handleMenuItemClick('profile')} className={`${baseItem} nav-img-profile ${isCollapsed ? collapsedItemPadding : expandedItemPadding} ${isActive('profile') ? activeItem : inactiveItem}`}>
              {!isCollapsed && <span className="font-semibold tracking-wide">Profile</span>}
            </Link>
          </nav>

          {/* Bottom section only visible when expanded */}
          {!isCollapsed && (
            <>
              <div className="mt-auto p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-md border border-[rgba(237,201,81,0.3)] bg-[rgba(13,56,27,0.6)] px-3 py-2">
                  <span className="text-sm font-semibold text-[rgb(237,201,81)]">NEAR</span>
                  <span className="text-sm text-[rgba(237,201,81,0.9)]">$—</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-[rgba(237,201,81,0.3)] bg-[rgba(13,56,27,0.6)] px-3 py-2">
                  <span className="text-sm font-semibold text-[rgb(237,201,81)]">CRANS</span>
                  <span className="text-sm text-[rgba(237,201,81,0.9)]">—</span>
                </div>
              </div>

              <div className="p-3 flex items-center gap-3">
                <a href="https://t.me/+-xPEx_2Kxuo5YmY0" target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100 transition">
                  <Image src="/telegram.png" alt="Telegram" width={22} height={22} />
                </a>
                <a href="https://x.com/rebelsblocks" target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100 transition">
                  <Image src="/x.png" alt="X" width={22} height={22} />
                </a>
              </div>
            </>
          )}
        </aside>

        {/* Spacer: match sidebar width to keep content visible */}
        <div className={`${isCollapsed ? 'w-28' : 'w-[220px]'} shrink-0`} />
      </>
    );
  }

  // Mobile header variant
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-20 h-14 bg-[rgba(8,35,17,0.95)] border-b border-[rgba(237,201,81,0.3)] backdrop-blur flex items-center justify-between px-3">
        {/* Logo acts as menu toggle on mobile */}
        <button
          className="flex items-center gap-2 text-[rgb(237,201,81)]"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <Image src="/logo.png" alt="Wars of Cards" width={36} height={36} />
          <span className="font-semibold tracking-wide">Wars of Cards</span>
        </button>

        <div className="flex items-center gap-3">
          <a href="https://t.me/+-xPEx_2Kxuo5YmY0" target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100 transition">
            <Image src="/telegram.png" alt="Telegram" width={20} height={20} />
          </a>
          <a href="https://x.com/rebelsblocks" target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100 transition">
            <Image src="/x.png" alt="X" width={20} height={20} />
          </a>
        </div>
      </header>

      {/* Dropdown menu */}
      <nav className={`fixed top-14 left-0 right-0 z-20 bg-[rgba(8,35,17,0.98)] border-b border-[rgba(237,201,81,0.3)] backdrop-blur transition-all duration-300 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="flex flex-col p-3 gap-2">
          
          <Link className={`px-4 py-3 rounded-md nav-tile nav-img-play flex items-center justify-between ${isActive('play') ? 'nav-tile-active text-[rgb(237,201,81)]' : 'text-[rgba(237,201,81,0.95)] hover:text-[rgb(237,201,81)]'}`} href="/Play" onClick={() => handleMenuItemClick('play')}>
            <span>Play</span>
          </Link>
          <Link className={`px-4 py-3 rounded-md nav-tile nav-img-chat flex items-center justify-between ${isActive('chat') ? 'nav-tile-active text-[rgb(237,201,81)]' : 'text-[rgba(237,201,81,0.95)] hover:text-[rgb(237,201,81)]'}`} href="/Chat" onClick={() => handleMenuItemClick('chat')}>
            <span>Chat</span>
          </Link>
          <Link className={`px-4 py-3 rounded-md nav-tile nav-img-mail flex items-center justify-between ${isActive('mail') ? 'nav-tile-active text-[rgb(237,201,81)]' : 'text-[rgba(237,201,81,0.95)] hover:text-[rgb(237,201,81)]'}`} href="/Mail" onClick={() => handleMenuItemClick('mail')}>
            <span>Mail</span>
          </Link>
          <Link className={`px-4 py-3 rounded-md nav-tile nav-img-profile flex items-center justify-between ${isActive('profile') ? 'nav-tile-active text-[rgb(237,201,81)]' : 'text-[rgba(237,201,81,0.95)] hover:text-[rgb(237,201,81)]'}`} href="/Profile" onClick={() => handleMenuItemClick('profile')}>
            <span>Profile</span>
          </Link>
        </div>
      </nav>

      {/* Header spacer so content is not under the header */}
      <div className="h-14" />
    </>
  );
}


