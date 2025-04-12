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
import "./index.less";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  const toggleCollapse = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/pages/login");
  };

  return (
    <>
      <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="header-container">
          {!collapsed && <div className="sidebar-title">SEKAI App</div>}
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
            <Link href="/todos" className="nav-link">
              <span className="icon-container">
                <AiOutlineCheckSquare />
              </span>
              {!collapsed && <span>Create Story</span>}
            </Link>
          </div>

          <div className="nav-item">
            <Link href="/settings" className="nav-link">
              <span className="icon-container">
                <AiOutlineSetting />
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
      <div
        className={`main-content ${collapsed ? "sidebar-collapsed" : ""}`}
      ></div>
    </>
  );
};

export default Sidebar;
