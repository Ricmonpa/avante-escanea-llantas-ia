
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { View, DiagnosisMeta } from '../types';
import { Card } from '../components/Card';
import { SkeletonLoader } from '../components/SkeletonLoader';

interface QuestionnaireProps {
  onNavigate: (view: View) => void;
  setMeta: (meta: DiagnosisMeta) => void;
}

const USAGE_OPTIONS = [
  'Uso Urbano / Ciudad',
  'Uso en Carretera / Viajes Largos',
  'Uso Mixto / Todoterreno Ligero',
  'Uso Off-Road / 4x4 Extremo',
  'Uso Comercial / Trabajo Pesado y Carga',
  'Uso Deportivo / Alto Rendimiento',
];

export const Questionnaire: React.FC<QuestionnaireProps> = ({ onNavigate, setMeta }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Capturamos la información para enviarla junto al diagnóstico de IA.
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const mileage = data.get('mileage');
    setMeta({
      mileageKm: mileage ? Number(mileage) : undefined,
      location: (data.get('location') as string) || undefined,
      usage: (data.get('usage') as string) || undefined,
      email: (data.get('email') as string) || undefined,
    });

    setIsLoading(true);
    // Pequeña transición antes de pasar al diagnóstico real (IA).
    setTimeout(() => {
      setIsLoading(false);
      onNavigate('diagnosis');
    }, 800);
  };

  if (isLoading) {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-avante-blue mb-4">Analizando tus llantas...</h2>
                <p className="text-avante-gray-200 mb-8">Nuestra IA está procesando las imágenes y tus respuestas para generar un diagnóstico preciso. Esto tomará solo un momento.</p>
                <div className="space-y-4">
                    <SkeletonLoader />
                    <SkeletonLoader />
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-avante-blue text-center mb-2">Casi listo, cuéntanos más</h2>
        <p className="text-center text-avante-gray-200 mb-8">Esta información nos ayuda a darte recomendaciones personalizadas.</p>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="mileage" className="block text-sm font-medium text-avante-gray-300">Kilometraje actual</label>
              <input type="number" name="mileage" id="mileage" className="mt-1 block w-full rounded-md border-avante-gray-100 shadow-sm focus:border-avante-blue focus:ring-avante-blue sm:text-sm" placeholder="Ej. 55000" required/>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-avante-gray-300">Ciudad / Estado</label>
              <input type="text" name="location" id="location" className="mt-1 block w-full rounded-md border-avante-gray-100 shadow-sm focus:border-avante-blue focus:ring-avante-blue sm:text-sm" placeholder="Ej. Ciudad de México" required/>
            </div>

            <div>
                <label className="block text-sm font-medium text-avante-gray-300">Tipo de uso principal</label>
                <select id="usage" name="usage" className="mt-1 block w-full rounded-md border-avante-gray-100 shadow-sm focus:border-avante-blue focus:ring-avante-blue sm:text-sm" required>
                    {USAGE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-avante-gray-300">¿Quieres enterarte de nuestras ofertas? Ingresa tu email (Opcional)</label>
                <input type="email" name="email" id="email" className="mt-1 block w-full rounded-md border-avante-gray-100 shadow-sm focus:border-avante-blue focus:ring-avante-blue sm:text-sm" placeholder="tucorreo@ejemplo.com" />
            </div>

            <div className="relative flex items-start">
              <div className="flex h-5 items-center">
                <input id="consent" name="consent" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-avante-blue focus:ring-avante-blue" required/>
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="consent" className="font-medium text-avante-gray-300">Acepto el procesamiento de mis datos según la <a href="#" className="text-avante-blue hover:underline">política de privacidad</a>.</label>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" variant="primary" className="w-full text-lg">
                Ver mi diagnóstico
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
