
import React from 'react';
import { View, RiskLevel } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { RiskChip } from '../components/RiskChip';

interface FleetsProps {
    onNavigate: (view: View) => void;
}

const fleetData = [
    { id: 'NP-300-01', lastCheck: '2024-07-20', risk: RiskLevel.High, nextAction: 'Alineación urgente' },
    { id: 'Trans-05', lastCheck: '2024-07-22', risk: RiskLevel.Low, nextAction: 'Revisar presión' },
    { id: 'Exec-02', lastCheck: '2024-07-25', risk: RiskLevel.None, nextAction: 'Monitoreo' },
    { id: 'Cargo-11', lastCheck: '2024-07-15', risk: RiskLevel.Medium, nextAction: 'Rotación recomendada' },
];

export const Fleets: React.FC<FleetsProps> = ({ onNavigate }) => {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                <h1 className="text-4xl font-extrabold text-avante-blue">Panel de Flotilla</h1>
                <div className="flex gap-2">
                    <Button variant="secondary">Generar Reporte PDF</Button>
                    <Button onClick={() => onNavigate('scanner')}>Escanear Unidad</Button>
                </div>
            </div>
            
            <Card>
                <div className="flex items-center mb-4">
                    <label htmlFor="risk-filter" className="mr-2 text-sm font-medium">Filtrar por riesgo:</label>
                    <select id="risk-filter" className="rounded-md border-avante-gray-100 shadow-sm sm:text-sm">
                        <option>Todos</option>
                        <option>Alto</option>
                        <option>Medio</option>
                        <option>Bajo</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-avante-gray-100">
                        <thead className="bg-avante-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-avante-gray-200 uppercase tracking-wider">Vehículo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-avante-gray-200 uppercase tracking-wider">Última Revisión</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-avante-gray-200 uppercase tracking-wider">Nivel de Riesgo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-avante-gray-200 uppercase tracking-wider">Próximas Acciones</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-avante-gray-100">
                            {fleetData.map((vehicle) => (
                                <tr key={vehicle.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-avante-gray-300">{vehicle.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-avante-gray-200">{vehicle.lastCheck}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <RiskChip level={vehicle.risk} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-avante-gray-200">{vehicle.nextAction}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <a onClick={() => onNavigate('diagnosis')} className="text-avante-blue hover:text-avante-blue/80 cursor-pointer">Ver detalle</a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
