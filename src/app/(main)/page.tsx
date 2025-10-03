import { Loader2, Music } from "lucide-react"; // @typescript-eslint/no-unused-vars
import { headers } from "next/headers";
import { Suspense } from "react"; // @typescript-eslint/no-unused-vars
import { getPresignedUrl } from "~/actions/generation"; // @typescript-eslint/no-unused-vars
import { SongPanel } from "~/app/components/create/song-panel"; // @typescript-eslint/no-unused-vars
import TrackListFetcher from "~/app/components/create/track-list-fetcher"; // @typescript-eslint/no-unused-vars
import { auth } from "~/lib/auth";
import { db } from "~/server/db"; // @typescript-eslint/no-unused-vars

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // if (!session) {
  //   redirect("/auth/sigin-in");
  // }

  const userId = session?.user.id; // @typescript-eslint/no-unused-vars

  // const song = await db.song.findMany({
  //   where: {
  //     published: true,
  //   },
  //   include: {
  //     user: {
  //       select: { name: true },
  //     },
  //     _count: {
  //       select: {
  //         likes: true,
  //       },
  //     },
  //     categories: true,
  //     likes: userId
  //       ? {
  //           where: {
  //             userId,
  //           },
  //         }
  //       : false,
  //   },
  //   orderBy: {
  //     createdAt: "desc",
  //   },
  //   take: 100,
  // });

  // const songsWithUrl = await Promise.all(
  //   song.map(async (song) => {
  //     const thumbnailS3Key = song.thumbnailS3Key
  //       ? await getPresignedUrl(song.thumbnailS3Key)
  //       : null;
  //     return { ...song, thumbnailS3Key };
  //   }),
  // );

  // // const last2Days = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  // const last2Days = new Date();
  // last2Days.setDate(last2Days.getDate() - 2);

  // const trendingSongs = songsWithUrl
  //   .filter((songs) => songs.createdAt >= last2Days)
  //   .splice(0, 10);

  // const trendingSongsId = new Set(trendingSongs.map((songs) => songs.id));

  // const categorizedSongs = songsWithUrl
  //   .filter(
  //     (songs) => !trendingSongsId.has(songs.id) && songs.categories.length > 0,
  //   )
  //   .reduce(
  //     (acc, song) => {
  //       const primaryCategory = song.categories[0];
  //       if (primaryCategory) {
  //         acc[primaryCategory.name] ??= [];
  //         if (acc[primaryCategory.name]!.length < 10) {
  //           acc[primaryCategory.name]!.push(song);
  //         }
  //       }
  //       return acc;
  //     },
  //     {} as Record<string, Array<(typeof songsWithUrl)[number]>>,
  //   );
  const trendingSongs = [0];
  const categorizedSongs = [0];
  if (trendingSongs.length === 0 && Object.keys(categorizedSongs)) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Music className="text-muted-foreground size-20"></Music>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          No Music Here
        </h1>
        <p className="text-muted-foreground mt-2">
          there are no published songs yet
        </p>
      </div>
    );
  }
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold tracking-tight">Discover Music </h1>

      {/* trending Songs */}
      {trendingSongs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold"> Trending</h2>
          <div className="gird-cols-2 mt-4 grid gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"></div>
        </div>
      )}
    </div>
  );
}
