"use client";

import {
  Download,
  MoreHorizontal,
  Music4,
  Pause,
  PlayIcon,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Card } from "~/components/ui/card";
import { usePlayerStore } from "~/store/use-player-store";
import { Button } from "./ui/button";
import { useEffect, useRef, useState } from "react";
import { Slider } from "~/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { DropdownMenuContent } from "~/components/ui/dropdown-menu";
import { toast } from "sonner";
import Image from "next/image";

export function SoundBar() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState(100);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const { track } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track?.url) return;

    const updateTime = () => setProgress(audio.currentTime);

    const updateDuration = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEventEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEventEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEventEnded);
    };
  }, [track]);

  useEffect(() => {
    if (audioRef.current) {
      //@typescript-eslint/no-unnecessary-type-assertion
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && track?.url) {
      setProgress(0);
      setDuration(0);
      audioRef.current.src = track.url;
      audioRef.current?.load();
    }
    const promisePlay = audioRef.current?.play();
    if (promisePlay) {
      promisePlay
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          toast.error("Error playing audio. Please try again.");
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        });
    }
  }, [track]);

  const playToggle = async () => {
    if (!audioRef.current || !track?.url) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      await audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formateTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = async (value: number[]) => {
    if (audioRef.current && value[0] !== undefined) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  if (!track) return null;

  return (
    <div className="px-4 pb-2">
      <Card className="bg-background/60 board relative w-full shrink-0 border-t py-0 backdrop-blur-md">
        <div className="space-y-2 p-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="bg-primary text-primary-foreground flex size-10 flex-shrink-0 items-center justify-center rounded-full">
                {track?.artwork ? (
                  <Image
                    src={track.artwork}
                    alt={track.title ?? "Track"}
                    className="size-full rounded-md object-cover"
                  />
                ) : (
                  <Music4 className="text-white" />
                )}
              </div>
              <div className="max-w-24 min-w-0 flex-1 md:max-w-full">
                <p className="truncate text-sm font-medium text-black">
                  {track?.title ?? "Unknown Track"}
                </p>
                <p className="text-muted-foreground truncate text-sm font-medium">
                  {track?.createdByUserName ?? "Unknown User"}
                </p>
              </div>
            </div>
            {/* center controls */}
            <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={playToggle}
                className="cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="size-4" />
                ) : (
                  <PlayIcon className="size-4" />
                )}
              </Button>
            </div>
            {/* additional controls */}
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-2">
                {volume > 0 ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setVolume(0)}
                    >
                      <Volume2 className="size-4" />
                    </Button>
                    <Slider
                      value={[volume]}
                      onValueChange={(value) => setVolume(value[0]!)}
                      step={1}
                      className="w-16"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setVolume(100)}
                    >
                      <VolumeX className="size-4" />
                    </Button>
                    <Slider
                      value={[volume]}
                      onValueChange={(value) => setVolume(value[0]!)}
                      step={1}
                      className="w-16"
                    />
                  </div>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!track?.url) return;

                        window.open(track?.url, "_blank");
                      }}
                    >
                      <Download className="mr-2 size-4 text-sm font-medium" />
                      Download
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          {/* progressbar for song */}
          <div className="flex items-center gap-1">
            <span className="bg-muted-forground w-8 text-right text-[10px] font-medium">
              {formateTime(progress)}
            </span>
            <Slider
              value={[progress]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="bg-muted-forground flex-1"
            />
            <span className="bg-muted-forground w-8 text-right text-[10px] font-medium">
              {formateTime(duration)}
            </span>
          </div>
        </div>
        {track?.url && (
          <audio
            ref={audioRef}
            src={track.url}
            preload="metadata"
            onLoadedMetadata={() =>
              setDuration(audioRef.current?.duration ?? 0)
            }
          />
        )}
      </Card>
    </div>
  );
}
