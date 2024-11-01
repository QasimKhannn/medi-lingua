"use client"
// components/SpeechToText.tsx
import { useState } from 'react';

interface SpeechToTextProps {
    onTranscribe: (transcript: string) => void;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ onTranscribe }) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            setError('Speech Recognition API is not supported in this browser.');
            return;
        }

        setError(null);
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            onTranscribe(transcript);
        };

        recognition.onerror = (event: any) => {
            setError(`Speech recognition error: ${event.error}`);
        };

        recognition.start();
    };

    return (
        <div>
            <button onClick={startListening} disabled={isListening} className="btn">
                {isListening ? 'Listening...' : 'Start Speaking'}
            </button>
            {error && <p className="text-red-500">{error}</p>}
        </div>
    );
};

export default SpeechToText;
