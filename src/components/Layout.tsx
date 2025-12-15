import React, { useState, useEffect } from 'react';
import { Header } from './header';
import { Footer } from './footer';
import Background from './Background';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Shared layout wrapper that centralizes scroll tracking, mobile menu state,
 * and renders the common Background, Header, and Footer for all pages.
 * Page components just provide their unique content via children.
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change (if user navigates via Link)
  // This is handled by the Header's onClick on each nav Link already.

  return (
    <div className="min-h-screen flex flex-col font-sans text-amber-900 relative overflow-x-hidden bg-amber-50/30">
      <Background />

      <div className="relative z-10 flex flex-col flex-grow w-full">
        <Header scrollY={scrollY} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

        <main className="flex-grow">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;
