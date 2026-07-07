import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import GardenPage from './pages/GardenPage';
import StudioPage from './pages/StudioPage';
import GalleryPage from './pages/GalleryPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AuthPage from './pages/AuthPage';
import OmniversePage from './pages/OmniversePage';
import MessagesPage from './pages/MessagesPage';
import SocialPage from './pages/SocialPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"             element={<HomePage />} />
          <Route path="/garden"       element={<GardenPage />} />
          <Route path="/studio"       element={<StudioPage />} />
          <Route path="/gallery"      element={<GalleryPage />} />
          <Route path="/profile"      element={<ProfilePage />} />
          <Route path="/profile/:uid" element={<ProfilePage />} />
          <Route path="/admin"        element={<AdminPage />} />
          <Route path="/admin/login"  element={<AdminLoginPage />} />
          <Route path="/auth"         element={<AuthPage />} />
          <Route path="/omniverse"    element={<OmniversePage />} />
          <Route path="/messages"     element={<MessagesPage />} />
          <Route path="/social"       element={<SocialPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
