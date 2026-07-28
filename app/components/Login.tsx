import React, { useState } from 'react';
import { Waves, Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation - you can customize this
    if (username === 'admin' && password === 'admin123') {
      onLogin();
    } else {
      setError('Username atau password salah');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-50 to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 transition-colors">
      <div className="max-w-md w-full">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 border-blue-200/50 dark:border-gray-700/50">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 dark:from-blue-700 dark:to-teal-700 p-4 rounded-full mb-4">
              <Waves className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white text-center">
              Sistem Monitoring Kualitas Air
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">Danau Toba, Sumatera Utara</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                  placeholder="Masukkan username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                  placeholder="Masukkan password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-500 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all transform hover:scale-105 active:scale-95"
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Demo: username: <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">admin</span></p>
            <p>password: <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">admin123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
