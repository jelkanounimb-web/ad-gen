import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CampaignResult } from "../types";

// Define the JSON Schema for the structured output
const campaignSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    strategy: {
      type: Type.OBJECT,
      properties: {
        targetAudience: { type: Type.STRING, description: "The ideal customer profile" },
        toneOfVoice: { type: Type.STRING, description: "Adjectives describing the brand voice" },
        usp: { type: Type.STRING, description: "The main Unique Selling Proposition" },
        visualStyle: { type: Type.STRING, description: "Recommended color palette and visual vibe" },
      },
      required: ["targetAudience", "toneOfVoice", "usp", "visualStyle"],
    },
    adCopy: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING, description: "Punchy, high-converting headline" },
        hook: { type: Type.STRING, description: "First sentence to grab attention" },
        body: { type: Type.STRING, description: "Main ad text (1-2 paragraphs)" },
        cta: { type: Type.STRING, description: "Short, actionable Call to Action button text" },
      },
      required: ["headline", "hook", "body", "cta"],
    },
    creative: {
      type: Type.OBJECT,
      properties: {
        imagePrompt: { type: Type.STRING, description: "A highly detailed prompt for DALL-E 3, Midjourney or Gemini Image" },
        videoScript: { type: Type.STRING, description: "A visual description of the scene for a 15s video ad (focus on what is seen, not dialogue)" },
      },
      required: ["imagePrompt", "videoScript"],
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 10 high-intent keywords for SEO/PPC",
    },
  },
  required: ["strategy", "adCopy", "creative", "keywords"],
};

// Helper to retrieve the API Key
const getApiKey = (): string => {
  return process.env.API_KEY || "AIzaSyD_qntb1DrwL4mDGFLJ0wIrXzmZicKh6ZM";
};

export const generateCampaign = async (
  inputText: string,
  inputImageBase64: string | null,
  inputUrl: string | null
): Promise<CampaignResult> => {
  
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const systemInstruction = `
    You are AdGen Master, a world-class Chief Marketing Officer and Creative Director.
    Your goal is to generate a cohesive, high-converting advertising campaign based on the user's input.
    
    Follow this workflow:
    1. ANALYZE the input (image, text, or URL content) to understand the product, features, and benefits.
    2. STRATEGIZE: Define the perfect audience and tone.
    3. GENERATE: Create copy, visuals, and scripts that strictly adhere to that strategy.
    
    IMPORTANT FOR CREATIVE ASSETS:
    - "imagePrompt": Must be a descriptive visual prompt suitable for an AI image generator (lighting, composition, subject).
    - "videoScript": Must be a VISUAL description of a 5-10 second video clip. Do not write dialogue or camera directions like "Cut to". Write what the viewer sees (e.g., "A slow motion shot of the coffee pouring into a glass cup with steam rising, cinematic lighting").
  `;

  try {
    let modelName = 'gemini-2.5-flash';
    let contents: any = [];

    if (inputUrl) {
      const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `Analyze this website URL and provide a comprehensive summary of the product, target audience, and unique selling points: ${inputUrl}. Context provided by user: ${inputText}` }]
          }
        ],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const searchAnalysis = searchResponse.text;
      contents = [
        {
          role: 'user',
          parts: [{ text: `Generate a campaign based on this analysis: ${searchAnalysis}` }]
        }
      ];

    } else if (inputImageBase64) {
      contents = [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: inputImageBase64
              }
            },
            { text: `Analyze this product image and generate a campaign. Context: ${inputText}` }
          ]
        }
      ];

    } else {
      contents = [
        {
          role: 'user',
          parts: [{ text: `Generate a campaign for this product description: ${inputText}` }]
        }
      ];
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: campaignSchema,
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("No response generated from AI.");
    }

    const parsedData = JSON.parse(textResponse) as CampaignResult;
    return parsedData;

  } catch (error: any) {
    console.error("Campaign Generation Error:", error);
    throw new Error(error.message || "Failed to generate campaign");
  }
};

export const generateAdImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  try {
    // Clean up prompt to prevent safety blocks
    const cleanPrompt = prompt.replace(/nudity|violence|hate|blood/gi, "");
    
    // Enhance prompt for better advertising quality
    const enhancedPrompt = `${cleanPrompt}. Professional advertising photography, product shot, high detail, studio lighting, 8k resolution, sharp focus.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Image generation refused. The prompt may have triggered safety filters.");
  } catch (error: any) {
    console.error("Image Gen Error", error);
    const msg = error.message || "Unknown error";
    if (msg.includes("400") || msg.includes("REFUSAL")) {
        throw new Error("Prompt refused by safety filters. Please try a different visual description.");
    }
    throw new Error(`Failed to generate image: ${msg}`);
  }
};

export const generateAdVideo = async (prompt: string, aspectRatio: string = '16:9'): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    // Veo requires concise visual prompts. Scripts with dialogue often fail or produce poor results.
    // We truncate the prompt to the first 300 characters to keep it focused.
    const visualPrompt = prompt.length > 350 ? prompt.substring(0, 350) : prompt;
    
    const enhancedPrompt = `${visualPrompt}. Cinematic, photorealistic, high resolution, smooth motion, commercial advertisement style, 4k.`;

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: enhancedPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    // Polling with timeout protection
    const startTime = Date.now();
    const timeout = 180000; // 3 minutes timeout for video

    while (!operation.done) {
      if (Date.now() - startTime > timeout) {
        throw new Error("Video generation timed out. The server is busy.");
      }
      await new Promise(resolve => setTimeout(resolve, 8000)); // Poll every 8s
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    if (operation.error) {
      throw new Error(`Veo Error: ${operation.error.message}`);
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video URI not found in response");

    const videoResponse = await fetch(`${videoUri}&key=${apiKey}`);
    if (!videoResponse.ok) throw new Error("Failed to download video bytes");
    
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);

  } catch (error: any) {
    console.error("Video Gen Error", error);
    throw new Error(`Failed to generate video: ${error.message}`);
  }
};

export const generateBrandLogo = async (prompt: string): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt + ", vector graphic, minimal, white background, professional logo design",
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/png'
      }
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      throw new Error("No logo image generated.");
    }

    return `data:image/png;base64,${imageBytes}`;

  } catch (error: any) {
    console.error("Logo Gen Error", error);
    throw new Error("Failed to generate logo. " + error.message);
  }
};