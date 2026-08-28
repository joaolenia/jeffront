import { useEffect, useState } from 'react';
import './Confirm.css';

export function GlobalConfirm() {
  const [confirmState, setConfirmState] = useState<{
    message: string;
    resolve: (value: boolean) => void;
  } | null>(null);

  useEffect(() => {
    // Intercepta a função nativa window.confirm e a transforma em uma Promise
    window.confirm = (msg?: string): any => {
      return new Promise((resolve) => {
        setConfirmState({
          message: String(msg ?? 'Tem certeza que deseja continuar?'),
          resolve,
        });
      });
    };
  }, []);

  if (!confirmState) return null;

  const handleConfirm = () => {
    confirmState.resolve(true);
    setConfirmState(null);
  };

  const handleCancel = () => {
    confirmState.resolve(false);
    setConfirmState(null);
  };

  return (
    <div className="confirm-overlay">
      <div className="confirm-popup">
        <h3>Confirmação</h3>
        <p>{confirmState.message}</p>
        
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={handleCancel}>
            Cancelar
          </button>
          <button className="btn-confirm" onClick={handleConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}