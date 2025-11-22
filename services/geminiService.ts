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
        videoScript: { type: Type.STRING, description: "A 15-second video script/storyboard description" },
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

export const generateCampaign = async (
  inputText: string,
  inputImageBase64: string | null,
  inputUrl: string | null
): Promise<CampaignResult> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing. Please check your environment.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // System instruction to ensure expert persona and consistency
  const systemInstruction = `
    You are AdGen Master, a world-class Chief Marketing Officer and Creative Director.
    Your goal is to generate a cohesive, high-converting advertising campaign based on the user's input.
    
    Follow this workflow:
    1. ANALYZE the input (image, text, or URL content) to understand the product, features, and benefits.
    2. STRATEGIZE: Define the perfect audience and tone.
    3. GENERATE: Create copy, visuals, and scripts that strictly adhere to that strategy.
    
    Ensure the "Visual Prompt" matches the "Headline" in theme and mood.
    Ensure the "Video Script" is feasible for a 15-second social media ad (TikTok/Reels style).
  `;

  try {
    let modelName = 'gemini-2.5-flash';
    let contents: any = [];

    // Workflow logic based on input type
    if (inputUrl) {
      // Case 1: URL Input - Use Search Grounding to understand the page
      // Note: responseSchema cannot be used with googleSearch tools in the same request.
      // We use a 2-step process: 
      // 1. Analyze URL using Search Grounding (Text output)
      // 2. Generate Campaign using the analysis (JSON output)
      
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
          // No responseSchema here
        },
      });

      const searchAnalysis = searchResponse.text;

      modelName = 'gemini-2.5-flash';
      contents = [
        {
          role: 'user',
          parts: [{ text: `Generate a campaign based on this analysis: ${searchAnalysis}` }]
        }
      ];

    } else if (inputImageBase64) {
      // Case 2: Image Input - Multimodal analysis
      modelName = 'gemini-2.5-flash';
      contents = [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg", // Assuming JPEG for simplicity, real app should detect
                data: inputImageBase64
              }
            },
            { text: `Analyze this product image and generate a campaign. Context: ${inputText}` }
          ]
        }
      ];

    } else {
      // Case 3: Pure Text Input - High reasoning
      modelName = 'gemini-2.5-flash';
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

export const generateAdImage = async (prompt: string): Promise<string> => {
  // IMPORTANT: gemini-3-pro-image-preview requires a selected paid key.
  // The UI MUST call window.aistudio.openSelectKey() before calling this.
  
  // Re-initialize AI to ensure it picks up the selected key if it changed
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Using gemini-3-pro-image-preview for "Pro" quality images as requested
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error: any) {
    console.error("Image Gen Error", error);
    throw new Error("Failed to generate image: " + error.message);
  }
};

export const generateAdVideo = async (prompt: string): Promise<string> => {
  // IMPORTANT: Veo requires a selected paid key.
  // The UI MUST call window.aistudio.openSelectKey() before calling this.

  // Re-initialize AI to ensure it picks up the selected key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '1:1' // Matching the ad format
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    // Check for errors in the operation result
    if (operation.error) {
      throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video URI not found in response");

    // Fetch the actual video bytes using the key
    const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) throw new Error("Failed to download video bytes");
    
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);

  } catch (error: any) {
    console.error("Video Gen Error", error);
    throw new Error("Failed to generate video: " + error.message);
  }
};