import React, { useState, useEffect } from 'react';
import { View } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Landing } from './views/Landing';
import { Scanner } from './views/Scanner';
import { Questionnaire } from './views/Questionnaire';
import { DiagnosisResult } from './views/DiagnosisResult';
import { Recommendations } from './views/Recommendations';
import { Assistant } from './views/Assistant';
import { Booking } from './views/Booking';
import { Confirmation } from './views/Confirmation';
import { Dashboard } from './views/Dashboard';
import { Fleets } from './views/Fleets';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [scannedPhotos, setScannedPhotos] = useState<(string | null)[]>(Array(4).fill(null));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const navigate = (view: View) => {
    setCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <Landing onNavigate={navigate} />;
      case 'scanner':
        return <Scanner onNavigate={navigate} photos={scannedPhotos} setPhotos={setScannedPhotos} />;
      case 'questionnaire':
        return <Questionnaire onNavigate={navigate} />;
      case 'diagnosis':
        return <DiagnosisResult onNavigate={navigate} scannedPhotos={scannedPhotos} />;
      case 'recommendations':
        return <Recommendations onNavigate={navigate} />;
      case 'assistant':
        return <Assistant onNavigate={navigate} />;
      case 'booking':
        return <Booking onNavigate={navigate} />;
      case 'confirmation':
        return <Confirmation onNavigate={navigate} />;
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />;
      case 'fleets':
        return <Fleets onNavigate={navigate} />;
      default:
        return <Landing onNavigate={navigate} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onNavigate={navigate} />
      <main className="flex-grow">
        {renderView()}
      </main>
      <Footer />
    </div>
  );
};

export default App;