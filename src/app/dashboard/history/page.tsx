import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

import { GlassCard } from "@/components/ui/GlassCard";
import { Image as ImageIcon, Video, History as HistoryIcon, Clock, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";

async function deleteMedia(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return;

  // Verify ownership before deleting
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (user) {
    await prisma.mediaItem.deleteMany({
      where: {
        id,
        userId: user.id
      }
    });
    revalidatePath("/dashboard/history");
  }
}

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="p-8 text-center text-muted-foreground mt-20">
        <p>Please log in to view your history.</p>
      </div>
    );
  }

  // Fetch the user's media items from the database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      mediaItems: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const mediaItems = user?.mediaItems || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your History</h1>
          <p className="text-sm text-muted-foreground">Everything you've generated so far.</p>
        </div>
      </div>

      {mediaItems.length === 0 ? (
        <GlassCard className="mt-12">
          <div className="text-center py-16 text-muted-foreground">
            <HistoryIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">You haven't generated any media yet.</p>
            <p className="text-sm mt-2">Head over to the Image Studio or Video Creator to get started!</p>
          </div>
        </GlassCard>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {mediaItems.map((item) => (
            <GlassCard key={item.id} hoverEffect className="overflow-hidden p-0 flex flex-col relative group break-inside-avoid">
              <div className="relative w-full bg-black/40 flex items-center justify-center">
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={item.prompt || "Generated image"}
                    className="w-full h-auto object-contain"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-auto object-contain"
                    controls
                  />
                )}
                <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-md p-1.5 rounded-md">
                  {item.type === "image" ? (
                    <ImageIcon className="w-4 h-4 text-pink-500" />
                  ) : (
                    <Video className="w-4 h-4 text-orange-500" />
                  )}
                </div>
                
                {/* Download Button Form */}
                <div className="absolute top-2 right-14 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={`/api/download?url=${encodeURIComponent(item.url)}`} className="bg-primary/80 hover:bg-primary text-white p-2 flex rounded-md backdrop-blur-md transition-colors shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </a>
                </div>

                {/* Delete Button Form */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <form action={deleteMedia}>
                    <input type="hidden" name="id" value={item.id} />
                    <button 
                      type="submit" 
                      className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-md backdrop-blur-md transition-colors shadow-lg"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm text-foreground line-clamp-3 flex-1 mb-4">
                  {item.prompt || "No prompt provided"}
                </p>
                <div className="flex items-center text-xs text-muted-foreground mt-auto">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
