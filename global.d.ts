export { };

declare global {
    interface Window {
        webkitSpeechRecognition: typeof SpeechRecognition;
    }
    interface SpeechRecognitionEvent {
        results: SpeechRecognitionResultList;
    }
}