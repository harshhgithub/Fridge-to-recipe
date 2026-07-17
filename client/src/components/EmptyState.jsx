import { ListPlus } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="state-box empty-box">
      <ListPlus className="state-icon" strokeWidth={1.5} aria-hidden="true" />
      <p>List what's in your fridge above and hit "Get Recipe" to get started.</p>
    </div>
  );
}