import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-amber-100 border-t border-amber-300 py-8 z-50 relative mt-auto shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
      <div className="container mx-auto px-6 text-center">
        <p className="text-amber-900 font-bold tracking-wide flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>© {new Date().getFullYear()} Aparna Bindu.</span>
          <span className="hidden sm:inline text-amber-500">•</span> 
          <span className="text-amber-800/80 font-medium tracking-normal">Preserving tradition, inspiring creativity.</span>
        </p>
      </div>
    </footer>
  );
};
