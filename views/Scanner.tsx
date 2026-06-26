import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../components/Button';
import { Stepper } from '../components/Stepper';
import { View } from '../types';
import { CameraIcon } from '../components/icons/CameraIcon';

// ─── Tipos de API de enfoque (no en todos los TS lib por defecto) ─────────────
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  focusMode?: string[];
  torch?: boolean;
}
interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
  focusMode?: ConstrainDOMString;
  torch?: boolean;
  advanced?: ExtendedMediaTrackConstraintSet[];
}
declare global {
  interface MediaTrackConstraints extends ExtendedMediaTrackConstraintSet {}
}

interface ScannerProps {
  onNavigate: (view: View) => void;
  photos: (string | null)[];
  setPhotos: React.Dispatch<React.SetStateAction<(string | null)[]>>;
}

const steps = ['Llanta 1', 'Llanta 2', 'Llanta 3', 'Llanta 4'];

// ─── Captura desde galería ────────────────────────────────────────────────────
// createImageBitmap hace decode+resize en una sola operación nativa.
// Peak de RAM = bitmap reducido (~2.5MB), nunca el archivo original (hasta 47MB+).
// Subimos a 1280px para que la IA tenga más detalle en el dibujo del neumático,
// manteniendo la compresión JPEG en 0.75 para equilibrar calidad vs. peso.
const compressFromFile = async (file: File): Promise<string> => {
  const MAX_WIDTH = 1280;
  const QUALITY = 0.75;

  const bitmap = await createImageBitmap(file, {
    resizeWidth: MAX_WIDTH,
    resizeQuality: 'high',
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
// El frame viene a la resolución real del track (hasta 1280×960).
// JPEG a 0.88 para mejor fidelidad del dibujo del neumático.
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
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  canvas.width = 0;
  canvas.height = 0;

  return dataUrl;
};

// ─── Activa autofoco continuo en el track de video (Android/Chrome) ───────────
// En Safari/iOS esta API no está expuesta, el catch lo maneja silenciosamente.
const applyAutoFocus = async (stream: MediaStream): Promise<void> => {
  const [track] = stream.getVideoTracks();
  if (!track) return;
  try {
    const caps = track.getCapabilities() as ExtendedMediaTrackCapabilities;
    if (caps?.focusMode && caps.focusMode.includes('continuous')) {
      await track.applyConstraints({
        advanced: [{ focusMode: 'continuous' }],
      } as ExtendedMediaTrackConstraintSet);
    }
  } catch {
    // silencioso — si el browser no lo soporta simplemente no aplica
  }
};

// ─── Enciende / apaga linterna (Android/Chrome) ───────────────────────────────
const applyTorch = async (stream: MediaStream, on: boolean): Promise<void> => {
  const [track] = stream.getVideoTracks();
  if (!track) return;
  try {
    const caps = track.getCapabilities() as ExtendedMediaTrackCapabilities;
    if (caps?.torch) {
      await track.applyConstraints({
        advanced: [{ torch: on }],
      } as ExtendedMediaTrackConstraintSet);
    }
  } catch {
    // silencioso
  }
};

// ─────────────────────────────────────────────────────────────────────────────

export const Scanner: React.FC<ScannerProps> = ({ onNavigate, photos, setPhotos }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ── Nuevos estados de enfoque ──────────────────────────────────────────────
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null); // null = inactivo

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detiene el stream y oculta el visor de cámara
  const stopStream = useCallback(() => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setTorchOn(false);
    setTorchAvailable(false);
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
  // Pedimos resolución más alta (1280×960) para mejor detalle del dibujo de la llanta.
  // El autofoco continuo se aplica después de obtener el stream.
  const handleOpenCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      streamRef.current = stream;

      // Autofoco continuo (Android/Chrome) — silencioso en iOS
      await applyAutoFocus(stream);

      // Detectar si hay linterna disponible
      const [track] = stream.getVideoTracks();
      if (track) {
        const caps = track.getCapabilities() as ExtendedMediaTrackCapabilities;
        setTorchAvailable(!!caps?.torch);
      }

      setIsCameraActive(true);
    } catch {
      setError('No se pudo acceder a la cámara. Verifica los permisos e intenta de nuevo.');
    }
  };

  // ── Tomar la foto del frame actual del video ───────────────────────────────
  // Espera 2 s de countdown para que el autofoco termine antes de disparar.
  // Si ya hay un countdown activo, lo cancela (permite reintentar).
  const handleCapture = () => {
    if (!videoRef.current) return;
    setError(null);

    // Si ya hay countdown corriendo, cancelarlo
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
      setCountdown(null);
      return;
    }

    // Inicia countdown: 2 → 1 → dispara
    setCountdown(2);

    const tick = (remaining: number) => {
      if (remaining <= 0) {
        setCountdown(null);
        countdownTimerRef.current = null;
        // Captura el frame
        try {
          const dataUrl = captureFromVideo(videoRef.current!);
          const newPhotos = [...photos];
          newPhotos[currentStep] = dataUrl;
          setPhotos(newPhotos);
          stopStream();
        } catch {
          setError('No se pudo capturar la foto. Intenta de nuevo.');
        }
        return;
      }
      setCountdown(remaining);
      countdownTimerRef.current = setTimeout(() => tick(remaining - 1), 1000);
    };

    countdownTimerRef.current = setTimeout(() => tick(1), 1000);
  };

  // ── Alternar linterna ─────────────────────────────────────────────────────
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const next = !torchOn;
    await applyTorch(streamRef.current, next);
    setTorchOn(next);
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

        {/* Logo oficial en modo cámara */}
        <div className="absolute top-4 left-4 z-10">
          <img
            src="/avante-logo-blanco.png"
            alt="AVANTE"
            className="h-8 w-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Linterna (solo visible si el dispositivo la soporta) */}
        {torchAvailable && (
          <button
            onClick={handleToggleTorch}
            aria-label={torchOn ? 'Apagar linterna' : 'Encender linterna'}
            className="absolute top-4 right-4 z-10 bg-black/50 rounded-full p-2 text-white text-xl"
          >
            {torchOn ? '🔦' : '💡'}
          </button>
        )}

        {/* Guía de encuadre */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md aspect-[4/3] border-4 border-dashed border-avante-green/70 rounded-2xl" />
          <p className="mt-4 font-bold text-white bg-black/50 px-3 py-1 rounded text-center">
            Enfoca la banda de rodadura de la {steps[currentStep]}
          </p>
        </div>

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white font-extrabold drop-shadow-lg"
              style={{ fontSize: '8rem', lineHeight: 1, textShadow: '0 0 20px rgba(0,0,0,0.8)' }}>
              {countdown}
            </span>
          </div>
        )}

        {error && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[90%] max-w-md p-3 bg-red-600/90 rounded-lg text-white text-sm text-center">
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
              disabled={countdown !== null}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCapture}
              variant="primary"
              className="flex-1 text-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <CameraIcon className="w-6 h-6" />
                {countdown !== null ? `Capturando… (${countdown}s)` : 'Tomar Foto'}
              </span>
            </Button>
          </div>
          <p className="text-center text-white/60 text-xs mt-3">
            Espera a que la imagen se vea nítida antes de disparar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">

        {/* Logo oficial + banner de marca */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/avante-logo.png"
            alt="AVANTE"
            className="h-14 w-auto object-contain mb-4"
          />
          <div className="w-full rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #003087 0%, #001a4d 100%)' }}>
            <div className="flex items-center gap-4 px-6 py-4">
              <img
                src="/avante-icono-blanco.png"
                alt=""
                aria-hidden="true"
                className="h-10 w-10 object-contain flex-shrink-0"
              />
              <div>
                <p className="text-white font-bold text-lg leading-tight">Escaneo de Llantas con IA</p>
                <p className="text-white/70 text-sm">Captura las 4 llantas para obtener tu diagnóstico</p>
              </div>
              <div className="ml-auto hidden sm:block">
                <span className="inline-block bg-[#ba0c2f] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Gratuito
                </span>
              </div>
            </div>
            <div className="h-1 bg-[#ba0c2f]" />
          </div>
        </div>

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
