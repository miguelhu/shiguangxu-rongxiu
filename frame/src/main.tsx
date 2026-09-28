import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import RetirementFrame from './retirement/RetirementFrame'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{location.hash.startsWith('#/frame') ? <RetirementFrame /> : <App />}</React.StrictMode>,
)
