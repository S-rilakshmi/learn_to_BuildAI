import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// createRoot takes over the <div id="root"> in index.html and
// renders <App /> into it. StrictMode double-renders in development
// to surface side effects that shouldn't exist.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
