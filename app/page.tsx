"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Edit from "./components/Edit";
import Sidebar from "./components/Sidebar";
import { getCurrentUser, supabase } from "./config/supabase";
import "./page.less";

export default function Home() {
  const router = useRouter();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [editingStoryId, setEditingStoryId] = useState(null);

  // 添加CSS样式注入以解决侧边栏交互问题
  useEffect(() => {
    // Create style element
    const style = document.createElement("style");
    style.textContent = `
      /* Preserve responsive behavior */
      .main-content {
        margin-left: 280px;
        transition: margin-left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        width: calc(100% - 280px);
      }
      
      body.sidebar-collapsed .main-content {
        margin-left: 90px;
        width: calc(100% - 90px);
      }
    `;

    // Add to document head
    document.head.appendChild(style);

    // Remove when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  // Handle edit story - now opens the Edit component
  const handleEditStory = (storyId) => {
    setEditingStoryId(storyId);
  };

  // Close edit modal
  const handleCloseEdit = () => {
    setEditingStoryId(null);
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
            <div className="grid">
              {stories.map((story) => (
                <div
                  key={story.story_id}
                  className="bg-white p-6 rounded-lg shadow"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-2">
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
                    <div className="flex space-x-2 mt-4">
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

      {/* Edit Story Modal */}
      {editingStoryId && (
        <Edit
          storyId={editingStoryId}
          onClose={handleCloseEdit}
          onSave={() => {
            setMessage({
              text: "Story updated successfully",
              type: "success",
            });
            fetchStories(userId);
          }}
        />
      )}
    </div>
  );
}
