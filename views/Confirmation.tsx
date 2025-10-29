
import React from 'react';
import { View } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CheckIcon } from '../components/icons/CheckIcon';

interface ConfirmationProps {
    onNavigate: (view: View) => void;
}

export const Confirmation: React.FC<ConfirmationProps> = ({ onNavigate }) => {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-2xl mx-auto text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-avante-green">
                    <CheckIcon className="h-10 w-10 text-white" />
                </div>
                <h1 className="mt-4 text-4xl font-extrabold text-avante-blue">¡Reserva Confirmada!</h1>
                <p className="mt-2 text-lg text-avante-gray-200">Hemos recibido tu cita. Te esperamos.</p>

                <Card className="mt-8 text-left">
                    <h2 className="text-xl font-bold text-avante-blue border-b pb-3 mb-4">Detalles de tu cita</h2>
                    <div className="space-y-3 text-sm">
                        <p><strong className="text-avante-gray-300">Número de reserva:</strong> #AVT-12345</p>
                        <p><strong className="text-avante-gray-300">Fecha y Hora:</strong> Mañana, 10:00 AM</p>
                        <p><strong className="text-avante-gray-300">Sucursal:</strong> AVANTE Revolución</p>
                        <p><strong className="text-avante-gray-300">Total:</strong> $10,800.00 MXN</p>
                        <p><strong className="text-avante-gray-300">Servicios:</strong> 4x Llanta AVANTE ProGrip, Alineación y Balanceo</p>
                    </div>
                </Card>

                 <div className="mt-8">
                    <Button onClick={() => onNavigate('landing')} variant="primary">Volver al inicio</Button>
                </div>
                 <p className="mt-4 text-sm text-avante-gray-200">Recibirás un correo de confirmación con todos los detalles.</p>
            </div>
        </div>
    );
};
