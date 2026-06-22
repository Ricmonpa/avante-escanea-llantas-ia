import React, { useState, useRef, useEffect, useCallback } from 'react';
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

// ─── Captura desde galería ────────────────────────────────────────────────────
// createImageBitmap hace decode+resize en una sola operación nativa.
// Peak de RAM = bitmap reducido (~1.9MB), nunca el archivo original (hasta 47MB+).
const compressFromFile = async (file: File): Promise<string> => {
  const MAX_WIDTH = 800;
  const QUALITY = 0.6;

  const bitmap = await createImageBitmap(file, {
    resizeWidth: MAX_WIDTH,
    resizeQuality: 'medium',
  });

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
    throw new Error('No se pudo crear contexto de canvas');
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close(); // liberación explícita, no depende del GC

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
  canvas.width = 0;
  canvas.height = 0;

  return dataUrl;
};

// ─── Captura desde video en vivo ──────────────────────────────────────────────
// El frame ya viene a la resolución solicitada (800×600).
// Nunca existe una imagen a resolución completa en memoria.
const captureFromVideo = (video: HTMLVideoElement): string => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.width = 0;
    canvas.height = 0;
    throw new Error('No se pudo crear contexto de canvas');
  }

  ctx.drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  canvas.width = 0;
  canvas.height = 0;

  return dataUrl;
};

// ─────────────────────────────────────────────────────────────────────────────

export const Scanner: React.FC<ScannerProps> = ({ onNavigate, photos, setPhotos }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Detiene el stream y oculta el visor de cámara
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Limpiar al desmontar el componente
  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  // Conectar el stream al elemento <video> una vez que React lo renderiza
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  // ── Abrir cámara con getUserMedia ──────────────────────────────────────────
  // El sensor nunca captura a más de 800×600 → cero imagen a resolución completa en RAM.
  const handleOpenCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 800 },
          height: { ideal: 600 },
        },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch {
      setError('No se pudo acceder a la cámara. Verifica los permisos e intenta de nuevo.');
    }
  };

  // ── Tomar la foto del frame actual del video ───────────────────────────────
  const handleCapture = () => {
    if (!videoRef.current) return;
    setError(null);
    try {
      const dataUrl = captureFromVideo(videoRef.current);
      const newPhotos = [...photos];
      newPhotos[currentStep] = dataUrl;
      setPhotos(newPhotos);
      stopStream();
    } catch {
      setError('No se pudo capturar la foto. Intenta de nuevo.');
    }
  };

  // ── Subir archivo desde galería ───────────────────────────────────────────
  const handleUpload = () => {
    if (uploadInputRef.current) uploadInputRef.current.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Elige una imagen más pequeña.');
      event.target.value = '';
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const dataUrl = await compressFromFile(file);
      const newPhotos = [...photos];
      newPhotos[currentStep] = dataUrl;
      setPhotos(newPhotos);
    } catch {
      setError('No se pudo procesar la imagen. Intenta con otra foto.');
    } finally {
      setIsProcessing(false);
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  // ── Navegación ────────────────────────────────────────────────────────────
  const handleRetry = () => {
    const newPhotos = [...photos];
    newPhotos[currentStep] = null;
    setPhotos(newPhotos);
    setError(null);
    stopStream();
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  const handleNext = () => {
    stopStream();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onNavigate('questionnaire');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // Cámara a pantalla completa: el video ocupa todo el viewport con guía y controles
  // superpuestos. Mejora la experiencia al capturar (antes solo se veía un recuadro).
  if (isCameraActive) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Guía de encuadre */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md aspect-[4/3] border-4 border-dashed border-avante-green/70 rounded-2xl" />
          <p className="mt-4 font-bold text-white bg-black/50 px-3 py-1 rounded text-center">
            Enfoca la banda de rodadura de la {steps[currentStep]}
          </p>
        </div>

        {error && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md p-3 bg-red-600/90 rounded-lg text-white text-sm text-center">
            {error}
          </div>
        )}

        {/* Controles inferiores */}
        <div className="absolute bottom-0 inset-x-0 p-6 pb-10 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
            <Button
              onClick={() => { stopStream(); setError(null); }}
              variant="secondary"
              className="flex-1 text-lg"
            >
              Cancelar
            </Button>
            <Button onClick={handleCapture} variant="primary" className="flex-1 text-lg">
              <span className="flex items-center justify-center gap-2">
                <CameraIcon className="w-6 h-6" />
                Tomar Foto
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">

        <div className="mb-12">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        <h2 className="text-3xl font-bold text-avante-blue text-center mb-2">
          Captura de la {steps[currentStep]}
        </h2>
        <p className="text-center text-avante-gray-200 mb-6">
          {isProcessing
            ? 'Procesando imagen...'
            : isCameraActive
            ? 'Enfoca la banda de rodadura y presiona Tomar Foto.'
            : photos[currentStep] !== null
            ? 'Revisa la imagen. Si es correcta, continúa.'
            : 'Sigue las guías en pantalla para una mejor calidad de imagen.'}
        </p>

        {/* Banner informativo: cómo tomar la foto */}
        {!isCameraActive && photos[currentStep] === null && (
          <div className="mb-6 bg-avante-blue/5 border border-avante-blue/20 rounded-xl p-4">
            <p className="font-bold text-avante-blue mb-1">📸 ¿Cómo tomar la foto correcta?</p>
            <p className="text-sm text-avante-gray-300">
              Fotografía solo la <span className="font-semibold">banda de rodadura</span>: es la
              superficie de la llanta que toca el piso, donde están los dibujos y canales.
              No tomes foto a toda la llanta ni al auto completo. Acércate, busca buena luz y
              que la imagen quede nítida.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Visor */}
        <div className="relative aspect-video bg-avante-gray-300 rounded-lg overflow-hidden mb-6 flex items-center justify-center text-white">
          {photos[currentStep] !== null ? (
            <img
              src={photos[currentStep]!}
              alt={`Foto de la ${steps[currentStep]}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <CameraIcon className="w-24 h-24 opacity-20" />
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

        {/* Controles */}
        {photos[currentStep] !== null ? (
          // Foto tomada → reintentar o continuar
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button onClick={handleRetry} variant="secondary" className="w-full md:w-auto text-lg">
              Reintentar
            </Button>
            <Button onClick={handleNext} variant="primary" className="w-full md:w-auto text-lg">
              {currentStep < steps.length - 1 ? 'Siguiente Llanta' : 'Finalizar y Continuar'}
            </Button>
          </div>
        ) : (
          // Sin foto → opciones iniciales (la cámara activa se muestra a pantalla completa)
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button
              onClick={handleOpenCamera}
              variant="primary"
              className="w-full md:w-auto text-lg"
              disabled={isProcessing}
            >
              <span className="flex items-center justify-center gap-2">
                <CameraIcon className="w-6 h-6" />
                Capturar Foto
              </span>
            </Button>
            <Button
              onClick={handleUpload}
              variant="secondary"
              className="w-full md:w-auto text-lg"
              disabled={isProcessing}
            >
              {isProcessing ? 'Procesando...' : 'Subir Foto Existente'}
            </Button>
            <input
              type="file"
              ref={uploadInputRef}
              onChange={handleFileSelected}
              className="hidden"
              accept="image/*"
            />
          </div>
        )}

        <p className="text-xs text-avante-gray-200 text-center mt-8">
          Procesamos tus imágenes de manera segura y anónima. Tu privacidad es importante para nosotros.
        </p>

      </div>
    </div>
  );
};
