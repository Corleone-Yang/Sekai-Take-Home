"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import { supabase } from "./config/supabase";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setIsLoading(false);
        } else {
          router.push("/pages/login");
        }
      } catch (error) {
        // if error, route to login page
        router.push("/pages/login");
      }
    };

    checkSession();
  }, [router]);

  // Handle sidebar collapse state change
  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  // if loading, show loading animation
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          style={{
            border: "4px solid #3b82f6",
            borderTopColor: "transparent",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <style>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // if user is logged in, show the home page with sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar onCollapsedChange={handleSidebarCollapse} />
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "ml-20" : "ml-[250px]"
        }`}
      >
        <div className="p-8 relative">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/pages/login");
            }}
            className="absolute top-4 right-4 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
          <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-center">
              D&D-Style Interactive Adventure
            </h1>
            <p className="text-lg mb-8 text-center">
              Embark on an AI-powered text adventure where your choices matter.
            </p>

            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-2xl font-semibold mb-3">How to Play</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Create a character with unique abilities</li>
                  <li>The AI describes the scene or situation</li>
                  <li>You decide what your character does or says</li>
                  <li>
                    The AI determines the outcome based on your abilities and
                    choices
                  </li>
                  <li>The AI describes the results and how the world reacts</li>
                  <li>The story progresses based on these interactions</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <button
                  onClick={() => router.push("/character/create")}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-center"
                >
                  Create a Character
                </button>

                <button
                  onClick={() => router.push("/character/select")}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Select a Character
                </button>

                <button
                  onClick={() => router.push("/adventure")}
                  className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors text-center"
                >
                  Start Adventure
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
