import { ArrowUpRight, FileCheck, UploadCloud, XCircle } from 'lucide-react';
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/shadcn/Dialog";


export function ModalSubirEmpleados({ service, open, onOpenChange }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setFile(null)
    setMessage("")
    setError("")
  },[open])

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Por favor, selecciona un archivo CSV.");
      return;
    }

    if (file.type !== "text/csv") {
      setError("Por favor, selecciona un archivo CSV válido.");
      return;
    }

    setIsUploading(true);

    try {
      const data = await service.registrarEmpleadosDesdeCSV(file)
      console.log("Respuesta del servidor:", data);

      if (data.error) {
        setError(data.error);
        setMessage("");
      } else {
        // Verifica si `total_empleados` está definido
        if (data.total_empleados !== undefined) {
          setMessage(
            `${data.message}. Total empleados registrados: ${data.total_empleados}`
          );
        } else {
          setMessage(`${data.message}.`);
        }
        setError("");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
      setMessage("");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-black">
        <DialogHeader>
          <DialogTitle>Subir empleados</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 flex flex-col gap-2">
          <label
            htmlFor="fileInput"
            className="text-sm font-medium text-gray-700"
          >
            Adjuntar archivo en formato CSV
          </label>
          {file ? (
            <div className="flex justify-between items-center gap-2">
              <div className="mt-2 flex items-center space-x-2 text-green-600">
                <FileCheck className="w-5 h-5" />
                <span className="text-sm">{file.name}</span>
              </div>
              <button
                className="opacity-50 hover:opacity-100 transition"
                onClick={() => {
                  setFile(null);
                  setError(null);
                }}
              >
                <XCircle />
              </button>
            </div>
          ) : (
            <div className="relative border-2 border-dashed hover:bg-gray-100 border-gray-300 rounded-lg p-4 flex items-center justify-center hover:border-primary-500 transition-colors cursor-pointer">
              <input
                id="fileInput"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".csv"
                type="file"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center text-gray-500">
                <UploadCloud className="h-8 w-8 mb-1" />
                <span className="text-sm">
                  Haz click o arrastra tu archivo CSV aquí
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <a
            className="mx-auto text-indigo-500 hover:underline group text-xs flex items-center w-fit"
            target="_blank"
            href="https://docs.google.com/spreadsheets/d/1huAWWzslooGEnzRjIEd8jDAb-i16xrx-pEeXcfsf0Bo/edit?gid=0#gid=0"
          >
            Asegurate de seguir esta plantilla{" "}
            <ArrowUpRight className="group-hover:-translate-y-1 group-hover:translate-x-1 transition" />
          </a>
        </div>

        <DialogFooter className="flex *:flex-1 gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="bg-gray-300 py-2 px-4 rounded text-black hover:bg-gray-400 focus:outline-none w-full text-center"
          >
            Cancelar
          </button>
          <button
            disabled={file === null}
            onClick={handleUpload}
            className="bg-indigo-500 disabled:opacity-50 text-white py-2 px-4 rounded hover:bg-indigo-600 focus:outline-none w-full text-center"
          >
            Subir Empleados
          </button>
        </DialogFooter>
        {/* Estado de carga */}
        {isUploading && (
          <div className="mt-4 p-4 bg-yellow-100 text-yellow-700 rounded text-center">
            Subiendo archivo, por favor espera...
          </div>
        )}

        {/* Mensaje de éxito */}
        {message && (
          <div className="mt-0 p-4 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="mt-0 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
