import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import axios from 'axios';

import { GoogleOAuthProvider } from '@react-oauth/google';

const apiBase = import.meta.env.VITE_API_URL || '';
// Fallback to the ID if env var isn't loaded properly
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '550430705112-a7t4dqne96tgibltm506q3scrmcg3ob3.apps.googleusercontent.com';
axios.defaults.baseURL = `${apiBase}/api`;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
