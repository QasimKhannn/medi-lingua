// components/SpeechToText.tsx
"use client";
import { useState } from 'react';

export const dynamic = "force-dynamic";

interface SpeechToTextProps {
    onTranscribe: (transcript: string) => void;
    inputLang: string
}

interface SpeechRecognitionError extends Event {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    onstart: () => void;
    onend: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: Event) => void;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ onTranscribe, inputLang }) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            setError('Speech Recognition API is not supported in this browser.');
            return;
        }

        setError(null);
        const recognition = new (window as { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition();
        recognition.lang = inputLang;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = async (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            console.log("Transcribed Text: ", transcript); // Debugging line

            // Pass to AI for refinement
            const refinedText = await refineText(transcript);
            if (refinedText) {
                onTranscribe(refinedText); // Send corrected text to parent component
            } else {
                console.error("Refinement failed.");
            }
        };

        recognition.onerror = (event) => {
            const speechError = event as SpeechRecognitionError;
            setError(`Speech recognition error: ${speechError.error}`);
        };

        recognition.start();
    };

    // Function to refine the text using a generative AI model
    const refineText = async (text: string) => {
        try {
            const response = await fetch('/api/refine', {  // Adjust to your refine API endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, lang: inputLang }), // Send the transcribed text for refinement
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            console.log("Refined Data: ", data.correctedText); // Debugging line
            return data.correctedText; // Assuming your API returns refinedText in the response

        } catch (error) {
            console.error("Error during refinement: ", error);
            return null; // Handle errors gracefully
        }
    };

    return (
        <div className="flex flex-col items-center space-y-2">
            <button
                onClick={startListening}
                disabled={isListening}
                className={`flex items-center justify-center w-20 h-20 rounded-full transition-transform duration-200 
                      ${isListening ? "bg-red-500 animate-pulse scale-110" : "bg-blue-500 hover:bg-blue-600"}`}
            >
                🎤
            </button>
            {isListening && <p className="text-blue-500 font-medium">Listening...</p>}
            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
    );
};

export default SpeechToText;
