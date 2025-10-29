
import React from 'react';
import { View } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface DashboardProps {
    onNavigate: (view: View) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-avante-blue">Mi Panel</h1>
                <Button onClick={() => onNavigate('scanner')}>Escanear nuevo vehículo</Button>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold text-avante-blue mb-4">Mis Vehículos</h2>
                    <Card>
                         <h3 className="text-xl font-bold text-avante-gray-300">Nissan Versa 2022</h3>
                         <p className="text-sm text-avante-gray-200">Placa: ABC-123</p>
                         <div className="mt-6">
                            <h4 className="font-semibold mb-2">Historial de escaneos</h4>
                             <div className="border rounded-lg p-4 flex justify-between items-center">
                                 <div>
                                     <p className="font-medium">25 de Julio, 2024</p>
                                     <p className="text-sm text-avante-gray-200">Salud promedio: 64%</p>
                                 </div>
                                 <a onClick={() => onNavigate('diagnosis')} className="text-avante-blue font-semibold cursor-pointer">Ver detalle</a>
                             </div>
                         </div>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <h2 className="text-2xl font-bold text-avante-blue mb-4">Recordatorios</h2>
                    <Card className="bg-avante-blue/5">
                        <h3 className="font-bold text-avante-blue">Próxima Rotación</h3>
                        <p className="text-avante-gray-300">Recomendada en ~3,000 km</p>
                        <p className="text-sm text-avante-gray-200">Est. Septiembre 2024</p>
                        <Button onClick={() => onNavigate('booking')} className="mt-4 w-full" variant="secondary">Agendar ahora</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};
