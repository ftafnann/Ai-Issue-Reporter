export const README_CONTENT = `# AI Issue Reporter - Technical Documentation

**AI Issue Reporter** is a role-based facility maintenance application powered by the Google Gemini API.

## 🚀 Core Functionality
- **AI Analysis**: Uses 'gemini-3-flash-preview' to process images and generate structured reports.
- **Role System**: 
  - **User**: Captures/Annotates photos and generates reports.
  - **Admin**: Manages the master issue list and assigns personnel.
  - **Inspector**: Uploads evidence and resolves tasks.
- **Geolocation**: Precise GPS tagging for maintenance teams.

## 🤖 n8n Automation Integration
You can extend this app using **n8n** to automate notifications (Slack, Email, SMS).

### n8n Workflow Architecture:
1. **Trigger**: HTTP Webhook (POST from this app).
2. **AI Node**: Use the prompt below with the **Gemini** or **AI Agent** node.
3. **Action**: Send to Slack / Discord / Google Sheets.

### 📋 The n8n AI Prompt:
Copy-paste this into your n8n AI Node system message:

> "You are an AI Maintenance Coordinator. You will receive a structured report about a facility issue including an image, category, and geolocation. Your task is to:
> 1. Verify the severity based on the image provided.
> 2. Format a professional alert for the technical team.
> 3. If the priority is 'High', generate a JSON output with 'emergency_dispatch: true'.
> 4. Suggest the nearest warehouse for parts based on these coordinates: {{ $json.latitude }}, {{ $json.longitude }}.
> 5. Output must be a clean JSON object for the next n8n node."

## 🏗 System Architecture
### Frontend
- React 19 + TypeScript
- Tailwind CSS
- HTML5 Canvas for annotation.

### "Backend" (Serverless AI)
The app communicates directly with the Google Generative AI SDK. State is managed via a **Nested Map** data structure for O(1) lookups and persisted in **LocalStorage**.

## 🧠 Data Structures Used
1. **Stack (LIFO)**: Used in the \`ImageAnnotator\` to manage undo/redo history.
2. **Nested Hash Map**: \`Map<Username, Map<ReportID, Report>>\` for high-performance data access.
3. **Priority Comparator**: Custom sorting algorithms for dashboard feeds.
`;

export const downloadReadme = () => {
  const blob = new Blob([README_CONTENT], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'README_AI_REPORTER.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
