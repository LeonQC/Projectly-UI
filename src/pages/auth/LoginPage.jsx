import React from "react";
import AuthLayout from "../../components/auth/AuthLayout.jsx";

function LoginPage({ onNavigate }) {
  return (
    <AuthLayout
      onNavigate={onNavigate}
      sideTitle="Plan work across boards and teams."
      sideText="A focused workspace for boards, lists, cards, members, and archived work items."
      form={{
        title: "Log in to your account",
        subtitle: "Access your workspaces, boards, cards, and team activity.",
        googleLabel: "Continue with Google",
        submitLabel: "Log in",
        fields: [
          {
            label: "Email",
            type: "email",
          },
          {
            label: "Password",
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
