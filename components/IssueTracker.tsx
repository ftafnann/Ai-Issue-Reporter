
import React from 'react';
import { AnalysisReport, Priority, Status } from '../types';
import { CalendarIcon, SortAscendingIcon, SortDescendingIcon } from './icons';

interface IssueTrackerProps {
  issues: AnalysisReport[];
  onSelectIssue: (issue: AnalysisReport) => void;
  sortBy: 'createdAt' | 'priority';
  setSortBy: (sortBy: 'createdAt' | 'priority') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
}

const priorityStyles: { [key in Priority]: { text: string; border: string } } = {
  [Priority.Low]: { text: 'text-green-300', border: 'border-green-700/50' },
  [Priority.Medium]: { text: 'text-yellow-300', border: 'border-yellow-700/50' },
  [Priority.High]: { text: 'text-red-300', border: 'border-red-700/50' },
};

const statusStyles: { [key in Status]: { text: string } } = {
  [Status.Reported]: { text: 'text-blue-400' },
  [Status.InProgress]: { text: 'text-purple-400' },
  [Status.Resolved]: { text: 'text-gray-400' },
};

const IssueTracker: React.FC<IssueTrackerProps> = ({ issues, onSelectIssue, sortBy, setSortBy, sortOrder, setSortOrder }) => {
    
    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    return (
    <div className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 space-y-4 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-white">My Tracked Issues</h2>
            <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-lg">
                <button
                    onClick={() => setSortBy('createdAt')}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${sortBy === 'createdAt' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    Sort by Date
                </button>
                 <button
                    onClick={() => setSortBy('priority')}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${sortBy === 'priority' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    Sort by Priority
                </button>
                 <button
                    onClick={toggleSortOrder}
                    className="p-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                    aria-label={`Set sort order to ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                >
                    {sortOrder === 'asc' ? <SortAscendingIcon className="w-5 h-5" /> : <SortDescendingIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
        
        {issues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {issues.map(issue => {
                const pStyles = priorityStyles[issue.priority];
                const sStyles = statusStyles[issue.status];
                return (
                    <button 
                        key={issue.id} 
                        onClick={() => onSelectIssue(issue)}
                        style={{
                            backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.8), rgba(17, 24, 39, 0.95)), url(${issue.imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                        className={`relative p-4 rounded-lg text-left transition-all duration-200 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 border ${pStyles.border} min-h-[120px] flex flex-col justify-between`}
                    >
                        <div>
                            <div className="flex justify-between items-start">
                                <p className={`text-xs font-bold uppercase tracking-wider ${pStyles.text}`}>{issue.priority} Priority</p>
                                <p className={`text-xs font-bold uppercase tracking-wider ${sStyles.text}`}>{issue.status}</p>
                            </div>
                            <h3 className="text-lg font-semibold text-white mt-2 truncate">{issue.problem}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                           <CalendarIcon className="w-4 h-4"/>
                           <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                    </button>
                )
            })}
            </div>
        ) : (
            <div className="text-center py-10 px-4 bg-gray-900/50 rounded-lg">
                <p className="text-gray-400">You have not reported any issues yet.</p>
                <p className="text-sm text-gray-500 mt-1">Use the creator tools to generate a new report.</p>
            </div>
        )}
    </div>
  );
};

export default IssueTracker;