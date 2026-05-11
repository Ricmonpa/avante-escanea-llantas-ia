
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { MOCK_TIRE_RECOMMENDATIONS } from '../constants';
import { TireRecommendation, View } from '../types';

interface RecommendationsProps {
  onNavigate: (view: View) => void;
}

const TireCard: React.FC<{ tire: TireRecommendation }> = ({ tire }) => (
    <Card className="flex flex-col justify-between">
        <div>
            <img src={tire.image} alt={tire.name} className="mx-auto h-40 w-40 object-contain mb-4"/>
            <h3 className="text-xl font-bold text-avante-blue text-center">{tire.name}</h3>
            <div className="mt-4 border-t pt-4">
                <div className="flex justify-around text-center text-sm">
                    <div>
                        <p className="font-bold">{tire.specs.wetGrip}/5</p>
                        <p className="text-avante-gray-200">Mojado</p>
                    </div>
                     <div>
                        <p className="font-bold">{tire.specs.noise}dB</p>
                        <p className="text-avante-gray-200">Ruido</p>
                    </div>
                     <div>
                        <p className="font-bold">{tire.specs.fuel}</p>
                        <p className="text-avante-gray-200">Consumo</p>
                    </div>
                </div>
            </div>
             <div className="mt-4 text-center bg-avante-gray-50 p-3 rounded-lg">
                <p className="text-sm text-avante-gray-200">Costo por kilómetro</p>
                <p className="text-2xl font-extrabold text-avante-green">${tire.costPerKm.toFixed(2)}</p>
            </div>
            <p className="text-3xl font-bold text-center text-avante-blue mt-4">${tire.price.toLocaleString('es-MX')}</p>
            <p className="text-xs text-center text-avante-gray-200">{tire.availability}</p>
        </div>
        <div className="mt-6">
            <Button variant="primary" className="w-full">Seleccionar</Button>
        </div>
    </Card>
);


export const Recommendations: React.FC<RecommendationsProps> = ({ onNavigate }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-extrabold text-avante-blue text-center mb-4">Recomendaciones para ti</h1>
        <p className="text-center text-avante-gray-200 max-w-2xl mx-auto mb-10">Basado en tu vehículo, uso y diagnóstico, estas son las mejores opciones para garantizar tu seguridad y optimizar tu gasto.</p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MOCK_TIRE_RECOMMENDATIONS.map(tire => <TireCard key={tire.id} tire={tire} />)}
        </div>

        <div className="mt-16">
            <Card>
                 <h2 className="text-2xl font-bold text-avante-blue mb-4">Completa tu servicio</h2>
                 <p className="text-avante-gray-200 mb-6">Aprovecha el cambio de llantas para realizar estos servicios y maximizar su vida útil.</p>
                 <div className="divide-y divide-avante-gray-100">
                     <div className="py-4 flex justify-between items-center">
                         <div>
                             <p className="font-semibold text-avante-gray-300">Alineación y Balanceo</p>
                             <p className="text-sm text-avante-gray-200">Esencial para un desgaste parejo.</p>
                         </div>
                         <Button variant="secondary">Agregar</Button>
                     </div>
                     <div className="py-4 flex justify-between items-center">
                         <div>
                             <p className="font-semibold text-avante-gray-300">Garantía Extendida AVANTE</p>
                             <p className="text-sm text-avante-gray-200">Protección contra baches y pinchaduras.</p>
                         </div>
                         <Button variant="secondary">Agregar</Button>
                     </div>
                 </div>
            </Card>
        </div>
        
        <div className="mt-12 text-center">
            <Button onClick={() => onNavigate('booking')} variant="primary" className="text-xl px-10 py-4">
                Reservar e Instalar
            </Button>
        </div>
    </div>
  );
};
