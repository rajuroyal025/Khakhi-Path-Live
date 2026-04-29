import { GoogleGenAI, Type } from "@google/genai";
import { Question, CurrentAffairsDaily, CurrentAffairsArticle, Test } from "../types";
import { getDailyFocus } from "../data/syllabus";

let genAI: GoogleGenAI | null = null;
const getAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing. AI features will be disabled.');
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

function handleGeminiError(error: any, context: string) {
  console.error(`Gemini Error [${context}]:`, error);
  const errorMsg = error.message || String(error);
  
  // Check for 429 or RESOURCE_EXHAUSTED in various error formats
  const isQuotaExceeded = 
    errorMsg.includes('429') || 
    errorMsg.includes('RESOURCE_EXHAUSTED') || 
    error.status === 'RESOURCE_EXHAUSTED' ||
    error.error?.status === 'RESOURCE_EXHAUSTED' ||
    error.error?.code === 429 ||
    error.error?.code === '429';

  if (isQuotaExceeded) {
    throw new Error('GUJARATI_QUOTA_EXCEEDED');
  }
  
  throw error;
}

export async function generateCurrentAffairs(date: string): Promise<CurrentAffairsDaily> {
  const prompt = `Role: You are an elite Current Affairs Content Architect and Curriculum Expert for Gujarat State Government Exams, specifically tailored for the Gujarat Police Constable and PSI syllabus.

Task: Generate a highly accurate, exam-focused daily current affairs briefing for today's date: ${date}.

Rules & Constraints:
1. Content Ratio: Exactly 60% of the news must be Gujarat-specific (state policies, appointments, local events, culture, geography). Exactly 40% must be National/International news highly relevant to India (defense, science, sports, national awards).
2. Exam Relevance: Filter out political gossip, celebrity news, or irrelevant crime. Only include news that has a high probability of being asked in an MCQ format for Constable/PSI exams.
3. Language: The output must be entirely in flawless, grammatically correct Gujarati.
4. Brevity: The details_gu section must be concise, bulleted, and take no more than 3-4 sentences to read.
5. Strict Output: You must output ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json or any conversational text before or after the JSON.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            total_news_count: { type: Type.INTEGER },
            articles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  category: { type: Type.STRING },
                  headline_gu: { type: Type.STRING },
                  details_gu: { type: Type.STRING },
                  key_takeaway_for_exam: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "category", "headline_gu", "details_gu", "key_takeaway_for_exam", "tags"]
              }
            }
          },
          required: ["date", "total_news_count", "articles"]
        }
      }
    });

    const text = response.text || '';
    return JSON.parse(text) as CurrentAffairsDaily;
  } catch (error) {
    handleGeminiError(error, "generateCurrentAffairs");
    throw error; // unreachable but satisfies TS
  }
}

// Memory of past topics (In a real app, this would come from Firestore)
let recentTopics: string[] = [];

export function updateExclusionList(topics: string[]) {
  recentTopics = [...new Set([...topics, ...recentTopics])].slice(0, 20);
}

const GENERATION_PROMPT = `Act as an expert examiner for the Gujarat Police LRD (Constable) exam. 
Generate 25 multiple choice questions in Gujarati based on the LRD syllabus:
- Indian Constitution (ભારતનું બંધારણ)
- History and Geography of Gujarat (ગુજરાતનો ઇતિહાસ અને ભૂગોળ)
- General Science (સામાન્ય વિજ્ઞાન)
- Current Affairs (વર્તમાન પ્રવાહો)
- Quantitative Aptitude (માત્રાત્મક યોગ્યતા)
- Reasoning (રીઝનીંગ)

Each question must have 4 options and exactly 1 correct answer.
CRITICAL RULE: You MUST generate EXACTLY 25 questions.

Respond strictly in valid JSON format. Do not include any other text, markdown formatting, or explanations outside of the JSON array.`;

export async function generateStudyContent(subject: string, lessonTitle: string): Promise<string> {
  const prompt = `You are an expert Gujarati assistant and tutor for the Police Constable Exam. Act as a teacher. The student is studying subject '${subject}' and has clicked on lesson topic '${lessonTitle}'.

Please generate a highly engaging, simple-to-understand study module in Gujarati.

Your outputs must be highly structured, perfectly aligned, and easy to read on a webpage.

Formatting Rules:
1. Use clear headings (using ## or ###).
2. Always use bullet points (* or -) for lists or multiple data points to ensure vertical alignment.
3. Keep paragraphs short and concise.
4. All responses must be entirely in the Gujarati language.
5. Do not output a single block of messy text; force line breaks where logical.
6. Make this content fully responsive. Ensure all containers use relative widths so it adapts perfectly to mobile, tablet, and desktop screens.

Structure it like this:
1. Concept Story: Start with a simple real-life example of why this topic matters to a common citizen.
2. Core Facts: Bullet points of the most important facts and articles that are frequently asked in exams.
3. Tricky Areas: Point out 1 or 2 things students usually get confused about.
4. Quick Test: 3 basic MCQs to test if they understood the text above.

Output exactly in Markdown format so I can render it properly on my learning portal.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    let text = response.text || '';
    
    // Clean up markdown if present
    if (text.startsWith('```html')) {
      text = text.replace('```html', '').replace('```', '');
    } else if (text.startsWith('```')) {
      text = text.replace('```', '').replace('```', '');
    }
    
    return text.trim();
  } catch (error) {
    handleGeminiError(error, "generateStudyContent");
    throw error;
  }
}

export async function generateDailyTest(): Promise<Question[]> {
  const focus = getDailyFocus(new Date());
  const randomSeed = Math.floor(Math.random() * 1000000);
  
  const SHARDED_PROMPT = `Act as an expert examiner for the Gujarat Police LRD (Constable) exam. 
Generate a 25-mark test in Gujarati.

TODAY'S STRICT FOCUS (Topic Sharding):
- 7 questions on: ${focus.constitution}
- 6 questions on: ${focus.history}
- 6 questions on: ${focus.geography}
- 6 questions on: ${focus.science}

CRITICAL EXCLUSION LIST (Negative Prompting):
Do NOT generate questions related to these recently covered topics: ${recentTopics.join(', ')}.

RANDOMIZATION STRATEGY:
Use seed ${randomSeed}. Start by picking a specific historical or scientific scenario related to the focus topics and derive at least 3 questions from it.

Each question must have 4 options and exactly 1 correct answer.
Respond strictly in valid JSON format.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: SHARDED_PROMPT }] }],
      config: {
        temperature: 0.6, // Increased for variety
        topK: 40,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Exactly 4 options"
              },
              correctAnswer: { type: Type.INTEGER, description: "Index of correct answer (0-3)" },
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING, description: "easy, medium, or hard" }
            },
            required: ["id", "text", "options", "correctAnswer", "subject", "topic", "difficulty"]
          }
        }
      }
    });
    
    const text = response.text || '';
    const questions = JSON.parse(text) as Question[];
    
    // Update exclusion list with new topics
    const newTopics = questions.map(q => q.topic);
    updateExclusionList(newTopics);
    
    return questions;
  } catch (error) {
    handleGeminiError(error, "generateDailyTest");
    throw error;
  }
}

export async function generateDuelQuestions(topic: string): Promise<Question[]> {
  const randomSeed = Math.floor(Math.random() * 1000000);
  const prompt = `Generate 10 highly balanced multiple choice questions in Gujarati for a competitive duel match.
Topic: ${topic}
Target Exam: Gujarat Police Constable (LRD)

RANDOMIZATION STRATEGY:
Use seed ${randomSeed}. Inject a "Joker" question as the final question (10th) which is a complex, scenario-based question.

CRITICAL EXCLUSION LIST:
Avoid these recently used sub-topics: ${recentTopics.join(', ')}.

Each question must have 4 options and exactly 1 correct answer.
The questions should range from easy to hard.

Respond strictly in valid JSON format.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7, // Higher for duels to keep it unpredictable
        topK: 50,
        topP: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.INTEGER },
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING }
            },
            required: ["id", "text", "options", "correctAnswer", "subject", "topic", "difficulty"]
          }
        }
      }
    });
    
    const questions = JSON.parse(response.text || '[]') as Question[];
    updateExclusionList(questions.map(q => q.topic));
    return questions;
  } catch (error) {
    handleGeminiError(error, "generateDuelQuestions");
    return [];
  }
}

export async function generatePostMatchCoach(missedQuestions: any[]): Promise<string> {
  if (missedQuestions.length === 0) {
    return "અદ્ભુત! તમે બધા પ્રશ્નોના સાચા જવાબ આપ્યા છે. તમે ખાખી માટે તૈયાર છો!";
  }

  const prompt = `Analyze these missed questions from a Police Constable exam duel and provide a highly specific 2-sentence summary in Gujarati to help the student improve.
  
Missed Questions:
${JSON.stringify(missedQuestions)}

Focus on the core concepts they need to review. Be encouraging but firm like a strict PSI instructor.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    return response.text || "વધુ મહેનત કરો અને આવતા વખતે વિજય મેળવો!";
  } catch (error) {
    handleGeminiError(error, "generatePostMatchCoach");
    return "તમારા નબળા મુદ્દાઓ પર ધ્યાન આપો અને ફરી પ્રયાસ કરો.";
  }
}

export async function generateQuestionExplanation(question: string, options: string[], correctAnswer: string, userChoice: string): Promise<string> {
  const prompt = `Role: You are an expert, encouraging professor mentoring students for the Gujarat Police Constable and PSI exams.

Task: The student has just answered a multiple-choice question incorrectly. Your job is to explain why their answer was wrong and why the correct answer is right, in a way that is incredibly easy to understand.

Question: "${question}"
Options: ${options.join(', ')}
Correct Answer: "${correctAnswer}"
Student's Incorrect Choice: "${userChoice}"

Guidelines:
1. Tone: Empathetic, supportive, and clear. Never make the student feel bad for guessing wrong.
2. Structure: 
   - State the correct answer clearly.
   - Explain why it is correct using a simple fact or analogy.
   - Briefly explain why the option they chose is a common misconception or incorrect.
3. Language: Provide the explanation in clear, conversational Gujarati so that complex legal or historical concepts are easy to grasp for everyone. Keep sentences short.
4. Formatting: Use Markdown for bolding key terms. Keep the total explanation under 4 sentences.

Output ONLY the explanation in Gujarati.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    return response.text || "સમજૂતી લોડ કરવામાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.";
  } catch (error) {
    handleGeminiError(error, "generateQuestionExplanation");
    return "સમજૂતી લોડ કરવામાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.";
  }
}

export async function explainCurrentAffairs(article: CurrentAffairsArticle): Promise<string> {
  const prompt = `Role: You are "Khakhi Path AI Tutor", an expert, friendly personal mentor specifically for Gujarat Police Constable and PSI aspirinats.
  
Task: Explain the following Current Affairs article in a deeply detailed yet simple way. Your goal is to make the student a "Master" of this topic for their exam.

Article Headline: "${article.headline_gu}"
Article Details: "${article.details_gu}"
Exam Insights: "${article.key_takeaway_for_exam}"

Guidelines for the Explanation:
1. Tone: Personal, friendly ("Personal Tutor"), and exam-oriented. Use "તમે" (You) and encourage them.
2. Language: Flawless Gujarati. Use simple analogies.
3. Structure (Markdown):
   - **શા માટે આ સમાચાર મહત્વના છે?** (Why this news matters): Explain the context.
   - **ઊંડાણપૂર્વક સમજૂતી** (In-depth Explanation): Explain the background (Who, What, Where, When, Why).
   - **પરીક્ષાલક્ષી વધારાની માહિતી** (Extra info for Exam): Add 2-3 related static facts (e.g., if it's about a district, mention its headquarters or a famous landmark).
   - **યાદ રાખવાની ટ્રીક** (Memory Trick): Give a simple trick or mnemonics if possible.
4. Formatting: Use Markdown (bold, headers, lists).
5. Length: Detailed (around 8-10 sentences).

Output ONLY the Gujarati explanation in Markdown.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    return response.text || "માફ કરશો, અત્યારે સમજૂતી ઉપલબ્ધ નથી.";
  } catch (error) {
    handleGeminiError(error, "explainCurrentAffairs");
    return "સમજૂતી લોડ કરવામાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.";
  }
}

export async function generateGKReadingMaterial(topic: string): Promise<string> {
  const prompt = `### ROLE: 
Senior Educational Content Architect & UI Content Specialist.

### TASK:
Generate comprehensive, structured reading material/study notes for the "Khakhi Path" application. 

### CONTEXT:
The material is for deep learning. It must be written in professional Gujarati, organized into logical sections with headings, and formatted for a clean, mobile-first reading experience (Apple/Google News style).

### TOPIC: 
${topic}

### OUTPUT FORMAT:
Output in a structured JSON format so it can be parsed into a beautiful "Reading Mode" UI.

{
  "article_metadata": {
    "title": "[Topic Title in Gujarati]",
    "reading_time": "5 mins",
    "category": "[e.g., History/Law]",
    "importance_level": "High (Exam Favorite)"
  },
  "content_body": [
    {
      "section_title": "પરિચય (Introduction)",
      "content": "[Comprehensive paragraph in Gujarati]",
      "key_points": ["Point 1", "Point 2", "Point 3"]
    },
    {
      "section_title": "મુખ્ય તથ્યો (Key Facts)",
      "content": "[Detailed historical or legal data]",
      "image_placeholder_suggestion": "[Describe a relevant map or diagram for this section]"
    },
    {
      "section_title": "યાદ રાખવા જેવું (Must Remember)",
      "content": "[A summary for quick revision before exams]",
      "highlight_box": "Special fact about this topic in Gujarat."
    }
  ],
  "summary_footer": "[A 2-sentence wrap-up]"
}

### STYLE GUIDELINES:
1. Use "Bullet Points" for readability.
2. Ensure the Gujarati is formal and accurate (Official Textbook Level).
3. Structure the data so it can be displayed with clean typography and plenty of whitespace.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Transform JSON to beautiful Markdown for the existing LessonView
    let markdown = `# ${data.article_metadata?.title || topic}\n\n`;
    markdown += `> **વાંચન સમય:** ${data.article_metadata?.reading_time || '5 મિનિટ'} | **કેટેગરી:** ${data.article_metadata?.category || 'સામાન્ય જ્ઞાન'} | **મહત્વ:** ${data.article_metadata?.importance_level || 'મહત્વનું'}\n\n`;
    
    if (Array.isArray(data.content_body)) {
      data.content_body.forEach((section: any) => {
        markdown += `## ${section.section_title}\n\n`;
        markdown += `${section.content}\n\n`;
        
        if (Array.isArray(section.key_points) && section.key_points.length > 0) {
          markdown += `### મુખ્ય મુદ્દાઓ:\n`;
          section.key_points.forEach((point: string) => {
            markdown += `- ${point}\n`;
          });
          markdown += `\n`;
        }
        
        if (section.highlight_box) {
          markdown += `> **📌 વિશેષ નોંધ:** ${section.highlight_box}\n\n`;
        }

        if (section.image_placeholder_suggestion) {
           markdown += `*💡 સૂચન: ${section.image_placeholder_suggestion}*\n\n`;
        }
      });
    }
    
    markdown += `---\n\n### સારાંશ\n${data.summary_footer || ''}`;
    
    return markdown;
  } catch (error) {
    handleGeminiError(error, "generateGKReadingMaterial");
    throw error;
  }
}
