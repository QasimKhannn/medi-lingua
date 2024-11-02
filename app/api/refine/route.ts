import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const { text, lang } = await request.json();

    if (!text || typeof text !== 'string') {
        return NextResponse.json({ error: 'Invalid input text.' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    try {
        const result = await model.generateContent(`Never generate extra content. Focus solely on correcting grammar and medical terminology while preserving the original language ${lang} in the following sentence. If the sentence is grammatically correct and uses proper medical terms, respond with nothing. If there are errors, provide only the corrected version without additional explanations in the original language ${lang}: ${text}`);
        const correctedText = result.response.text() || text;

        if (correctedText.trim() !== text.trim()) {
            return NextResponse.json({ correctedText }, { status: 200 });
        } else {
            return NextResponse.json({}, { status: 204 });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: `Error processing your request: ${errorMessage}` }, { status: 500 });
    }
}
