import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './hooks/useAuth';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="text-center space-y-4">
                <h1 className="text-6xl font-bold text-slate-900">
                  Schedulux V3
                </h1>
                <p className="text-xl text-slate-600">
                  Frontend reset complete. Ready for redesign.
                </p>
                <div className="text-sm text-slate-500 font-mono">
                  React Router • TanStack Query • Zustand
                </div>
              </div>
            </div>
          } />
        </Routes>
        <Toaster position="top-right" richColors />
      </Router>
    </AuthProvider>
  );
}

export default App;
