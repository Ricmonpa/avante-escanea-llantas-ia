import React from 'react';
import { View } from '../types';
import { AvanteLogo } from './icons/AvanteLogo';

interface HeaderProps {
    onNavigate: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <a onClick={() => onNavigate('landing')} className="cursor-pointer">
              <AvanteLogo className="h-10 w-auto" />
            </a>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a onClick={() => onNavigate('scanner')} className="text-avante-gray-300 hover:text-avante-blue px-3 py-2 rounded-md text-sm font-medium cursor-pointer">Escanear</a>
              <a onClick={() => onNavigate('dashboard')} className="text-avante-gray-300 hover:text-avante-blue px-3 py-2 rounded-md text-sm font-medium cursor-pointer">Mi Panel</a>
              <a onClick={() => onNavigate('fleets')} className="text-avante-gray-300 hover:text-avante-blue px-3 py-2 rounded-md text-sm font-medium cursor-pointer">Flotillas</a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
