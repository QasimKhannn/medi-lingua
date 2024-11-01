"use client";
import { useCallback, useEffect, useState } from 'react';
import SpeechToText from '@/components/SpeechToText';
import InputLangsData from "@/data/input-lang.json"
import OutputLangsData from "@/data/output-lang.json"
import { updateSessionRecords } from '@/utils/session';
export const dynamic = "force-dynamic";

interface TranslationRecord {
  transcription: string;
  translation: string;
}

const Home: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [inputLang, setInputLang] = useState('en')
  const [outputLang, setOutputLang] = useState('en');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<SpeechSynthesisVoice[]>([]);

  const populateVoiceList = useCallback(() => {
    const synth = window.speechSynthesis;
    const availableVoices = synth.getVoices();
    if (availableVoices.length) {
      setVoices(availableVoices);
    } else {
      setTimeout(populateVoiceList, 100);
    }
  }, []);


  const handleTranscribe = async (text: string) => {
    setTranscript(text);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: outputLang }),
      });

      const data = await response.json();
      const translated = data.translatedText || 'Translation failed. Please try again.';
      setTranslatedText(translated);

      updateSessionRecords({ transcription: text, translation: translated });

    } catch {
      setTranslatedText('Translation error occurred.');
    }
  };

  const handleOutputLang = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOutputLang(e.target.value);
  };

  const handleInputLang = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInputLang(e.target.value);
  };

  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const synth = window.speechSynthesis;

      if (voices.length === 0) {
        console.error('No voices available for speech synthesis.');
        reject(new Error('No voices available.'));
        return;
      }

      if (!text.trim()) {
        console.error('No text provided for speech synthesis.');
        reject(new Error('No text provided.'));
        return;
      }

      const utterThis = new SpeechSynthesisUtterance(text);
      utterThis.lang = outputLang;
      utterThis.rate = 1;

      const selectedVoice = filteredVoices.find(voice => voice.lang.startsWith(outputLang));

      if (selectedVoice) {
        utterThis.voice = selectedVoice;
      } else {
        console.warn(`No voice found for language: ${outputLang}. Using first available voice.`);
        utterThis.voice = filteredVoices[0];
      }

      utterThis.onstart = () => console.log("Speech has started");
      utterThis.onend = () => {
        console.log("Speech has ended");
        resolve();
      };
      utterThis.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        reject(new Error(`Speech synthesis error: ${event.error}`))
      };

      synth.cancel();
      synth.speak(utterThis);
    });
  };

  useEffect(() => {
    populateVoiceList();
    window.speechSynthesis.onvoiceschanged = populateVoiceList;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [populateVoiceList]);

  useEffect(() => {
    const filtered = voices.filter(voice => voice.lang.startsWith(outputLang));
    setFilteredVoices(filtered);
  }, [voices, outputLang]);

  useEffect(() => {
    // This effect will only run in the browser
    if (typeof window !== 'undefined') {
      const savedRecords = JSON.parse(sessionStorage.getItem('translationRecords') || '[]');
      if (savedRecords.length) {
        console.log("Session Translation Records:", savedRecords); // Display them as needed in your UI
      }
    }
  }, []);

  return (
    <div className='grid grid-cols-4 w-full'>
      <div className="w-[95%] p-6 max-w-lg mx-auto space-y-6 bg-gray-50 shadow-md rounded-md col-span-4 md:col-span-2">
        <h1 className="text-3xl font-bold text-gray-800">Healthcare Translator</h1>
        <SpeechToText onTranscribe={handleTranscribe} inputLang={inputLang} />
        <div className="w-full space-y-4">
          <div>
            <div className="w-full">
              <label htmlFor="inputLang" className="block text-sm font-semibold text-gray-600">
                Input Language
              </label>
              <select
                id="inputLang"
                value={inputLang}
                onChange={handleInputLang}
                className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {InputLangsData.map((ipl, index) => {
                  return (
                    <option value={ipl.value} key={index}>{ipl.label}</option>
                  )
                })}
              </select>
            </div>
            <p className="p-2 mt-2 text-gray-900 bg-gray-200 rounded-md shadow-inner">{transcript ? transcript : "Transcription.."}</p>
          </div>
          <div>
            <div className="w-full">
              <label htmlFor="outputLang" className="block text-sm font-semibold text-gray-600">
                Output Language
              </label>
              <select
                id="outputLang"
                value={outputLang}
                onChange={handleOutputLang}
                className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {OutputLangsData.map((opl, index) => {
                  return (
                    <option value={opl.value} key={index}>{opl.label}</option>
                  )
                })}
              </select>
            </div>
            <p className="p-2 my-2 text-gray-900 bg-gray-200 rounded-md shadow-inner">{translatedText ? translatedText : "Translation.."}</p>
          </div>
          <button
            onClick={() => speakText(translatedText)}
            className="w-full px-4 py-2 mt-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Speak Translation
          </button>
        </div>
      </div>
      <div className="flex flex-col history-section md:col-span-2 col-span-4 justify-center items-center">
        <h2 className="text-xl font-semibold text-gray-300">Translation History</h2>
        <ul className='w-[80%]'>
          {typeof window !== 'undefined' && JSON.parse(sessionStorage.getItem('translationRecords') || '[]').map((record: TranslationRecord, index: number) => (
            <li key={index} className="p-2 mt-2 text-gray-900 bg-gray-200 rounded-md shadow-inner">
              <p><strong>Transcription:</strong> {record.transcription}</p>
              <p><strong>Translation:</strong> {record.translation}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
