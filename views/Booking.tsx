
import React from 'react';
import { Button } from '../components/Button';
import { View } from '../types';
import { Card } from '../components/Card';

interface BookingProps {
  onNavigate: (view: View) => void;
}

export const Booking: React.FC<BookingProps> = ({ onNavigate }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-extrabold text-avante-blue text-center mb-8">Agenda tu cita</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <form className="space-y-6">
                <h2 className="text-2xl font-bold text-avante-blue border-b pb-4 mb-6">1. Elige tu sucursal y horario</h2>
                <div>
                    <label htmlFor="branch" className="block text-sm font-medium text-avante-gray-300">Sucursal</label>
                    <select id="branch" name="branch" className="mt-1 block w-full rounded-md border-avante-gray-100 shadow-sm focus:border-avante-blue focus:ring-avante-blue sm:text-sm">
                        <option>AVANTE Revolución</option>
                        <option>AVANTE Insurgentes</option>
                        <option>Servicio a domicilio</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-avante-gray-300">Selecciona fecha y hora</label>
                    {/* A real calendar component would go here */}
                    <div className="mt-2 p-4 border rounded-md bg-avante-gray-50 text-center text-avante-gray-200">
                        <p>Simulador de calendario</p>
                        <div className="mt-2 flex flex-wrap gap-2 justify-center">
                            <button className="px-3 py-1 rounded-md bg-white border border-avante-blue text-avante-blue">Mañana - 10:00 AM</button>
                            <button className="px-3 py-1 rounded-md bg-white border text-avante-gray-300">Mañana - 12:00 PM</button>
                            <button className="px-3 py-1 rounded-md bg-white border text-avante-gray-300">Pasado mañana - 9:00 AM</button>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-avante-blue border-b pb-4 mb-6 pt-6">2. Tus datos</h2>
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-avante-gray-300">Nombre completo</label>
                        <input type="text" name="name" id="name" className="mt-1 block w-full rounded-md border-avante-gray-100 shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-avante-gray-300">Teléfono</label>
                        <input type="tel" name="phone" id="phone" className="mt-1 block w-full rounded-md border-avante-gray-100 shadow-sm"/>
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="email" className="block text-sm font-medium text-avante-gray-300">Email</label>
                        <input type="email" name="email" id="email" className="mt-1 block w-full rounded-md border-avante-gray-100 shadow-sm"/>
                    </div>
                </div>

            </form>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <h2 className="text-2xl font-bold text-avante-blue border-b pb-4 mb-6">Resumen de pedido</h2>
            <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                    <span className="text-avante-gray-200">4x Llanta AVANTE ProGrip</span>
                    <span className="font-medium text-avante-gray-300">$10,000.00</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-avante-gray-200">Alineación y Balanceo</span>
                    <span className="font-medium text-avante-gray-300">$800.00</span>
                </div>
                 <div className="flex justify-between border-t pt-4 font-bold text-lg">
                    <span className="text-avante-blue">Total</span>
                    <span className="text-avante-blue">$10,800.00</span>
                </div>
            </div>
            <p className="text-xs text-avante-gray-200 mt-4">Tiempo de instalación estimado: 90 min.</p>

            <div className="mt-8">
                <Button onClick={() => onNavigate('confirmation')} variant="primary" className="w-full text-lg">
                    Confirmar Reserva
                </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
