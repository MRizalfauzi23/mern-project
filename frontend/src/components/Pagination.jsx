import { Button } from "./ui/button";

export function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="pagination">
      <Button
        variant="outline"
        className="clean-btn"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </Button>
      <span>
        Page {page} / {totalPages || 1}
      </span>
      <Button
        variant="outline"
        className="clean-btn"
        size="sm"
        disabled={page >= (totalPages || 1)}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

