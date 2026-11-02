"use client";

import { Button } from "~/app/components/ui/button";
import { authClient } from "~/lib/auth-client";

export default function Upgrade() {
  const upgrade = async () => {
    await authClient.checkout({
      products: [
        "1b6c0da0-404a-4109-8f2d-5ca454adcec2",
        "6a8d6ff6-c230-4956-9593-a91c438bbd3f",
        "99935252-b8a7-4353-9727-8bb951e5aebd",
      ],
    });
  };
  return (
    <Button
      variant="outline"
      className="ml-2 cursor-pointer text-orange-500"
      size="sm"
      onClick={upgrade}
    >
      Upgrade
    </Button>
  );
}
