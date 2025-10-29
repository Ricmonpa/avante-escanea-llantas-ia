import React from 'react';
import { Button } from '../components/Button';
import { View } from '../types';
import { CameraIcon } from '../components/icons/CameraIcon';

interface LandingProps {
  onNavigate: (view: View) => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-avante-blue tracking-tight">
                Escanea tus llantas con IA
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-avante-gray-200">
                Diagnóstico gratuito, recomendaciones y agenda en minutos.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                    onClick={() => onNavigate('scanner')} 
                    variant="primary" 
                    className="text-xl px-10 py-5 w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                    <span className="flex items-center justify-center gap-3">
                        <CameraIcon className="w-7 h-7" />
                        Escanear mis llantas
                    </span>
                </Button>
                <Button 
                    onClick={() => onNavigate('fleets')} 
                    variant="secondary" 
                    className="text-lg px-8 py-4 w-full sm:w-auto"
                >
                    Para flotillas
                </Button>
            </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 text-center">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-avante-blue">Seguridad primero</h3>
            <p className="mt-2 text-avante-gray-200">Detecta riesgos antes de que se conviertan en problemas. Viaja tranquilo.</p>
          </div>
          <div className="p-6">
            <h3 className="text-2xl font-bold text-avante-blue">Ahorro por kilómetro</h3>
            <p className="mt-2 text-avante-gray-200">Recomendaciones para maximizar la vida útil de tus llantas y ahorrar combustible.</p>
          </div>
          <div className="p-6">
            <h3 className="text-2xl font-bold text-avante-blue">Conveniencia total</h3>
            <p className="mt-2 text-avante-gray-200">Diagnóstico y agenda desde tu celular. Sin esperas, sin complicaciones.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-avante-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-avante-blue">Lo que dicen nuestros clientes</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
                <p className="text-avante-gray-300">"El proceso fue increíblemente fácil y rápido. El diagnóstico me ayudó a entender por qué mis llantas se gastaban tan rápido. ¡Totalmente recomendado!"</p>
                <p className="mt-4 font-bold text-avante-blue">- Ana L., Conductora</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
                <p className="text-avante-gray-300">"Para nuestra flotilla, AVANTE ha sido un cambio radical. Tenemos control total sobre el estado de los neumáticos y hemos reducido costos operativos."</p>
                <p className="mt-4 font-bold text-avante-blue">- Carlos M., Gerente de Flotilla</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};