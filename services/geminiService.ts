
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
    if (!this.hasApiKey()) {
      return this.getLocalResponse(courses, userQuery);
    }

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
  },

  getLocalResponse(courses: Course[], query: string): string {
    const q = query.toLowerCase();

    if (courses.length === 0) {
      return "현재 보관함에 등록된 강좌가 없습니다. 관리자가 강좌를 추가하면 여기서 확인하실 수 있어요!";
    }

    // 강좌 목록 질문
    if (q.match(/강좌|목록|리스트|어떤|뭐가|몇 개|몇개|전체|보관함|등록/)) {
      let reply = `현재 보관함에 ${courses.length}개의 강좌가 있습니다:\n\n`;
      courses.forEach((c, i) => {
        const progress = c.curriculum.length > 0
          ? ` (대목차 ${c.curriculum.length}개)`
          : '';
        reply += `${i + 1}. 📚 ${c.title}\n   플랫폼: ${c.platform} | 강사: ${c.instructor}${progress}\n`;
      });
      return reply;
    }

    // 특정 강좌 검색
    const matched = courses.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q) ||
      c.platform.toLowerCase().includes(q) ||
      q.includes(c.title.toLowerCase()) ||
      q.includes(c.instructor.toLowerCase())
    );

    if (matched.length > 0) {
      let reply = '';
      matched.forEach(c => {
        reply += `📚 **${c.title}**\n플랫폼: ${c.platform} | 강사: ${c.instructor}\n`;
        if (c.curriculum.length > 0) {
          reply += `\n커리큘럼 (${c.curriculum.length}개 대목차):\n`;
          c.curriculum.forEach((major, i) => {
            reply += `\n${i + 1}. ${major.title}`;
            if (major.middles?.length > 0) {
              major.middles.forEach(mid => {
                reply += `\n   ├ ${mid.title}`;
                if (mid.minors?.length > 0) {
                  mid.minors.forEach(min => {
                    reply += `\n   │  └ ${min.title}`;
                  });
                }
              });
            }
          });
        }
        reply += '\n\n';
      });
      return reply.trim();
    }

    // 커리큘럼/내용 질문
    if (q.match(/커리큘럼|목차|내용|구성|과목|챕터|chapter/)) {
      let reply = '보관 중인 강좌들의 커리큘럼입니다:\n\n';
      courses.forEach(c => {
        reply += `📚 ${c.title}\n`;
        if (c.curriculum.length > 0) {
          c.curriculum.forEach((major, i) => {
            reply += `  ${i + 1}. ${major.title}`;
            if (major.middles?.length > 0) {
              reply += ` (${major.middles.length}개 중목차)`;
            }
            reply += '\n';
          });
        } else {
          reply += '  (커리큘럼 정보 없음)\n';
        }
        reply += '\n';
      });
      return reply.trim();
    }

    // 플랫폼 질문
    if (q.match(/플랫폼|어디서|사이트/)) {
      const platforms = [...new Set(courses.map(c => c.platform))];
      let reply = `등록된 강좌의 플랫폼 목록:\n\n`;
      platforms.forEach(p => {
        const count = courses.filter(c => c.platform === p).length;
        reply += `• ${p} (${count}개 강좌)\n`;
      });
      return reply;
    }

    // 강사 질문
    if (q.match(/강사|선생|누가|누구/)) {
      const instructors = [...new Set(courses.map(c => c.instructor))];
      let reply = `등록된 강좌의 강사 목록:\n\n`;
      instructors.forEach(inst => {
        const instrCourses = courses.filter(c => c.instructor === inst);
        reply += `• ${inst}: ${instrCourses.map(c => c.title).join(', ')}\n`;
      });
      return reply;
    }

    // 기본 응답
    return `보관함에 ${courses.length}개의 강좌가 등록되어 있습니다. 궁금한 강좌명이나 키워드를 입력해보세요!\n\n예시 질문:\n• "어떤 강좌가 있어?"\n• "커리큘럼 알려줘"\n• "파이썬 강좌 있어?"\n• "강사 목록 알려줘"`;
  }
};
