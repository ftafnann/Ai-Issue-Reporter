import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ImageUploader from './components/ImageUploader';
import ImageAnnotator from './components/ImageAnnotator';
import ReportDisplay from './components/ReportDisplay';
import IssueTracker from './components/IssueTracker';
import AdminDashboard from './components/AdminDashboard';
import Loader from './components/Loader';
import LoginPage from './components/LoginPage';
import { analyzeImageWithLocation, isGeminiConfigured } from './services/geminiService';
import { AnalysisReport, Location, Status, Priority, User, Role } from './types';
import { LocationIcon, CheckCircleIcon, ExclamationCircleIcon } from './components/icons';
import { downloadReadme } from './readmeData';
import ShareModal from './components/ShareModal';

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, {type:mime});
}

const MOCK_USERS: User[] = [
  { username: 'admin', role: Role.Admin },
  { username: 'field_agent_1', role: Role.User },
  { username: 'inspector_jane', role: Role.User },
  { username: 'inspector_mike', role: Role.IssueInspector, phone: '555-222-3333' },
];
const STORAGE_KEY = 'ai_issue_reporter_data';
const SESSION_KEY = 'ai_issue_reporter_session';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [allUsersData, setAllUsersData] = useState<Map<string, Map<string, AnalysisReport>>>(new Map());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnnotating, setIsAnnotating] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [usingFallbackLocation, setUsingFallbackLocation] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData)) {
            const loadedData = new Map<string, Map<string, AnalysisReport>>(
              (parsedData as [string, [string, AnalysisReport][]][]).map(
                ([username, issuesArray]: [string, [string, AnalysisReport][]]) => 
                  [username, new Map<string, AnalysisReport>(issuesArray)]
              )
            );
            setAllUsersData(loadedData);
        }
      }
      const sessionUser = sessionStorage.getItem(SESSION_KEY);
      if (sessionUser) {
        setCurrentUser(JSON.parse(sessionUser));
      }
    } catch (e) {
      console.error("Failed to parse data from storage", e);
    }
  }, []);

  useEffect(() => {
      const dataToStore = Array.from(allUsersData.entries()).map(([username, issuesMap]) => 
        [username, Array.from(issuesMap.entries())]
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
  }, [allUsersData]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const parsedData = JSON.parse(e.newValue);
        if (Array.isArray(parsedData)) {
            const loadedData = new Map<string, Map<string, AnalysisReport>>(
              (parsedData as [string, [string, AnalysisReport][]][]).map(
                ([username, issuesArray]: [string, [string, AnalysisReport][]]) => 
                  [username, new Map<string, AnalysisReport>(issuesArray)]
              )
            );
            setAllUsersData(loadedData);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setUsingFallbackLocation(false);
      },
      (err) => {
        console.warn("Error getting location:", err.message);
        // If getting location fails (e.g. from permissions policy or user denial), use a default location
        setLocation({ latitude: 40.7128, longitude: -74.0060 }); // Default to New York City
        setUsingFallbackLocation(true);
      }
    );
  }, []);

  const handleLogin = (username: string) => {
    const user = MOCK_USERS.find(u => u.username === username);
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      setLoginError(null);
      if (!allUsersData.has(username)) {
        setAllUsersData(prev => new Map(prev).set(username, new Map()));
      }
    } else {
      setLoginError("Invalid user selected.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem(SESSION_KEY);
    handleResetCreator();
  };

  const handleImageSelect = useCallback((file: File, dataUrl: string) => {
    setImageFile(file); setImagePreviewUrl(dataUrl); setCurrentReport(null); setIsAnnotating(true);
  }, []);
  
  const handleAnnotationComplete = useCallback((annotatedDataUrl: string) => {
    setImagePreviewUrl(annotatedDataUrl);
    if (imageFile) setImageFile(dataURLtoFile(annotatedDataUrl, imageFile.name));
    setIsAnnotating(false);
  }, [imageFile]);

  const handleResetCreator = () => {
    setImageFile(null); setImagePreviewUrl(null); setCurrentReport(null); setError(null); setIsAnnotating(false);
  };

  const handleAnalyze = async () => {
    if (!imageFile || !imagePreviewUrl || !location || !currentUser) return;
    setIsLoading(true); setError(null); setCurrentReport(null);
    try {
      const base64Data = imagePreviewUrl.split(',')[1];
      const result = await analyzeImageWithLocation(base64Data, imageFile.type, location);
      const newReport: AnalysisReport = {
        ...result, 
        id: Date.now().toString(), 
        status: Status.Reported, 
        createdAt: Date.now(), 
        reportedBy: currentUser.username,
        imageUrl: imagePreviewUrl,
        assignedInspectorUsername: undefined,
      };
      setAllUsersData(prev => {
        const newData = new Map(prev);
        const userIssuesMap = newData.get(currentUser.username);
        const userIssues = userIssuesMap instanceof Map ? new Map(userIssuesMap) : new Map<string, AnalysisReport>();
        userIssues.set(newReport.id, newReport);
        newData.set(currentUser.username, userIssues);
        return newData;
      });
      setCurrentReport(newReport);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown analysis error.";
      setError(`Analysis Failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStatusChange = (reportId: string, reportedBy: string, newStatus: Status) => {
    setAllUsersData(prev => {
      const newData = new Map(prev);
      const userIssues = newData.get(reportedBy);
      if (userIssues instanceof Map) {
        const issueToUpdate = userIssues.get(reportId);
        if (issueToUpdate) {
          const updatedUserIssues = new Map(userIssues);
          const updatedIssue = { ...issueToUpdate, status: newStatus };
          updatedUserIssues.set(reportId, updatedIssue);
          newData.set(reportedBy, updatedUserIssues);
          if (currentReport?.id === reportId) setCurrentReport(updatedIssue);
        }
      }
      return newData;
    });
  };

  const handleAssignInspector = (reportId: string, reportedBy: string, inspectorUsername: string | undefined) => {
    setAllUsersData(prev => {
      const newData = new Map(prev);
      const userIssues = newData.get(reportedBy);
      if (userIssues instanceof Map) {
        const issueToUpdate = userIssues.get(reportId);
        if (issueToUpdate) {
          const inspectorUser = MOCK_USERS.find(u => u.username === inspectorUsername);
          const updatedUserIssues = new Map(userIssues);
          const updatedIssue = { 
            ...issueToUpdate, 
            assignedInspectorUsername: inspectorUsername,
            inspector: {
              name: inspectorUser?.username || 'Unassigned',
              phone: inspectorUser?.phone || 'N/A'
            }
          };
          updatedUserIssues.set(reportId, updatedIssue);
          newData.set(reportedBy, updatedUserIssues);
          if (currentReport?.id === reportId) setCurrentReport(updatedIssue);
        }
      }
      return newData;
    });
  };

  const handleInspectorUpdate = (reportId: string, reportedBy: string, review: string, photoFile: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
        const photoUrl = reader.result as string;
        setAllUsersData(prev => {
            const newData = new Map(prev);
            const userIssues = newData.get(reportedBy);
            if (userIssues instanceof Map) {
                const issueToUpdate = userIssues.get(reportId);
                if (issueToUpdate) {
                    const updatedUserIssues = new Map(userIssues);
                    const updatedIssue: AnalysisReport = { 
                        ...issueToUpdate, 
                        status: Status.InProgress,
                        inspectorReview: review,
                        inspectorPhotoUrl: photoUrl,
                        inspectorUpdateAt: Date.now(),
                    };
                    updatedUserIssues.set(reportId, updatedIssue);
                    newData.set(reportedBy, updatedUserIssues);
                    if (currentReport?.id === reportId) setCurrentReport(updatedIssue);
                }
            }
            return newData;
        });
        setIsLoading(false);
    };
    reader.onerror = () => {
        setError("Failed to read inspector photo.");
        setIsLoading(false);
    }
    reader.readAsDataURL(photoFile);
  };

  const handleDelete = (reportId: string, reportedBy: string) => {
    setAllUsersData(prev => {
        const newData = new Map(prev);
        const userIssues = newData.get(reportedBy);
        if (userIssues instanceof Map) {
            const updatedUserIssues = new Map(userIssues);
            updatedUserIssues.delete(reportId);
            newData.set(reportedBy, updatedUserIssues);
        }
        return newData;
    });
    if (currentReport?.id === reportId) {
        setCurrentReport(null);
    }
  };

  const handleSelectIssue = (issue: AnalysisReport) => {
    setCurrentReport(issue);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const sortedIssues = useMemo(() => {
    const priorityOrder = { [Priority.High]: 3, [Priority.Medium]: 2, [Priority.Low]: 1 };
    
    let issuesArray: AnalysisReport[] = [];
    if (currentUser?.role === Role.Admin || currentUser?.role === Role.IssueInspector) {
      issuesArray = Array.from(allUsersData.values()).flatMap(userMap => userMap instanceof Map ? Array.from(userMap.values()) : []);
    } else if (currentUser) {
      const userIssues = allUsersData.get(currentUser.username);
      issuesArray = userIssues instanceof Map ? Array.from(userIssues.values()) : [];
    }

    return issuesArray.sort((a, b) => {
        let comparison = (sortBy === 'priority')
            ? priorityOrder[b.priority] - priorityOrder[a.priority]
            : b.createdAt - a.createdAt;
        return sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [allUsersData, sortBy, sortOrder, currentUser]);

  const availableInspectors = useMemo(() => MOCK_USERS.filter(u => u.role === Role.IssueInspector), []);

  if (!currentUser) {
    return <LoginPage users={MOCK_USERS} onLogin={handleLogin} error={loginError} />;
  }

  const isReadyToAnalyze = imageFile && location && !isAnnotating && isGeminiConfigured;
  const showDashboard = currentUser.role === Role.Admin || currentUser.role === Role.IssueInspector;

  const handleBackToDashboard = () => {
    setCurrentReport(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto flex-grow">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
              AI Issue Reporter
            </h1>
            <p className="text-sm text-gray-400">Logged in as: <span className="font-bold text-cyan-300">{currentUser.username}</span> ({currentUser.role})</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsShareOpen(true)} 
              className="px-3.5 py-2 text-sm font-semibold text-cyan-300 bg-gray-800 border border-cyan-700/50 rounded-lg hover:bg-cyan-900/30 hover:border-cyan-500 transition-colors flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share & Download
            </button>
            <button onClick={handleLogout} className="px-3.5 py-2 text-sm font-semibold text-red-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-red-900/50 hover:border-red-700 transition-colors">
              Logout
            </button>
          </div>
        </header>

        <main className="space-y-8">
          {currentUser.role === Role.User && !isGeminiConfigured && (
            <div role="status" className="rounded-lg border border-amber-700 bg-amber-950/60 p-4 text-amber-200">
              <p className="font-semibold">AI analysis needs a Gemini API key</p>
              <p className="mt-1 text-sm text-amber-100/90">
                Copy <code className="rounded bg-black/20 px-1">.env.example</code> to <code className="rounded bg-black/20 px-1">.env</code>,
                add your key as <code className="rounded bg-black/20 px-1">VITE_GEMINI_API_KEY</code>, then restart the dev server.
              </p>
            </div>
          )}
          {currentReport && location ? (
             <div className="space-y-6">
                <ReportDisplay 
                    report={currentReport} 
                    location={location} 
                    currentUser={currentUser}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onInspectorUpdate={handleInspectorUpdate}
                    onAssignInspector={handleAssignInspector}
                    inspectors={availableInspectors}
                    isLoading={isLoading}
                />
                <div className="text-center">
                    <button onClick={handleBackToDashboard} className="px-6 py-2 text-base font-semibold text-cyan-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors">
                        Back to Dashboard
                    </button>
                </div>
            </div>
          ) : (
            currentUser.role === Role.User ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">1. Provide Image</h3>
                    {isAnnotating && imagePreviewUrl ? (
                      <ImageAnnotator src={imagePreviewUrl} onComplete={handleAnnotationComplete} onCancel={() => setIsAnnotating(false)} />
                    ) : (
                      <>
                        <ImageUploader onImageSelect={handleImageSelect} imagePreviewUrl={imagePreviewUrl} />
                        {imagePreviewUrl && (
                          <div className="flex justify-center items-center gap-6 mt-2">
                              <button onClick={() => setIsAnnotating(true)} className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">Annotate</button>
                              <button onClick={handleResetCreator} className="text-sm font-semibold text-red-400 hover:text-red-300 hover:underline">Clear</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">2. Confirm Location</h3>
                    <div className={`p-4 rounded-lg flex items-center space-x-3 border ${location ? (usingFallbackLocation ? 'bg-orange-900/50 border-orange-700' : 'bg-green-900/50 border-green-700') : 'bg-yellow-900/50 border-yellow-700'}`}>
                      {location ? <CheckCircleIcon className={`w-8 h-8 ${usingFallbackLocation ? 'text-orange-400' : 'text-green-400'}`} /> : <LocationIcon className="w-8 h-8 text-yellow-400 animate-pulse" />}
                      <div>
                        <p className="font-semibold">{location ? (usingFallbackLocation ? 'Fallback Location Used' : 'Location Acquired') : 'Getting Location...'}</p>
                        {location && <p className={`text-sm ${usingFallbackLocation ? 'text-orange-300' : 'text-gray-300'}`}>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>}
                        {usingFallbackLocation && <p className="text-xs text-orange-400 mt-1">Browser blocked location access.</p>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center pt-4">
                  <button onClick={handleAnalyze} disabled={!isReadyToAnalyze || isLoading} className="px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-600 rounded-lg shadow-lg hover:from-cyan-400 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300">
                    {isLoading ? 'Analyzing...' : 'Generate Report'}
                  </button>
                </div>
              </div>
            ) : null
          )}

          {error && <div className="p-4 mt-6 bg-red-900/50 border border-red-700 text-red-300 rounded-lg flex items-center space-x-3"><ExclamationCircleIcon className="w-6 h-6"/><span>{error}</span></div>}
          {isLoading && !currentReport && <Loader message="AI is analyzing the image and location..." />}

          {!currentReport && (
            showDashboard ? (
              <AdminDashboard 
                issues={sortedIssues} 
                onSelectIssue={handleSelectIssue} 
                sortBy={sortBy} setSortBy={setSortBy} 
                sortOrder={sortOrder} setSortOrder={setSortOrder} 
                hasInspectors={availableInspectors.length > 0}
                inspectors={availableInspectors}
                onAssignInspector={handleAssignInspector}
              />
            ) : (
              <IssueTracker 
                issues={sortedIssues} 
                onSelectIssue={handleSelectIssue} 
                sortBy={sortBy} setSortBy={setSortBy} 
                sortOrder={sortOrder} setSortOrder={setSortOrder} 
              />
            )
          )}
        </main>
      </div>
      
      <footer className="w-full max-w-4xl mx-auto py-8 mt-12 border-t border-gray-800 text-center">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
          <button 
            onClick={() => setIsShareOpen(true)}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share / Download Project
          </button>
          <span>•</span>
          <button 
            onClick={downloadReadme}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            README.md Documentation
          </button>
        </div>
        <p className="text-gray-600 text-[10px] mt-4 uppercase tracking-widest">&copy; 2025 AI Issue Reporter System</p>
      </footer>

      <ShareModal 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        allUsersData={allUsersData}
        onImportData={(data) => setAllUsersData(data)}
      />
    </div>
  );
};

export default App;
