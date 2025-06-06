import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PaperPlaneIcon } from "@radix-ui/react-icons";

// imagenes según expresiones
const expresiones = {
  neutral: "/avatars/ichi-neutral.png",
  neutral2: "/avatars/ichi-neutral-ojo-cerrado.png"
};

export default function IchiChatBot({ estado = "neutral" }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mensajes, setMensajes] = useState([
    {
      remitente: "ichi",
      texto: "Estoy acá si necesitás ayuda. Podés escribirme lo que quieras resolver.",
    },
  ]);

  const [estadoActual, setEstadoActual] = useState(estado);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setEstadoActual("neutral2"); // cerrar el ojo
      setTimeout(() => setEstadoActual("neutral"), 150); // abrirlo rápido
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  const enviarMensaje = () => {
    if (!input.trim()) return;
    const nuevoMensaje = { remitente: "user", texto: input };
    setMensajes([...mensajes, nuevoMensaje]);
    setInput("");

    setTimeout(() => {
      setMensajes((prev) => [
        ...prev,
        {
          remitente: "ichi",
          texto: "Podemos pensarlo juntos. Lo importante es avanzar con claridad.",
        },
      ]);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-80 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden"
        >
          {/* header chat */}
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

          {/* input*/}
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
          <span className="text-[10px] font-medium mt-1 text-gray-600">Ichi</span>
        </motion.button>
      )}
    </div>
  );
}
