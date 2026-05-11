
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { View } from '../types';
import { Card } from '../components/Card';
import { SkeletonLoader } from '../components/SkeletonLoader';

interface QuestionnaireProps {
  onNavigate: (view: View) => void;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ onNavigate }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call for diagnosis
    setTimeout(() => {
      setIsLoading(false);
      onNavigate('diagnosis');
    }, 3000);
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
                    <option>Urbano</option>
                    <option>Carretera</option>
                    <option>Mixto</option>
                </select>
            </div>
            
             <div>
                <label className="block text-sm font-medium text-avante-gray-300">Estilo de manejo</label>
                <select id="drivingStyle" name="drivingStyle" className="mt-1 block w-full rounded-md border-avante-gray-100 shadow-sm focus:border-avante-blue focus:ring-avante-blue sm:text-sm" required>
                    <option>Conservador</option>
                    <option>Normal</option>
                    <option>Deportivo</option>
                </select>
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
