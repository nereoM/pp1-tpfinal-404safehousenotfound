import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaperPlaneIcon } from "@radix-ui/react-icons";

const API_URL = import.meta.env.VITE_API_URL;

const expresiones = {
  neutral: "https://i.postimg.cc/XvWB5f8d/ichi-neutral.png",
  neutral2: "https://i.postimg.cc/sXN2T7pn/ichi-neutral-ojo-cerrado.png",
};

const glowColors = {
  neutral: "drop-shadow(0 0 10px #60a5fa66)",
  neutral2: "drop-shadow(0 0 10px #a5b4fc66)",
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
  const [cargando, setCargando] = useState(false);
  const mensajesEndRef = useRef(null);
  const [dots, setDots] = useState("");
  const [miniExpresion, setMiniExpresion] = useState("neutral");
  const chatRef = useRef(null);

  // parpadeo en minimizado (solo ojo abierto/cerrado)
useEffect(() => {
  if (!open) {
    const interval = setInterval(() => {
      setMiniExpresion("neutral2"); // cerrar el ojo
      setTimeout(() => setMiniExpresion("neutral"), 500); // abrir después de 100ms
    }, 3000); // cada 5 segundos
    return () => clearInterval(interval);
  }
}, [open]);


  // parpadeo normal cuando está abierto
  useEffect(() => {
    if (open) {
      const intervalo = setInterval(() => {
        setEstadoActual("neutral2");
        setTimeout(() => setEstadoActual("neutral"), 150);
      }, 5000);
      return () => clearInterval(intervalo);
    }
  }, [open]);

  // animación de puntos para "pensando..."
  useEffect(() => {
    if (!cargando) return;
    let i = 0;
    const interval = setInterval(() => {
      setDots(".".repeat((i % 3) + 1));
      i++;
    }, 400);
    return () => clearInterval(interval);
  }, [cargando]);

  // scroll automático al último mensaje
  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes, cargando]);

  const enviarMensaje = async () => {
    const textoUser = input.trim();
    if (!textoUser || cargando) return;

    setMensajes((prev) => [
      ...prev,
      { remitente: "user", texto: textoUser },
    ]);
    setInput("");
    setCargando(true);

    try {
      const res = await fetch(`${API_URL}/api/chatbot`, {
        method: "POST",
        credentials: "include",
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
    } finally {
      setCargando(false);
      setDots("");
    }
  };

  // entrada para mensajes (caen desde arriba)
  const mensajeVariants = {
    initial: { opacity: 0, y: -24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -24 },
  };

  // clickear fuera
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (chatRef.current && !chatRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <motion.div
          ref={chatRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-80 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden"
        >
          {/* header */}
          <div className="flex items-center gap-2 p-4 border-b bg-white">
            <motion.div
              animate={{ y: [0, -1.5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <img
                src={expresiones[estadoActual]}
                alt="Ichi"
                className="w-10 h-10 rounded-full"
                style={{
                  filter: glowColors[estadoActual] || glowColors["neutral"],
                  transition: "filter 0.3s",
                }}
              />
            </motion.div>
            <div className="text-sm font-semibold text-black">Ichi</div>
            <button
              className="ml-auto text-gray-400 hover:text-black transition"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
            >
              ✕
            </button>
          </div>

          {/* mensajes */}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto text-sm bg-white"
            style={{ maxHeight: 340, minHeight: 140 }}>
            <AnimatePresence initial={false}>
              {mensajes.map((msg, i) => (
                <motion.div
                  key={i}
                  variants={mensajeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.32, ease: "easeOut" }}
                  className={`${
                    msg.remitente === "user"
                      ? "text-right text-blue-600"
                      : "text-left text-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block px-3 py-2 rounded-xl max-w-[85%] break-words ${
                      msg.remitente === "user"
                        ? "bg-blue-50 ml-auto"
                        : "bg-gray-100"
                    }`}
                  >
                    {msg.texto}
                  </span>
                </motion.div>
              ))}
              {/* Mensaje de carga */}
              {cargando && (
                <motion.div
                  key="thinking"
                  variants={mensajeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.32, ease: "easeOut" }}
                  className="text-left text-gray-400"
                >
                  <span className="inline-block px-3 py-2 rounded-xl bg-gray-50 animate-pulse">
                    Ichi está pensando{dots}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={mensajesEndRef} />
          </div>

          {/* input */}
          <div className="p-2 border-t flex items-center gap-2 bg-white">
            <input
              type="text"
              placeholder="Escribí un mensaje..."
              className="flex-1 text-sm p-2 border rounded-xl bg-white text-black outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !cargando && enviarMensaje()
              }
              disabled={cargando}
              autoFocus
            />
            <button
              onClick={enviarMensaje}
              className={`text-blue-600 hover:text-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={cargando || !input.trim()}
              aria-label="Enviar mensaje"
            >
              <PaperPlaneIcon />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{
            scale: 1.07,
            rotate: -7,
            transition: { type: "spring", stiffness: 200, damping: 12 },
          }}
          className="relative border-none outline-none w-20 h-20 flex flex-col items-center justify-center transition group"
          style={{
            background: "rgba(255,255,255,0.18)",
            boxShadow:
              "0 4px 24px 0 rgba(60, 120, 255, 0.10), 0 1.5px 8px 0 rgba(60, 120, 255, 0.08)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "9999px",
            border: "1.5px solid rgba(180,200,255,0.18)",
          }}
          onClick={() => setOpen(true)}
        >
          <motion.img
            src={expresiones[miniExpresion]}
            alt="Ichi"
            className="w-14 h-14 rounded-full select-none pointer-events-none"
            style={{
              filter: glowColors[miniExpresion] || glowColors["neutral"],
              transition: "filter 0.3s",
            }}
            whileHover={{
              rotate: -10,
              scale: 1.08,
              transition: { type: "spring", stiffness: 180, damping: 14 },
            }}
            onMouseEnter={() => setMiniExpresion("neutral2")}
            onMouseLeave={() => setMiniExpresion("neutral")}
            draggable={false}
          />
          <span className="text-xs font-semibold mt-1 text-gray-700 select-none pointer-events-none">
            Ichi
          </span>
        </motion.button>
      )}
    </div>
  );
}
