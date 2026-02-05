// src/components/Pagination.tsx
import React from "react";

type Props = {
  total: number;
  limit: number;
  offset: number; // offset in items (0-index)
  onChange: (newOffset: number) => void;
};

export default function Pagination({ total, limit, offset, onChange }: Props) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const go = (page: number) => {
    const newOffset = (page - 1) * limit;
    onChange(newOffset);
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button disabled={currentPage === 1} onClick={() => go(1)}>
        {"<<"}
      </button>
      <button disabled={currentPage === 1} onClick={() => go(currentPage - 1)}>
        {"<"}
      </button>

      <span>
        Page {currentPage} / {totalPages} — {total} result
        {total !== 1 ? "s" : ""}
      </span>

      <button
        disabled={currentPage === totalPages}
        onClick={() => go(currentPage + 1)}
      >
        {">"}
      </button>
      <button
        disabled={currentPage === totalPages}
        onClick={() => go(totalPages)}
      >
        {">>"}
      </button>
    </div>
  );
}
