import Link from "next/link";
import { useCallback, useState } from "react";
import {
  AiOutlineAppstore,
  AiOutlineCheckSquare,
  AiOutlineLeft,
  AiOutlineRight,
  AiOutlineSetting,
} from "react-icons/ai";

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapsedChange = () => {} }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleCollapse = useCallback(() => {
    const newCollapsedState = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsedState);
    onCollapsedChange(newCollapsedState);
  }, [sidebarCollapsed, onCollapsedChange]);

  const createMenuItem = useCallback(
    (title, route, IconComponent, tooltip = null) => {
      const tooltipTitle =
        sidebarCollapsed || (!sidebarCollapsed && tooltip)
          ? tooltip || title
          : null;

      return (
        <div title={tooltipTitle} className="py-0 my-1">
          <Link
            href={route}
            className="flex items-center py-3 px-4 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span className="flex items-center justify-center mr-3 text-lg">
              <IconComponent />
            </span>
            {!sidebarCollapsed && <span>{title}</span>}
          </Link>
        </div>
      );
    },
    [sidebarCollapsed]
  );

  const sideMenuItems = [
    {
      key: "dashboard",
      label: createMenuItem("Dashboard", "/", AiOutlineAppstore),
    },
    {
      key: "todos",
      label: createMenuItem("Todos", "/todos", AiOutlineCheckSquare),
    },
    {
      key: "settings",
      label: createMenuItem("Settings", "/settings", AiOutlineSetting),
    },
  ];

  return (
    <div
      id="app-sidebar"
      className={`fixed top-0 left-0 h-screen bg-gray-50 shadow-md z-10 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? "w-20" : "w-[250px]"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 relative">
        {!sidebarCollapsed && (
          <h1 className="text-xl font-medium m-0 text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
            Todo App
          </h1>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse();
          }}
          className={`bg-transparent border-none cursor-pointer w-6 h-6 flex items-center justify-center text-gray-600 absolute transition-all duration-300 ${
            sidebarCollapsed
              ? "right-[-12px] bg-white rounded-full shadow-md"
              : "right-4"
          }`}
          aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? (
            <AiOutlineRight className="open-icon" />
          ) : (
            <AiOutlineLeft className="close-icon" />
          )}
        </button>
      </div>
      <nav className="flex flex-col py-4 flex-1 overflow-y-auto">
        {sideMenuItems.map((item) => (
          <div key={item.key} className="py-0 my-1">
            {item.label}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
