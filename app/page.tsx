"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import { getCurrentUser, supabase } from "./config/supabase";

export default function Home() {
  const router = useRouter();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  // Get current user and load stories on component mount
  useEffect(() => {
    async function fetchUserAndStories() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.id);
          fetchStories(user.id);
        } else {
          // If user is not logged in, redirect to login
          router.push("/pages/login");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setMessage({
          text: "Failed to get user information",
          type: "error",
        });
        setLoading(false);
      }
    }
    fetchUserAndStories();
  }, [router]);

  // Fetch all stories for the user directly from Supabase
  const fetchStories = async (id) => {
    try {
      setLoading(true);
      const { data: storiesData, error: storiesError } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      if (storiesError) throw storiesError;

      // For each story, get the character count
      const storiesWithCharacterCount = await Promise.all(
        storiesData.map(async (story) => {
          const { data: charactersData, error: charError } = await supabase
            .from("characters")
            .select("character_id", { count: "exact" })
            .eq("story_id", story.story_id);

          if (charError) {
            console.error(
              `Error getting characters for story ${story.story_id}:`,
              charError
            );
            return {
              ...story,
              characters_count: 0,
            };
          }

          return {
            ...story,
            characters_count: charactersData.length,
          };
        })
      );

      setStories(storiesWithCharacterCount || []);
    } catch (error) {
      console.error("Error fetching stories:", error);
      setMessage({
        text: "An error occurred while loading stories",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete story using the existing API
  const handleDeleteStory = async (storyId) => {
    if (!confirm("Are you sure you want to delete this story?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/createStory/${storyId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          text: "Story deleted successfully",
          type: "success",
        });
        // Refresh stories list
        fetchStories(userId);
      } else {
        setMessage({
          text: data.error || "Failed to delete story",
          type: "error",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      setMessage({
        text: "An error occurred while deleting the story",
        type: "error",
      });
      setLoading(false);
    }
  };

  // Handle edit story
  const handleEditStory = (storyId) => {
    router.push(`/pages/editStory/${storyId}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // if loading, show loading animation
  if (loading && !stories.length) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner"></div>
        <style>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          .spinner {
            border: 4px solid rgba(160, 140, 108, 0.2);
            border-top-color: #a08c6c;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  // if user is logged in, show the dashboard
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 main-content">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 heading-style">
            Story Dashboard
          </h1>

          {message.text && (
            <div
              className={
                message.type === "error" ? "error-message" : "success-message"
              }
            >
              {message.text}
            </div>
          )}

          {stories.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
              <p className="text-gray-700">
                You haven't created any stories yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {stories.map((story) => (
                <div
                  key={story.story_id}
                  className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold mb-2 text-gray-800">
                        {story.title}
                      </h2>
                      <p className="text-sm text-gray-500 mb-2">
                        Created: {formatDate(story.created_at)}
                      </p>
                      <p className="text-gray-700 mb-3 leading-relaxed max-h-20 overflow-hidden">
                        {story.background || "No background story provided."}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Characters:</span>{" "}
                        {story.characters_count}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditStory(story.story_id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStory(story.story_id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        .heading-style {
          color: #4a3c31;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
          position: relative;
          padding-bottom: 0.5rem;
        }
        .heading-style::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 80px;
          height: 3px;
          background-color: #a08c6c;
          border-radius: 2px;
        }
        .error-message {
          padding: 1rem;
          background-color: #fef1f2;
          border: 1px solid #fecdd3;
          color: #be123c;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
        }
        .success-message {
          padding: 1rem;
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
        }
        @media screen and (max-width: 768px) {
          .flex.justify-between.items-start {
            flex-direction: column;
          }
          .flex.space-x-2 {
            margin-top: 1rem;
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
