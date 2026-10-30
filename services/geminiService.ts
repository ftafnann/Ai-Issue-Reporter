import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport, Location } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
export const isGeminiConfigured = Boolean(API_KEY);

const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
};

/**
 * OPTIONAL: n8n Integration
 * You can call an n8n webhook after this analysis by using:
 * await fetch('YOUR_N8N_WEBHOOK_URL', { method: 'POST', body: JSON.stringify(result) });
 */

export const analyzeImageWithLocation = async (
  base64ImageData: string,
  mimeType: string,
  location: Location
): Promise<Omit<AnalysisReport, 'id' | 'status' | 'createdAt' | 'reportedBy' | 'imageUrl' | 'assignedInspectorUsername'>> => {
    try {
        if (!API_KEY) {
            throw new Error("Gemini API key is missing. Add VITE_GEMINI_API_KEY to .env, then restart the dev server.");
        }
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const imagePart = fileToGenerativePart(base64ImageData, mimeType);
        const textPart = {
            text: `You are an expert maintenance and safety analysis system. Analyze the provided image to identify any structural, safety, or maintenance issues. The user is at location: ${location.latitude}, ${location.longitude}. Based on your analysis:
1.  First, determine the category of the problem (e.g., 'Electrical', 'Plumbing', 'Structural', 'Safety', 'General Maintenance').
2.  Then, generate a concise problem title.
3.  Provide a detailed report explaining the issue and its potential risks.
4.  Suggest actionable remediation steps or preventative measures.
5.  Assign a priority level ('Low', 'Medium', or 'High').
6.  The report should be sent to a "Site Administrator". Provide a plausible corporate email address ('site.admin@example.com') and a 10-digit US-style phone number for them.
7.  Set the initial inspector to be 'Unassigned' with a placeholder phone number 'N/A'. The administrator will assign a real inspector later.
Respond ONLY with a JSON object that adheres to the specified schema.`,
        };

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [imagePart, textPart] },
            config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                problemCategory: {
                    type: Type.STRING,
                    description: "The specific category of the identified problem (e.g., 'Plumbing', 'Electrical')."
                },
                problem: {
                    type: Type.STRING,
                    description: "A short, concise title for the identified problem.",
                },
                report: {
                    type: Type.STRING,
                    description:
                    "A detailed report explaining the problem, its context, and potential risks.",
                },
                remediationSteps: {
                    type: Type.STRING,
                    description: "Suggested steps to fix the issue or prevent it from happening again."
                },
                priority: {
                    type: Type.STRING,
                    enum: ["Low", "Medium", "High"],
                    description: "The urgency of the issue.",
                },
                recipient: {
                    type: Type.OBJECT,
                    properties: {
                    name: {
                        type: Type.STRING,
                        description: "This should always be 'Site Administrator'.",
                    },
                    email: {
                        type: Type.STRING,
                        description: "A plausible corporate email address for the administrator (e.g., 'site.admin@example.com').",
                    },
                    phone: {
                        type: Type.STRING,
                        description:
                        "A plausible 10-digit US-style phone number for the administrator (e.g., '555-123-4567').",
                    },
                    },
                    required: ["name", "email", "phone"],
                },
                inspector: {
                    type: Type.OBJECT,
                    properties: {
                    name: {
                        type: Type.STRING,
                        description: "This should always be 'Unassigned'.",
                    },
                    phone: {
                        type: Type.STRING,
                        description: "This should always be 'N/A'.",
                    },
                    },
                    required: ["name", "phone"],
                },
                },
                required: ["problemCategory", "problem", "report", "priority", "recipient", "remediationSteps", "inspector"],
            },
            },
        });

        const jsonString = response.text?.trim();
        if (!jsonString) {
            throw new Error("API returned an empty response.");
        }

        const result = JSON.parse(jsonString);
        return result;

    } catch (error) {
        console.error("Error in analyzeImageWithLocation:", error);
        let errorMessage = "An unknown error occurred during AI analysis.";
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                errorMessage = "The provided API key is not valid. Please check your configuration.";
            } else if (error.message.includes('429')) {
                errorMessage = "API rate limit exceeded. Please try again later.";
            } else if (error.message.includes('500')) {
                errorMessage = "The server encountered an error. Please try again later.";
            } else if (error instanceof SyntaxError) {
                errorMessage = "Failed to parse the response from the AI. The response was not valid JSON.";
            } else {
                errorMessage = error.message;
            }
        }
        throw new Error(errorMessage);
    }
};
