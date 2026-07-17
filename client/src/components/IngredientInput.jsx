import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function IngredientInput({ onSubmit, disabled }) {
  const [text, setText] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  };

  return (
    <form className="ingredient-form" onSubmit={submit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. chicken breast, spinach, garlic, rice, half a lemon"
        rows={3}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !text.trim()}>
        {disabled ? (
          <>
            <Loader2 className="btn-icon spin" strokeWidth={2} aria-hidden="true" />
            Cooking up ideas…
          </>
        ) : (
          <>
            <Sparkles className="btn-icon" strokeWidth={2} aria-hidden="true" />
            Get Recipe
          </>
        )}
      </button>
    </form>
  );
}