"use client"
import { TranslationRecord } from "@/app/page";
export const dynamic = "force-dynamic";

export const updateSessionRecords = (newRecord: TranslationRecord) => {
    const existingRecords = JSON.parse(sessionStorage.getItem('translationRecords') || '[]');
    existingRecords.push(newRecord);
    sessionStorage.setItem('translationRecords', JSON.stringify(existingRecords));
};