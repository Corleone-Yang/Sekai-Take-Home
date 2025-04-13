"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { getCurrentUser } from "../../config/supabase";

export default function CreateStory() {
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState("");
  const [characterNum, setCharacterNum] = useState(2);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [step, setStep] = useState(1); // 1 = story details, 2 = character details
  const [characters, setCharacters] = useState([]);

  // Get current user ID on component mount
  useEffect(() => {
    async function fetchUser() {
      const user = await getCurrentUser();
      if (user) {
        console.log("Current user:", user.id); // 添加日志以便调试
        setUserId(user.id);
      } else {
        // 如果用户未登录，显示错误
        setMessage({
          text: "Please login to create a story",
          type: "error",
        });
      }
    }
    fetchUser();
  }, []);

  // Initialize character array when characterNum changes
  useEffect(() => {
    if (step === 2) {
      const newCharacters = Array(characterNum)
        .fill(null)
        .map((_, index) => ({
          name: `Character ${index + 1}`,
          character: "",
          background: "",
        }));
      setCharacters(newCharacters);
    }
  }, [step, characterNum]);

  const handleStorySubmit = (e) => {
    e.preventDefault();

    if (!title || !characterNum || !userId) {
      setMessage({
        text: "Please fill in all required fields",
        type: "error",
      });
      return;
    }

    // Move to character details step
    setStep(2);
    setMessage({ text: "", type: "" });
  };

  const handleCharacterChange = (index, field, value) => {
    const updatedCharacters = [...characters];
    updatedCharacters[index] = {
      ...updatedCharacters[index],
      [field]: value,
    };
    setCharacters(updatedCharacters);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    // Validate that all characters have names
    const missingNames = characters.some((char) => !char.name.trim());
    if (missingNames) {
      setMessage({
        text: "All characters must have names",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/createStory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          background: background || "",
          character_num: Number(characterNum),
          user_id: userId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          text: data.message || "Story created successfully!",
          type: "success",
        });
        // Reset form and go back to step 1
        setTitle("");
        setBackground("");
        setCharacterNum(2);
        setCharacters([]);
        setStep(1);
      } else {
        setMessage({
          text: data.error || "Failed to create story",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error creating story:", error);
      setMessage({
        text: "An error occurred while creating the story",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 main-content">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            Create Story
          </h1>

          {message.text && (
            <div
              className={`p-4 mb-6 rounded-md ${
                message.type === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-700"
                } font-semibold mr-2`}
              >
                1
              </div>
              <div
                className={`text-sm ${
                  step === 1 ? "text-blue-600 font-semibold" : "text-gray-500"
                }`}
              >
                Story Details
              </div>
              <div className="border-t border-gray-300 flex-1 mx-4"></div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-700"
                } font-semibold mr-2`}
              >
                2
              </div>
              <div
                className={`text-sm ${
                  step === 2 ? "text-blue-600 font-semibold" : "text-gray-500"
                }`}
              >
                Character Details
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            {step === 1 ? (
              <form onSubmit={handleStorySubmit}>
                <table className="w-full border-collapse mb-6">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 pr-4 font-medium text-gray-700 w-1/4">
                        Title <span className="text-red-500">*</span>
                      </td>
                      <td className="py-4">
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter story title"
                          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 pr-4 font-medium text-gray-700">
                        Background
                      </td>
                      <td className="py-4">
                        <textarea
                          value={background}
                          onChange={(e) => setBackground(e.target.value)}
                          placeholder="Enter story background (optional)"
                          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 pr-4 font-medium text-gray-700">
                        Number of Characters{" "}
                        <span className="text-red-500">*</span>
                      </td>
                      <td className="py-4">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={characterNum}
                          onChange={(e) =>
                            setCharacterNum(parseInt(e.target.value) || 1)
                          }
                          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Choose how many characters will be in your story
                          (1-10)
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Next: Character Details
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleFinalSubmit}>
                <h2 className="text-xl font-semibold mb-4">
                  Character Details
                </h2>
                <p className="text-gray-600 mb-6">
                  Please fill in the details for each character in your story.
                </p>

                {characters.map((character, index) => (
                  <div
                    key={index}
                    className="mb-8 p-4 border border-gray-200 rounded-lg"
                  >
                    <h3 className="text-lg font-medium mb-3">
                      Character {index + 1}
                    </h3>
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 pr-4 font-medium text-gray-700 w-1/4">
                            Name <span className="text-red-500">*</span>
                          </td>
                          <td className="py-3">
                            <input
                              type="text"
                              value={character.name}
                              onChange={(e) =>
                                handleCharacterChange(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="Enter character name"
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 pr-4 font-medium text-gray-700">
                            Character Traits
                          </td>
                          <td className="py-3">
                            <textarea
                              value={character.character}
                              onChange={(e) =>
                                handleCharacterChange(
                                  index,
                                  "character",
                                  e.target.value
                                )
                              }
                              placeholder="Describe the character's traits (optional)"
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                            />
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 pr-4 font-medium text-gray-700">
                            Background
                          </td>
                          <td className="py-3">
                            <textarea
                              value={character.background}
                              onChange={(e) =>
                                handleCharacterChange(
                                  index,
                                  "background",
                                  e.target.value
                                )
                              }
                              placeholder="Describe the character's background (optional)"
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}

                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-2 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Back to Story Details
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      loading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? "Creating..." : "Create Story with Characters"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
