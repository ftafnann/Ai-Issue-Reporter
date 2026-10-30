import React, { useState } from 'react';
import { downloadReadme } from '../readmeData';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsersData?: Map<string, Map<string, any>>;
  onImportData?: (importedData: Map<string, Map<string, any>>) => void;
}

const SHARED_APP_URL = 'https://ais-pre-7koqusiciekqgtgwuakatz-335287824673.asia-east1.run.app';

export const ShareModal: React.FC<ShareModalProps> = ({ 
  isOpen, 
  onClose,
  allUsersData,
  onImportData
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'code' | 'data'>('link');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' && window.location.href.startsWith('http') 
    ? window.location.href 
    : SHARED_APP_URL;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(SHARED_APP_URL || currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const handleExportData = () => {
    try {
      const stored = localStorage.getItem('ai_issue_reporter_data') || '[]';
      const blob = new Blob([stored], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-issue-reporter-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          localStorage.setItem('ai_issue_reporter_data', text);
          if (onImportData) {
            const loaded = new Map<string, Map<string, any>>(
              parsed.map(([username, issues]: [string, any[]]) => [
                username,
                new Map(issues)
              ])
            );
            onImportData(loaded);
          }
          alert('Data imported successfully! The dashboard has been updated.');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Could not parse the backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Share & Download Project</h2>
              <p className="text-xs text-gray-400">Share with teammates or export the full source code</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/60 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-900/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'link' 
                ? 'border-cyan-400 text-cyan-300' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            1. Share Live App
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'code' 
                ? 'border-cyan-400 text-cyan-300' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            2. Download Full Source Code
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'data' 
                ? 'border-cyan-400 text-cyan-300' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            3. Project Data & Docs
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'link' && (
            <div className="space-y-5">
              <div className="bg-gray-900/70 border border-gray-700 rounded-xl p-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
                  Live Teammate Sharing Link
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={SHARED_APP_URL}
                    className="flex-grow px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-gray-200 select-all focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
                  >
                    {copiedLink ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-900" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-900/40 border border-gray-700/70 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold">1</span>
                    Works on Mobile Phones
                  </div>
                  <p className="text-xs text-gray-400">
                    Send this link to teammates on their phones. They can open it directly in Chrome or Safari to test the real-time thermal camera & GPS live in the field!
                  </p>
                </div>

                <div className="p-4 bg-gray-900/40 border border-gray-700/70 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs font-bold">2</span>
                    Role-Based Access
                  </div>
                  <p className="text-xs text-gray-400">
                    Teammates can log in as <strong>Field Agent</strong> (creates reports), <strong>Inspector Mike</strong> (uploads verification photos), or <strong>Admin</strong> (assigns staff).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-cyan-950/60 to-gray-900 border border-cyan-800/40 rounded-xl p-4">
                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  How to Download Full Project ZIP from Google AI Studio:
                </h3>
                <ol className="text-xs text-gray-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Look at the <strong>top-right corner</strong> of your Google AI Studio Build workspace.
                  </li>
                  <li>
                    Click the <strong>Code</strong> icon (<code className="text-cyan-300">&lt; / &gt;</code>) or the <strong>Three-Dots menu (⋮)</strong>.
                  </li>
                  <li>
                    Click <strong>"Download ZIP"</strong> or <strong>"Export to GitHub"</strong>.
                  </li>
                  <li>
                    This downloads all files: React components, TypeScript files, Tailwind config, thermal heat map algorithms, and package configurations.
                  </li>
                </ol>
              </div>

              <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                    Running Locally on Your Computer
                  </label>
                  <button
                    onClick={() => handleCopyCommand('git clone <repo-url> && npm install && npm run dev')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {copiedCommand ? 'Copied command!' : 'Copy Commands'}
                  </button>
                </div>
                <pre className="p-3 bg-gray-950 rounded-lg text-xs font-mono text-cyan-300 overflow-x-auto border border-gray-800">
{`# 1. Unzip the downloaded project or clone it
cd ai-issue-reporter

# 2. Install dependencies
npm install

# 3. Start the Vite local development server
npm run dev
# -> Opens http://localhost:3000`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Technical Documentation (README.md)</h4>
                  <p className="text-xs text-gray-400">Includes system architecture, n8n webhook automation prompt, and data structures.</p>
                </div>
                <button
                  onClick={downloadReadme}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-xs font-bold text-cyan-300 transition-colors whitespace-nowrap"
                >
                  Download README
                </button>
              </div>

              <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Export Issues Database (JSON Backup)</h4>
                  <p className="text-xs text-gray-400">Save all created issues, annotations, and inspection records to share with teammates.</p>
                </div>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-bold text-white transition-colors whitespace-nowrap"
                >
                  Export JSON Backup
                </button>
              </div>

              <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Import Issues Database</h4>
                  <p className="text-xs text-gray-400">Load a teammate's JSON backup into your app.</p>
                </div>
                <label className="cursor-pointer px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-xs font-bold text-teal-300 transition-colors whitespace-nowrap">
                  Import JSON
                  <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-700 bg-gray-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded-lg transition-colors border border-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default ShareModal;
