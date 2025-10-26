import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MacroDataProvider } from './features/macro/MacroDataProvider';
import { useAuth } from './providers/AuthProvider';
import HomePage from './pages/HomePage';
import IngredientsPage from './pages/IngredientsPage';
import LoginPage from './pages/LoginPage';
import MealsPage from './pages/MealsPage';
import SignupPage from './pages/SignupPage';
import InfoPage from './pages/InfoPage';

function App() { 
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MacroDataProvider>
              <AppLayout />
            </MacroDataProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="meals" element={<MealsPage />} />
        <Route path="ingredients" element={<IngredientsPage />} />
        <Route path="info" element={<InfoPage />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />}
      />
    </Routes>
  );
}

export default App;
