
import { GoogleGenAI, Type } from "@google/genai";
import { HistoricalEvent } from "../types";

// Fix: Always use a named parameter for apiKey and use process.env.API_KEY string directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const eventSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      // year removed
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

export const searchHistoryEvents = async (query: string): Promise<HistoricalEvent[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `查找并列举关于 "${query}" 的主要历史事件。请确保包含精确的经纬度坐标以便在地图上标注。日期 (dateStr) 字段必须包含年份：使用 YYYY-MM-DD 格式（例如 1990-04-03）；如果是公元前，请使用负数年份（例如 -221-01-01）；如果具体日期不详，仅提供年份（例如 1990 或 -221）。`,
      config: {
        systemInstruction: "你是一个专业的历史学家和地理学家。你的任务是根据用户的查询提供详细的历史事件列表。每个事件必须包含全球唯一的 ID、准确的地理坐标（经纬度）、标准日期字符串（dateStr，格式如 YYYY-MM-DD, YYYY, -YYYY）以及详细背景。请务必以 JSON 数组格式返回。",
        responseMimeType: "application/json",
        responseSchema: eventSchema,
      },
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as HistoricalEvent[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const fetchEventDetailsBatch = async (eventNames: string[]): Promise<HistoricalEvent[]> => {
  if (eventNames.length === 0) return [];

  try {
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
    if (!text) return [];

    return JSON.parse(text) as HistoricalEvent[];
  } catch (error) {
    console.error("Gemini Batch API Error:", error);
    throw error;
  }
};
