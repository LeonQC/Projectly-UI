import React from "react";

function GoogleAuthButton({ label }) {
  return (
    <button className="google-button" type="button">
      <span className="google-mark">G</span>
      {label}
    </button>
  );
}

export default GoogleAuthButton;
