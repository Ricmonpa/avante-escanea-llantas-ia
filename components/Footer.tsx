import React from 'react';

export const Footer: React.FC<{ hidden?: boolean }> = ({ hidden }) => {
  if (hidden) return null;
  return (
    <footer className="bg-avante-gray-300 text-white">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:justify-between md:items-center">
          <div className="mb-6 md:mb-0">
            <img src="/avante-logo-blanco.png" alt="AVANTE" className="h-12 w-auto object-contain" />
            <p className="text-avante-gray-200 mt-2">Diagnóstico de llantas con IA.</p>
          </div>
          <div className="flex flex-col gap-4 sm:items-end">
            {/* Redes sociales */}
            <div className="flex gap-6 text-avante-gray-200 font-medium">
              <a href="https://www.instagram.com/avantellantasyrines" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">Instagram</a>
              <a href="https://www.facebook.com/avantellantasyrines" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">Facebook</a>
              <a href="https://www.tiktok.com/@avantellantasyrines" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">TikTok</a>
            </div>
            {/* Enlaces */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-avante-gray-200 font-medium">
              <a href="https://www.grupoavante.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">Página web</a>
              <a href="https://wa.me/528183963593" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">WhatsApp</a>
              <a href="https://www.grupoavante.org/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">Términos y Condiciones</a>
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
