import { db } from "~/server/db";
import { inngest } from "./client";
import { env } from "~/env";

export const generateSong = inngest.createFunction(
    {
        id: "generate-song", concurrency: {
            limit: 1,
            key: "event.data.userId",
        },
        onFailure: async ({ event, error }) => {
            await db.song.update({
                where: {
                    id: (event?.data?.event?.data as { songId: string }).songId,
                },
                data: {
                    status: "failed",
                },
            });
        },
    },
    { event: "generate-song-event" },
    async ({ event, step }) => {
        const { songId } = event.data as {
            songId: string,
            userId: string,
        };
        const { userId, credits, endpoint, body } = await step.run("check-credits", async () => {
            const song = await db.song.findFirstOrThrow({
                where: {
                    id: songId,
                },
                select: {
                    user: {
                        select: {
                            id: true,
                            credits: true,
                        }
                    },
                    prompt: true,
                    describedLyrics: true,
                    instrumental: true,
                    guidanceScale: true,
                    lyrics: true,
                    seed: true,
                    audioDuration: true,
                    fullDescribedSong: true,
                    inferenceStep: true,

                }
            })
            type RequestBody = {
                prompt?: string
                lyrics?: string
                guidance_scale?: number,
                seed?: number,
                audio_duration?: number,
                full_described_song?: string,
                infer_step?: number,
                instrumental?: boolean,
                described_lyrics?: string

            }
            let body: RequestBody = {}
            let endpoint = ""

            const commonParams = {
                guidance_scale: song.guidanceScale ?? 15.0,
                seed: song.seed ?? -1,
                audio_duration: song.audioDuration ?? 15.0,
                infer_step: song.inferenceStep ?? 60,
                instrumental: song.instrumental ?? false,
                described_lyrics: song.describedLyrics ?? "",
            }

            if (song.fullDescribedSong) {
                endpoint = env.GENERATE_FROM_DESCRIPTION;
                body = {
                    ...commonParams,
                    full_described_song: song.fullDescribedSong,
                }
            }

            else if (song.lyrics && song.prompt) {
                endpoint = env.GENERATE_FROM_LYRICS
                body = {
                    ...commonParams,
                    lyrics: song.lyrics,
                    prompt: song.prompt,
                }
            }
            else if (song.describedLyrics && song.prompt) {
                endpoint = env.GENERATE_FROM_DESCRIBED_LYRICS;
                body = {
                    ...commonParams,
                    described_lyrics: song.describedLyrics,
                    prompt: song.prompt,
                }
            }

            return { userId: song.user.id, credits: song.user.credits, endpoint, body }
        });
        if (credits > 0) {
            await step.run("set-status-processing", async () => {
                return await db.song.update({
                    where: {
                        id: songId,
                    },
                    data: {
                        status: "processing",
                    }
                })
            })

            const response = await step.fetch(endpoint, {
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                    "Modal-Key": env.MODAL_KEY,
                    "Modal-Secret": env.MODAL_SECRET
                }
            })
            await step.run("update-song-result", async () => {
                const responseData = response.ok ? (await response.json()) as { s3Key: string, cover_image_s3key: string, categories: string[] } : null;
                await db.song.update({
                    where: {
                        id: songId,
                    },
                    data: {
                        s3key: responseData?.s3Key,
                        thumbnailS3Key: responseData?.cover_image_s3key,
                        status: responseData ? "processed" : "failed",
                    }
                })
                if (responseData && responseData.categories.length > 0) {
                    await db.song.update({
                        where: {
                            id: songId,
                        },
                        data: {
                            categories: {
                                connectOrCreate: responseData.categories.map((categoryName) => ({
                                    where: {
                                        name: categoryName,
                                    },
                                    create: {
                                        name: categoryName,
                                    }
                                }))
                            }
                        }
                    })
                }

            })

            return await step.run("deduct-credits", async () => {
                await db.user.update({
                    where: {
                        id: userId,
                    },
                    data: {
                        credits: {
                            decrement: 1,
                        }
                    }
                })

            })

        } else {
            await step.run("set-status-no-credits", async () => {
                return await db.song.update({
                    where: {
                        id: songId,
                    },
                    data: {
                        status: "no credits",
                    }
                })
            })
        }
    },

);  