import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AiOutlineAppstore,
  AiOutlineCheckSquare,
  AiOutlineLeft,
  AiOutlineLogout,
  AiOutlineRight,
  AiOutlineSetting,
} from "react-icons/ai";
import { supabase } from "../../config/supabase";

const Sidebar = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  const toggleCollapse = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed]);

  const createMenuItem = useCallback(
    (title, route, IconComponent) => {
      return (
        <div className="w-full">
          <Link
            href={route}
            className="flex items-center py-3 px-4 text-gray-700 hover:bg-gray-100 transition-colors w-full"
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/pages/login");
  };

  // Add a style tag to apply dynamic CSS based on sidebar state
  const dynamicStyle = `
    .main-content {
      padding-left: ${sidebarCollapsed ? "80px" : "256px"};
      transition: padding-left 0.3s;
    }
  `;

  return (
    <>
      <style jsx global>
        {dynamicStyle}
      </style>
      <div
        id="app-sidebar"
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-10 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 h-16">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-800">Todo App</h1>
          )}
          <button
            onClick={toggleCollapse}
            className={`bg-gray-100 border border-gray-200 rounded-md w-7 h-7 flex items-center justify-center text-gray-600 ${
              sidebarCollapsed ? "ml-auto mr-1" : "absolute right-4"
            }`}
            aria-label={
              sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"
            }
          >
            {sidebarCollapsed ? (
              <AiOutlineRight className="text-sm" />
            ) : (
              <AiOutlineLeft className="text-sm" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4">
          {sideMenuItems.map((item) => (
            <div key={item.key} className="mb-1">
              {item.label}
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center py-2 px-4 text-red-600 hover:bg-gray-100 rounded transition-colors`}
          >
            <span className="flex items-center justify-center mr-3 text-lg">
              <AiOutlineLogout />
            </span>
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
