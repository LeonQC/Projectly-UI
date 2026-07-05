import React from "react";
import AuthLayout from "../../components/auth/AuthLayout.jsx";

function ForgotPasswordPage({ onNavigate }) {
  return (
    <AuthLayout
      onNavigate={onNavigate}
      sideTitle="Get back to your projects."
      sideText="Reset your password and continue managing your project work."
      form={{
        title: "Forgot password",
        subtitle: "Enter your email and we will send you a reset link.",
        submitLabel: "Send reset link",
        fields: [
          {
            label: "Email",
            type: "email",
          },
        ],
        footerText: "Remembered your password?",
        footerAction: "Log in",
        footerTarget: "login",
      }}
    />
  );
}

export default ForgotPasswordPage;
