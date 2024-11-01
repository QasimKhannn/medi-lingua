"use client"
export const dynamic = "force-dynamic";

export const updateSessionRecords = (newRecord: { transcription: string; translation: string }) => {
    const existingRecords = JSON.parse(sessionStorage.getItem('translationRecords') || '[]');
    existingRecords.push(newRecord);
    sessionStorage.setItem('translationRecords', JSON.stringify(existingRecords));
};