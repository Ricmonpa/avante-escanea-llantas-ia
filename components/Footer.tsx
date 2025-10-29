import React from 'react';
import { AvanteLogo } from './icons/AvanteLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-avante-gray-300 text-white">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:justify-between">
          <div className="mb-6 md:mb-0">
            <AvanteLogo className="h-12 w-auto" variant="dark" />
            <p className="text-avante-gray-200 mt-2">Diagnóstico de llantas con IA.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase">Recursos</h2>
              <ul className="text-avante-gray-200 space-y-2">
                <li><a href="#" className="hover:underline">Blog</a></li>
                <li><a href="#" className="hover:underline">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase">Legal</h2>
              <ul className="text-avante-gray-200 space-y-2">
                <li><a href="#" className="hover:underline">Política de Privacidad</a></li>
                <li><a href="#" className="hover:underline">Términos y Condiciones</a></li>
              </ul>
            </div>
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase">Contacto</h2>
              <ul className="text-avante-gray-200 space-y-2">
                <li><a href="#" className="hover:underline">info@avante.mx</a></li>
                <li><a href="#" className="hover:underline">800-AVANTE-1</a></li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="my-6 border-avante-gray-200 sm:mx-auto opacity-30" />
        <div className="text-center text-sm text-avante-gray-200">
          © {new Date().getFullYear()} AVANTE™. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};
