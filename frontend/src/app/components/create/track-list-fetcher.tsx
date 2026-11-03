"use server";

import { headers } from "next/headers";
import { getSignedCoverUrl } from "~/server/storage";
import { auth } from "~/lib/auth";
import { db } from "~/server/db";
import { TrackList } from "./track-list";
import { redirect } from "next/navigation";

export default async function TrackListFetcher() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const song = await db.song.findMany({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const songWithThumbnail = song.map((song) => ({
    id: song.id,
    title: song.title,
    createdAt: song.createdAt,
    instrumental: song.instrumental,
    prompt: song.prompt,
    lyrics: song.lyrics,
    describedLyrics: song.describedLyrics,
    fullDescribedSong: song.fullDescribedSong,
    thumbnailUrl: song.thumbnailS3Key
      ? getSignedCoverUrl(song.thumbnailS3Key)
      : null,
    playUrl: null,
    status: song.status,
    createdByUserName: song.user.name,
    published: song.published,
  }));
  return <TrackList tracks={songWithThumbnail}></TrackList>;
}
