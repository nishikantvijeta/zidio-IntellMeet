import React from 'react';
import { AuthProvider } from './features/auth/AuthContext';
import { SocketProvider } from './app/SocketContext';
import { ThemeProvider } from './app/ThemeContext';
import { AppRouter } from './app/router';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <AppRouter />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
