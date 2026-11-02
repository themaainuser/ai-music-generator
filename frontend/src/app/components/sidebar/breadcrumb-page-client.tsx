"use client";

import { usePathname } from "next/navigation";
import { BreadcrumbPage } from "~/app/components/ui/breadcrumb";

export default function BreadCrumbPageClient() {
  const page = usePathname();
  return (
    <BreadcrumbPage>
      {page === "/" && "Home"}
      {page === "/create" && "Create"}
    </BreadcrumbPage>
  );
}
