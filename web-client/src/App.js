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
      
      // Update client with credentials
      matrixClient.setCredentials({
        userId: response.user_id,
        accessToken: response.access_token,
        deviceId: response.device_id,
      });

      // Start client
      await matrixClient.startClient();
      
      setClient(matrixClient);
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
      const matrixClient = await initializeClient();
      
      if (!matrixClient) {
        throw new Error('Failed to initialize client');
      }

      const response = await matrixClient.register(username, password);
      
      // Auto-login after registration
      return await login(username, password);
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error.message || 'Registration failed');
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
    const checkExistingSession = async () => {
      const accessToken = localStorage.getItem('matrix_access_token');
      const userId = localStorage.getItem('matrix_user_id');
      const deviceId = localStorage.getItem('matrix_device_id');

      if (accessToken && userId && deviceId) {
        try {
          const matrixClient = await initializeClient();
          
          if (matrixClient) {
            matrixClient.setCredentials({
              userId: userId,
              accessToken: accessToken,
              deviceId: deviceId,
            });

            await matrixClient.startClient();
            
            setClient(matrixClient);
            setUser({ user_id: userId, device_id: deviceId });
            setIsLoggedIn(true);
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          // Clear invalid credentials
          localStorage.removeItem('matrix_access_token');
          localStorage.removeItem('matrix_user_id');
          localStorage.removeItem('matrix_device_id');
        }
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