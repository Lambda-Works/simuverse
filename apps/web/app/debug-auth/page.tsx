'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/services/ApiClient';

export default function DebugAuthPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [authState, setAuthState] = useState<any>({});

  useEffect(() => {
    const addLog = (msg: string) => {
      setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    // Check localStorage
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const refreshToken = localStorage.getItem('refreshToken');

    addLog(`Token: ${token ? token.substring(0, 50) + '...' : 'NULL'}`);
    addLog(`User: ${user || 'NULL'}`);
    addLog(`RefreshToken: ${refreshToken ? 'EXISTS' : 'NULL'}`);

    setAuthState({ token, user, refreshToken });

    // Test API call
    if (token) {
      addLog('Testing API call to /tech-sheets...');
      apiClient.get('/tech-sheets')
        .then(res => {
          addLog(`✅ Success: ${res.data.length} tech sheets`);
        })
        .catch(err => {
          addLog(`❌ Error: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
        });
    } else {
      addLog('⚠️ No token found, skipping API test');
    }
  }, []);

  const clearAndLogin = () => {
    localStorage.clear();
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Debug Auth</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="font-semibold mb-2">Auth State</h2>
          <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(authState, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="font-semibold mb-2">Logs</h2>
          <div className="text-sm font-mono space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-gray-700">{log}</div>
            ))}
          </div>
        </div>

        <button
          onClick={clearAndLogin}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Clear Auth & Go to Login
        </button>
      </div>
    </div>
  );
}
