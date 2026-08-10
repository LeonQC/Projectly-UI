import React from "react";
import AuthLayout from "../../components/auth/AuthLayout.jsx";

function RegisterPage({
  error,
  googleClientId,
  isSubmitting,
  onGoogleError,
  onGoogleSubmit,
  onNavigate,
  onRegister,
}) {
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
        googleClientId,
        submitLabel: "Register",
        error,
        isSubmitting,
        onGoogleError,
        onGoogleSubmit,
        onSubmit: onRegister,
        fields: [
          {
            label: "Username",
            name: "username",
          },
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
          {
            label: "Confirm password",
            name: "confirm_password",
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
