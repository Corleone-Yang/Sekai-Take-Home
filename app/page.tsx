"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import { supabase } from "./config/supabase";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 main-content">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            D&D-Style Interactive Adventure
          </h1>
          <p className="text-lg mb-8 text-gray-700">
            Embark on an AI-powered text adventure where your choices matter.
          </p>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              How to Play
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
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

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => router.push("/character/create")}
              className="px-5 py-2.5 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition-colors"
            >
              Create a Character
            </button>

            <button
              onClick={() => router.push("/character/select")}
              className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
            >
              Select a Character
            </button>

            <button
              onClick={() => router.push("/adventure")}
              className="px-5 py-2.5 bg-purple-600 text-white font-medium rounded hover:bg-purple-700 transition-colors"
            >
              Start Adventure
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
