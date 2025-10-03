"use client";

import {
  Download,
  Loader2,
  MoreHorizontal,
  Music,
  Pencil,
  Play,
  RefreshCcw,
  Search,
  XCircle,
} from "lucide-react";
import { Input } from "../ui/input";
import { useState } from "react";
import { Button } from "../ui/button";
import { getPlayUrl } from "~/actions/generation";
import { Badge } from "../ui/badge";
import {
  downloadSong,
  onRenameTitle,
  setPublishedStatus,
} from "~/actions/song";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import RenameDialogue from "./rename-dialogue";
import { useRouter } from "next/router";
import { usePlayerStore } from "~/store/use-player-store";
import Image from "next/image";

export interface Track {
  id: string;
  title: string | null;
  createdAt: Date;
  instrumental: boolean;
  prompt: string | null;
  lyrics: string | null;
  describedLyrics: string | null;
  fullDescribedSong: string | null;
  thumbnailUrl: string | null;
  playUrl: string | null;
  status: string | null;
  createdByUserName: string | null;
  published: boolean | null;
}

export function TrackList({ tracks }: { tracks: Track[] }) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const [renameTrack, setRenameTrack] = useState<Track | null>(null);
  const router = useRouter();
  const setTrack = usePlayerStore((state) => state.setTrack);

  const filteredTracks = tracks.filter(
    (track) =>
      track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ??
      track.prompt?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const handleTrackSelect = async (track: Track) => {
    if (loadingTrackId) return; // Prevent multiple clicks
    setLoadingTrackId(track.id);
    const playUrl = await getPlayUrl(track.id);
    setLoadingTrackId(null);

    setTrack({
      id: track.id,
      title: track.title,
      instrumental: track.instrumental,
      url: playUrl,
      artwork: track.thumbnailUrl,
      prompt: track.prompt,
      createdByUserName: track.createdByUserName,
    });
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // await handleTrackSelect(renameTrack!);
    router.reload();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-scroll">
      <div className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              className="pl-10"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              disabled
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2" />
              )}
              Refresh
            </Button>
          </div>
          {/* TrackList */}
          <div className="text-muted-foreground text-sm">
            {filteredTracks.length > 0 ? (
              filteredTracks.map((track) => {
                switch (track.status) {
                  case "failed":
                    return (
                      <div
                        key={track.id}
                        className="mb-2 flex cursor-not-allowed items-center gap-4 rounded-lg p-3"
                      >
                        <div className="bg-destructive/10 flex size-8 flex-shrink-0 items-center justify-center rounded-md">
                          <XCircle className="text-destructive size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-destructive truncate text-xs font-medium">
                            Generation Failed
                          </h3>
                          <p className="text-muted-foreground truncate text-xs">
                            Please try again later.
                          </p>
                        </div>
                      </div>
                    );
                  case "no credits":
                    return (
                      <div
                        key={track.id}
                        className="mb-2 flex cursor-not-allowed items-center gap-4 rounded-lg p-3"
                      >
                        <div className="bg-destructive/10 flex size-8 flex-shrink-0 items-center justify-center rounded-md">
                          <XCircle className="text-destructive size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-destructive truncate text-xs font-medium">
                            Generation Failed
                          </h3>
                          <p className="text-muted-foreground truncate text-xs">
                            You have no credits left. Please top up to continue.
                          </p>
                        </div>
                      </div>
                    );
                  case "queued":
                  case "pending":
                    return (
                      <div
                        key={track.id}
                        className="mb-2 flex cursor-not-allowed items-center gap-4 rounded-lg p-3"
                      >
                        <div className="font-medium">
                          <Loader2 className="text-muted-foreground size-6 animate-spin" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-muted-foreground truncate text-xs font-medium">
                            Pending
                          </h3>
                          {/* <> svg ... animation </> */}
                        </div>
                        <p className="text-muted-foreground truncate text-xs">
                          Refresh To Check Status
                        </p>
                      </div>
                    );
                  default:
                    return (
                      <div
                        className="hover:bg-muted/50 mb-2 flex cursor-pointer items-center gap-4 rounded-lg p-3"
                        key={track.id}
                        onClick={() => handleTrackSelect(track)}
                      >
                        <div className="group relative flex size-12 flex-shrink-0 overflow-hidden">
                          {track.thumbnailUrl ? (
                            <Image
                              className="size-full object-cover"
                              src={track.thumbnailUrl}
                              alt={track.title ?? "Track Thumbnail"}
                            />
                          ) : (
                            <div className="bg-secondary/10 flex size-full flex-shrink-0 items-center justify-center rounded-md">
                              <Music className="text-muted-foreground size-6" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:bg-black/50">
                            {loadingTrackId === track.id ? (
                              <Loader2 className="animate-spin text-white" />
                            ) : (
                              <Play className="size-6 fill-white" />
                            )}
                          </div>
                        </div>

                        {/* Track Info */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-primary truncate text-sm font-medium">
                            {track.title ?? "Untitled Track"}
                          </h3>
                          {track.instrumental && (
                            <Badge
                              variant="outline"
                              className="bg-muted-foreground text-primary text-xs font-medium"
                            >
                              Instrumental
                            </Badge>
                          )}
                          <p className="text-muted-foreground truncate text-xs">
                            {track.prompt ?? "No prompt provided"}
                          </p>
                        </div>

                        {/* Actions */}
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-primary text-primary-foreground"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await setPublishedStatus(
                                track.id,
                                !track.published,
                              );
                            }}
                          >
                            {track.published ? "Unpublish" : "Publish"}
                          </Button>
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
                                  await downloadSong(track.id);
                                  const playURL = await getPlayUrl(track.id);
                                  window.open(playURL, "_blank");
                                }}
                              >
                                <Download className="size-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setRenameTrack(track);
                                }}
                              >
                                <Pencil />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem>Team</DropdownMenuItem>
                              <DropdownMenuItem>Subscription</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                }
              })
            ) : (
              <div>No tracks found</div>
            )}
          </div>
        </div>
      </div>
      {renameTrack && (
        <RenameDialogue
          track={renameTrack}
          onClose={() => setRenameTrack(null)}
          onRename={async (trackId: string, newTitle: string) =>
            await onRenameTitle(trackId, newTitle)
          }
        />
      )}
    </div>
  );
}
