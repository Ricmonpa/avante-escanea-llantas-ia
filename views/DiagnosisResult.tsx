import React, { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { RiskChip } from '../components/RiskChip';
import { TireDiagnosis, RiskLevel, View } from '../types';
import { analyzeTires } from '../services/geminiService';

const isCritical = (diagnosis: TireDiagnosis[]) =>
  diagnosis.some((t) => t.health < 40 || t.alerts.some((a) => a.risk === RiskLevel.High));

type AlertStatus = 'idle' | 'sending' | 'sent' | 'error';

const WhatsAppAlertBlock: React.FC<{ diagnosis: TireDiagnosis[] }> = ({ diagnosis }) => {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<AlertStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setErrorMsg('Ingresa un número válido (mínimo 10 dígitos).');
      return;
    }
    setErrorMsg('');
    setStatus('sending');
    try {
      const res = await fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits, diagnosis }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || data.error);
      setStatus('sent');
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al enviar. Intenta de nuevo.');
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <Card className="border-2 border-avante-green bg-green-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-bold text-avante-blue">Alerta enviada por WhatsApp</p>
            <p className="text-sm text-avante-gray-200">Recibirás el diagnóstico y el link para agendar tu cita.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-red-400 bg-red-50">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-bold text-red-700 text-lg">Desgaste crítico detectado</p>
          <p className="text-sm text-red-600">Una o más llantas representan un riesgo de seguridad. Te enviamos el diagnóstico y una propuesta de cambio por WhatsApp.</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Tu número (ej. 5512345678)"
          className="flex-1 rounded-md border border-red-300 px-3 py-2 text-sm focus:outline-none focus:border-avante-blue"
          disabled={status === 'sending'}
        />
        <Button
          onClick={handleSend}
          variant="primary"
          className="whitespace-nowrap"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Enviando…' : 'Enviar por WhatsApp'}
        </Button>
      </div>
      {(status === 'error' || errorMsg) && (
        <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
      )}
      <p className="mt-2 text-xs text-red-400">Solo usamos tu número para enviarte este diagnóstico.</p>
    </Card>
  );
};

interface DiagnosisResultProps {
  onNavigate: (view: View) => void;
  scannedPhotos: (string | null)[];
}

const TireDiagnosisCard: React.FC<{ diagnosis: TireDiagnosis, photo: string | null }> = ({ diagnosis, photo }) => (
    <Card className="flex flex-col md:flex-row gap-6 items-start">
        <img src={photo || diagnosis.image} alt={`Llanta ${diagnosis.position}`} className="w-full md:w-1/3 h-auto object-cover rounded-lg"/>
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

                {diagnosis.alerts.map((alert, index) => (
                    <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-start gap-3">
                            <RiskChip level={alert.risk} />
                            <p className="text-sm text-avante-gray-300">{alert.text}</p>
                        </div>
                    </div>
                ))}
                
                <div>
                    <p className="text-sm text-avante-gray-200"><span className="font-semibold text-avante-gray-300">Vida útil restante:</span> {diagnosis.lifeRemainingKm.min} - {diagnosis.lifeRemainingKm.max} km ({diagnosis.lifeRemainingMonths.min}-{diagnosis.lifeRemainingMonths.max} meses est.)</p>
                </div>

                <div>
                    <p className="text-sm font-semibold text-avante-gray-300 mb-2">Patrones de desgaste detectados:</p>
                    <div className="flex flex-wrap gap-2">
                        {diagnosis.wearPatterns.map(pattern => <span key={pattern} className="bg-avante-gray-100 text-avante-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">{pattern}</span>)}
                    </div>
                </div>
            </div>
        </div>
    </Card>
);

export const DiagnosisResult: React.FC<DiagnosisResultProps> = ({ onNavigate, scannedPhotos }) => {
    const [diagnosis, setDiagnosis] = useState<TireDiagnosis[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const result = await analyzeTires(scannedPhotos);
                if (mounted) setDiagnosis(result);
            } catch (e) {
                console.error(e);
                setError('No pudimos analizar las imágenes. Mostramos un diagnóstico de ejemplo.');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const dataToShow: TireDiagnosis[] = diagnosis || [];
    const overallHealth = dataToShow.length
        ? dataToShow.reduce((acc, tire) => acc + tire.health, 0) / dataToShow.length
        : 0;
    
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-extrabold text-avante-blue text-center mb-4">Tu Diagnóstico AVANTE</h1>
                <p className="text-center text-avante-gray-200 mb-10">Aquí está el análisis completo de la salud de tus llantas.</p>

                <Card className="mb-10 bg-avante-blue text-white">
                    <h2 className="text-2xl font-bold text-center">Resumen General</h2>
                    <div className="mt-4 text-center">
                        <p className="text-lg">Salud promedio de tus llantas: <span className="font-extrabold text-3xl">{Math.round(overallHealth)}%</span></p>
                        {loading && <p className="text-avante-gray-200 mt-2">Analizando tus llantas…</p>}
                        {error && <p className="text-avante-gray-200 mt-2">{error}</p>}
                    </div>
                </Card>

                <div className="space-y-8">
                    {loading && (
                        <Card><p className="text-avante-gray-300">Procesando imágenes…</p></Card>
                    )}
                    {!loading && dataToShow.map((tire, index) => (
                        <TireDiagnosisCard key={index} diagnosis={tire} photo={scannedPhotos[index]} />
                    ))}
                </div>

                {!loading && dataToShow.length > 0 && isCritical(dataToShow) && (
                    <div className="mt-8">
                        <WhatsAppAlertBlock diagnosis={dataToShow} />
                    </div>
                )}

                <div className="text-center mt-12 space-y-4">
                    <p className="text-xs text-avante-gray-200">
                        *Estimación orientativa basada en IA. No es una certificación técnica. Para una evaluación definitiva, agenda una inspección gratuita en tu sucursal AVANTE más cercana.
                    </p>
                    <div className="flex justify-center flex-wrap gap-4">
                        <Button onClick={() => onNavigate('recommendations')} variant="primary" className="text-lg">Ver recomendaciones</Button>
                        <Button onClick={() => onNavigate('assistant')} variant="secondary" className="text-lg">Hablar con un asesor IA</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};