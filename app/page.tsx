"use client";
import { useCallback, useEffect, useState } from 'react';
// export const dynamic = "force-dynamic";
import dynamic from 'next/dynamic';
const SpeechToText = dynamic(() => import('@/components/SpeechToText'), {
  ssr: false, // This will disable server-side rendering for this component
});
const SpeakingLoader = dynamic(() => import('@/components/loaders/speaking'), {
  ssr: false, // This will disable server-side rendering for this component
});
import InputLangsData from "@/data/input-lang.json"
import OutputLangsData from "@/data/output-lang.json"
import { updateSessionRecords } from '@/utils/session';
import { CirclePlay } from 'lucide-react';
import { format } from "date-fns"

export interface TranslationRecord {
  transcription: string;
  translation: string;
  timestamp: string;
  outputLang: string;
  inputLang: string;
}

const Home: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [inputLang, setInputLang] = useState('en')
  const [outputLang, setOutputLang] = useState('en');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      const record: TranslationRecord = {
        transcription: text,
        translation: translated,
        timestamp: format(new Date(), 'h:mm a'),
        outputLang: outputLang,
        inputLang: outputLang,
      };

      updateSessionRecords(record);

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

  const speakText = (text: string, index?: number, passedLang?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const synth = window.speechSynthesis;

      if (voices.length === 0) {
        console.error('No voices available for speech synthesis.');
        reject(new Error('No voices available.'));
        return;
      }

      if (!text.trim()) {
        console.error('No text provided for speech synthesis.');
        setError('Press mic and speak, before listening to translation.');
        reject(new Error('No text provided.'));
        return;
      }

      synth.cancel();

      const utterThis = new SpeechSynthesisUtterance(text);
      utterThis.lang = passedLang ? passedLang : outputLang;
      utterThis.rate = 1;

      const selectedVoice = filteredVoices.find(voice => voice.lang.startsWith(outputLang));

      if (selectedVoice) {
        utterThis.voice = selectedVoice;
      } else {
        console.warn(`No voice found for language: ${outputLang}. Using first available voice.`);
        utterThis.voice = voices[0];
      }

      utterThis.onstart = () => {
        if (index === undefined) {
          setIsSpeaking(true);
        }
        if (index !== undefined) {
          setPlayingIndex(index); // Update playing state
        }
      };
      utterThis.onend = () => {
        setIsSpeaking(false);
        setPlayingIndex(null); // Reset playing state
        resolve();
      };
      utterThis.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        reject(new Error(`Speech synthesis error: ${event.error}`))
      };

      synth.speak(utterThis);
    });
  };

  const handleSpeakTranslation = () => {
    if (!translatedText.trim()) {
      setError('Press mic and speak, before listening to translation.');
    } else {
      setError(null); // Clear error if there's text
      speakText(translatedText);
    }
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
      }
    }
  }, []);

  return (
    <div className='grid grid-cols-4 w-full'>
      <div className="w-[92%] p-6 max-w-lg mx-auto space-y-6 bg-gray-50 shadow-md rounded-md col-span-4 md:col-span-2">
        <p className="text-3xl font-extrabold text-gray-800">Medi Lingua</p>
        <p className="text-sm font-bold text-gray-700">Healthcare Translation Web App with Generative AI</p>
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
            <p className="p-2 mt-2 text-gray-900 bg-gray-200 rounded-md shadow-inner text-sm">{transcript ? transcript : "Transcription.."}</p>
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
            <p className="p-2 my-2 text-sm text-gray-900 bg-gray-200 rounded-md shadow-inner max-h-24 overflow-y-auto">{translatedText ? translatedText : "Translation.."}</p>
          </div>
          <button
            onClick={handleSpeakTranslation}
            className="w-full px-4 py-2 mt-2 text-white flex justify-center items-center bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {isSpeaking ? (
              <div className='h-5 flex justify-center items-center'>
                <SpeakingLoader color='white' />
              </div>
            ) : (
              <span className='flex flex-row gap-3 justify-center items-center'>
                Speak Translation
                <CirclePlay
                  size={20}
                  color='white'
                  className='cursor-pointer'
                />
              </span>
            )}
          </button>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
      <div className="p-3 max-w-lg mx-auto space-y-6 shadow-md rounded-md col-span-4 md:col-span-2">
        <h2 className="text-xl font-semibold text-gray-300">Translation History</h2>
        <ul className='w-96 max-h-[15rem] md:max-h-[28rem] overflow-y-auto px-2'>
          {typeof window !== 'undefined' && JSON.parse(sessionStorage.getItem('translationRecords') || '[]').map((record: TranslationRecord, index: number) => (
            <div className=' p-2 mt-2 grid grid-cols-12 rounded-md shadow-inner bg-gray-200' key={index}>
              <div className='col-span-10'>
                <li key={index} className="text-gray-900">
                  <p className='text-sm'><strong>Me({record.inputLang}):</strong> {record.transcription}</p>
                  <p className='text-sm'><strong>Translation({record.outputLang}):</strong> {record.translation}</p>
                </li>
              </div>
              <div className='col-span-2 flex justify-end flex-col items-end gap-2'>
                <p className='text-[10px] text-gray-500'>{record.timestamp}</p>
                {playingIndex === index ? (
                  <div className='h-5'>
                    <SpeakingLoader color='red' />
                  </div>
                ) : (
                  <CirclePlay
                    size={20}
                    color='blue'
                    className='cursor-pointer'
                    onClick={() => speakText(record.translation, index)}
                  />
                )}
              </div>
            </div>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
