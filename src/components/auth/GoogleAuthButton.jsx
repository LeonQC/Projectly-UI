import React, { useEffect, useRef, useState } from "react";

let googleScriptPromise;

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector("script[data-google-identity]");
      if (existingScript) {
        existingScript.addEventListener("load", resolve, { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
}

function GoogleAuthButton({ clientId, disabled = false, label, onCredential, onError }) {
  const buttonRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!clientId) {
      setIsReady(false);
      return undefined;
    }

    loadGoogleScript()
      .then(() => {
        if (!isMounted || !buttonRef.current) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              onCredential?.(response.credential);
            }
          },
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          shape: "rectangular",
          size: "large",
          text: label.toLowerCase().includes("register") ? "signup_with" : "continue_with",
          theme: "outline",
          width: 360,
        });
        setIsReady(true);
      })
      .catch(() => {
        if (isMounted) {
          onError?.("Google sign-in failed to load");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [clientId, label, onCredential, onError]);

  if (clientId) {
    return (
      <div
        className={`google-button-host${disabled || !isReady ? " is-disabled" : ""}`}
        ref={buttonRef}
        aria-label={label}
      />
    );
  }

  return (
    <button
      className="google-button"
      type="button"
      disabled
      onClick={() => onError?.("Missing VITE_GOOGLE_CLIENT_ID")}
    >
      <span className="google-mark">G</span>
      {label}
    </button>
  );
}

export default GoogleAuthButton;
