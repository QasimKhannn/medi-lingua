"use client"; // Indicate this component should be rendered on the client side
import { useCallback, useEffect, useState } from 'react';
import SpeechToText from '@/components/SpeechToText';
export const dynamic = "force-dynamic";

interface SessionEntry {
  original: string;
  translated: string;
}

const Home: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>([]);

  const populateVoiceList = useCallback(() => {
    const synth = window.speechSynthesis;
    const availableVoices = synth.getVoices();
    if (availableVoices.length) {
      setVoices(availableVoices);
    } else {
      setTimeout(populateVoiceList, 100); // Retry fetching voices
    }
  }, []);

  useEffect(() => {
    populateVoiceList();
    window.speechSynthesis.onvoiceschanged = populateVoiceList;

    const history = sessionStorage.getItem('sessionHistory');
    if (history) {
      setSessionHistory(JSON.parse(history));
    }

    return () => {
      window.speechSynthesis.onvoiceschanged = null; // Clean up
    };
  }, [populateVoiceList]);

  useEffect(() => {
    const filtered = voices.filter(voice => voice.lang.startsWith(targetLanguage));
    setFilteredVoices(filtered);
  }, [voices, targetLanguage]);

  const handleTranscribe = async (text: string) => {
    setTranscript(text);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, targetLanguage }),
      });

      const data = await response.json();

      setTranslatedText(data.translatedText || 'Translation failed. Please try again.');
      const translated = data.translatedText || 'Translation failed. Please try again.';

      setTranslatedText(translated);

      // Store in session history
      const newEntry = {
        original: text,
        translated,
      };
      const updatedHistory = [...sessionHistory, newEntry];
      setSessionHistory(updatedHistory);
      sessionStorage.setItem('sessionHistory', JSON.stringify(updatedHistory));
    } catch {
      setTranslatedText('Translation error occurred.');
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTargetLanguage(e.target.value);
  };

  const speakText = (text: string) => {

    const synth = window.speechSynthesis;

    // Check if voices are loaded
    if (voices.length === 0) {
      console.error('No voices available for speech synthesis.');
      return;
    }

    if (!text.trim()) {
      console.error('No text provided for speech synthesis.');
      return;
    }

    const utterThis = new SpeechSynthesisUtterance(text);
    utterThis.lang = targetLanguage; // Use selected language
    utterThis.rate = 1;

    const selectedVoice = voices.find(voice => voice.lang.startsWith(targetLanguage));
    if (!selectedVoice) {
      console.warn(`No voice found for language: ${targetLanguage}. Using default.`);
    }
    utterThis.voice = selectedVoice || voices[0]; // Fallback to first voice if none found

    // Event listeners for speech events
    utterThis.onstart = () => console.log("Speech has started");
    utterThis.onend = () => console.log("Speech has ended");
    utterThis.onerror = (event) => console.error("Speech synthesis error:", event.error);

    // Speak the text
    synth.speak(utterThis);
  };


  useEffect(() => {
    const synth = window.speechSynthesis;

    const populateVoiceList = () => {
      const availableVoices = synth.getVoices();
      if (availableVoices.length) {
        setVoices(availableVoices);
      } else {
        setTimeout(populateVoiceList, 100); // Retry fetching voices
      }
    };

    populateVoiceList();
    synth.onvoiceschanged = populateVoiceList;

    return () => {
      synth.onvoiceschanged = null; // Clean up
    };
  }, []);


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Healthcare Translation Web App</h1>
      <div className="mb-4">
        <label htmlFor="targetLanguage" className="block mb-2">Select Target Language:</label>
        <select
          id="targetLanguage"
          value={targetLanguage}
          onChange={handleLanguageChange}
          className="border p-2 rounded bg-black"
        >
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="zh">Chinese</option>
        </select>
      </div>
      <SpeechToText onTranscribe={handleTranscribe} />

      <div className="mt-4">
        <h2 className="text-xl font-semibold">Original Transcript:</h2>
        <p>{transcript}</p>

        <h2 className="text-xl font-semibold mt-4">Translated Text:</h2>
        <p>{translatedText}</p>
        <button onClick={() => {
          console.log(filteredVoices)
          speakText("problems hui hain")
        }} className="mt-4 btn">
          Speak Translated Text
        </button>
      </div>
    </div>
  );
};

export default Home;
