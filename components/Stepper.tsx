
import React from 'react';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {stepIdx < currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-avante-green" />
                </div>
                <a href="#" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-avante-green hover:bg-avante-green-dark">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                  </svg>
                </a>
              </>
            ) : stepIdx === currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-avante-gray-100" />
                </div>
                <a href="#" className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-avante-blue bg-white" aria-current="step">
                  <span className="h-2.5 w-2.5 rounded-full bg-avante-blue" aria-hidden="true" />
                </a>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-avante-gray-100" />
                </div>
                <a href="#" className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-avante-gray-100 bg-white hover:border-avante-gray-200">
                   <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-avante-gray-200" aria-hidden="true" />
                </a>
              </>
            )}
             <span className="absolute top-10 w-max -ml-2 text-xs text-center text-avante-gray-300">{step}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
};
