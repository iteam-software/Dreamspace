# Component Stubbing Guide

**Purpose**: Guidelines for creating functional, unstyled component stubs during frontend migration

## Principles

1. **Functional First**: Components must work without styling
2. **Native Elements**: Use standard HTML elements (no UI libraries)
3. **Type-Safe**: All props and state properly typed
4. **Context-Aware**: Use appropriate contexts for state
5. **Server-First**: Prefer Server Components unless interactivity needed

## Component Template

### Client Component Template

```tsx
'use client';

import { useDreams } from '@/lib/contexts'; // or other contexts

/**
 * ComponentName
 * Brief description of what this component does
 */
export function ComponentName() {
  // 1. Get data from context
  const { dreams, addDream } = useDreams();
  
  // 2. Local state (if needed)
  const [isOpen, setIsOpen] = useState(false);
  
  // 3. Event handlers
  const handleClick = () => {
    // Handle user interaction
  };
  
  // 4. Render with native HTML
  return (
    <div>
      <h2>Section Title</h2>
      <button onClick={handleClick}>Action</button>
      
      {/* Conditional rendering */}
      {dreams.length === 0 ? (
        <p>No data yet</p>
      ) : (
        <ul>
          {dreams.map(dream => (
            <li key={dream.id}>{dream.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Server Component Template

```tsx
import { auth } from '@/lib/auth';
import { getDreams } from '@/services/dreams';

/**
 * ComponentName
 * Brief description of what this component does
 */
export async function ComponentName() {
  // 1. Auth check (if needed)
  const session = await auth();
  
  // 2. Fetch data
  const result = await getDreams(session.user.id);
  
  if (result.failed) {
    return <div>Error: {result.errors._errors.join(', ')}</div>;
  }
  
  const { dreams } = result;
  
  // 3. Render
  return (
    <div>
      <h2>Dreams</h2>
      {dreams.map(dream => (
        <div key={dream.id}>
          <h3>{dream.title}</h3>
          <p>{dream.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## Component Patterns

### 1. List Display

```tsx
export function ItemList() {
  const { items } = useItems();
  
  return (
    <div>
      <h2>Items</h2>
      {items.length === 0 ? (
        <p>No items found</p>
      ) : (
        <ul>
          {items.map(item => (
            <li key={item.id}>
              <span>{item.name}</span>
              <button onClick={() => handleEdit(item.id)}>Edit</button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={handleAdd}>Add Item</button>
    </div>
  );
}
```

### 2. Form Input

```tsx
export function ItemForm() {
  const { addItem } = useItems();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const item = {
      id: crypto.randomUUID(),
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    };
    
    addItem(item);
    e.currentTarget.reset();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Name:
          <input type="text" name="name" required />
        </label>
      </div>
      <div>
        <label>
          Description:
          <textarea name="description" rows={3}></textarea>
        </label>
      </div>
      <button type="submit">Save</button>
      <button type="button" onClick={handleCancel}>Cancel</button>
    </form>
  );
}
```

### 3. Modal/Dialog

```tsx
export function ItemModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  return (
    <div onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>Modal Title</h2>
          <button onClick={onClose}>×</button>
        </header>
        <div>
          {/* Modal content */}
        </div>
        <footer>
          <button onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}
```

### 4. Tabs

```tsx
export function TabView() {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');
  
  return (
    <div>
      <nav>
        <button onClick={() => setActiveTab('overview')}>Overview</button>
        <button onClick={() => setActiveTab('details')}>Details</button>
      </nav>
      
      <div>
        {activeTab === 'overview' && <OverviewContent />}
        {activeTab === 'details' && <DetailsContent />}
      </div>
    </div>
  );
}
```

### 5. Filters/Search

```tsx
export function FilterableList() {
  const { items } = useItems();
  const [filter, setFilter] = useState('');
  
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  );
  
  return (
    <div>
      <input
        type="search"
        placeholder="Search..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <ul>
        {filteredItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 6. Stats/Metrics

```tsx
export function StatsCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  );
}

export function StatsGrid() {
  const { currentUser } = useUser();
  
  return (
    <div>
      <StatsCard label="Score" value={currentUser?.score || 0} />
      <StatsCard label="Dreams" value={currentUser?.dreamsCount || 0} />
      <StatsCard label="Connections" value={currentUser?.connectsCount || 0} />
    </div>
  );
}
```

### 7. Progress Indicator

```tsx
export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100;
  
  return (
    <div>
      <progress value={value} max={max}></progress>
      <span>{percentage.toFixed(0)}%</span>
    </div>
  );
}
```

## Context Usage Patterns

### Single Context

```tsx
'use client';

import { useDreams } from '@/lib/contexts';

export function DreamList() {
  const { dreams, deleteDream } = useDreams();
  // ... component logic
}
```

### Multiple Contexts

```tsx
'use client';

import { useDreams, useGoals, useUser } from '@/lib/contexts';

export function Dashboard() {
  const { currentUser } = useUser();
  const { dreams } = useDreams();
  const { weeklyGoals } = useGoals();
  
  // ... component logic
}
```

### Optional Context (for shared components)

```tsx
'use client';

import { useDreams } from '@/lib/contexts';

export function SharedComponent({ standalone = false }: { standalone?: boolean }) {
  // Only use context if not standalone
  const context = standalone ? null : useDreams();
  
  // ... component logic
}
```

## HTML Elements Reference

### Common Elements

- `<div>` - Container
- `<section>` - Thematic grouping
- `<article>` - Self-contained content
- `<header>` - Introductory content
- `<footer>` - Footer content
- `<nav>` - Navigation links
- `<main>` - Main content

### Text Elements

- `<h1>` to `<h6>` - Headings
- `<p>` - Paragraph
- `<span>` - Inline text
- `<strong>` - Bold text
- `<em>` - Italic text
- `<code>` - Code snippet
- `<pre>` - Preformatted text

### Form Elements

- `<form>` - Form container
- `<input>` - Input field
  - `type="text"` - Text input
  - `type="email"` - Email input
  - `type="password"` - Password input
  - `type="number"` - Number input
  - `type="date"` - Date picker
  - `type="checkbox"` - Checkbox
  - `type="radio"` - Radio button
  - `type="search"` - Search input
- `<textarea>` - Multi-line text
- `<select>` - Dropdown
- `<option>` - Dropdown option
- `<button>` - Button
  - `type="submit"` - Submit button
  - `type="button"` - Regular button
  - `type="reset"` - Reset button
- `<label>` - Input label
- `<fieldset>` - Group of inputs
- `<legend>` - Fieldset title

### List Elements

- `<ul>` - Unordered list
- `<ol>` - Ordered list
- `<li>` - List item
- `<dl>` - Description list
- `<dt>` - Description term
- `<dd>` - Description details

### Table Elements

- `<table>` - Table
- `<thead>` - Table header
- `<tbody>` - Table body
- `<tfoot>` - Table footer
- `<tr>` - Table row
- `<th>` - Table header cell
- `<td>` - Table data cell

### Interactive Elements

- `<button>` - Button
- `<a>` - Link (use `<Link>` from next/link)
- `<details>` - Collapsible content
- `<summary>` - Details summary

### Media Elements

- `<img>` - Image (use `<Image>` from next/image)
- `<video>` - Video
- `<audio>` - Audio

## Common Gotchas

### 1. Client Component Required For:
- `useState`, `useEffect`, hooks
- Event handlers (`onClick`, `onChange`)
- Context consumers
- Browser APIs

### 2. Server Component Advantages:
- Direct database access
- No client JS bundle
- SEO-friendly
- Automatic code splitting

### 3. Form Handling
```tsx
// ✅ Good: Uncontrolled form
<form onSubmit={handleSubmit}>
  <input name="title" required />
  <button type="submit">Save</button>
</form>

// ❌ Avoid: Controlled form (unnecessary state)
const [title, setTitle] = useState('');
<input value={title} onChange={(e) => setTitle(e.target.value)} />
```

### 4. Key Props
```tsx
// ✅ Good: Stable unique key
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}

// ❌ Bad: Index as key (can cause bugs)
{items.map((item, i) => (
  <div key={i}>{item.name}</div>
))}
```

### 5. Event Handlers
```tsx
// ✅ Good: Arrow function or defined function
<button onClick={() => handleClick(id)}>Click</button>
<button onClick={handleClick}>Click</button>

// ❌ Bad: Calling function immediately
<button onClick={handleClick()}>Click</button>
```

## File Organization

```
components/
└── feature-name/
    ├── FeatureList.tsx          # Main list view
    ├── FeatureCard.tsx          # Individual item
    ├── FeatureForm.tsx          # Create/edit form
    ├── FeatureModal.tsx         # Detail modal
    ├── FeatureFilters.tsx       # Filtering UI
    └── index.ts                 # Barrel export
```

### Barrel Export (index.ts)

```ts
/**
 * Feature component exports
 */

export * from './FeatureList';
export * from './FeatureCard';
export * from './FeatureForm';
export * from './FeatureModal';
export * from './FeatureFilters';
```

## Testing Considerations

Even without tests yet, write components to be testable:

```tsx
// ✅ Good: Props clearly defined, easy to test
type Props = {
  items: Item[];
  onSelect: (id: string) => void;
};

export function ItemList({ items, onSelect }: Props) {
  // ...
}

// ❌ Bad: Hard to test, unclear dependencies
export function ItemList() {
  const items = useItems(); // Hidden dependency
  // ...
}
```

## Quick Checklist

For each component, ensure:

- [ ] JSDoc comment explaining purpose
- [ ] Type-safe props and state
- [ ] Uses appropriate context(s)
- [ ] Native HTML elements only
- [ ] Event handlers properly typed
- [ ] Conditional rendering for empty states
- [ ] Loading/error states (where applicable)
- [ ] Exported from barrel index.ts
- [ ] 'use client' directive (if needed)

## Example: Complete Component

```tsx
'use client';

import { useState } from 'react';
import { useDreams } from '@/lib/contexts';

/**
 * Dream Form
 * Creates or edits a dream with title, category, and description
 */
export function DreamForm({ dreamId, onClose }: { dreamId?: string; onClose: () => void }) {
  const { dreams, addDream, updateDream } = useDreams();
  const existingDream = dreamId ? dreams.find(d => d.id === dreamId) : null;
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const dream = {
      id: dreamId || crypto.randomUUID(),
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      progress: existingDream?.progress || 0,
    };
    
    if (dreamId) {
      updateDream(dreamId, dream);
    } else {
      addDream(dream);
    }
    
    onClose();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h2>{dreamId ? 'Edit Dream' : 'Create Dream'}</h2>
      
      <div>
        <label>
          Title:
          <input
            type="text"
            name="title"
            defaultValue={existingDream?.title}
            required
          />
        </label>
      </div>
      
      <div>
        <label>
          Category:
          <select name="category" defaultValue={existingDream?.category} required>
            <option value="">Select category</option>
            <option value="personal">Personal</option>
            <option value="career">Career</option>
            <option value="health">Health</option>
          </select>
        </label>
      </div>
      
      <div>
        <label>
          Description:
          <textarea
            name="description"
            defaultValue={existingDream?.description}
            rows={5}
          ></textarea>
        </label>
      </div>
      
      <div>
        <button type="submit">Save</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}
```

---

**Remember**: The goal is functionality, not beauty. Keep it simple, use native elements, and ensure everything works before styling.
