import React, { useState } from 'react';

export default function StarRating({ value = 0, onChange, readonly = false, size = 24 }) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            background: 'none', border: 'none', padding: 0,
            fontSize: size, cursor: readonly ? 'default' : 'pointer',
            color: star <= (hover || value) ? 'var(--yellow)' : 'var(--t3)',
            transition: 'color 0.1s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
