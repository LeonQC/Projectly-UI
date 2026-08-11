import React, { useState } from "react";
import GoogleAuthButton from "./GoogleAuthButton.jsx";

function getFieldName(label) {
  return label.toLowerCase().replace(/\s+/g, "_");
}

function TextField({ label, name, type = "text", value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        autoComplete={type === "password" ? "current-password" : "on"}
        onChange={onChange}
      />
    </label>
  );
}

function AuthForm({
  title,
  subtitle,
  googleLabel,
  googleClientId,
  submitLabel,
  fields,
  footerText,
  footerAction,
  footerTarget,
  isSubmitting = false,
  error,
  onGoogleError,
  onGoogleSubmit,
  onNavigate,
  onSubmit,
  showForgotPassword = false,
}) {
  const [values, setValues] = useState(() =>
    fields.reduce((formValues, field) => {
      formValues[field.name ?? getFieldName(field.label)] = field.defaultValue ?? "";
      return formValues;
    }, {})
  );

  function updateField(event) {
    const { name, value } = event.target;
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
  }

  function submitForm(event) {
    event.preventDefault();
    onSubmit?.(values);
  }

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
          <GoogleAuthButton
            clientId={googleClientId}
            disabled={isSubmitting}
            label={googleLabel}
            onCredential={onGoogleSubmit}
            onError={onGoogleError}
          />
          <div className="divider">
            <span>OR</span>
          </div>
        </>
      )}

      <form className="auth-form" onSubmit={submitForm}>
        {fields.map((field) => (
          <TextField
            key={field.label}
            label={field.label}
            name={field.name ?? getFieldName(field.label)}
            type={field.type}
            value={values[field.name ?? getFieldName(field.label)] ?? ""}
            onChange={updateField}
          />
        ))}

        {error && <p className="auth-error">{error}</p>}

        {showForgotPassword && (
          <button
            className="link-button align-right"
            type="button"
            onClick={() => onNavigate("forgot")}
          >
            Forgot password?
          </button>
        )}

        <button
          className="primary-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Please wait..." : submitLabel}
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
