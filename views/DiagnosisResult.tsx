import React, { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { RiskChip } from '../components/RiskChip';
import { TireDiagnosis, RiskLevel, View } from '../types';
import { analyzeTires } from '../services/geminiService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avgHealth = (d: TireDiagnosis[]) =>
  d.length ? Math.round(d.reduce((s, t) => s + t.health, 0) / d.length) : 0;

const healthLabel = (h: number) => {
  if (h >= 70) return 'Buen estado general';
  if (h >= 40) return 'Requiere atención';
  return 'Estado crítico';
};

const healthScoreColor = (h: number) => {
  if (h >= 70) return 'text-green-300';
  if (h >= 40) return 'text-yellow-300';
  return 'text-red-300';
};

const tiresNeedingAttention = (d: TireDiagnosis[]) =>
  d.filter(
    t => t.health < 70 || t.alerts.some(a => a.risk === RiskLevel.High || a.risk === RiskLevel.Medium)
  ).length;

// ─── Loading ──────────────────────────────────────────────────────────────────

const LoadingScreen: React.FC = () => (
  <div className="text-center py-24">
    <div className="inline-block w-16 h-16 border-4 border-avante-blue border-t-transparent rounded-full animate-spin mb-6" />
    <h2 className="text-2xl font-bold text-avante-blue mb-2">Analizando tus llantas…</h2>
    <p className="text-avante-gray-200">
      Nuestra IA está revisando el estado de desgaste. Tarda unos segundos.
    </p>
  </div>
);

// ─── WhatsApp Gate: teaser + formulario ───────────────────────────────────────

interface GateProps {
  diagnosis: TireDiagnosis[];
  onUnlock: () => void;
}

const WhatsAppGate: React.FC<GateProps> = ({ diagnosis, onUnlock }) => {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const health = avgHealth(diagnosis);
  const attention = tiresNeedingAttention(diagnosis);

  const handleSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setErrorMsg('Ingresa un número válido (mínimo 10 dígitos).');
      return;
    }
    setErrorMsg('');
    setStatus('sending');

    // Enviamos el WhatsApp — si falla, igual desbloqueamos.
    // El número ya fue capturado; no penalizamos al usuario por un error de infraestructura.
    try {
      await fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits, diagnosis }),
      });
    } catch {
      // silencioso — igual abre el diagnóstico
    }

    onUnlock();
  };

  return (
    <div className="max-w-2xl mx-auto">

      {/* Teaser: score general */}
      <Card className="mb-6 bg-avante-blue text-white text-center py-8">
        <p className="text-base font-medium opacity-75 mb-1 uppercase tracking-wide">
          Tu diagnóstico está listo
        </p>
        <p className={`text-7xl font-extrabold mb-2 ${healthScoreColor(health)}`}>
          {health}%
        </p>
        <p className="text-xl font-bold">{healthLabel(health)}</p>
        {attention > 0 && (
          <p className="mt-3 opacity-80 text-sm">
            {attention} de 4 llantas {attention === 1 ? 'requiere' : 'requieren'} atención
          </p>
        )}
      </Card>

      {/* Preview borroso de los resultados detallados */}
      <div className="relative mb-6 overflow-hidden rounded-xl">
        <div className="blur-sm pointer-events-none select-none opacity-50 space-y-4">
          {[0, 1].map(i => (
            <Card key={i}>
              <div className="flex items-center gap-4 px-2">
                <div className="w-20 h-16 bg-avante-gray-300 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-avante-gray-300 rounded w-1/3" />
                  <div className="h-3 bg-avante-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-avante-gray-200 rounded w-1/2" />
                </div>
                <div className="text-3xl font-extrabold text-avante-gray-300 flex-shrink-0">
                  {diagnosis[i]?.health ?? '--'}%
                </div>
              </div>
            </Card>
          ))}
        </div>
        {/* Gradiente que disuelve el preview */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white pointer-events-none" />
      </div>

      {/* Formulario de captura */}
      <Card className="border-2 border-avante-blue shadow-lg">
        <div className="text-center mb-6">
          <span className="text-4xl">📱</span>
          <h3 className="text-xl font-bold text-avante-blue mt-3">
            Recibe tu diagnóstico completo por WhatsApp
          </h3>
          <p className="text-sm text-avante-gray-200 mt-1">
            Gratis · Inmediato · Sin spam
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Tu WhatsApp (ej. 5512345678)"
            className="flex-1 rounded-md border border-avante-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-avante-blue"
            disabled={status === 'sending'}
          />
          <Button
            onClick={handleSubmit}
            variant="primary"
            className="whitespace-nowrap px-6 py-3 text-base"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? 'Un momento…' : 'Ver diagnóstico →'}
          </Button>
        </div>

        {errorMsg && (
          <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
        )}

        <p className="mt-4 text-xs text-avante-gray-200 text-center">
          Solo usamos tu número para enviarte este diagnóstico. Sin spam, sin suscripciones.
        </p>
      </Card>
    </div>
  );
};

// ─── Tarjeta individual de llanta ─────────────────────────────────────────────

const TireDiagnosisCard: React.FC<{ diagnosis: TireDiagnosis; photo: string | null }> = ({
  diagnosis,
  photo,
}) => (
  <Card className="flex flex-col md:flex-row gap-6 items-start">
    <img
      src={photo || diagnosis.image}
      alt={`Llanta ${diagnosis.position}`}
      className="w-full md:w-1/3 h-auto object-cover rounded-lg"
    />
    <div className="flex-1">
      <h3 className="text-xl font-bold text-avante-blue">{diagnosis.position}</h3>
      <div className="mt-4 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-avante-gray-300">Salud de la llanta</span>
            <span className="text-sm font-bold text-avante-blue">{diagnosis.health}%</span>
          </div>
          <ProgressBar value={diagnosis.health} />
        </div>

        {diagnosis.alerts.map((alert, i) => (
          <div key={i} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <RiskChip level={alert.risk} />
              <p className="text-sm text-avante-gray-300">{alert.text}</p>
            </div>
          </div>
        ))}

        <p className="text-sm text-avante-gray-200">
          <span className="font-semibold text-avante-gray-300">Vida útil restante:</span>{' '}
          {diagnosis.lifeRemainingKm.min}–{diagnosis.lifeRemainingKm.max} km (
          {diagnosis.lifeRemainingMonths.min}–{diagnosis.lifeRemainingMonths.max} meses est.)
        </p>

        <div>
          <p className="text-sm font-semibold text-avante-gray-300 mb-2">
            Patrones de desgaste detectados:
          </p>
          <div className="flex flex-wrap gap-2">
            {diagnosis.wearPatterns.map(p => (
              <span
                key={p}
                className="bg-avante-gray-100 text-avante-gray-300 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </Card>
);

// ─── Diagnóstico completo (post-gate) ─────────────────────────────────────────

interface FullDiagnosisProps {
  diagnosis: TireDiagnosis[];
  scannedPhotos: (string | null)[];
  onNavigate: (view: View) => void;
}

const FullDiagnosis: React.FC<FullDiagnosisProps> = ({ diagnosis, scannedPhotos, onNavigate }) => {
  const health = avgHealth(diagnosis);
  return (
    <>
      <Card className="mb-10 bg-avante-blue text-white">
        <h2 className="text-2xl font-bold text-center">Resumen General</h2>
        <div className="mt-4 text-center">
          <p className="text-lg">
            Salud promedio de tus llantas:{' '}
            <span className="font-extrabold text-3xl">{health}%</span>
          </p>
        </div>
      </Card>

      <div className="space-y-8">
        {diagnosis.map((tire, i) => (
          <TireDiagnosisCard key={i} diagnosis={tire} photo={scannedPhotos[i] ?? null} />
        ))}
      </div>

      <div className="text-center mt-12 space-y-4">
        <p className="text-xs text-avante-gray-200">
          *Estimación orientativa basada en IA. No es una certificación técnica. Para una
          evaluación definitiva, agenda una inspección gratuita en tu sucursal AVANTE más cercana.
        </p>
        <div className="flex justify-center flex-wrap gap-4">
          <Button onClick={() => onNavigate('recommendations')} variant="primary" className="text-lg">
            Ver recomendaciones
          </Button>
          <Button onClick={() => onNavigate('assistant')} variant="secondary" className="text-lg">
            Hablar con un asesor IA
          </Button>
        </div>
      </div>
    </>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

interface DiagnosisResultProps {
  onNavigate: (view: View) => void;
  scannedPhotos: (string | null)[];
}

export const DiagnosisResult: React.FC<DiagnosisResultProps> = ({ onNavigate, scannedPhotos }) => {
  const [diagnosis, setDiagnosis] = useState<TireDiagnosis[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gateUnlocked, setGateUnlocked] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await analyzeTires(scannedPhotos);
        if (mounted) setDiagnosis(result);
      } catch (e) {
        console.error(e);
        if (mounted) setError('No pudimos analizar las imágenes. Intenta de nuevo.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-avante-blue text-center mb-4">
          Tu Diagnóstico AVANTE
        </h1>

        {/* 1. Analizando */}
        {loading && <LoadingScreen />}

        {/* 2. Error sin diagnóstico */}
        {!loading && error && !diagnosis && (
          <Card className="text-center py-8">
            <p className="text-avante-gray-300 mb-4">{error}</p>
            <Button onClick={() => onNavigate('scanner')} variant="secondary">
              Volver a escanear
            </Button>
          </Card>
        )}

        {/* 3. Gate — teaser + WhatsApp */}
        {!loading && diagnosis && !gateUnlocked && (
          <WhatsAppGate diagnosis={diagnosis} onUnlock={() => setGateUnlocked(true)} />
        )}

        {/* 4. Diagnóstico completo */}
        {!loading && diagnosis && gateUnlocked && (
          <FullDiagnosis
            diagnosis={diagnosis}
            scannedPhotos={scannedPhotos}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
};
