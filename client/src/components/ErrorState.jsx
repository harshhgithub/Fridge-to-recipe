import { AlertCircle } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="state-box error-box">
      <AlertCircle className="state-icon state-icon-danger" strokeWidth={1.5} aria-hidden="true" />
      <p>{message}</p>
      <button onClick={onRetry}>Try Again</button>
    </div>
  );
}