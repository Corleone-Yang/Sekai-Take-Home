/**
 * Script to test the Gemini API configuration
 *
 * Run with: node test/test-gemini-api.js
 */

// Load environment variables from .env.local file
try {
  const fs = require("fs");
  const path = require("path");
  const dotenvPath = path.resolve(process.cwd(), ".env.local");

  if (fs.existsSync(dotenvPath)) {
    console.log("Loading environment variables from .env.local");
    const envConfig = fs
      .readFileSync(dotenvPath, "utf8")
      .split("\n")
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split("="))
      .reduce((acc, [key, value]) => {
        if (key && value) {
          acc[key.trim()] = value.trim();
        }
        return acc;
      }, {});

    Object.keys(envConfig).forEach((key) => {
      process.env[key] = envConfig[key];
    });
  }
} catch (error) {
  console.warn("Error loading .env.local file:", error.message);
}

// Using environment variables with fallback
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Generates a response from the Gemini API
 */
async function generateGeminiResponse(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated from Gemini API");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating response from Gemini:", error);
    throw error;
  }
}

async function main() {
  console.log("===== Gemini API Test Script =====");

  if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in environment variables");
    return false;
  }

  console.log(
    "Testing API with API key: " + GEMINI_API_KEY.substring(0, 5) + "..."
  );

  try {
    const testPrompt = "Tell me a short joke about programming";
    console.log(`\nSending test prompt: "${testPrompt}"`);

    console.log("\nCalling Gemini API...");
    const startTime = Date.now();
    const response = await generateGeminiResponse(testPrompt);
    const endTime = Date.now();

    console.log(`\n✅ Success! Response received in ${endTime - startTime}ms`);
    console.log("\n--- Response content ---");
    console.log(response);
    console.log("------------------------");

    return true;
  } catch (error) {
    console.error("\n❌ Error calling Gemini API:");
    if (error instanceof Error) {
      console.error(`  ${error.name}: ${error.message}`);
      if (error.stack) {
        console.error("\nStack trace:");
        console.error(error.stack.split("\n").slice(1).join("\n"));
      }
    } else {
      console.error(error);
    }
    return false;
  }
}

// Execute the script
main()
  .then((success) => {
    console.log("\n===== Test Complete =====");
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("\nUnexpected error during script execution:");
    console.error(error);
    process.exit(1);
  });
