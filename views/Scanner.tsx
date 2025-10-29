import React, { useState, useRef } from 'react';
import { Button } from '../components/Button';
import { Stepper } from '../components/Stepper';
import { View } from '../types';
import { CameraIcon } from '../components/icons/CameraIcon';

interface ScannerProps {
  onNavigate: (view: View) => void;
  photos: (string | null)[];
  setPhotos: React.Dispatch<React.SetStateAction<(string | null)[]>>;
}

const steps = ['Llanta 1', 'Llanta 2', 'Llanta 3', 'Llanta 4'];

export const Scanner: React.FC<ScannerProps> = ({ onNavigate, photos, setPhotos }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoTaken = (imageData: string) => {
    const newPhotos = [...photos];
    newPhotos[currentStep] = imageData;
    setPhotos(newPhotos);
  };
  
  const handleCapture = () => {
    // In a real app, this would interact with the camera API
    // For this prototype, we'll just add a placeholder
    handlePhotoTaken(`https://picsum.photos/seed/capture${currentStep}${Date.now()}/800/600`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          handlePhotoTaken(e.target.result);
        }
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handleRetry = () => {
    const newPhotos = [...photos];
    newPhotos[currentStep] = null;
    setPhotos(newPhotos);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onNavigate('questionnaire');
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
            <Stepper steps={steps} currentStep={currentStep} />
        </div>
        
        <h2 className="text-3xl font-bold text-avante-blue text-center mb-2">Captura de la {steps[currentStep]}</h2>
        <p className="text-center text-avante-gray-200 mb-6">
            {photos[currentStep] === null 
                ? "Sigue las guías en pantalla para una mejor calidad de imagen."
                : "Revisa la imagen. Si es correcta, continúa."}
        </p>

        <div className="relative aspect-video bg-avante-gray-300 rounded-lg overflow-hidden mb-6 flex items-center justify-center text-white">
            {photos[currentStep] ? (
                <img src={photos[currentStep]!} alt={`Foto de la ${steps[currentStep]}`} className="w-full h-full object-cover" />
            ) : (
                <>
                    {/* Camera View Simulation */}
                    <CameraIcon className="w-24 h-24 opacity-20" />

                    {/* Overlay Guides */}
                    <div className="absolute inset-0 border-4 border-dashed border-avante-green/50 rounded-lg m-8 flex flex-col items-center justify-center p-4">
                        <p className="font-bold bg-black/50 px-2 py-1 rounded">Enfoca la banda de rodadura</p>
                        <div className="absolute bottom-4 text-xs text-center space-y-1">
                            <p>• Asegura buena iluminación</p>
                            <p>• Evita imágenes borrosas</p>
                        </div>
                    </div>
                </>
            )}
        </div>
        
        {photos[currentStep] === null ? (
            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button onClick={handleCapture} variant="primary" className="w-full md:w-auto text-lg">
                    <span className="flex items-center justify-center gap-2">
                        <CameraIcon className="w-6 h-6"/>
                        Capturar Foto
                    </span>
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full md:w-auto text-lg">
                    Subir Foto Existente
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*"
                />
            </div>
        ) : (
            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button onClick={handleRetry} variant="secondary" className="w-full md:w-auto text-lg">
                    Reintentar
                </Button>
                <Button onClick={handleNext} variant="primary" className="w-full md:w-auto text-lg">
                    {currentStep < steps.length - 1 ? 'Siguiente Llanta' : 'Finalizar y Continuar'}
                </Button>
            </div>
        )}

        <p className="text-xs text-avante-gray-200 text-center mt-8">
            Procesamos tus imágenes de manera segura y anónima. Tu privacidad es importante para nosotros.
        </p>
      </div>
    </div>
  );
};