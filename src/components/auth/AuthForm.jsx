import React from "react";
import GoogleAuthButton from "./GoogleAuthButton.jsx";

function TextField({ label, type = "text", defaultValue }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} defaultValue={defaultValue} />
    </label>
  );
}

function AuthForm({
  title,
  subtitle,
  googleLabel,
  submitLabel,
  fields,
  footerText,
  footerAction,
  footerTarget,
  onNavigate,
  showForgotPassword = false,
}) {
  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="brand-lockup">
        <span className="brand-mark">P</span>
        <span className="brand-name">Projectly</span>
      </div>

      <div className="auth-heading">
        <h1 id="auth-title">{title}</h1>
        <p>{subtitle}</p>
      </div>

      {googleLabel && (
        <>
          <GoogleAuthButton label={googleLabel} />
          <div className="divider">
            <span>OR</span>
          </div>
        </>
      )}

      <form className="auth-form">
        {fields.map((field) => (
          <TextField
            key={field.label}
            label={field.label}
            type={field.type}
            defaultValue={field.defaultValue}
          />
        ))}

        {showForgotPassword && (
          <button
            className="link-button align-right"
            type="button"
            onClick={() => onNavigate("forgot")}
          >
            Forgot password?
          </button>
        )}

        <button className="primary-button" type="button">
          {submitLabel}
        </button>
      </form>

      <p className="auth-footer">
        {footerText}{" "}
        <button className="link-button" type="button" onClick={() => onNavigate(footerTarget)}>
          {footerAction}
        </button>
      </p>
    </section>
  );
}

export default AuthForm;
