import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Music } from "lucide-react";
import { getPresignedUrl } from "~/actions/generation";
import { auth } from "~/lib/auth";
import { db } from "~/server/db";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user.id;

  const song = await db.song.findMany({
    where: {
      published: true,
    },
    include: {
      user: {
        select: { name: true },
      },
      _count: {
        select: {
          likes: true,
        },
      },
      categories: true,
      likes: userId
        ? {
            where: {
              userId,
            },
          }
        : false,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  const songsWithUrl = await Promise.all(
    song.map(async (song) => {
      const thumbnailS3Key = song.thumbnailS3Key
        ? await getPresignedUrl(song.thumbnailS3Key)
        : null;
      return { ...song, thumbnailS3Key };
    }),
  );

  const last2Days = new Date();
  last2Days.setDate(last2Days.getDate() - 2);

  const trendingSongs = songsWithUrl
    .filter((songs) => songs.createdAt >= last2Days)
    .slice(0, 10);

  const trendingSongsId = new Set(trendingSongs.map((songs) => songs.id));

  const categorizedSongs = songsWithUrl
    .filter(
      (songs) => !trendingSongsId.has(songs.id) && songs.categories.length > 0,
    )
    .reduce(
      (acc, song) => {
        const primaryCategory = song.categories[0];
        if (primaryCategory) {
          acc[primaryCategory.name] ??= [];
          if (acc[primaryCategory.name]!.length < 10) {
            acc[primaryCategory.name]!.push(song);
          }
        }
        return acc;
      },
      {} as Record<string, Array<(typeof songsWithUrl)[number]>>,
    );

  if (trendingSongs.length === 0 && Object.keys(categorizedSongs).length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Music className="text-muted-foreground size-20"></Music>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          No Music Here
        </h1>
        <p className="text-muted-foreground mt-2">
          There are no published songs yet
        </p>
      </div>
    );
  }
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold tracking-tight">Discover Music</h1>

      {trendingSongs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Trending</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {trendingSongs.map((song) => (
              <div key={song.id} className="group cursor-pointer">
                <div className="bg-muted aspect-square overflow-hidden rounded-lg">
                  {song.thumbnailS3Key ? (
                    <img
                      src={song.thumbnailS3Key}
                      alt={song.title ?? "Song"}
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Music className="text-muted-foreground size-8" />
                    </div>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-medium">{song.title ?? "Untitled"}</p>
                <p className="text-muted-foreground truncate text-xs">{song.user.name ?? "Unknown"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.entries(categorizedSongs).map(([category, songs]) => (
        <div key={category} className="mt-6">
          <h2 className="text-xl font-semibold">{category}</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {songs.map((song) => (
              <div key={song.id} className="group cursor-pointer">
                <div className="bg-muted aspect-square overflow-hidden rounded-lg">
                  {song.thumbnailS3Key ? (
                    <img
                      src={song.thumbnailS3Key}
                      alt={song.title ?? "Song"}
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Music className="text-muted-foreground size-8" />
                    </div>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-medium">{song.title ?? "Untitled"}</p>
                <p className="text-muted-foreground truncate text-xs">{song.user.name ?? "Unknown"}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
