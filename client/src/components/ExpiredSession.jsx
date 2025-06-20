import { Link } from "react-router-dom";

export function ExpiredSession() {
  return (
    <section className="bg-background text-foreground h-dvh flex flex-col items-center justify-center gap-12">
      <header className="flex flex-col gap-4 items-center">
        <h2 className="text-2xl font-semibold">Sesión expirada</h2>
        <p>
          Por tu seguridad, tu sesión ha finalizado automáticamente. Por favor,
          vuelve a iniciar sesión para continuar.
        </p>
      </header>
      <Link to="/login">
        <button className="border rounded-xl px-4 py-2 bg-indigo-600 text-white hover:-translate-y-1 transition cursor-pointer">
          Iniciar sesión
        </button>
      </Link>
    </section>
  );
}
