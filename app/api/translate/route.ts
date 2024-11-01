// pages/api/translate.ts
import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const { text, targetLanguage } = await request.json();
    console.log('Received text:', text);
    console.log('Received targetLanguage:', targetLanguage);

    // Validate input
    if (!text || typeof text !== 'string') {
        return NextResponse.json({ message: 'Invalid input text.' }, { status: 400 });
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
        return NextResponse.json({ message: 'Invalid target language.' }, { status: 400 });
    }

    try {
        const response = await fetch(
            `https://translation.googleapis.com/language/translate/v2?key=${process.env.CLOUD_TRANSLATION_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: text,
                    target: targetLanguage,
                    format: 'text',
                }),
            }
        );

        const data = await response.json();
        console.log("DATAAAA", data)
        if (data.data && data.data.translations && data.data.translations[0].translatedText) {
            return NextResponse.json({ translatedText: data.data.translations[0].translatedText }, { status: 200 });
        } else {
            return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ error: `Translation error occurred ${error}` }, { status: 500 });
    }
}
