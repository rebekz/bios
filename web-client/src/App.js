import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import * as sdk from 'matrix-js-sdk';
import toast from 'react-hot-toast';

import LoginPage from './components/LoginPage';
import ChatPage from './components/ChatPage';
import LoadingSpinner from './components/LoadingSpinner';

// Matrix Context
const MatrixContext = createContext();

export const useMatrix = () => {
  const context = useContext(MatrixContext);
  if (!context) {
    throw new Error('useMatrix must be used within a MatrixProvider');
  }
  return context;
};

// Matrix Provider Component
const MatrixProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Initialize Matrix client
  const initializeClient = async (baseUrl = 'http://localhost:8008') => {
    try {
      const matrixClient = sdk.createClient({
        baseUrl: baseUrl,
        store: new sdk.MemoryStore(),
        scheduler: new sdk.MatrixScheduler(),
      });
      
      return matrixClient;
    } catch (error) {
      console.error('Failed to initialize Matrix client:', error);
      toast.error('Failed to connect to Matrix server');
      return null;
    }
  };

  // Login function
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      const matrixClient = await initializeClient();
      
      if (!matrixClient) {
        throw new Error('Failed to initialize client');
      }

      const response = await matrixClient.loginWithPassword(username, password);
      
      // Store credentials
      localStorage.setItem('matrix_access_token', response.access_token);
      localStorage.setItem('matrix_user_id', response.user_id);
      localStorage.setItem('matrix_device_id', response.device_id);
      
      // Create a new client with the credentials
      const authenticatedClient = sdk.createClient({
        baseUrl: 'http://localhost:8008',
        accessToken: response.access_token,
        userId: response.user_id,
        deviceId: response.device_id,
        store: new sdk.MemoryStore(),
        scheduler: new sdk.MatrixScheduler(),
      });

      // Start client
      await authenticatedClient.startClient();
      
      // Debug: expose client globally
      window.matrixClient = authenticatedClient;
      console.warn('🔥 Matrix client set in login, rooms:', authenticatedClient.getRooms().length);
      
      setClient(authenticatedClient);
      setUser(response);
      setIsLoggedIn(true);
      
      toast.success('Successfully logged in!');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (username, password) => {
    try {
      setIsLoading(true);
      
      // Use direct HTTP requests for registration since Matrix SDK has issues with auth flows
      const baseUrl = 'http://localhost:8008';
      
      // First request to get authentication flows
      const firstResponse = await fetch(`${baseUrl}/_matrix/client/v3/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const firstData = await firstResponse.json();
      
      if (firstResponse.ok && firstData.user_id) {
        // Registration succeeded without auth
        return await login(username, password);
      }
      
      // Handle authentication flow
      if (firstData.flows && firstData.session) {
        // Find dummy auth flow
        const dummyFlow = firstData.flows.find(flow => 
          flow.stages && flow.stages.includes('m.login.dummy')
        );
        
        if (dummyFlow) {
          // Register with dummy auth
          const authResponse = await fetch(`${baseUrl}/_matrix/client/v3/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: username,
              password: password,
              auth: {
                type: 'm.login.dummy',
                session: firstData.session
              }
            }),
          });
          
          const authData = await authResponse.json();
          
          if (authResponse.ok && authData.user_id) {
            // Registration successful, now login
            return await login(username, password);
          } else {
            throw new Error(authData.error || 'Registration failed');
          }
        } else {
          throw new Error('No supported authentication flow found');
        }
      } else {
        throw new Error(firstData.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.message || 'Registration failed';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (client) {
        await client.logout();
        client.stopClient();
      }
      
      // Clear stored credentials
      localStorage.removeItem('matrix_access_token');
      localStorage.removeItem('matrix_user_id');
      localStorage.removeItem('matrix_device_id');
      
      setClient(null);
      setUser(null);
      setIsLoggedIn(false);
      
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  // Check for existing session on app load
  useEffect(() => {
    console.warn('🔥 App.js useEffect starting...');
    
    const checkExistingSession = async () => {
      const accessToken = localStorage.getItem('matrix_access_token');
      const userId = localStorage.getItem('matrix_user_id');
      const deviceId = localStorage.getItem('matrix_device_id');

      console.warn('🔥 Checking credentials:', {
        hasToken: !!accessToken,
        userId: userId,
        hasDeviceId: !!deviceId
      });

      if (accessToken && userId && deviceId) {
        try {
          console.warn('🔥 Creating Matrix client...');
          
          // Create client with stored credentials
          const authenticatedClient = sdk.createClient({
            baseUrl: 'http://localhost:8008',
            accessToken: accessToken,
            userId: userId,
            deviceId: deviceId,
            store: new sdk.MemoryStore(),
            scheduler: new sdk.MatrixScheduler(),
          });

          console.warn('🔥 Starting Matrix client...');
          await authenticatedClient.startClient();
          
          // Wait for initial sync
          await new Promise((resolve) => {
            const onSync = (state) => {
              console.warn('🔥 Sync state:', state);
              if (state === 'PREPARED') {
                authenticatedClient.removeListener('sync', onSync);
                resolve();
              }
            };
            
            if (authenticatedClient.getSyncState() === 'PREPARED') {
              resolve();
            } else {
              authenticatedClient.on('sync', onSync);
            }
          });
          
          // Debug: expose client globally
          window.matrixClient = authenticatedClient;
          console.warn('🔥 Matrix client set in App.js, rooms:', authenticatedClient.getRooms().length);
          
          setClient(authenticatedClient);
          setUser({ user_id: userId, device_id: deviceId });
          setIsLoggedIn(true);
          
          console.warn('🔥 App.js session restoration complete');
        } catch (error) {
          console.warn('❌ Failed to restore session:', error);
          // Clear invalid credentials
          localStorage.removeItem('matrix_access_token');
          localStorage.removeItem('matrix_user_id');
          localStorage.removeItem('matrix_device_id');
        }
      } else {
        console.warn('🔥 No stored credentials found');
      }
      
      setIsLoading(false);
    };

    checkExistingSession();
  }, []);

  const value = {
    client,
    isLoggedIn,
    isLoading,
    user,
    login,
    register,
    logout,
  };

  return (
    <MatrixContext.Provider value={value}>
      {children}
    </MatrixContext.Provider>
  );
};

// Main App Component
function App() {
  return (
    <MatrixProvider>
      <div className="App">
        <AppRoutes />
      </div>
    </MatrixProvider>
  );
}

// App Routes Component
const AppRoutes = () => {
  const { isLoggedIn, isLoading } = useMatrix();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/chat" replace /> : <LoginPage />}
      />
      <Route
        path="/chat"
        element={isLoggedIn ? <ChatPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/"
        element={<Navigate to={isLoggedIn ? "/chat" : "/login"} replace />}
      />
    </Routes>
  );
};

export default App;