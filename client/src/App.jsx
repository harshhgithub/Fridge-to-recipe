import { useState, useRef, useCallback } from 'react';
import { ChefHat } from 'lucide-react';
import IngredientInput from './components/IngredientInput';
import RecipeView from './components/RecipeView';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import EmptyState from './components/EmptyState';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [status, setStatus] = useState('idle'); // idle | loading | error | success
  const [recipe, setRecipe] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const requestIdRef = useRef(0);
  const abortRef = useRef(null);
  const lastInputRef = useRef('');

  const generateRecipe = useCallback(async (ingredientsText) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const thisRequestId = ++requestIdRef.current;
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/api/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientsText }),
        signal: controller.signal,
      });

      const data = await res.json();

      // Drop this result if a newer request has since started
      if (thisRequestId !== requestIdRef.current) return;

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setRecipe(data);
      setStatus('success');
    } catch (err) {
      if (err.name === 'AbortError') return; // superseded, ignore silently
      if (thisRequestId !== requestIdRef.current) return;
      setStatus('error');
      setErrorMsg('Could not reach the server. Is it running on port 5000?');
    }
  }, []);

  const handleSubmit = (text) => {
    lastInputRef.current = text;
    generateRecipe(text);
  };

  const handleRetry = () => {
    if (lastInputRef.current) generateRecipe(lastInputRef.current);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <ChefHat className="icon-header" strokeWidth={1.75} aria-hidden="true" />
          Fridge → Recipe
        </h1>
        <p>Tell us what's in your fridge. We'll turn it into a recipe you can cook.</p>
      </header>

      <IngredientInput onSubmit={handleSubmit} disabled={status === 'loading'} />

      <main className="app-main">
        {status === 'idle' && <EmptyState />}
        {status === 'loading' && <LoadingState />}
        {status === 'error' && <ErrorState message={errorMsg} onRetry={handleRetry} />}
        {status === 'success' && recipe && <RecipeView recipe={recipe} />}
      </main>
    </div>
  );
}