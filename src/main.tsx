import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { TextSizeProvider } from './contexts/TextSizeContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TextSizeProvider>
      <App />
    </TextSizeProvider>
  </React.StrictMode>,
)