import { User } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "~/app/components/ui/sidebar";
import SidebarMenuItems from "./sidebar-menu-items";
import Credits from "./credits";
import { UserButton } from "@daveyplate/better-auth-ui";
import Upgrade from "./upgrade";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="item-start text-primary mt-2 mb-12 flex flex-col justify-start px-2 text-3xl font-black tracking-widest uppercase">
            <p>AI Music </p>
            <p className="text-lg">Generator</p>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItems />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="mb-2 flex w-full flex-col items-center justify-center gap-2 text-xs">
          <Credits />
          <Upgrade />
        </div>
        <UserButton
          variant="outline"
          additionalLinks={[
            {
              label: "customer portal",
              icon: <User />,
              href: "/customer-portal",
            },
          ]}
          className=""
        />
      </SidebarFooter>
    </Sidebar>
  );
}
