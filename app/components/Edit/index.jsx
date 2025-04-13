"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import "./index.less";

export default function Edit({ storyId, onClose, onSave }) {
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState("");
  const [characterNum, setCharacterNum] = useState(0);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [deletedCharacters, setDeletedCharacters] = useState([]);

  // Fetch story and character data when component mounts
  useEffect(() => {
    const fetchStoryData = async () => {
      try {
        setLoading(true);

        // Fetch story data
        const { data: storyData, error: storyError } = await supabase
          .from("stories")
          .select("*")
          .eq("story_id", storyId)
          .single();

        if (storyError) throw storyError;

        // Fetch characters data
        const { data: charactersData, error: charactersError } = await supabase
          .from("characters")
          .select("*")
          .eq("story_id", storyId)
          .order("created_at", { ascending: true });

        if (charactersError) throw charactersError;

        // Set state with fetched data
        setStory(storyData);
        setTitle(storyData.title);
        setBackground(storyData.background || "");
        setCharacterNum(storyData.character_num);
        setCharacters(charactersData);
      } catch (error) {
        console.error("Error fetching story data:", error);
        setMessage({
          text: "Failed to load story data",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (storyId) {
      fetchStoryData();
    }
  }, [storyId]);

  // Handle character change
  const handleCharacterChange = (index, field, value) => {
    const updatedCharacters = [...characters];
    updatedCharacters[index] = {
      ...updatedCharacters[index],
      [field]: value,
    };
    setCharacters(updatedCharacters);
  };

  // Handle delete character
  const handleDeleteCharacter = (characterId, index) => {
    // If the character is already stored in database (has an ID)
    if (characterId) {
      setDeletedCharacters([...deletedCharacters, characterId]);
    }

    // Remove from current characters array
    const updatedCharacters = [...characters];
    updatedCharacters.splice(index, 1);
    setCharacters(updatedCharacters);
    setCharacterNum(characterNum - 1);
  };

  // Handle add character
  const handleAddCharacter = () => {
    if (characterNum >= 10) {
      setMessage({
        text: "Maximum 10 characters allowed",
        type: "error",
      });
      return;
    }

    setCharacters([
      ...characters,
      {
        story_id: storyId,
        name: `Character ${characters.length + 1}`,
        character: "",
        background: "",
      },
    ]);
    setCharacterNum(characterNum + 1);
  };

  // Handle save changes
  const handleSave = async () => {
    if (!title.trim()) {
      setMessage({
        text: "Story title cannot be empty",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare data only including characters with valid character_id
      const validCharacters = characters
        .filter((char) => char.character_id) // Only include characters that already exist
        .map((char) => ({
          character_id: char.character_id,
          name: char.name,
          character: char.character || "",
          background: char.background || "",
        }));

      // Check if there are new characters (without character_id)
      const newCharacters = characters.filter((char) => !char.character_id);

      // Prepare the update request
      const updateData = {
        title,
        background,
        character_num: characterNum,
        characters: validCharacters,
        deleted_character_ids: deletedCharacters,
      };

      // Update the story using the API
      const response = await fetch(`/api/createStory/${storyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to update story: ${response.status}`
        );
      }

      const result = await response.json();

      // If there are new characters, create them one by one
      if (newCharacters.length > 0) {
        for (const newChar of newCharacters) {
          try {
            const charResponse = await fetch(`/api/createStory/character`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                story_id: storyId,
                name: newChar.name,
                character: newChar.character || "",
                background: newChar.background || "",
              }),
            });

            if (!charResponse.ok) {
              console.error(
                "Failed to create new character:",
                await charResponse.json()
              );
            }
          } catch (charError) {
            console.error("Error creating character:", charError);
          }
        }
      }

      setMessage({
        text: "Story updated successfully",
        type: "success",
      });

      // Call onSave callback to refresh the parent component
      if (onSave) {
        onSave();
      }

      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error updating story:", error);
      setMessage({
        text: error.message || "An error occurred while updating the story",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !story) {
    return (
      <div className="edit-modal">
        <div className="edit-card loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
      <div className="edit-card" onClick={(e) => e.stopPropagation()}>
        <div className="edit-header">
          <h2>Edit Story</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="edit-content">
          <div className="section">
            <h3>Story Details</h3>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter story title"
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label>Background</label>
              <textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Enter story background"
                className="input-field textarea"
              />
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h3>Characters ({characters.length})</h3>
              <button
                className="add-btn"
                onClick={handleAddCharacter}
                disabled={loading}
              >
                Add Character
              </button>
            </div>

            {characters.length === 0 ? (
              <div className="no-characters">No characters available</div>
            ) : (
              <div className="character-list">
                {characters.map((char, index) => (
                  <div
                    key={char.character_id || `new-${index}`}
                    className="character-item"
                  >
                    <div className="character-header">
                      <h4>Character {index + 1}</h4>
                      <button
                        className="delete-btn"
                        onClick={() =>
                          handleDeleteCharacter(char.character_id, index)
                        }
                        disabled={characters.length <= 1 || loading}
                      >
                        Delete
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={char.name}
                        onChange={(e) =>
                          handleCharacterChange(index, "name", e.target.value)
                        }
                        placeholder="Enter character name"
                        className="input-field"
                      />
                    </div>
                    <div className="form-group">
                      <label>Character Description</label>
                      <textarea
                        value={char.character || ""}
                        onChange={(e) =>
                          handleCharacterChange(
                            index,
                            "character",
                            e.target.value
                          )
                        }
                        placeholder="Enter character description"
                        className="input-field textarea"
                      />
                    </div>
                    <div className="form-group">
                      <label>Character Background</label>
                      <textarea
                        value={char.background || ""}
                        onChange={(e) =>
                          handleCharacterChange(
                            index,
                            "background",
                            e.target.value
                          )
                        }
                        placeholder="Enter character background"
                        className="input-field textarea"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="edit-footer">
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
