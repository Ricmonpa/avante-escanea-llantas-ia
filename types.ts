
export type View = 
  | 'landing' 
  | 'scanner' 
  | 'questionnaire' 
  | 'diagnosis' 
  | 'recommendations' 
  | 'assistant' 
  | 'booking' 
  | 'confirmation' 
  | 'dashboard' 
  | 'fleets';

export enum RiskLevel {
  High = 'Alto',
  Medium = 'Medio',
  Low = 'Bajo',
  None = 'Ninguno'
}

export interface TireDiagnosis {
  id: number;
  position: string;
  health: number; // 0-100
  wearPatterns: string[];
  alerts: { text: string; risk: RiskLevel }[];
  lifeRemainingKm: { min: number; max: number };
  lifeRemainingMonths: { min: number; max: number };
  recommendations: string[];
  image: string;
}

export interface TireRecommendation {
  id: string;
  name: string;
  image: string;
  specs: {
    wetGrip: number; // 1-5
    noise: number; // dB
    fuel: 'A' | 'B' | 'C' | 'D' | 'E';
  };
  costPerKm: number;
  price: number;
  availability: string;
  installTime: number; // in minutes
}

export interface ChatMessage {
    sender: 'user' | 'assistant';
    text: string;
}
