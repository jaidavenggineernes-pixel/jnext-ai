import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export const maxDuration = 60; // Up to 60s

export async function POST(req: Request) {
  try {
    const { prompt, aspectRatio = "16:9" } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized. Please log in." }), { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!dbUser || dbUser.tier === "FREE") {
      return new Response(JSON.stringify({ 
        error: "Video Generation is not available on the Free plan. Please upgrade to JNext GO Student or higher to unlock AI Cinematic Renders." 
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Advanced Prompt Engineering using Gemini for Video Generation base image
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const googleProvider = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    let enhancedByGemini = prompt;
    try {
      const { text } = await generateText({
        model: googleProvider("gemini-1.5-flash"),
        system: `You are an expert cinematic director and prompt engineer for FLUX AI. The user will give you a scene description in any language. 
        Translate it to English and rewrite it into a highly detailed, natural language paragraph describing a dynamic, cinematic shot.
        Emphasize the exact subjects, the motion, the setting, lighting, and photorealism clearly. 
        DO NOT use comma-separated keywords like 'masterpiece, 8k, cinematic film still'. Keep it natural and concise (under 60 words). 
        Only output the final English prompt string.`,
        prompt: prompt,
      });
      if (text) enhancedByGemini = text;
    } catch (geminiError) {
      console.error("Gemini video enhancement failed, using raw prompt:", geminiError);
    }

    const seed = Math.floor(Math.random() * 1000000);
    const enhancedPrompt = `Cinematic action shot: ${enhancedByGemini.trim()}`;
    
    let width = 1024;
    let height = 576;
    
    if (aspectRatio === "1:1") {
      width = 1024;
      height = 1024;
    } else if (aspectRatio === "9:16") {
      width = 576;
      height = 1024;
    }

    let finalVideoUrl = "";
    let isMotionGraphics = true;

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    
    if (replicateToken) {
      const Replicate = (await import("replicate")).default;
      const replicate = new Replicate({
        auth: replicateToken,
      });

      console.log("Generating video with Replicate Zeroscope V2 XL...");
      try {
        const output = await replicate.run(
          "cjwbw/zeroscope_v2_xl:71996d331e8ede8ef7bd76eba9fae076d3181c4e9766946777174e2b027cd90e",
          {
            input: {
              prompt: enhancedPrompt,
              num_frames: 24,
              fps: 8,
              width: width,
              height: height,
              guidance_scale: 17.5,
              num_inference_steps: 50
            }
          }
        );
        
        if (Array.isArray(output) && output.length > 0) {
          finalVideoUrl = output[0]; // Zeroscope returns an array of URLs
          isMotionGraphics = false; // It's a real video now!
        }
      } catch (err: any) {
        console.error("Replicate Video Error:", err);
      }
    }

    // Fallback to Pollinations if no token or generation failed
    if (!finalVideoUrl) {
      console.log("Falling back to Pollinations AI (Motion Graphics)...");
      finalVideoUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?seed=${seed}&width=${width}&height=${height}&nologo=true&model=flux&enhance=false`;
      isMotionGraphics = true;
    }

    // Save to database if user is logged in
    if (session?.user?.email) {
      if (dbUser) {
        await prisma.mediaItem.create({
          data: {
            userId: dbUser.id,
            type: "video", // Still marked as video for history UI
            url: finalVideoUrl,
            prompt: prompt,
          },
        });
      }
    }

    // Return the URL and the type of media generated
    return NextResponse.json(
      { 
        videoUrl: finalVideoUrl,
        isMotionGraphics: isMotionGraphics,
        prompt
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Video generation error:", error);
    return NextResponse.json(
      { error: "Internal server error during generation." },
      { status: 500 }
    );
  }
}
