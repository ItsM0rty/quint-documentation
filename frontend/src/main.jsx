import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import QuintApp from './QuintApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QuintApp />
  </StrictMode>,
)