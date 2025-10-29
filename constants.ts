
import { TireDiagnosis, RiskLevel, TireRecommendation, ChatMessage } from './types';

export const MOCK_DIAGNOSIS_DATA: TireDiagnosis[] = [
  {
    id: 1,
    position: 'Delantera Izquierda',
    health: 45,
    wearPatterns: ['Desgaste en borde externo'],
    alerts: [{ text: 'Requiere rotación y alineación urgente', risk: RiskLevel.High }],
    lifeRemainingKm: { min: 5000, max: 8000 },
    lifeRemainingMonths: { min: 3, max: 5 },
    recommendations: ['Rotación', 'Alineación'],
    image: 'https://picsum.photos/seed/tire1/400/300'
  },
  {
    id: 2,
    position: 'Delantera Derecha',
    health: 55,
    wearPatterns: ['Desgaste central'],
    alerts: [{ text: 'Presión de inflado podría ser incorrecta', risk: RiskLevel.Medium }],
    lifeRemainingKm: { min: 8000, max: 12000 },
    lifeRemainingMonths: { min: 5, max: 7 },
    recommendations: ['Revisar presión', 'Rotación'],
    image: 'https://picsum.photos/seed/tire2/400/300'
  },
  {
    id: 3,
    position: 'Trasera Izquierda',
    health: 80,
    wearPatterns: ['Desgaste regular'],
    alerts: [],
    lifeRemainingKm: { min: 25000, max: 30000 },
    lifeRemainingMonths: { min: 12, max: 18 },
    recommendations: ['Mantener monitoreo'],
    image: 'https://picsum.photos/seed/tire3/400/300'
  },
  {
    id: 4,
    position: 'Trasera Derecha',
    health: 75,
    wearPatterns: ['Desgaste regular'],
    alerts: [{ text: 'Revisión de balanceo sugerida', risk: RiskLevel.Low }],
    lifeRemainingKm: { min: 20000, max: 25000 },
    lifeRemainingMonths: { min: 10, max: 15 },
    recommendations: ['Balanceo'],
    image: 'https://picsum.photos/seed/tire4/400/300'
  },
];

export const MOCK_TIRE_RECOMMENDATIONS: TireRecommendation[] = [
    {
        id: 'AV-001',
        name: 'AVANTE ProGrip',
        image: 'https://picsum.photos/seed/newtire1/200/200',
        specs: { wetGrip: 5, noise: 68, fuel: 'B' },
        costPerKm: 0.15,
        price: 2500,
        availability: 'Inmediata en Suc. Revolución',
        installTime: 60,
    },
    {
        id: 'AV-002',
        name: 'AVANTE EcoTour',
        image: 'https://picsum.photos/seed/newtire2/200/200',
        specs: { wetGrip: 4, noise: 65, fuel: 'A' },
        costPerKm: 0.12,
        price: 2200,
        availability: 'Inmediata en Suc. Revolución',
        installTime: 60,
    },
    {
        id: 'AV-003',
        name: 'AVANTE AllTerrain',
        image: 'https://picsum.photos/seed/newtire3/200/200',
        specs: { wetGrip: 4, noise: 72, fuel: 'C' },
        costPerKm: 0.18,
        price: 2800,
        availability: 'Entrega en 24 hrs',
        installTime: 90,
    }
];

export const MOCK_INITIAL_CHAT: ChatMessage[] = [
    {
        sender: 'assistant',
        text: 'Hola, soy tu llanta delantera derecha. He analizado tu escaneo y los datos de tu vehículo. Veo un patrón de desgaste en el centro. ¿Sueles manejar más en ciudad o en carretera?'
    }
];
