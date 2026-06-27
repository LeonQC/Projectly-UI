import React from "react";
import AuthForm from "./AuthForm.jsx";
import BoardPreview from "./BoardPreview.jsx";

function AuthLayout({ form, sideTitle, sideText, onNavigate }) {
  return (
    <main className="auth-shell">
      <div className="auth-frame">
        <AuthForm {...form} onNavigate={onNavigate} />
        <aside className="auth-side-panel">
          <div className="side-copy">
            <h2>{sideTitle}</h2>
            <p>{sideText}</p>
          </div>
          <BoardPreview />
        </aside>
      </div>
    </main>
  );
}

export default AuthLayout;
