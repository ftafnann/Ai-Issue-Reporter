import React, { useState } from 'react';
import { User } from '../types';
import { downloadReadme } from '../readmeData';
import ShareModal from './ShareModal';

interface LoginPageProps {
  users: User[];
  onLogin: (username: string) => void;
  error: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ users, onLogin, error }) => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      onLogin(selectedUser);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
            AI Issue Reporter
          </h1>
          <p className="mt-2 text-lg text-gray-400">Please log in to continue</p>
        </header>
        <form 
          onSubmit={handleLogin}
          className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-8 space-y-6"
        >
          <div>
            <label htmlFor="user-select" className="block text-sm font-medium text-gray-300 mb-2">
              Select User Profile
            </label>
            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="" disabled>-- Choose a user --</option>
              {users.map((user) => (
                <option key={user.username} value={user.username}>
                  {user.username} ({user.role})
                </option>
              ))}
            </select>
          </div>
          
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={!selectedUser}
            className="w-full px-8 py-3 text-lg font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-600 rounded-lg shadow-lg hover:from-cyan-400 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/50"
          >
            Login
          </button>
        </form>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <button 
            onClick={() => setIsShareOpen(true)}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700 hover:border-cyan-500/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share & Download Project
          </button>

          <button 
            onClick={downloadReadme}
            className="text-gray-400 hover:text-gray-200 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            README Docs
          </button>
        </div>

        <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
      </div>
    </div>
  );
};

export default LoginPage;