import { GoogleGenAI } from "@google/genai";
import { Question, CurrentAffairsDaily, CurrentAffairsArticle, Test } from "../types";
import { getDailyFocus } from "../data/syllabus";

// Initialize Gemini directly in frontend as per skill instructions
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing from environment. AI features will not work.");
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

function handleGeminiError(error: any, context: string) {
  console.error(`Gemini Error [${context}]:`, error);
  const errorMsg = error.error || error.message || String(error);
  
  const isQuotaExceeded = 
    errorMsg.includes('429') || 
    errorMsg.includes('RESOURCE_EXHAUSTED') || 
    error.status === 'RESOURCE_EXHAUSTED' ||
    error.error?.status === 'RESOURCE_EXHAUSTED';

  if (isQuotaExceeded) {
    throw new Error('GUJARATI_QUOTA_EXCEEDED');
  }
  
  throw error;
}

export async function generateCurrentAffairs(date: string): Promise<CurrentAffairsDaily> {
  const prompt = `Role: You are an elite Current Affairs Content Architect and Curriculum Expert for Gujarat State Government Exams, specifically tailored for the Gujarat Police Constable and PSI syllabus.
...
5. Strict Output: You must output ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json or any conversational text before or after the JSON.`;

  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            date: { type: "STRING" },
            total_news_count: { type: "INTEGER" },
            articles: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "INTEGER" },
                  category: { type: "STRING" },
                  headline_gu: { type: "STRING" },
                  details_gu: { type: "STRING" },
                  key_takeaway_for_exam: { type: "STRING" },
                  tags: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["id", "category", "headline_gu", "details_gu", "key_takeaway_for_exam", "tags"]
              }
            }
          },
          required: ["date", "total_news_count", "articles"]
        }
      }
    });

    return JSON.parse(result.text || '{}') as CurrentAffairsDaily;
  } catch (error) {
    handleGeminiError(error, "generateCurrentAffairs");
    throw error;
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
  const prompt = `Role: You are a distinguished Senior Professor from a world-class university (like Harvard), specialized in pedagogy and ${subject}. You are mentoring a student for the competitive Gujarat Police Constable Exam. 

Your objective is to provide a comprehensive, intellectually stimulating, yet perfectly clear study module in Gujarati. 

Pedagogical Principles:
1. Intellectual Rigor: Do not oversimplify. Explain the "Why" and the "How".
2. Multi-Layered Learning: Break down complex legal or scientific phenomena into first principles.
3. Engaging Narrative: Use elegant analogies to ground abstract concepts in reality.

Formatting Instructions (CRITICAL for Readability):
1. Use semantic headers (## and ###).
2. Use bolding (**term**) for key technical terms in Gujarati.
3. Use bullet points extensively for clarity.
4. Ensure a generous use of whitespace between sections.
5. All content must be in Gujarati and perfectly structured for mobile view.

Structure:
1. The Grand Concept: An introductory analogy that sets the stage.
2. The Academic Core: Detailed breakdown of facts, articles (if Law), and historical milestones (if History). Use structured lists.
3. Nuanced Distinctions: Clarify common misconceptions with academic precision.
4. The Scholar's Review: A concise wrap-up.
5. Quick Knowledge Check: 3 challenging MCQs with answers.

Subject: ${subject}
Topic: ${lessonTitle}

Render the output in clean Markdown.`;

  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
        topP: 0.9,
      }
    });
    
    let text = result.text || '';
    
    if (!text) {
      throw new Error("Empty response from AI");
    }
    
    // Clean up markdown if present
    if (text.startsWith('```markdown')) {
      text = text.replace('```markdown', '').replace('```', '');
    } else if (text.startsWith('```html')) {
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
  
  const SHARDED_PROMPT = `Role: Senior Examiner for the Gujarat State Selection Board.
Task: Construct a rigorous, syllabus-aligned 25-mark examination in Gujarati for the LRD (Constable) cadre.

Examination Focus (Topic Sharding):
- Constitution of India (${focus.constitution}): 7 Questions
- History of Gujarat (${focus.history}): 6 Questions
- Geography of Gujarat (${focus.geography}): 6 Questions
- General Science (${focus.science}): 6 Questions

Randomization Seed: ${randomSeed}
Academic Constraint: Do NOT repeat these topics: ${recentTopics.join(', ')}.

Technical Requirements:
1. Every question must have EXACTLY 4 plausible options.
2. Only 1 option must be academically correct.
3. Use professional administrative Gujarati.
4. Output Format: Valid JSON array.`;

  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: SHARDED_PROMPT }] }],
      config: {
        temperature: 0.6, // Increased for variety
        topK: 40,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              text: { type: "STRING" },
              options: { 
                type: "ARRAY", 
                items: { type: "STRING" },
                description: "Exactly 4 options"
              },
              correctAnswer: { type: "INTEGER", description: "Index of correct answer (0-3)" },
              subject: { type: "STRING" },
              topic: { type: "STRING" },
              difficulty: { type: "STRING", description: "easy, medium, or hard" }
            },
            required: ["id", "text", "options", "correctAnswer", "subject", "topic", "difficulty"]
          }
        }
      }
    });
    
    const questions = JSON.parse(result.text || '[]') as Question[];
    
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
  const prompt = `Role: Competitive Assessment Specialist.
Task: Generate 10 intellectually challenging MCQs in Gujarati for a high-stakes competitive match.

Topic: ${topic}
Exam Hierarchy: Gujarat Police Recruitment (LRD)

Specific Instructions:
1. Randomization: Use seed ${randomSeed}. The 10th question must be a "Cognitive Challenge" (scenario-based).
2. Diversity: Avoid ${recentTopics.join(', ')}.
3. Precision: Ensure each question reflects the official LRD syllabus standards.

Response Format: JSON array.`;

  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7, // Higher for duels to keep it unpredictable
        topK: 50,
        topP: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              text: { type: "STRING" },
              options: { 
                type: "ARRAY", 
                items: { type: "STRING" }
              },
              correctAnswer: { type: "INTEGER" },
              subject: { type: "STRING" },
              topic: { type: "STRING" },
              difficulty: { type: "STRING" }
            },
            required: ["id", "text", "options", "correctAnswer", "subject", "topic", "difficulty"]
          }
        }
      }
    });
    
    const questions = JSON.parse(result.text || '[]') as Question[];
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
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    return result.text || "વધુ મહેનત કરો અને આવતા વખતે વિજય મેળવો!";
  } catch (error) {
    handleGeminiError(error, "generatePostMatchCoach");
    return "તમારા નબળા મુદ્દાઓ પર ધ્યાન આપો અને ફરી પ્રયાસ કરો.";
  }
}

export async function generateQuestionExplanation(question: string, options: string[], correctAnswer: string, userChoice: string): Promise<string> {
  const prompt = `Role: You are a distinguished Professor specializing in academic mentoring for competitive exams. 

Context: A student has missed a question. Your task is to provide a "Harvard-style" debrief in Gujarati.

Question: "${question}"
Options: ${options.join(', ')}
Correct Answer: "${correctAnswer}"
Student's Incorrect Choice: "${userChoice}"

Objectives:
1. Validate the student's effort but clarify the logical gap.
2. Explain the fundamental principle behind the correct answer using a clear, elegant analogy.
3. Briefly explain why the chosen incorrect option was a reasonable but flawed deduction.
4. Use professional, encouraging Gujarati.

Format: Maximum 5 sentences. Use Markdown for emphasis.
Output ONLY the explanation in Gujarati.`;

  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.4
      }
    });
    
    return result.text || "સમજૂતી લોડ કરવામાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.";
  } catch (error) {
    handleGeminiError(error, "generateQuestionExplanation");
    return "સમજૂતી લોડ કરવામાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.";
  }
}

export async function explainCurrentAffairs(article: CurrentAffairsArticle): Promise<string> {
  const prompt = `Role: You are a distinguished Professor and subject matter expert for the Gujarat Police Exams. 

Task: Provide a "Harvard-style" academic briefing on the following news article, ensuring the student achieves conceptual mastery for their exam.

Article Headline: "${article.headline_gu}"
Article Details: "${article.details_gu}"
Exam Insights: "${article.key_takeaway_for_exam}"

Academic Structure:
1. **Contextual Significance**: Why does this matter in the larger framework of governance, law, or society?
2. **First Principles Analysis**: Break down the "Who, What, Where, When, Why" with intellectual depth.
3. **Scholar's Marginalia**: 2-3 critical static facts or historical parallels relevant to the syllabus.
4. **Pedagogical Anchor**: A memory technique or conceptual hook to ensure long-term retention.

Tone: Professional, intellectually stimulating, and supportive. Use Gujarati language exclusively.
Length: Detailed and structured (approx. 8-10 sentences).
Output strictly in Markdown.`;

  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3
      }
    });
    
    return result.text || "માફ કરશો, અત્યારે સમજૂતી ઉપલબ્ધ નથી.";
  } catch (error) {
    handleGeminiError(error, "explainCurrentAffairs");
    return "સમજૂતી લોડ કરવામાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.";
  }
}

export async function generateGKReadingMaterial(topic: string): Promise<string> {
  const prompt = `Role: You are a Senior Educational Content Architect and distinguished Professor. 

Task: Construct a "Master Class" reading module for the "Khakhi Path" application in Gujarati.

Topic: ${topic}

Your output must be a highly structured JSON object that follows this schema, emphasizing academic depth and clarity.

{
  "article_metadata": {
    "title": "[Master Title in Gujarati]",
    "reading_time": "5-7 mins",
    "category": "[History/Polity/Science]",
    "importance_level": "High (Academic Priority)"
  },
  "content_body": [
    {
      "section_title": "પરિચય અને પૃષ્ઠભૂમિ (Introduction & Context)",
      "content": "[Deeply analytical paragraph in Gujarati explaining the core principles]",
      "key_points": ["[Academic Insight 1]", "[Academic Insight 2]"]
    },
    {
      "section_title": "બૌદ્ધિક પાયો (Fundamental Principles)",
      "content": "[Detailed historical data or legal principles with professional depth]",
      "image_placeholder_suggestion": "[Analytical diagram or map description]"
    },
    {
      "section_title": "પરીક્ષાલક્ષી વિશ્લેષણ (Exam-Centric Synthesis)",
      "content": "[Strategic summary of what to keep in mind for the constable exam]",
      "highlight_box": "A critical 'Need to Know' fact."
    }
  ],
  "summary_footer": "[A professional, academic wrap-up]"
}

Style Guidelines:
1. Use formal, textbook-level Gujarati.
2. Maintain a "Harvard Professor" persona—rigorous yet clear.
3. Ensure every section has substantial pedagogical value.`;

  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.25,
        responseMimeType: "application/json",
      }
    });

    const data = JSON.parse(result.text || '{}');
    
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
