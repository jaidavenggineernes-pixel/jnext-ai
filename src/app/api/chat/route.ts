import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60; // 60 seconds

const TIER_WORD_LIMITS: any = {
  "FREE": 300,
  "STUDENT": 5500,
  "PLUS": 8900,
  "PRO": 11000,
  "EXPERT": 15000,
  "PREMIUM": 19000,
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { messages, conversationId, userTime } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), { status: 400 });
    }

    let currentConversationId = conversationId;

    // Create a new conversation if it doesn't exist and user is logged in
    if (!currentConversationId && session?.user?.id) {
      const conv = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          title: messages[0].content.substring(0, 50) || "New Chat",
        }
      });
      currentConversationId = conv.id;
    }

    // --- SUBSCRIPTION LIMIT CHECK ---
    let dbUser = null;
    let wordLimit = 1000;
    
    if (session?.user?.email) {
      dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
      
      if (dbUser) {
        // Reset daily limits if more than 24 hours have passed
        const now = new Date();
        const lastReset = new Date(dbUser.lastUsageReset);
        if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { dailyWordCount: 0, dailyImageCount: 0, lastUsageReset: now }
          });
        }

        wordLimit = TIER_WORD_LIMITS[dbUser.tier] || 1000;
        const lastMessage = messages[messages.length - 1];
        const promptWordCount = lastMessage.content.split(/\s+/).length;

        if (dbUser.dailyWordCount + promptWordCount > wordLimit) {
          return new Response(JSON.stringify(
            { error: `You have reached your daily limit of ${wordLimit.toLocaleString()} words on the JNext ${dbUser.tier} plan. Please upgrade your subscription to continue.` }
          ), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        // Block multimodal features for FREE users
        const hasImages = messages.some((m: any) => 
          (Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image' || c.type === 'file')) ||
          (m.attachments && m.attachments.length > 0)
        );
        if (hasImages && dbUser.tier === "FREE") {
          return new Response(JSON.stringify({ 
            error: "Image and File Analysis is not available on the Free plan. Please upgrade to JNext GO Student or higher to unlock Multimodal AI." 
          }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        // Increment word count for the prompt
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { dailyWordCount: { increment: promptWordCount } }
        });
      }
    }

    // Save the user's message
    if (currentConversationId && session?.user?.id) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        await prisma.message.create({
          data: {
            conversationId: currentConversationId,
            role: "user",
            content: lastMessage.content,
          }
        });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey || apiKey.includes("your_token") || apiKey === "hf_invalid_123";

    if (isMock) {
      // Return a simulated stream since there is no API key
      const mockResponse = "Halo! Saya JNext Assistant (Mode Simulasi Gemini).\n\nKarena Anda belum memasukkan API Key Gemini di file `.env`, saya merespons menggunakan mode simulasi lokal otomatis.\n\nContoh blok kode:\n```javascript\nconsole.log('JNext is awesome!');\n```";
      
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const chunks = mockResponse.split(" ");
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk + " ")}\n`));
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          controller.close();
        }
      });
      
      return new Response(stream, { 
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Vercel-AI-Data-Stream': 'v1'
        }
      });
    }

    const googleProvider = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    const coreMessages = messages.map((msg: any) => {
      if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
        return {
          role: 'user',
          content: [
            { type: 'text', text: msg.content || '' },
            ...msg.attachments.map((att: any) => {
              // Vercel AI SDK Core requires the data URL or base64 for images
              if (att.mimeType.startsWith('image/')) {
                return { type: 'image', image: att.url };
              } else {
                return { type: 'file', data: att.url, mimeType: att.mimeType };
              }
            })
          ]
        };
      }
      return {
        role: msg.role,
        content: msg.content
      };
    });

    const result = streamText({
      model: googleProvider('gemini-2.5-flash'),
      messages: coreMessages,
      system: `You are JNext, an elite AI assistant and world-class senior software engineer created by JAIDAV. 
You possess deep, comprehensive knowledge of all programming languages, frameworks, and computer science concepts. 
Your goal is to provide the most optimal, secure, and elegant solutions. 

Guidelines:
1. Always think step-by-step and provide clear, highly structured, and accurate answers.
2. When writing code, provide complete, production-ready snippets with comments explaining complex logic. Do not leave placeholder comments like "add logic here" unless requested.
3. Be proactive: if a user asks for a simple website, provide a beautiful, modern layout with CSS/Tailwind included, not just basic HTML.
4. Communicate in a professional, warm, and highly intelligent tone. 
5. The user's current local date and time is ${userTime || new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}. Greet the user accordingly (e.g. Selamat Pagi, Selamat Siang, Selamat Sore, Selamat Malam) based on this time if it's the beginning of a conversation.
6. Answer in Indonesian (Bahasa Indonesia) by default, unless the user uses English. 
Always aim to exceed the user's expectations.`,
      onFinish: async ({ text }) => {
        // Save the assistant's response when finished
        if (currentConversationId && session?.user?.id && dbUser) {
          await prisma.message.create({
            data: {
              conversationId: currentConversationId,
              role: "assistant",
              content: text,
            }
          });
          
          await prisma.conversation.update({
            where: { id: currentConversationId },
            data: { updatedAt: new Date() }
          });

          // Charge for the generated response words
          const responseWordCount = text.split(/\s+/).length;
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { dailyWordCount: { increment: responseWordCount } }
          });
        }
      }
    });

    const responseHeaders = {
      'X-Conversation-Id': currentConversationId || ''
    };

    // Use UI Message Stream Response for latest Vercel AI SDK
    if (typeof (result as any).toUIMessageStreamResponse === "function") {
      return (result as any).toUIMessageStreamResponse({ headers: responseHeaders });
    } else if (typeof (result as any).toTextStreamResponse === "function") {
      return (result as any).toTextStreamResponse({ headers: responseHeaders });
    } else {
      throw new Error(`streamText result has no known stream response method. Keys: ${Object.keys(result).join(', ')}`);
    }
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat" }), { status: 500 });
  }
}
