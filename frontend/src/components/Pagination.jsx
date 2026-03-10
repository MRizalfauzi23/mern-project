export function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Prev
      </button>
      <span>
        Page {page} / {totalPages || 1}
      </span>
      <button disabled={page >= (totalPages || 1)} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  );
}

