import { NextRequest, NextResponse } from "next/server";

const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const GEMINI_TTS_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`;

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texte requis" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Cle API manquante" }, { status: 500 });
    }

    const res = await fetch(GEMINI_TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice || "Kore",
              },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini TTS error:", err);
      return NextResponse.json(
        { error: "Erreur de l'API Gemini TTS" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const audioData =
      data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      return NextResponse.json(
        { error: "Pas de donnees audio dans la reponse" },
        { status: 500 }
      );
    }

    return NextResponse.json({ audio: audioData });
  } catch (e) {
    console.error("TTS API error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
