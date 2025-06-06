import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PaperPlaneIcon } from "@radix-ui/react-icons";

const API_URL = import.meta.env.VITE_API_URL;

const expresiones = {
  neutral: "/avatars/ichi-neutral.png",
  neutral2: "/avatars/ichi-neutral-ojo-cerrado.png",
};

export default function IchiChatBot({ estado = "neutral" }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mensajes, setMensajes] = useState([
    {
      remitente: "ichi",
      texto:
        "Estoy acá si necesitás ayuda. Podés escribirme lo que quieras resolver.",
    },
  ]);
  const [estadoActual, setEstadoActual] = useState(estado);

  // parpadeo 
  useEffect(() => {
    const intervalo = setInterval(() => {
      setEstadoActual("neutral2");
      setTimeout(() => setEstadoActual("neutral"), 150);
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  const enviarMensaje = async () => {
    const textoUser = input.trim();
    if (!textoUser) return;

    // agregar mensaje de usuario
    setMensajes((prev) => [
      ...prev,
      { remitente: "user", texto: textoUser },
    ]);
    setInput("");

    // llamada al backend
    try {
      const res = await fetch(`${API_URL}/api/chatbot`, {
        method: "POST",
        credentials: "include", // envía cookies JWT
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: textoUser }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensajes((prev) => [
          ...prev,
          { remitente: "ichi", texto: data.respuesta },
        ]);
      } else {
        setMensajes((prev) => [
          ...prev,
          {
            remitente: "ichi",
            texto: `Error: ${data.error || res.statusText}`,
          },
        ]);
      }
    } catch (err) {
      setMensajes((prev) => [
        ...prev,
        { remitente: "ichi", texto: "No puedo conectarme al servidor." },
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-80 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden"
        >
          {/* header */}
          <div className="flex items-center gap-2 p-4 border-b">
            <motion.div
              animate={{ y: [0, -1.5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <img
                src={expresiones[estadoActual]}
                alt="Ichi"
                className="w-10 h-10 rounded-full"
              />
            </motion.div>
            <div className="text-sm font-semibold text-black">Ichi</div>
            <button
              className="ml-auto text-gray-400 hover:text-black"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* mensajes */}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto text-sm">
            {mensajes.map((msg, i) => (
              <div
                key={i}
                className={`${
                  msg.remitente === "user"
                    ? "text-right text-blue-600"
                    : "text-left text-gray-700"
                }`}
              >
                {msg.texto}
              </div>
            ))}
          </div>

          {/* input */}
          <div className="p-2 border-t flex items-center gap-2">
            <input
              type="text"
              placeholder="Escribí un mensaje..."
              className="flex-1 text-sm p-2 border rounded-xl bg-white text-black outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
            />
            <button
              onClick={enviarMensaje}
              className="text-blue-600 hover:text-blue-800"
            >
              <PaperPlaneIcon />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-gray-200 shadow-md rounded-full w-16 h-16 flex flex-col items-center justify-center hover:scale-105 transition p-1"
          onClick={() => setOpen(true)}
        >
          <motion.div
            animate={{ y: [0, -1.5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <img
              src={expresiones[estadoActual]}
              alt="Ichi"
              className="w-10 h-10 rounded-full"
            />
          </motion.div>
          <span className="text-[10px] font-medium mt-1 text-gray-600">
            Ichi
          </span>
        </motion.button>
      )}
    </div>
  );
}
