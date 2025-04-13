import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AiOutlineAppstore,
  AiOutlineLeft,
  AiOutlineLogout,
  AiOutlineRight,
} from "react-icons/ai";
import { BiBookAlt } from "react-icons/bi";
import { IoGameControllerOutline } from "react-icons/io5";
import { supabase } from "../../config/supabase";
import "./index.less";

const Sidebar = () => {
  // 从localStorage初始化collapsed状态，如果不存在则默认为false（展开状态）
  const [collapsed, setCollapsed] = useState(() => {
    // 在服务端渲染时不执行localStorage操作
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("sidebar-collapsed");
      return savedState ? JSON.parse(savedState) : false;
    }
    return false;
  });

  const router = useRouter();

  useEffect(() => {
    // 将collapsed状态保存到localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
    }

    // Add or remove sidebar-collapsed class from body
    document.body.classList.toggle("sidebar-collapsed", collapsed);

    return () => {
      // Clean up when component unmounts
      document.body.classList.remove("sidebar-collapsed");
    };
  }, [collapsed]);

  const toggleCollapse = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/pages/login");
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="header-container">
        {!collapsed && <div className="sidebar-title">SEKAI APP</div>}
        <button
          onClick={toggleCollapse}
          className={`toggle-btn ${collapsed ? "collapsed" : ""}`}
          aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <span className="icon">
            {collapsed ? <AiOutlineRight /> : <AiOutlineLeft />}
          </span>
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-item">
          <Link href="/" className="nav-link">
            <span className="icon-container">
              <AiOutlineAppstore />
            </span>
            {!collapsed && <span>Dashboard</span>}
          </Link>
        </div>

        <div className="nav-item">
          <Link href="/pages/createStory" className="nav-link">
            <span className="icon-container">
              <BiBookAlt />
            </span>
            {!collapsed && <span>Create Story</span>}
          </Link>
        </div>

        <div className="nav-item">
          <Link href="/pages/playGame" className="nav-link">
            <span className="icon-container">
              <IoGameControllerOutline />
            </span>
            {!collapsed && <span>Play Game</span>}
          </Link>
        </div>
      </nav>

      <div className="footer">
        <button onClick={handleSignOut} className="sign-out-btn">
          <span className="icon-container">
            <AiOutlineLogout />
          </span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
