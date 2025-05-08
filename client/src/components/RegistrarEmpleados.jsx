import React, { useState } from 'react';

const SubirEmpleados = () => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [fileSelectedMessage, setFileSelectedMessage] = useState(''); 

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            console.log("Archivo seleccionado:", selectedFile);
            setFile(selectedFile);
            setFileSelectedMessage(`Archivo seleccionado: ${selectedFile.name}`);
            setError('');
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

        const formData = new FormData();
        formData.append("file", file);

        setIsUploading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/registrar-empleados`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`,
                },
                body: formData,
                credentials: 'include',
            });

            const data = await response.json();

            console.log("Respuesta del servidor:", data);

            setIsUploading(false);

            if (data.error) {
                setError(data.error);
                setMessage('');
            } else {
                // Verifica si `total_empleados` está definido
                if (data.total_empleados !== undefined) {
                    setMessage(`${data.message}. Total empleados registrados: ${data.total_empleados}`);
                } else {
                    setMessage(`${data.message}.`);
                }
                setError('');
            }
        } catch (error) {
            console.error("Error:", error);
            setError("Ocurrió un error al cargar el archivo.");
            setMessage('');
            setIsUploading(false);
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-white rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Subir Empleados</h2>
            <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                id="fileInput"
                className="hidden"
            />
            <label
                htmlFor="fileInput"
                className="cursor-pointer bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none block mb-4 w-full text-center">
                Seleccionar Archivo
            </label>

            {/* Mensaje de archivo seleccionado */}
            {fileSelectedMessage && (
                <div className="mt-4 p-4 bg-blue-100 text-blue-700 rounded">
                    {fileSelectedMessage}
                </div>
            )}

            <button
                onClick={handleUpload}
                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none mb-4 w-full text-center">
                Subir Empleados
            </button>

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
        </div>
    );
};

export default SubirEmpleados;
