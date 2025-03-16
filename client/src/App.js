import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/routing/PrivateRoute";
import Spinner from "./components/common/Spinner";
import { ThemeProvider } from "./context/ThemeContext";
import "./App.css";

// Layouts
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Pages - Direct imports for existing components
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import DocumentEdit from "./pages/DocumentEdit";
import DocumentView from "./pages/DocumentView";
import UserSettings from "./pages/UserSettings";
import NotFound from "./pages/NotFound";
import DocumentEmailPage from "./pages/DocumentEmailPage";
import ClassicForm from "./pages/ClassicForm";
import DocumentHistory from "./pages/DocumentHistory";
import LocalDocumentPreview from "./pages/LocalDocumentPreview";

// Map existing components to lazily loaded names
const HomePage = lazy(() => Promise.resolve({ default: Home }));
const AuthPage = lazy(() => Promise.resolve({ default: Auth }));
const DocumentForm = lazy(() => import("./components/documents/DocumentForm"));
const SettingsPage = lazy(() => Promise.resolve({ default: UserSettings }));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app bg-background text-foreground min-h-screen transition-colors duration-200">
            <Navbar />
            <main className="main-content bg-background">
              <div className="container">
                <Suspense fallback={<Spinner />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/document/:id" element={<DocumentView />} />
                    <Route
                      path="/document/:id/email"
                      element={<DocumentEmailPage />}
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <PrivateRoute>
                          <Dashboard />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/document/edit/:id"
                      element={
                        <PrivateRoute>
                          <DocumentEdit />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <PrivateRoute>
                          <SettingsPage />
                        </PrivateRoute>
                      }
                    />
                    <Route path="/classic-form" element={<ClassicForm />} />
                    <Route path="/documents" element={<DocumentHistory />} />
                    <Route path="/document-preview" element={<LocalDocumentPreview />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
