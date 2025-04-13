"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "../../components/Sidebar";
import "./page.less";

export default function PlayGame() {
  // State for different game phases
  const [gamePhase, setGamePhase] = useState("storySelection"); // storySelection, characterSelection, playing
  const [stories, setStories] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [gameSessionId, setGameSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

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

  // Fetch available stories on component mount
  useEffect(() => {
    async function fetchStories() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/playGame/stories");
        if (!response.ok) {
          throw new Error("Failed to fetch stories");
        }
        const data = await response.json();
        setStories(data.stories || []);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching stories:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStories();
  }, []);

  // Fetch characters when a story is selected
  useEffect(() => {
    if (selectedStory) {
      async function fetchCharacters() {
        try {
          setIsLoading(true);
          const response = await fetch(
            `/api/playGame/characters/${selectedStory.story_id}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch characters");
          }
          const data = await response.json();
          setCharacters(data.characters || []);
        } catch (error) {
          setError(error.message);
          console.error("Error fetching characters:", error);
        } finally {
          setIsLoading(false);
        }
      }

      fetchCharacters();
    }
  }, [selectedStory]);

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus on input when it's player's turn
  useEffect(() => {
    if (isPlayerTurn && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isPlayerTurn]);

  // Handle story selection
  const handleStorySelect = (story) => {
    setSelectedStory(story);
    setGamePhase("characterSelection");
  };

  // Handle character selection
  const handleCharacterSelect = async (character) => {
    try {
      setIsLoading(true);
      setSelectedCharacter(character);

      // Mock user_id (in a real app this would come from auth)
      const user_id = "user-123";

      const response = await fetch("/api/playGame/select-character", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          story_id: selectedStory.story_id,
          character_id: character.character_id,
          user_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start game");
      }

      const data = await response.json();
      setGameSessionId(data.game_session_id);

      // Add welcome message
      setMessages([
        {
          type: "system",
          content: `Welcome to "${selectedStory.title}". You are playing as ${character.name}.`,
          timestamp: new Date(),
        },
      ]);

      setGamePhase("playing");
      setIsPlayerTurn(true);
    } catch (error) {
      setError(error.message);
      console.error("Error starting game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isPlayerTurn) return;

    try {
      setIsLoading(true);
      setIsPlayerTurn(false);

      // Add player message to the chat
      const playerMessage = {
        type: "player",
        character_name: selectedCharacter.name,
        content: newMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, playerMessage]);
      setNewMessage("");

      // Send message to the API
      const response = await fetch("/api/playGame/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_session_id: gameSessionId,
          message: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Add responses from NPCs with a slight delay for the typing effect
      if (data.responses && data.responses.length > 0) {
        for (let i = 0; i < data.responses.length; i++) {
          const npcResponse = data.responses[i];

          // Wait a bit between messages to simulate typing
          await new Promise((resolve) => setTimeout(resolve, 1000));

          setMessages((prev) => [
            ...prev,
            {
              type: "npc",
              character_id: npcResponse.character_id,
              character_name: npcResponse.character_name,
              content: npcResponse.content,
              timestamp: new Date(npcResponse.timestamp),
            },
          ]);
        }
      }

      // Check if the last message suggests it's the player's turn
      const lastResponse =
        data.responses[data.responses.length - 1]?.content || "";
      const isPlayerTurnNow =
        lastResponse.includes("?") ||
        lastResponse.includes("What do you do?") ||
        lastResponse.includes("Your turn");

      setIsPlayerTurn(isPlayerTurnNow);
    } catch (error) {
      setError(error.message);
      console.error("Error sending message:", error);
      setIsPlayerTurn(true); // Let the player try again
    } finally {
      setIsLoading(false);
    }
  };

  // UI for story selection phase
  const renderStorySelection = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Select a Story</h2>
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map((story) => (
            <div
              key={story.story_id}
              className="story-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition"
              onClick={() => handleStorySelect(story)}
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {story.title}
                </h3>
                <p className="text-gray-600">{story.background}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {story.character_num} Characters
                  </span>
                  <button
                    className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStorySelect(story);
                    }}
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No stories available
        </div>
      )}
    </div>
  );

  // UI for character selection phase
  const renderCharacterSelection = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          className="flex items-center text-amber-600 hover:text-amber-800 transition"
          onClick={() => setGamePhase("storySelection")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to stories
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-2 text-gray-800">
        Select Your Character
      </h2>
      <h3 className="text-xl mb-6 text-gray-600">{selectedStory?.title}</h3>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : characters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {characters.map((character) => (
            <div
              key={character.character_id}
              className="character-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition"
              onClick={() => handleCharacterSelect(character)}
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {character.name}
                </h3>
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700">Personality:</h4>
                  <p className="text-gray-600">{character.character}</p>
                </div>
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700">Background:</h4>
                  <p className="text-gray-600">{character.background}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCharacterSelect(character);
                    }}
                  >
                    Play as {character.name}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No characters available for this story
        </div>
      )}
    </div>
  );

  // UI for the gameplay phase
  const renderGameplay = () => (
    <div className="game-container h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedStory?.title}
          </h2>
          <p className="text-gray-600">Playing as {selectedCharacter?.name}</p>
        </div>
        <button
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          onClick={() => {
            setGamePhase("storySelection");
            setMessages([]);
            setSelectedStory(null);
            setSelectedCharacter(null);
            setGameSessionId(null);
          }}
        >
          End Game
        </button>
      </div>

      <div className="chat-container flex-1 overflow-y-auto mb-4 px-4 py-2 bg-gray-100 rounded-lg">
        {messages.map((msg, index) => {
          if (msg.type === "system") {
            return (
              <div key={index} className="my-4 text-center">
                <div className="inline-block px-4 py-2 bg-gray-200 rounded-lg text-gray-700">
                  {msg.content}
                </div>
              </div>
            );
          } else if (msg.type === "player") {
            return (
              <div key={index} className="flex justify-end my-2">
                <div className="message-bubble player-message max-w-xl px-4 py-2 text-white rounded-lg shadow">
                  <div className="font-semibold mb-1">{msg.character_name}</div>
                  <div className="message-content">
                    <TypewriterText text={msg.content} speed={10} />
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div key={index} className="flex justify-start my-2">
                <div className="message-bubble npc-message max-w-xl px-4 py-2 bg-white text-gray-800 rounded-lg shadow">
                  <div className="font-semibold mb-1 text-amber-700">
                    {msg.character_name}
                  </div>
                  <div className="message-content">
                    <TypewriterText text={msg.content} speed={30} />
                  </div>
                </div>
              </div>
            );
          }
        })}
        {isLoading && (
          <div className="flex justify-start my-2">
            <div className="message-bubble npc-message px-4 py-3 bg-white text-gray-800 rounded-lg shadow">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative">
        <input
          ref={messageInputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={!isPlayerTurn || isLoading}
          placeholder={
            isPlayerTurn
              ? "Type your message..."
              : "Waiting for other characters..."
          }
          className={`message-input w-full px-4 py-3 pr-12 rounded-lg border ${
            isPlayerTurn
              ? "border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              : "bg-gray-100 border-gray-300 text-gray-500"
          } focus:outline-none`}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <button
          disabled={!isPlayerTurn || isLoading}
          onClick={handleSendMessage}
          className={`send-button absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
            isPlayerTurn && !isLoading
              ? "bg-amber-600 hover:bg-amber-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );

  // Error message display
  const renderError = () =>
    error && (
      <div
        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
        role="alert"
      >
        <p>{error}</p>
        <button
          className="font-bold hover:text-red-800"
          onClick={() => setError(null)}
        >
          Dismiss
        </button>
      </div>
    );

  // Render the appropriate phase
  const renderGamePhase = () => {
    switch (gamePhase) {
      case "storySelection":
        return renderStorySelection();
      case "characterSelection":
        return renderCharacterSelection();
      case "playing":
        return renderGameplay();
      default:
        return renderStorySelection();
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 main-content">
        <div className="p-8 h-screen flex flex-col">
          {renderError()}
          {renderGamePhase()}
        </div>
      </main>
    </div>
  );
}

// Text typewriter effect component
function TypewriterText({ text, speed = 30 }) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [text]);

  return <div>{displayedText}</div>;
}
