import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './youtube-theme.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


// Service worker disabled to fix caching issues
