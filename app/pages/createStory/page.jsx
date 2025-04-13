"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { getCurrentUser } from "../../config/supabase";
import "./page.less";

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
        console.log("Current user:", user.id); // Add log for debugging
        setUserId(user.id);
      } else {
        // If user is not logged in, show error
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

  // Create style element with responsive behavior CSS
  useEffect(() => {
    // Create style element
    const style = document.createElement("style");
    style.textContent = `
      /* Preserve responsive behavior */
      .main-content {
        padding-left: 280px;
        transition: padding-left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      
      body.sidebar-collapsed .main-content {
        padding-left: 90px;
      }
    `;

    // Add to document head
    document.head.appendChild(style);

    // Remove when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
    <div className="flex min-h-screen fantasy-page">
      <Sidebar />
      <main className="flex-1 main-content fantasy-content">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 heading-style">
            Create Story
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

          <div className="mb-6">
            <div className="flex items-center">
              <div className={step === 1 ? "active-step" : "inactive-step"}>
                1
              </div>
              <div
                className={
                  step === 1 ? "text-[#8b6a43] font-bold" : "text-[#917140]"
                }
              >
                Story Details
              </div>
              <div className="step-divider"></div>
              <div className={step === 2 ? "active-step" : "inactive-step"}>
                2
              </div>
              <div
                className={
                  step === 2 ? "text-[#8b6a43] font-bold" : "text-[#917140]"
                }
              >
                Character Details
              </div>
            </div>
          </div>

          <div className="form-container p-6">
            {step === 1 ? (
              <form onSubmit={handleStorySubmit}>
                <table className="w-full border-collapse mb-6">
                  <tbody>
                    <tr className="fantasy-table-row">
                      <td className="py-4 pr-4 w-1/4 form-label">
                        Title <span className="text-[#cc785e]">*</span>
                      </td>
                      <td className="py-4">
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter story title"
                          className="fantasy-input"
                          required
                        />
                      </td>
                    </tr>
                    <tr className="fantasy-table-row">
                      <td className="py-4 pr-4 form-label">Background</td>
                      <td className="py-4">
                        <textarea
                          value={background}
                          onChange={(e) => setBackground(e.target.value)}
                          placeholder="Enter story background (optional)"
                          className="fantasy-textarea"
                        />
                      </td>
                    </tr>
                    <tr className="fantasy-table-row">
                      <td className="py-4 pr-4 form-label">
                        Number of Characters{" "}
                        <span className="text-[#cc785e]">*</span>
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
                          className="fantasy-input"
                          required
                        />
                        <p className="text-sm text-[#5b3a1c] mt-1">
                          Choose how many characters will be in your story
                          (1-10)
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <button type="submit" className="primary-button">
                    Next: Character Details
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleFinalSubmit}>
                <h2 className="text-xl font-semibold mb-4 character-title">
                  Character Details
                </h2>
                <p className="text-[#5b3a1c] mb-6">
                  Please fill in the details for each character in your story.
                </p>

                {characters.map((character, index) => (
                  <div key={index} className="character-card">
                    <h3 className="text-lg font-medium mb-3 character-title">
                      Character {index + 1}
                    </h3>
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="fantasy-table-row">
                          <td className="py-3 pr-4 w-1/4 form-label">
                            Name <span className="text-[#cc785e]">*</span>
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
                              className="fantasy-input"
                              required
                            />
                          </td>
                        </tr>
                        <tr className="fantasy-table-row">
                          <td className="py-3 pr-4 form-label">
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
                              className="fantasy-textarea"
                              style={{ minHeight: "80px" }}
                            />
                          </td>
                        </tr>
                        <tr className="fantasy-table-row">
                          <td className="py-3 pr-4 form-label">Background</td>
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
                              className="fantasy-textarea"
                              style={{ minHeight: "80px" }}
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
                    className="secondary-button"
                  >
                    Back to Story Details
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`primary-button ${
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
