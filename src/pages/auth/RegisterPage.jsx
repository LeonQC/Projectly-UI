import React from "react";
import AuthLayout from "../../components/auth/AuthLayout.jsx";

function RegisterPage({ onNavigate }) {
  return (
    <AuthLayout
      onNavigate={onNavigate}
      sideTitle="Create projects with your team."
      sideText="Register to create workspaces, invite members, and manage projects."
      form={{
        title: "Create your account",
        subtitle:
          "Create a workspace account to start organizing projects and cards.",
        googleLabel: "Register with Google",
        submitLabel: "Register",
        fields: [
          {
            label: "Username",
          },
          {
            label: "Email",
            type: "email",
          },
          {
            label: "Password",
            type: "password",
          },
          {
            label: "Confirm password",
            type: "password",
          },
        ],
        footerText: "Already have an account?",
        footerAction: "Log in",
        footerTarget: "login",
      }}
    />
  );
}

export default RegisterPage;
