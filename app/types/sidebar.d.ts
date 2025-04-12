import React from "react";

declare module "./components/Sidebar" {
  export interface SidebarProps {
    onCollapsedChange?: (collapsed: boolean) => void;
  }

  const Sidebar: React.FC<SidebarProps>;
  export default Sidebar;
}
