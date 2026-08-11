import React from "react";
import AuthLayout from "../../components/auth/AuthLayout.jsx";

function LoginPage({
  error,
  googleClientId,
  isSubmitting,
  onGoogleError,
  onGoogleSubmit,
  onLogin,
  onNavigate,
}) {
  return (
    <AuthLayout
      onNavigate={onNavigate}
      sideTitle="Plan work across projects and teams."
      sideText="A focused workspace for projects, epics, cards, members, and archived work items."
      form={{
        title: "Log in to your account",
        subtitle: "Access your workspaces, projects, cards, and team activity.",
        googleLabel: "Continue with Google",
        googleClientId,
        submitLabel: "Log in",
        error,
        isSubmitting,
        onGoogleError,
        onGoogleSubmit,
        onSubmit: onLogin,
        fields: [
          {
            label: "Email",
            name: "email",
            type: "email",
          },
          {
            label: "Password",
            name: "password",
            type: "password",
          },
        ],
        showForgotPassword: true,
        footerText: "New to Projectly?",
        footerAction: "Register",
        footerTarget: "register",
      }}
    />
  );
}

export default LoginPage;
