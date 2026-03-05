
import { GoogleGenAI, Type } from "@google/genai";
import { Course, MajorCategory, Message } from "../types";

let ai: GoogleGenAI | null = null;
let currentApiKey: string = '';

function getAI(): GoogleGenAI {
  const storedKey = localStorage.getItem('gemini_api_key') || '';
  if (!storedKey) {
    throw new Error("API_KEY_MISSING");
  }
  if (!ai || storedKey !== currentApiKey) {
    currentApiKey = storedKey;
    ai = new GoogleGenAI({ apiKey: storedKey });
  }
  return ai;
}

export const geminiService = {
  setApiKey(key: string) {
    localStorage.setItem('gemini_api_key', key);
    currentApiKey = key;
    ai = new GoogleGenAI({ apiKey: key });
  },

  getApiKey(): string {
    return localStorage.getItem('gemini_api_key') || '';
  },

  hasApiKey(): boolean {
    return !!localStorage.getItem('gemini_api_key');
  },

  /**
   * 텍스트, 이미지, 파일 또는 URL을 분석하여 [대목차-중목차-소목차] 구조로 변환합니다.
   */
  async parseCurriculum(input: string | { data: string, mimeType: string }): Promise<Partial<Course>> {
    const isText = typeof input === 'string';
    const isUrl = isText && (input.startsWith('http://') || input.startsWith('https://'));

    let prompt = "";
    let tools: any[] = [];
    const modelName = isUrl ? 'gemini-3-pro-image-preview' : 'gemini-3-flash-preview';

    if (isUrl) {
      prompt = `다음 URL에 접속하여 강의 정보를 추출해주세요: ${input}.
      반드시 다음 구조의 JSON으로 응답하세요:
      - title: 강좌명
      - platform: 플랫폼
      - instructor: 강사명
      - curriculum: [대목차] 배열. 각 대목차는 title과 middles(중목차 배열)를 가짐.
      - middles: 각 중목차는 title과 minors(소목차 배열)를 가짐.
      - minors: 각 소목차는 단순 문자열 제목 배열.`;
      tools = [{ googleSearch: {} }];
    } else {
      prompt = `제공된 콘텐츠(이미지/문서)에서 3단계 계층 구조의 커리큘럼을 추출해주세요.
      이미지 예시 구조:
      1. 대목차 (예: "01. Intro: 왜 내 에이전트는...")
      2. 중목차 (예: "CH01. AI 에이전트와...")
      3. 소목차 (예: "01. 오리엔테이션...")

      반드시 다음 스키마를 따르는 JSON으로 응답하세요:
      {
        "title": "강좌명",
        "platform": "플랫폼명",
        "instructor": "강사명",
        "curriculum": [
          {
            "title": "대목차 제목",
            "middles": [
              {
                "title": "중목차 제목",
                "minors": ["소목차1", "소목차2"]
              }
            ]
          }
        ]
      }`;
    }

    const response = await getAI().models.generateContent({
      model: modelName,
      contents: isText
        ? prompt
        : { parts: [{ inlineData: input }, { text: prompt }] },
      config: {
        tools: tools,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            platform: { type: Type.STRING },
            instructor: { type: Type.STRING },
            curriculum: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  middles: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        minors: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        }
                      },
                      required: ["title", "minors"]
                    }
                  }
                },
                required: ["title", "middles"]
              }
            }
          },
          required: ["title", "curriculum"]
        }
      }
    });

    try {
      const parsed = JSON.parse(response.text || '{}');
      const formattedCurriculum: MajorCategory[] = (parsed.curriculum || []).map((major: any, i: number) => ({
        id: `major-${i}-${Date.now()}`,
        title: major.title,
        middles: (major.middles || []).map((middle: any, j: number) => ({
          id: `middle-${i}-${j}-${Date.now()}`,
          title: middle.title,
          minors: (middle.minors || []).map((minor: string, k: number) => ({
            id: `minor-${i}-${j}-${k}-${Date.now()}`,
            title: minor
          }))
        }))
      }));

      return {
        title: parsed.title || '분석된 강좌',
        platform: parsed.platform || '가져온 강좌',
        instructor: parsed.instructor || '미상',
        curriculum: formattedCurriculum
      };
    } catch (error) {
      console.error("Gemini 파싱 실패:", error);
      throw new Error("3단계 계층 구조 분석에 실패했습니다.");
    }
  },

  async getChatResponse(history: Message[], courses: Course[], userQuery: string): Promise<string> {
    const context = courses.map(c =>
      `강의: ${c.title}. 커리큘럼: ${c.curriculum.map(major =>
        `[대]${major.title}: ${major.middles.map(mid =>
          `[중]${mid.title}(소: ${mid.minors.map(min => min.title).join(', ')})`
        ).join('; ')}`
      ).join('\n')}`
    ).join('\n\n');

    const chatHistory = history.slice(1).map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }]
    }));

    const chat = getAI().chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `당신은 Onlinecurri AI입니다. 사용자의 3단계 계층 구조 강좌 데이터를 바탕으로 학습을 도와주세요.\n\n[보관 중인 강좌 정보]\n${context}`
      },
      history: chatHistory
    });

    const response = await chat.sendMessage({ message: userQuery });
    return response.text || "응답을 생성하지 못했습니다.";
  }
};
