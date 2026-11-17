type FieldErrorProps = {
  message?: string | null;
  id?: string;
};

export default function FieldError({ message, id }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm leading-snug text-red-600" role="alert">
      {message}
    </p>
  );
}
