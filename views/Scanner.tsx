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

// Función para comprimir imagen y reducir uso de memoria
const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar si es necesario
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo crear contexto de canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Error al cargar imagen'));
      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        reject(new Error('Error al leer archivo'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer archivo'));
    reader.readAsDataURL(file);
  });
};

export const Scanner: React.FC<ScannerProps> = ({ onNavigate, photos, setPhotos }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoTaken = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Comprimir imagen antes de guardar
      const compressedDataUrl = await compressImage(file);
      
      const newPhotos = [...photos];
      newPhotos[currentStep] = compressedDataUrl;
      setPhotos(newPhotos);
    } catch (err) {
      console.error('Error procesando imagen:', err);
      setError('No se pudo procesar la imagen. Intenta con otra foto.');
    } finally {
      setIsProcessing(false);
      // Limpiar inputs para permitir seleccionar el mismo archivo de nuevo
      if (captureInputRef.current) captureInputRef.current.value = '';
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };
  
  const handleCapture = () => {
    if (captureInputRef.current) {
      captureInputRef.current.click();
    }
  };

  const handleUpload = () => {
    if (uploadInputRef.current) {
      uploadInputRef.current.click();
    }
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño máximo (10MB antes de comprimir)
      if (file.size > 10 * 1024 * 1024) {
        setError('La imagen es demasiado grande. Por favor, elige una imagen más pequeña.');
        event.target.value = '';
        return;
      }
      await handlePhotoTaken(file);
    }
  };

  const handleRetry = () => {
    const newPhotos = [...photos];
    newPhotos[currentStep] = null;
    setPhotos(newPhotos);
    setError(null);
    // Limpiar inputs
    if (captureInputRef.current) captureInputRef.current.value = '';
    if (uploadInputRef.current) uploadInputRef.current.value = '';
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
            {isProcessing 
                ? "Procesando imagen..."
                : photos[currentStep] === null 
                    ? "Sigue las guías en pantalla para una mejor calidad de imagen."
                    : "Revisa la imagen. Si es correcta, continúa."}
        </p>

        {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                {error}
            </div>
        )}

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
                <Button 
                    onClick={handleCapture} 
                    variant="primary" 
                    className="w-full md:w-auto text-lg"
                    disabled={isProcessing}
                >
                    <span className="flex items-center justify-center gap-2">
                        <CameraIcon className="w-6 h-6"/>
                        {isProcessing ? 'Procesando...' : 'Capturar Foto'}
                    </span>
                </Button>
                <Button 
                    onClick={handleUpload} 
                    variant="secondary" 
                    className="w-full md:w-auto text-lg"
                    disabled={isProcessing}
                >
                    Subir Foto Existente
                </Button>
                {/* Input separado para captura con cámara */}
                <input
                    type="file"
                    ref={captureInputRef}
                    onChange={handleFileSelected}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                />
                {/* Input separado para subir archivo existente (sin capture) */}
                <input
                    type="file"
                    ref={uploadInputRef}
                    onChange={handleFileSelected}
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