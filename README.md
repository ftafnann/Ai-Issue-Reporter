# AI Issue Reporter

**AI Issue Reporter** is a comprehensive, role-based web application designed to streamline facility maintenance and safety reporting. By leveraging the **Google Gemini API**, it acts as an intelligent agent that analyzes images of defects, categorizes them, assesses severity, and generates professional remediation reports automatically.

## 🚀 Features

*   **🤖 AI-Powered Analysis**: Utilizes Google's **Gemini 2.5 Flash** model to process images, generating structured JSON reports containing problem titles, severity levels, and step-by-step remediation plans.
*   **📸 Image Capture & Annotation**: Integrated camera support and a custom canvas-based annotation tool allowing users to draw, add shapes, and place text on images before analysis.
*   **📍 Geolocation Tagging**: Automatically captures precise GPS coordinates to provide context for maintenance teams.
*   **👥 Role-Based Access Control (RBAC)**:
    *   **Users**: Submit reports.
    *   **Admins**: Dashboard view of all issues, assignment of inspectors, deletion of reports.
    *   **Inspectors**: Receive assignments, upload photographic evidence of repairs, and update status.
*   **📊 Interactive Dashboards**: Sortable and filterable lists of issues with priority highlighting.
*   **💾 Local Persistence**: Uses browser LocalStorage to persist complex state across sessions without a database.
*   **📧 One-Click Reporting**: Generates pre-filled email drafts to site administrators.

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **AI Backend**: Google GenAI SDK (`@google/genai`)
*   **Build Tool**: Vite
*   **State Management**: React Hooks (`useState`, `useReducer`)

## 🏗 Backend Architecture

This project utilizes a **Serverless / Client-Side AI** architecture.

*   **No Traditional Server**: There is no Node.js or Python backend server managing a database.
*   **The "Backend"**: The application communicates directly with **Google's Gemini API**. The AI model acts as the logic layer, performing image recognition and data structuring on demand.
*   **Database**: The browser's `LocalStorage` acts as the persistence layer, simulating a database structure using JSON serialization.

## 🧠 Data Structures & Algorithms Report

To ensure performance and handle complex features, specific Data Structures were implemented in the code:

### 1. Nested Hash Maps (Adjacency List-like State)
*   **Where**: `App.tsx` (State variable: `allUsersData`)
*   **Implementation**: `Map<Username, Map<ReportID, AnalysisReport>>`
*   **Purpose**: This mimics a relational database index in memory.
    *   **Efficiency**: It allows for **O(1) (Constant Time)** lookup, insertion, and update of any specific report if the User ID and Report ID are known.
    *   **Benefit**: This is significantly more efficient than iterating through a flat array of all reports (`O(N)`) every time a status update is needed.

### 2. Stack (LIFO - Last In, First Out)
*   **Where**: `components/ImageAnnotator.tsx` (State variable: `history`)
*   **Implementation**: `Array<Annotation>` (utilized as a Stack)
*   **Purpose**: Manages the **Undo** functionality in the drawing tool.
    *   **Operation**: Every time a user draws a line, the action is **Pushed** onto the stack. When "Undo" is clicked, the last action is **Popped** (via `slice`).
    *   **Algorithm**: The canvas is cleared and re-rendered by iterating through the stack to reconstruct the image state.

### 3. Priority Queue Logic (Sorting)
*   **Where**: `components/IssueTracker.tsx` and `AdminDashboard.tsx`
*   **Implementation**: `Array.prototype.sort()` with custom comparators.
*   **Purpose**: Sorting issues by urgency or date.
    *   **Algorithm**: Custom comparator functions map Priority strings ('High', 'Medium', 'Low') to integers (3, 2, 1) to perform numeric sorting, ensuring critical issues appear at the top of the feed.

## 📂 Project Structure

A brief overview of the code organization:

*   **`App.tsx`**: The main controller. Handles routing (via state), data persistence, and the master state `Map`.
*   **`services/geminiService.ts`**: The interface to the AI backend. Contains the prompt engineering and JSON schema validation for the Gemini API.
*   **`components/`**:
    *   **`ImageAnnotator.tsx`**: Complex UI component using HTML5 Canvas API and vector math.
    *   **`ReportDisplay.tsx`**: Renders the AI analysis and handles status updates.
    *   **`ImageUploader.tsx`**: Handles file drag-and-drop and Camera media streams.
*   **`types.ts`**: TypeScript definitions ensuring type safety across the application.
*   **`metadata.json`**: Configuration for camera and location permissions.

## 🏃‍♂️ How to Run

1.  **Configure API Key**: Copy `.env.example` to `.env` and set `VITE_GEMINI_API_KEY` to your Google Gemini API key.
2.  **Install**: `npm install`
3.  **Start**: `npm run dev`
