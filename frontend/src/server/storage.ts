import ImageKit from "@imagekit/nodejs";
import { env } from "~/env";

// Keep this module out of "use server" files: every export there becomes a
// browser-callable action, which would let anyone sign any file path.
const imagekit = new ImageKit({ privateKey: env.IMAGEKIT_PRIVATE_KEY });

const SIGNED_URL_TTL_SECONDS = 3600;

// Generated covers are 1024px PNGs; ImageKit resizes (and picks the format)
// so pages don't download the full image.
const COVER_WIDTH = 400;

/** Signed, expiring URL for a private ImageKit file, e.g. "/generated/<id>.mp3". */
export function getSignedFileUrl(
  filePath: string,
  { width }: { width?: number } = {},
) {
  return imagekit.helper.buildSrc({
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
    src: filePath,
    ...(width ? { transformation: [{ width }] } : {}),
    signed: true,
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}

/** Signed URL for a song's cover image, resized for cards and thumbnails. */
export function getSignedCoverUrl(filePath: string) {
  return getSignedFileUrl(filePath, { width: COVER_WIDTH });
}
