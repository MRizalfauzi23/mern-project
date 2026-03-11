import { Input } from "./ui/input";

export function SearchBar({ value, onChange }) {
  return (
    <Input
      className="input"
      placeholder="Search title, company, location..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

