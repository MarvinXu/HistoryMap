import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const eventSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      dateStr: { type: Type.STRING },
      location: {
        type: Type.OBJECT,
        properties: {
          lat: { type: Type.NUMBER },
          lng: { type: Type.NUMBER },
          name: { type: Type.STRING }
        },
        required: ["lat", "lng", "name"]
      }
    },
    required: ["id", "title", "description", "dateStr", "location"]
  }
};

export async function GET(request: Request) {
  if (!ai) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `查找并列举关于 "${query}" 的主要历史事件。请确保包含精确的经纬度坐标以便在地图上标注。日期 (dateStr) 字段必须包含年份：使用 YYYY-MM-DD 格式（例如 1990-04-03）；如果是公元前，请使用负数年份（例如 -221-01-01）；如果具体日期不详，仅提供年份（例如 1990 或 -221）。`,
      config: {
        systemInstruction: "你是一个专业的历史学家和地理学家。你的任务是根据用户的查询提供详细的历史事件列表。每个事件必须包含全球唯一的 ID、准确的地理坐标（经纬度）、标准日期字符串（dateStr，格式如 YYYY-MM-DD, YYYY, -YYYY）以及详细背景。请务必以 JSON 数组格式返回。",
        responseMimeType: "application/json",
        responseSchema: eventSchema,
      },
    });

    const text = response.text;
    if (!text) return NextResponse.json([]);
    
    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
