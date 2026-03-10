export function ErrorState({ message = "Something went wrong." }) {
  return <p className="error">{message}</p>;
}

