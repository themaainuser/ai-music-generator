"use client";
import { Dialog, DialogContent, DialogHeader } from "~/components/ui/dialog";
import type { Track } from "./track-list";
import { useState } from "react";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";

function RenameDialogue(
  track: Track,
  onClose: () => void,
  onRename: (trackId: string, newTitle: string) => void,
) {
  const [title, setTitle] = useState(track.title ?? "");
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (title.trim()) onRename(track.id, title.trim());
  };
  return (
    <Dialog onOpenChange={onClose} open={true}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename {track.title}</DialogTitle>
            <DialogDescription>
              Please enter a new title for the track.
            </DialogDescription>
            <div className="grid gap-4 py-4">
              <div className="gird-cols-4 grid items-center gap-4">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>
          </DialogHeader>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RenameDialogue;
