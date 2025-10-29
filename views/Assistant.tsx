
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { MOCK_INITIAL_CHAT } from '../constants';
import { ChatMessage, View } from '../types';
import { getAssistantResponse } from '../services/geminiService';

interface AssistantProps {
  onNavigate: (view: View) => void;
}

export const Assistant: React.FC<AssistantProps> = ({ onNavigate }) => {
    const [messages, setMessages] = useState<ChatMessage[]>(MOCK_INITIAL_CHAT);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => {
        if (inputValue.trim() === '' || isLoading) return;

        const userMessage: ChatMessage = { sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        const aiResponseText = await getAssistantResponse(inputValue, messages);
        const aiMessage: ChatMessage = { sender: 'assistant', text: aiResponseText };

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-avante-blue text-center mb-2">Tu llanta te habla</h1>
                <p className="text-center text-avante-gray-200 mb-8">Resuelve tus dudas con nuestro asesor IA.</p>
                <Card className="h-[70vh] flex flex-col">
                    <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'assistant' && <div className="w-8 h-8 rounded-full bg-avante-blue text-white flex items-center justify-center font-bold text-sm flex-shrink-0">IA</div>}
                                <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-avante-blue text-white rounded-br-none' : 'bg-avante-gray-100 text-avante-gray-300 rounded-bl-none'}`}>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                             <div className="flex items-end gap-2 justify-start">
                                <div className="w-8 h-8 rounded-full bg-avante-blue text-white flex items-center justify-center font-bold text-sm flex-shrink-0">IA</div>
                                <div className="max-w-xs p-3 rounded-2xl bg-avante-gray-100 text-avante-gray-300 rounded-bl-none">
                                    <div className="flex items-center space-x-1">
                                       <span className="h-2 w-2 bg-avante-blue rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                       <span className="h-2 w-2 bg-avante-blue rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                       <span className="h-2 w-2 bg-avante-blue rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <div className="flex gap-2">
                             <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Escribe tu respuesta..."
                                className="flex-1 block w-full rounded-md border-avante-gray-100 shadow-sm focus:border-avante-blue focus:ring-avante-blue sm:text-sm"
                                disabled={isLoading}
                            />
                            <Button onClick={handleSendMessage} disabled={isLoading}>Enviar</Button>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button onClick={() => onNavigate('booking')} className="text-xs bg-avante-gray-100 hover:bg-avante-gray-100/80 text-avante-blue font-semibold py-1 px-3 rounded-full">Agendar servicio</button>
                            <button onClick={() => onNavigate('recommendations')} className="text-xs bg-avante-gray-100 hover:bg-avante-gray-100/80 text-avante-blue font-semibold py-1 px-3 rounded-full">Ver comparación</button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
