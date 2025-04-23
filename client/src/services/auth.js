import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(${API_URL}/auth/login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // 👈 para recibir la cookie JWT
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error  "Error al iniciar sesión");
      }

      const userRes = await fetch(${API_URL}/auth/me, {
        method: "GET",
        credentials: "include"
      });

      const user = await userRes.json();

      if (!userRes.ok) throw new Error(user?.error  "No se pudo obtener el usuario");

      // redireccion segun rol

      if (user.roles.includes("admin")) {
        navigate("/admin/dashboard");
      } else if (user.roles.includes("rrhh")) {
        navigate("/rrhh/home");
      } else {
        navigate("/home");
      }

      /*
      if (user?.roles?.includes("rrhh")) {
        navigate("/rrhh/home");
      }
      */


    } catch (err) {
      console.error(err);
      setError(err.message || "Ocurrió un error. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };