import React, { useState } from 'react';
import { AnalysisReport, Priority, Status, User } from '../types';
import { CalendarIcon, SortAscendingIcon, SortDescendingIcon } from './icons';

interface AdminDashboardProps {
  issues: AnalysisReport[];
  inspectors: User[];
  onSelectIssue: (issue: AnalysisReport) => void;
  onAssignInspector: (reportId: string, reportedBy: string, inspectorUsername: string | undefined) => void;
  sortBy: 'createdAt' | 'priority';
  setSortBy: (sortBy: 'createdAt' | 'priority') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  hasInspectors: boolean;
}

const priorityStyles: { [key in Priority]: { border: string } } = {
  [Priority.Low]: { border: 'border-green-700/50' },
  [Priority.Medium]: { border: 'border-yellow-700/50' },
  [Priority.High]: { border: 'border-red-700/50' },
};

const statusStyles: { [key in Status]: { text: string, bg: string } } = {
  [Status.Reported]: { text: 'text-blue-300', bg: 'bg-blue-900/50' },
  [Status.InProgress]: { text: 'text-purple-300', bg: 'bg-purple-900/50' },
  [Status.Resolved]: { text: 'text-gray-400', bg: 'bg-gray-800/50' },
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ issues, inspectors, onSelectIssue, onAssignInspector, sortBy, setSortBy, sortOrder, setSortOrder, hasInspectors }) => {
    const [showN8nInfo, setShowN8nInfo] = useState(false);
    
    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const n8nPrompt = `You are an AI Maintenance Coordinator. Analyze the report for coordinates. Output JSON alert.`;

    return (
    <div className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 space-y-4 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Admin Control Center</h2>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-3 h-3 rounded-full bg-amber-400 ring-1 ring-amber-200/50"></span>
                  <span>New Priority Issues</span>
                </div>
                <button 
                  onClick={() => setShowN8nInfo(!showN8nInfo)}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
                >
                  {showN8nInfo ? 'Hide n8n Config' : 'Setup n8n Automation'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-lg">
                <button onClick={() => setSortBy('createdAt')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${sortBy === 'createdAt' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Date</button>
                <button onClick={() => setSortBy('priority')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${sortBy === 'priority' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Priority</button>
                <button onClick={toggleSortOrder} className="p-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors" aria-label={`Set sort order to ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}>
                    {sortOrder === 'asc' ? <SortAscendingIcon className="w-5 h-5" /> : <SortDescendingIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>

        {showN8nInfo && (
          <div className="bg-cyan-900/20 border border-cyan-700/50 p-4 rounded-lg animate-fade-in">
            <h4 className="text-sm font-bold text-cyan-300 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Connect to n8n Automation
            </h4>
            <p className="text-xs text-gray-300 mb-3 leading-relaxed">
              To trigger external workflows, set up a <strong>Webhook Trigger</strong> in n8n and use the following AI System Prompt in your Gemini Node:
            </p>
            <div className="bg-black/40 p-3 rounded border border-gray-700 relative group">
              <code className="text-[10px] text-teal-400 break-words">{n8nPrompt}</code>
              <button 
                onClick={() => navigator.clipboard.writeText(n8nPrompt)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-gray-700 text-[10px] px-2 py-1 rounded transition-opacity"
              >
                Copy
              </button>
            </div>
          </div>
        )}
        
        {issues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {issues.map(issue => {
                const pStyles = priorityStyles[issue.priority];
                const sStyles = statusStyles[issue.status];
                const needsInspection = hasInspectors && issue.status === Status.Reported && (issue.priority === Priority.High || issue.priority === Priority.Medium);
                const hasReview = !!issue.inspectorReview && issue.status !== Status.Resolved;
                
                return (
                    <div key={issue.id} className={`bg-gray-800 rounded-lg border ${pStyles.border} shadow-lg flex flex-col transition-transform duration-200 hover:scale-[1.02] ${needsInspection ? 'ring-2 ring-amber-400' : ''}`}>
                        <button onClick={() => onSelectIssue(issue)} className="block w-full h-32 bg-gray-900 rounded-t-lg overflow-hidden">
                          {issue.imageUrl ? (
                            <img src={issue.imageUrl} alt={issue.problem} className="w-full h-full object-cover"/>
                          ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500">No Image</div>
                          )}
                        </button>
                        <div className="p-4 flex flex-col flex-grow">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${sStyles.bg} ${sStyles.text}`}>{issue.status}</span>
                             {hasReview && (
                                <span className="px-2 py-0.5 text-xs font-bold text-teal-200 bg-teal-800/70 rounded-full">Review</span>
                              )}
                          </div>
                          <button onClick={() => onSelectIssue(issue)} className="text-left flex-grow">
                            <h3 className="text-md font-semibold text-white hover:text-cyan-400 transition-colors">{issue.problem}</h3>
                            <p className="text-xs text-gray-400 mt-1">By: {issue.reportedBy}</p>
                          </button>
                           <div className="mt-3">
                              <label htmlFor={`inspector-select-${issue.id}`} className="text-xs font-semibold text-gray-400">Assign Inspector:</label>
                              <select 
                                id={`inspector-select-${issue.id}`}
                                value={issue.assignedInspectorUsername || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  onAssignInspector(issue.id, issue.reportedBy, e.target.value || undefined);
                                }}
                                onClick={(e) => e.stopPropagation()} 
                                className="mt-1 w-full bg-gray-900/70 border border-gray-600 rounded-md p-1.5 text-sm text-white focus:ring-cyan-500 focus:border-cyan-500"
                              >
                                <option value="">Unassigned</option>
                                {inspectors.map(inspector => (
                                  <option key={inspector.username} value={inspector.username}>{inspector.username}</option>
                                ))}
                              </select>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-3 pt-2 border-t border-gray-700">
                             <CalendarIcon className="w-3.5 h-3.5"/>
                             <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                    </div>
                )
            })}
            </div>
        ) : (
            <div className="text-center py-10 px-4 bg-gray-900/50 rounded-lg">
                <p className="text-gray-400">No issues have been reported by any user yet.</p>
            </div>
        )}
    </div>
  );
};

export default AdminDashboard;