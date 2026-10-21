import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';
import './index.css';

// Ensure direct connection to backend (port 5000) with CORS enabled
axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.headers.common['Accept'] = 'application/json';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
