// import { redirect } from "next/dist/server/api-utils";
import { Loader2 } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import SongPanel from "~/app/components/create/song-panel";
import TrackListFetcher from "~/app/components/create/track-list-fetcher";
import { auth } from "~/lib/auth";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // if (!session) {
  //   redirect("/auth/sigin-in");
  // }
  return (
    <div className="flex h-full flex-col lg:flex-row">
      <SongPanel />
      <Suspense
        fallback={
          <div className="flex h-32 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <TrackListFetcher />
      </Suspense>
    </div>
  );
}
