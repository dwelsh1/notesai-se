import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { Dashboard } from './routes/Dashboard'
import { Settings } from './routes/Settings'
import { Editor } from './routes/Editor'
import './App.css'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="page/:id" element={<Editor />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
