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

export async function POST(request: Request) {
  if (!ai) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const { eventNames } = await request.json();

    if (!eventNames || !Array.isArray(eventNames) || eventNames.length === 0) {
      return NextResponse.json([]);
    }

    const prompt = `
      我提供了一组历史事件名称，请为每一个事件补充详细的历史信息。
      
      事件列表:
      ${JSON.stringify(eventNames)}

      要求：
      1. **标题 (title)** 必须尽量保持我输入的名称，不要随意更改。
      2. 补全发生的 **日期 (dateStr)**：格式 YYYY-MM-DD。公元前用负号 (如 -221)。
      3. 提供精确的 **地理位置 (location)**，包含经纬度和地名。
      4. 生成一段简要的 **描述 (description)**。
      5. 如果某个输入不是历史事件，请尽力解释它可能指代的内容，或者如果完全无法识别，可以跳过。
      6. **id** 字段：为每个事件生成一个唯一的 ID，格式为 UUID。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "你是一个历史数据补全助手。接收用户输入的事件名称列表，返回标准的 JSON 数组。优先保留用户的输入作为标题。",
        responseMimeType: "application/json",
        responseSchema: eventSchema,
      },
    });

    const text = response.text;
    if (!text) return NextResponse.json([]);

    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini Batch API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
