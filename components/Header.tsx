import React from 'react';
import { View } from '../types';

interface HeaderProps {
    onNavigate: (view: View) => void;
    hidden?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, hidden }) => {
  if (hidden) return null;
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <a onClick={() => onNavigate('landing')} className="cursor-pointer">
              <img
                src="/avante-logo.png"
                alt="AVANTE"
                className="h-10 w-auto object-contain"
              />
            </a>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a onClick={() => onNavigate('scanner')} className="text-avante-gray-300 hover:text-avante-blue px-3 py-2 rounded-md text-sm font-medium cursor-pointer">Escanear</a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
