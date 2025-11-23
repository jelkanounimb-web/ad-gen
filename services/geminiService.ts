
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CampaignResult, AdCopy, CampaignStrategy, CreativeAssets, SocialPrompts, AdVariant, LandingPageContent, TargetLanguage } from "../types";

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
        imagePrompt: { type: Type.STRING, description: "A highly detailed prompt for DALL-E 3, Midjourney or Gemini Image (Always in English for best results)" },
        videoScript: { type: Type.STRING, description: "A visual description of the scene for a 15s video ad (Always in English for best results)" },
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

const adCopySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: "Punchy, high-converting headline" },
    hook: { type: Type.STRING, description: "First sentence to grab attention" },
    body: { type: Type.STRING, description: "Main ad text (1-2 paragraphs)" },
    cta: { type: Type.STRING, description: "Short, actionable Call to Action button text" },
  },
  required: ["headline", "hook", "body", "cta"],
};

const socialPromptsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    instagramStory: { type: Type.STRING, description: "Detailed visual prompt for a 9:16 Instagram Story (focus on stickers, polls, quick cuts)" },
    tikTok: { type: Type.STRING, description: "Detailed direction for a TikTok video (UGC style, trending audio suggestion, text overlays)" },
    youTubeShort: { type: Type.STRING, description: "Direction for a YouTube Short (educational or entertainment hook, clear value prop)" },
  },
  required: ["instagramStory", "tikTok", "youTubeShort"],
};

const adVariationsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    variations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          angle: { type: Type.STRING, description: "The marketing angle (must be one of: 'Pain & Problem', 'UGC / Social Proof', 'Educational / Authority', 'Contrarian / Curiosity', 'Irresistible Offer / FOMO')" },
          headline: { type: Type.STRING, description: "Headline optimized for the angle" },
          primaryText: { type: Type.STRING, description: "Main body text optimized for the platform mix" },
          platforms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Best platforms for this specific variation" }
        },
        required: ["angle", "headline", "primaryText", "platforms"]
      }
    }
  }
};

const landingPageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hero: { type: Type.OBJECT, properties: { headline: { type: Type.STRING }, subheadline: { type: Type.STRING }, cta: { type: Type.STRING } }, required: ["headline", "subheadline", "cta"] },
    trust: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, logos: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["title", "logos"] },
    problem: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, desc: { type: Type.STRING } }, required: ["title", "desc"] } } }, required: ["title", "items"] },
    solution: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, desc: { type: Type.STRING } }, required: ["title", "desc"] } } }, required: ["title", "items"] },
    howItWorks: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, steps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, desc: { type: Type.STRING } }, required: ["title", "desc"] } } }, required: ["title", "steps"] },
    socialProof: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, testimonials: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, role: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["name", "role", "text"] } } }, required: ["title", "testimonials"] },
    pricing: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, price: { type: Type.STRING }, period: { type: Type.STRING }, features: { type: Type.ARRAY, items: { type: Type.STRING } }, cta: { type: Type.STRING } }, required: ["title", "price", "period", "features", "cta"] },
    faq: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } }, required: ["question", "answer"] } } }, required: ["title", "items"] },
    footer: { type: Type.OBJECT, properties: { copyright: { type: Type.STRING }, links: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["copyright", "links"] },
  },
  required: ["hero", "trust", "problem", "solution", "howItWorks", "socialProof", "pricing", "faq", "footer"]
};

// Helper to retrieve the API Key
const getApiKey = (): string => {
  return process.env.API_KEY || 'AIzaSyD_qntb1DrwL4mDGFLJ0wIrXzmZicKh6ZM'; // Fallback to provided key
};

export const generateCampaign = async (
  inputText: string,
  inputImages: string[] | null,
  inputUrl: string | null,
  language: TargetLanguage = 'English'
): Promise<CampaignResult> => {
  
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const systemInstruction = `
    You are AdGen Master, a world-class Chief Marketing Officer and Creative Director.
    Your goal is to generate a cohesive, high-converting advertising campaign.
    
    IMPORTANT: OUTPUT LANGUAGE
    You MUST generate all public-facing text (Ad Copy, Keywords, Strategy details) in the following language: ${language}.

    Specific Instructions for Languages:
    - If 'Darija (Morocco)', use authentic Moroccan Darija (Maghrebi Arabic script mixed with Latin if appropriate for the brand context, but usually Arabic script for ads). It should sound natural and local.
    - If 'Français', use professional and persuasive French.
    - If 'العربية', use Modern Standard Arabic (MSA) or creative advertising Arabic.

    EXCEPTIONS (Always in English):
    - The 'imagePrompt' and 'videoScript' in the creative section MUST remain in ENGLISH to ensure compatibility with image/video generation models.

    Follow this workflow:
    1. ANALYZE the input (image, text, or URL content).
    2. STRATEGIZE: Define the perfect audience and tone in ${language}.
    3. GENERATE: Create copy in ${language}.
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
          parts: [{ text: `Generate a campaign in ${language} based on this analysis: ${searchAnalysis}` }]
        }
      ];

    } else if (inputImages && inputImages.length > 0) {
      const imageParts = inputImages.map(img => ({
          inlineData: {
              mimeType: "image/jpeg",
              data: img
          }
      }));

      contents = [
        {
          role: 'user',
          parts: [
            ...imageParts,
            { text: `Analyze these ${inputImages.length} product images and generate a campaign in ${language}. Context: ${inputText}` }
          ]
        }
      ];

    } else {
      contents = [
        {
          role: 'user',
          parts: [{ text: `Generate a campaign in ${language} for this product description: ${inputText}` }]
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
    // Inject the language into the result for downstream use
    parsedData.language = language;
    return parsedData;

  } catch (error: any) {
    console.error("Campaign Generation Error:", error);
    throw new Error(error.message || "Failed to generate campaign");
  }
};

export const generateLandingPage = async (campaign: CampaignResult): Promise<LandingPageContent> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const language = campaign.language || 'English';

  const prompt = `
    You are a CRO (Conversion Rate Optimization) Expert.
    
    Task: Create a High-Converting Landing Page structure for the product described below.
    This landing page must strictly align with the generated Ad Campaign.

    IMPORTANT: Generate all text content in **${language}**.
    ${language === 'Darija (Morocco)' ? 'Use authentic Moroccan Darija for headlines and copy.' : ''}

    CAMPAIGN CONTEXT:
    - USP: ${campaign.strategy.usp}
    - Audience: ${campaign.strategy.targetAudience}
    - Tone: ${campaign.strategy.toneOfVoice}
    - Ad Hook: ${campaign.adCopy.hook}

    REQUIREMENTS:
    1. HERO: Write a compelling H1 (Headline) and H2 (Subheadline) that matches the Ad Hook.
    2. PROBLEM: Identify 3 key pain points this audience faces.
    3. SOLUTION: Identify 3 key benefits/features that solve the problem.
    4. SOCIAL PROOF: Generate 3 realistic testimonials relevant to the target audience (Use names typical for the language/region).
    5. PRICING: Create a realistic pricing tier (Currency should match the region, e.g. MAD for Morocco if Darija).
    6. FAQ: 3 relevant questions and answers.

    Output pure JSON matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: landingPageSchema,
      },
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from AI for Landing Page");
    
    return JSON.parse(textResponse) as LandingPageContent;

  } catch (error: any) {
    console.error("Landing Page Gen Error", error);
    throw new Error("Failed to generate landing page content");
  }
};

export const regenerateAdCopy = async (
  strategy: CampaignStrategy,
  creative: CreativeAssets
): Promise<AdCopy> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `
    Rewrite the Ad Copy (Headline, Hook, Body, CTA) for this campaign.
    
    STRATEGY CONTEXT:
    - Target Audience: ${strategy.targetAudience}
    - Tone: ${strategy.toneOfVoice}
    - USP: ${strategy.usp}

    VISUAL CONTEXT (The copy must match this vibe):
    - Image Style: ${creative.imagePrompt}
    - Video Concept: ${creative.videoScript}

    Generate a FRESH, creative variation that is high-converting and persuasive.
    Detect the language from the strategy context and strictly output in the same language.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: adCopySchema,
      },
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from AI");
    
    return JSON.parse(textResponse) as AdCopy;
  } catch (error: any) {
    console.error("Copy Regeneration Error", error);
    throw new Error("Failed to regenerate ad copy");
  }
};

export const generateSocialPrompts = async (
  strategy: CampaignStrategy,
  creative: CreativeAssets
): Promise<SocialPrompts> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `
    You are a Social Media Content Strategist. 
    Based on the following campaign strategy and existing creative assets, generate highly specific creative directions/prompts for Instagram Stories, TikTok, and YouTube Shorts.
    
    CAMPAIGN STRATEGY:
    - Audience: ${strategy.targetAudience}
    - USP: ${strategy.usp}
    - Vibe: ${strategy.visualStyle}

    EXISTING ASSETS:
    - Base Image Concept: ${creative.imagePrompt}
    - Base Video Concept: ${creative.videoScript}

    TASK:
    Create 3 distinct adaptations. 
    Each adaptation must include:
    1. Visual Hook (first 3 seconds)
    2. Main Action/Content
    3. Audio/Text Overlay suggestions

    The content ideas should be culturally relevant to the target audience defined in the strategy.
    
    Output JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: socialPromptsSchema,
      },
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from AI");
    
    return JSON.parse(textResponse) as SocialPrompts;
  } catch (error: any) {
    console.error("Social Prompts Gen Error", error);
    throw new Error("Failed to generate social prompts");
  }
};

export const generateAdVariations = async (strategy: CampaignStrategy, currentCopy: AdCopy): Promise<AdVariant[]> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `
    You are an expert Ad Creative Strategist for the post-iOS14 era.
    Platforms like Meta Advantage+, Google Performance Max, and TikTok Smart Creative generally require 5 distinct psychological angles to optimize delivery.
    
    CONTEXT:
    - Product USP: ${strategy.usp}
    - Target Audience: ${strategy.targetAudience}
    - Baseline Copy: ${currentCopy.headline}

    TASK:
    Generate exactly 5 DISTINCT ad variations.
    IMPORTANT: Detect the language of the Baseline Copy/USP and generate the variations in the SAME language.

    Frameworks:
    1. 'Pain & Problem' (Focus on the struggle + Solution). 
    2. 'UGC / Social Proof' (Native, authentic, 'TikTok style'). 
    3. 'Educational / Authority' (Value first, 'How-to', Logical). 
    4. 'Contrarian / Curiosity' (Pattern interrupt, 'Stop doing this'). 
    5. 'Irresistible Offer / FOMO' (Urgency, Discount, Scarcity). 

    Output a JSON object with a "variations" array containing exactly these 5 items.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: adVariationsSchema,
      },
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from AI");
    
    const parsed = JSON.parse(textResponse);
    return parsed.variations as AdVariant[];

  } catch (error: any) {
    console.error("Variations Gen Error", error);
    throw new Error("Failed to generate ad variations");
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

export const generateImageVariations = async (prompt: string, aspectRatio: string = "1:1"): Promise<string[]> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const cleanPrompt = prompt.replace(/nudity|violence|hate|blood/gi, "");
    // Add "variation" context to prompt
    const enhancedPrompt = `${cleanPrompt}. Alternative composition, different angle, creative lighting variation, professional advertising photography.`;

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 3,
        aspectRatio: aspectRatio as any,
        outputMimeType: 'image/jpeg'
      }
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("No variation images generated.");
    }

    return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);

  } catch (error: any) {
    console.error("Image Variation Error", error);
    throw new Error("Failed to generate variations: " + error.message);
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
      model: 'veo-3.1-generate-preview',
      prompt: enhancedPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    // Polling with timeout protection (increased for standard Veo model)
    const startTime = Date.now();
    const timeout = 300000; // 5 minutes timeout for video

    while (!operation.done) {
      if (Date.now() - startTime > timeout) {
        throw new Error("Video generation timed out. The server is busy.");
      }
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10s
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
