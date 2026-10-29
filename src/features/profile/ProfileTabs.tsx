"use client";

import * as React from "react";

export interface ProfileTabItem<T extends string> {
  id: T;
  label: string;
}

export function ProfileTabs<T extends string>({
  items,
  onSelect,
  selected,
}: {
  items: readonly ProfileTabItem<T>[];
  onSelect: (id: T) => void;
  selected: T;
}) {
  const buttons = React.useRef(new Map<T, HTMLButtonElement | null>());

  function focusAndSelect(id: T) {
    onSelect(id);
    buttons.current.get(id)?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const total = items.length;
    if (total === 0) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAndSelect(items[(index + 1) % total].id);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAndSelect(items[(index - 1 + total) % total].id);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusAndSelect(items[0].id);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusAndSelect(items[total - 1].id);
    }
  }

  return (
    <div aria-label="Detail profil" className="tp-tabs" role="tablist">
      {items.map((item, index) => (
        <button
          aria-controls={`profile-panel-${item.id}`}
          aria-selected={item.id === selected}
          className="tp-tab"
          id={`profile-tab-${item.id}`}
          key={item.id}
          onClick={() => onSelect(item.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          ref={(node) => {
            buttons.current.set(item.id, node);
          }}
          role="tab"
          tabIndex={item.id === selected ? 0 : -1}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
