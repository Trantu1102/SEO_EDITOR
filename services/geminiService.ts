
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ArticleData, SeoResult, ProofreadResult, UserSettings } from "../types";

/**
 * Get Client helper to create instance with latest key
 */
const getClient = (apiKey?: string) => {
  // STRICT PRIORITY: User Key > Environment Key
  const key = apiKey && apiKey.trim().length > 0 ? apiKey : process.env.API_KEY;
  
  if (!key) {
    throw new Error("API Key is missing. Please enter your key in Settings.");
  }
  
  // Debug log to confirm which key is active (safety check)
  const keySource = apiKey && apiKey.trim().length > 0 ? "Custom User Key" : "Default Env Key";
  const maskedKey = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : "Invalid Key";
  console.info(`[GeminiService] Using ${keySource}: ${maskedKey}`);

  return new GoogleGenAI({ apiKey: key });
};

/**
 * Helper to retry functions with exponential backoff on 429/500/Network errors
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>, 
  retries = 3, 
  delay = 2000
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || error?.code === 429 || error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED';
    
    // Check for 429 (Rate Limit), 5xx (Server Error), or generic Network/XHR errors
    const shouldRetry = (retries > 0) && (
        isRateLimit ||
        (error?.status && error.status >= 500) ||
        (error?.code && error.code >= 500) ||
        error?.message?.includes('500') ||
        error?.message?.includes('503') ||
        error?.message?.includes('xhr error') ||
        error?.message?.includes('network') ||
        error?.message?.includes('fetch failed')
    );

    if (shouldRetry) {
      console.warn(`API Error (${error?.message || error?.status}). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Helper function to split text into chunks of approximately `wordLimit` words.
 * It splits by paragraphs (\n) to preserve sentence integrity.
 */
const chunkTextHelper = (text: string, wordLimit: number = 1000): string[] => {
  if (!text) return [];
  
  const paragraphs = text.split('\n');
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const p of paragraphs) {
    const wCount = p.trim().length === 0 ? 0 : p.trim().split(/\s+/).length;
    
    if (currentWordCount + wCount > wordLimit && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
      currentChunk = [];
      currentWordCount = 0;
    }
    
    currentChunk.push(p);
    currentWordCount += wCount;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }

  return chunks;
};

/**
 * Post-processing to clean "False Positives" where the AI corrected a word to itself,
 * or got confused by footnotes like (1), (2).
 * 
 * CRITICAL UPDATE: Normalizes Unicode (NFC) to handle Vietnamese accent differences.
 */
const cleanFalsePositives = (html: string): string => {
  // Regex to find pattern: [original] <span ...>corrected</span>
  const regex = /\[(.*?)\]\s*<span[^>]*>(.*?)<\/span>/g;

  return html.replace(regex, (match, original, corrected) => {
    // 1. UNICODE NORMALIZATION (The "Silver Bullet" for Vietnamese text)
    // Converts both "o + ´" and "ó" to the same underlying character code.
    const normOriginal = original.trim().normalize('NFC');
    const normCorrected = corrected.trim().normalize('NFC');

    // 2. EXACT MATCH CHECK
    if (normOriginal === normCorrected) {
      return original;
    }

    // 3. CITATION/FOOTNOTE CHECK
    // Removes (1), [1], (12) from the end of the string for comparison
    const removeCitations = (s: string) => s.replace(/[\(\[]\d+[\)\]]$/, '').trim();
    
    if (removeCitations(normOriginal) === removeCitations(normCorrected)) {
       return original; 
    }

    // 4. IGNORE CASE DIFFERENCES FOR LIST ITEMS (Backup check)
    // If words are identical ignoring case, and it's not a known proper noun issue, ignore.
    if (normOriginal.toLowerCase() === normCorrected.toLowerCase()) {
        // Just return original to be safe, unless it's specifically about capitalization rules
        // For now, let's assume if content is identical letters, it's a false positive
        // unless it matches specific "Nhà nước" type rules. 
        // But since we have strict rules, we can trust the AI *mostly*, 
        // but this catches "Ngành" vs "ngành" if the AI hallucinated the error tag.
        
        // However, we want to catch "nhà nước" -> "Nhà nước".
        // So we only skip if the ORIGINAL was already capitalized correctly? 
        // Let's rely on the Identity Check above.
    }

    return match; // Keep the correction if it passed checks
  });
};

/**
 * Generates SEO content based on the n8n logic.
 */
export const generateSeo = async (data: ArticleData, settings: UserSettings): Promise<SeoResult> => {
  const prompt = `Hãy giúp tôi tạo nội dung SEO cho bài viết dưới đây theo đúng định dạng sau:

SEO Title: [tối đa 75 ký tự, viết hấp dẫn, khác tiêu đề gốc]
SEO Description: [tối đa 160 ký tự, mô tả ngắn gọn và thu hút] - Tránh keyword stuffing
SEO Keywords: [Tối đa 5 từ khóa quan trọng nhất, ngăn cách bằng dấu phẩy, không có ký tự đặc biệt] - Từ khóa chính từ title và nội dung

Trả về kết quả theo đúng định dạng:
SEO Title: [nội dung]
SEO Description: [nội dung] 
SEO Keywords: [nội dung] 

Không sử dụng ** hoặc các ký tự markdown.
Xuống dòng giữa các mục để tôi dễ copy.

Dưới đây là thông tin bài viết:
Tiêu đề gốc: [${data.title}]
Sapo: [${data.excerpt}]
Nội dung chính: [${data.content}]`;

  const parseSeoText = (text: string) => {
    const lines = text.split('\n');
    let title = "";
    let description = "";
    let keywords = "";

    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      if (lowerLine.startsWith('seo title:')) title = line.substring(10).trim();
      else if (lowerLine.startsWith('seo description:')) description = line.substring(16).trim();
      else if (lowerLine.startsWith('seo keywords:')) keywords = line.substring(13).trim();
    });

    title = title.replace(/^\[|\]$/g, '');
    description = description.replace(/^\[|\]$/g, '');
    keywords = keywords.replace(/^\[|\]$/g, '');
    
    return { title, description, keywords };
  };

  try {
    const ai = getClient(settings.apiKey);
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: settings.modelName,
      contents: prompt,
      config: {
        systemInstruction: settings.seoSystemInstruction,
        temperature: 0.7,
      }
    }));
    return parseSeoText(response.text || "");

  } catch (error) {
    console.warn("Primary SEO generation failed. Attempting fallback...", error);
    
    if (settings.modelName !== 'gemini-2.5-flash') {
       try {
         const ai = getClient(settings.apiKey);
         const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              systemInstruction: settings.seoSystemInstruction,
              temperature: 0.7,
            }
          }));
          return parseSeoText(response.text || "");
       } catch (fallbackError) {
          throw fallbackError;
       }
    }
    throw error;
  }
};

/**
 * Generates Proofreading content.
 */
export const generateProofread = async (data: ArticleData, settings: UserSettings): Promise<ProofreadResult> => {
  const fullText = `${data.title}\n\n${data.excerpt}\n\n${data.content}`;
  const chunks = chunkTextHelper(fullText, 1000);
  console.log(`Split article into ${chunks.length} chunks for processing.`);

  const processedChunks: string[] = [];

  try {
    const ai = getClient(settings.apiKey);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const prompt = `Hãy kiểm tra và sửa lỗi cho đoạn văn sau:\n\n${chunk}`;
      
      try {
        if (i > 0) {
            console.log("Waiting 1s before next chunk...");
            await new Promise(r => setTimeout(r, 1000));
        }

        const callApi = (model: string) => ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            systemInstruction: settings.proofreadSystemInstruction,
            temperature: 0, // Set to 0 for maximum determinism to reduce hallucinations
          }
        });

        let response: GenerateContentResponse;
        
        try {
           response = await retryWithBackoff(() => callApi(settings.modelName), 3, 2000);
        } catch (e) {
            console.warn(`Chunk ${i} failed with primary model. Trying fallback...`);
            if (settings.modelName !== 'gemini-2.5-flash') {
                 response = await retryWithBackoff(() => callApi('gemini-2.5-flash'), 3, 2000);
            } else {
                throw e;
            }
        }

        let correctedText = response.text || "";
        correctedText = correctedText.replace(/output\s*/gi, '').trim();
        
        // --- APPLY FALSE POSITIVE FILTER ---
        correctedText = cleanFalsePositives(correctedText);
        
        processedChunks.push(correctedText);
      } catch (chunkError) {
        console.error(`Error processing chunk ${i}:`, chunkError);
        processedChunks.push(
          `<div style="border:1px dashed orange; padding:8px; margin:8px 0; color: orange;">
             [Lỗi hệ thống: Không thể xử lý đoạn này do lỗi kết nối API. Giữ nguyên nội dung gốc bên dưới]
           </div><br/>${chunk.replace(/\n/g, '<br/>')}`
        );
      }
    }

    const finalHtml = processedChunks.join('\n\n').replace(/\n+/g, '<br/><br/>'); 

    return {
      original: fullText,
      correctedHtml: finalHtml
    };
  } catch (error) {
    console.error("Proofread Error:", error);
    throw new Error("Failed to proofread content. Check your API Key or quota.");
  }
};
