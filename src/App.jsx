import React, { useEffect, useState } from "react";
import AppShell from "./components/app/AppShell.jsx";
import {
  clearAuthToken,
  getAuthToken,
  getCurrentUser,
  googleAuth,
  loginUser,
  registerUser,
  setAuthToken,
} from "./lib/api.js";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

function App() {
  const [page, setPage] = useState(() => (getAuthToken() ? "checking" : "login"));
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      setPage("login");
      return;
    }

    getCurrentUser()
      .then((user) => {
        setCurrentUser(user);
        setPage("app");
      })
      .catch(() => {
        clearAuthToken();
        setCurrentUser(null);
        setPage("login");
      });
  }, []);

  function handleAuthSuccess(authResponse) {
    setAuthToken(authResponse.access_token);
    setCurrentUser(authResponse.user);
    setAuthError("");
    setPage("app");
  }

  async function submitLogin(values) {
    setIsSubmitting(true);
    setAuthError("");
    try {
      const authResponse = await loginUser(values);
      handleAuthSuccess(authResponse);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitRegister(values) {
    setAuthError("");
    if (values.password !== values.confirm_password) {
      setAuthError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const authResponse = await registerUser(values);
      handleAuthSuccess(authResponse);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitGoogleAuth(idToken) {
    if (!idToken) {
      setAuthError("Google sign-in did not return a token");
      return;
    }

    setIsSubmitting(true);
    setAuthError("");
    try {
      const authResponse = await googleAuth(idToken);
      handleAuthSuccess(authResponse);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function logout() {
    clearAuthToken();
    setCurrentUser(null);
    setAuthError("");
    setPage("login");
  }

  if (page === "register") {
    return (
      <RegisterPage
        error={authError}
        googleClientId={GOOGLE_CLIENT_ID}
        isSubmitting={isSubmitting}
        onGoogleError={setAuthError}
        onGoogleSubmit={submitGoogleAuth}
        onNavigate={setPage}
        onRegister={submitRegister}
      />
    );
  }

  if (page === "forgot") {
    return <ForgotPasswordPage onNavigate={setPage} />;
  }

  if (page === "app") {
    if (!currentUser) {
      return (
        <main className="auth-shell">
          <section className="auth-panel">
            <div className="brand-lockup">
              <span className="brand-mark">P</span>
              <span>Projectly</span>
            </div>
            <div className="auth-heading">
              <h1>Checking session</h1>
              <p>Loading your account...</p>
            </div>
          </section>
        </main>
      );
    }

    return <AppShell currentUser={currentUser} onLogout={logout} onUserUpdated={setCurrentUser} />;
  }

  if (page === "checking") {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div className="brand-lockup">
            <span className="brand-mark">P</span>
            <span>Projectly</span>
          </div>
          <div className="auth-heading">
            <h1>Checking session</h1>
            <p>Loading your account...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <LoginPage
      error={authError}
      googleClientId={GOOGLE_CLIENT_ID}
      isSubmitting={isSubmitting}
      onGoogleError={setAuthError}
      onGoogleSubmit={submitGoogleAuth}
      onLogin={submitLogin}
      onNavigate={setPage}
    />
  );
}

export default App;
