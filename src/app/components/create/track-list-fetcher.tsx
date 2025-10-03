"use server";

import { headers } from "next/dist/server/request/headers";
import { getPresignedUrl } from "~/actions/generation";
import { auth } from "~/lib/auth";
import { db } from "~/server/db";
import { TrackList } from "./track-list";

export default async function TrackListFetcher() {
  const session = await auth.api.getSession({ headers: await headers() });
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // if (!session) {
  //   redirect("/auth/sigin-in");
  // }

  const song = await db.song.findMany({
    where: { userId: session?.user.id },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const songWithThumbnail = await Promise.all(
    song.map(async (song) => {
      const thumbnailUrl = song.thumbnailS3Key
        ? await getPresignedUrl(song.thumbnailS3Key)
        : null;
      return {
        id: song.id,
        title: song.title,
        createdAt: song.createdAt,
        instrumental: song.instrumental,
        prompt: song.prompt,
        lyrics: song.lyrics,
        describedLyrics: song.describedLyrics,
        fullDescribedSong: song.fullDescribedSong,
        thumbnailUrl,
        playUrl: null,
        status: song.status,
        createdByUserName: song.user.name,
        published: song.published,
      };
    }),
  );
  return <TrackList tracks={songWithThumbnail}></TrackList>;
}
