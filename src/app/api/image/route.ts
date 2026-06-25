import { HfInference } from "@huggingface/inference";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export const maxDuration = 60; // Image generation can take up to 60s

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    const { prompt, style, aspectRatio, negativePrompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400 });
    }

    const TIER_IMAGE_LIMITS: any = {
      "FREE": 3,
      "STUDENT": 50,
      "PLUS": 100,
      "PRO": 200,
      "EXPERT": 300,
      "PREMIUM": 500,
    };

    let dbUser = null;
    if (session?.user?.email) {
      dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (dbUser) {
        const now = new Date();
        const lastReset = new Date(dbUser.lastUsageReset);
        if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { dailyWordCount: 0, dailyImageCount: 0, lastUsageReset: now }
          });
        }

        const limit = TIER_IMAGE_LIMITS[dbUser.tier] || 3;
        if (dbUser.dailyImageCount >= limit) {
          return new Response(JSON.stringify(
            { error: `You have reached your daily limit of ${limit} images on the JNext ${dbUser.tier} plan. Please upgrade your subscription.` }
          ), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        await prisma.user.update({
          where: { id: dbUser.id },
          data: { dailyImageCount: { increment: 1 } }
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "Unauthorized. Please log in." }), { status: 401 });
    }

    // Advanced Prompt Engineering using Gemini
    // Translate from Indonesian/any language to English and expand into a highly descriptive 50-word prompt
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const googleProvider = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    const { text: enhancedByGemini } = await generateText({
      model: googleProvider("gemini-1.5-flash"),
      system: `You are an expert midjourney prompt engineer. The user will give you a short idea or prompt (which might be in Indonesian). 
      Your job is to translate it to English and expand it into a highly detailed, cinematic, hyper-realistic image generation prompt.
      Describe the subject, lighting, atmosphere, camera angle, and textures. Keep it under 50 words. Only output the final English prompt string, no markdown, no quotes, no conversational text.`,
      prompt: prompt,
    });

    const seed = Math.floor(Math.random() * 1000000);
    
    let enhancedPrompt = enhancedByGemini.trim();
    if (style === "Cinematic") {
      enhancedPrompt = `${enhancedPrompt}, cinematic lighting, highly detailed, dramatic, photorealistic, 8k resolution, shot on Arri Alexa, anamorphic lens flare, award winning cinematography`;
    } else if (style === "Anime / Manga") {
      enhancedPrompt = `${enhancedPrompt}, studio ghibli style, makoto shinkai, anime key visual, vibrant colors, beautiful lighting, highly detailed anime illustration, masterpiece`;
    } else if (style === "Digital Art") {
      enhancedPrompt = `${enhancedPrompt}, trending on artstation, concept art, vibrant, highly detailed digital painting, crisp lines, smooth shading, masterpiece`;
    } else if (style === "3D Render") {
      enhancedPrompt = `${enhancedPrompt}, octane render, unreal engine 5, ray tracing, incredibly detailed 3D, volumetric lighting, 8k textures, masterpiece`;
    } else {
      enhancedPrompt = `${enhancedPrompt}, masterpiece, award-winning, best quality, ultra-detailed, 8k resolution, photorealistic, highly detailed`;
    }

    if (negativePrompt) {
      enhancedPrompt += ` --no ${negativePrompt}`;
    }

    const finalPrompt = enhancedPrompt;
    
    let width = 1024;
    let height = 1024;
    
    if (aspectRatio === "16:9") {
      width = 1024;
      height = 576;
    } else if (aspectRatio === "9:16") {
      width = 576;
      height = 1024;
    }
    
    let finalImageUrl = "";

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (replicateToken) {
      const Replicate = (await import("replicate")).default;
      const replicate = new Replicate({
        auth: replicateToken,
      });

      console.log("Generating image with Replicate SDXL...");
      // For stability-ai/sdxl, the output is an array of image URLs
      const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt: finalPrompt,
            negative_prompt: negativePrompt || "",
            width: width,
            height: height,
            scheduler: "K_EULER",
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 50
          }
        }
      );
      
      if (Array.isArray(output) && output.length > 0) {
        finalImageUrl = output[0]; // SDXL returns an array of URLs
      }
    } 

    if (!finalImageUrl) {
      console.log("Falling back to Pollinations AI...");
      finalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?seed=${seed}&width=${width}&height=${height}&nologo=true&model=flux&enhance=false`;
    }

    // Save to database if user is logged in
    if (session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      
      if (dbUser) {
        await prisma.mediaItem.create({
          data: {
            userId: dbUser.id,
            type: "image",
            url: finalImageUrl,
            prompt: finalPrompt,
          },
        });
      }
    }

    return new Response(JSON.stringify({ imageUrl: finalImageUrl }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Image generation error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate image" }), { status: 500 });
  }
}
