import { motion } from "framer-motion";
import { File, FileText } from "lucide-react";

export function CandidatoEmptyOfertas() {
  const handleUploadCVFromTopBar = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload-cv`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        const successToastEvent = new CustomEvent("cvSubidoOk", {
          detail: "¡CV subido exitosamente!",
        });
        window.dispatchEvent(successToastEvent);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error al subir CV:", error);
      alert("Error de conexión al subir CV");
    }
  };

  return (
    <motion.div className="text-gray-600 flex flex-col items-center gap-4 p-12 relative">
      <div className="flex opacity-50">
        <File className="translate-x-5 -rotate-12 size-14 " />
        <File className="-translate-x-2 rotate-12 size-14 fill-white" />
      </div>
      <p className="bg-gradient-to-b from-transparent via-white to-transparent p-2">
        Sube un CV para obtener recomendaciones
      </p>
      <label
        htmlFor="cv-upload"
        className="max-w-xs flex items-center justify-center gap-2 text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer w-full"
      >
        <FileText size={16} /> Subir nuevo CV
      </label>
      <input
        id="cv-upload"
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) handleUploadCVFromTopBar(file);
        }}
      />
    </motion.div>
  );
}
