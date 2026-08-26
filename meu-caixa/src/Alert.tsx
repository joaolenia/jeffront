import { useEffect, useState } from 'react';
import './Alert.css';

export function GlobalAlert() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (msg?: any) => {
      setMessage(String(msg ?? ''));
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  if (message === null) return null;

  return (
    <div className="alert-overlay">
      <div className="alert-popup">
        <h3>Aviso</h3>

        <p>{message}</p>

        <button onClick={() => setMessage(null)}>
          OK
        </button>
      </div>
    </div>
  );
}