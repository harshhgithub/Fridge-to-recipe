import { useState, useMemo } from 'react';
import { Minus, Plus, Users, ListChecks, ClipboardList, Repeat } from 'lucide-react';

export default function RecipeView({ recipe }) {
  const [servings, setServings] = useState(recipe.baseServings);
  const [checkedSteps, setCheckedSteps] = useState({});

  const scale = servings / recipe.baseServings;

  const scaledIngredients = useMemo(() => {
    return recipe.ingredients.map((ing) => ({
      ...ing,
      scaledAmount: roundNice(ing.amount * scale),
    }));
  }, [recipe.ingredients, scale]);

  const toggleStep = (id) => {
    setCheckedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const doneCount = Object.values(checkedSteps).filter(Boolean).length;

  return (
    <div className="recipe">
      <h2>{recipe.title}</h2>
      {recipe.description && <p className="recipe-desc">{recipe.description}</p>}

      <div className="servings-control">
        <label>
          <Users className="inline-icon" strokeWidth={1.75} aria-hidden="true" />
          Servings
        </label>
        <div className="stepper">
          <button onClick={() => setServings((s) => Math.max(1, s - 1))} aria-label="Decrease servings">
            <Minus size={14} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <span>{servings}</span>
          <button onClick={() => setServings((s) => Math.min(24, s + 1))} aria-label="Increase servings">
            <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      <section className="ingredients-section">
        <h3>
          <ClipboardList className="inline-icon" strokeWidth={1.75} aria-hidden="true" />
          Ingredients
        </h3>
        <ul className="ingredients-list">
          {scaledIngredients.map((ing) => (
            <li key={ing.id}>
              <span className="ing-amount">{formatAmount(ing.scaledAmount, ing.unit)}</span>
              <span className="ing-name">{ing.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="steps-section">
        <h3>
          <ListChecks className="inline-icon" strokeWidth={1.75} aria-hidden="true" />
          Steps ({doneCount}/{recipe.steps.length} done)
        </h3>
        <ol className="steps-list">
          {recipe.steps.map((step) => (
            <li key={step.id} className={checkedSteps[step.id] ? 'done' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={!!checkedSteps[step.id]}
                  onChange={() => toggleStep(step.id)}
                />
                <span>{step.text}</span>
              </label>
            </li>
          ))}
        </ol>
      </section>

      {recipe.swaps && recipe.swaps.length > 0 && (
        <section className="swaps-section">
          <h3>
            <Repeat className="inline-icon" strokeWidth={1.75} aria-hidden="true" />
            Ingredient Swaps
          </h3>
          <ul className="swaps-list">
            {recipe.swaps.map((swap, i) => (
              <li key={i}>
                <strong>{swap.ingredient}:</strong> {swap.alternatives.join(', ')}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function roundNice(n) {
  if (!isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function formatAmount(amount, unit) {
  if (unit === 'to-taste') return 'to taste';
  if (!amount || amount <= 0) return unit || '';
  const rounded = Number.isInteger(amount) ? amount : Math.round(amount * 4) / 4;
  return unit ? `${rounded} ${unit}` : `${rounded}`;
}