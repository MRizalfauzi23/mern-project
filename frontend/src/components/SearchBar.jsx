export function SearchBar({ value, onChange }) {
  return (
    <input
      className="input"
      placeholder="Search title, company, location..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

