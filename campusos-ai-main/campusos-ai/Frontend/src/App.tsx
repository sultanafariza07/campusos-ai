import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import NotesPage from "./pages/NotesPage";
import NoteEditorPage from "./pages/NoteEditorPage";
import AiChatPage from "./pages/AiChatPage";
import TasksPage from "./pages/TasksPage";
import StudyPlannerPage from "./pages/StudyPlannerPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import BottomNav from "./pages/components/BottomNav";



// This is a placeholder for a real ProtectedRoute component.
// It ensures that a user must be logged in to access these pages.
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  // In a real app, you'd check for a valid token here and redirect if missing.
  return children;
};

// Define which routes should display the bottom navigation bar.
const NAV_ROUTES = ["/dashboard", "/tasks", "/ai", "/study-planner", "/profile"];



function Layout() {
  const { pathname } = useLocation();
  const showNav = NAV_ROUTES.includes(pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
        <Route path="/notes/new" element={<ProtectedRoute><NoteEditorPage /></ProtectedRoute>} />
        <Route path="/notes/:id" element={<ProtectedRoute><NoteEditorPage /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AiChatPage /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
        <Route path="/study-planner" element={<ProtectedRoute><StudyPlannerPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
