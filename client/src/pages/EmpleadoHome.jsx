import { motion } from "framer-motion";
import { BarChart2, FilePlus, FileText, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { ProfileCard } from "../components/ProfileCard";
import { TopBar } from "../components/TopBar";
import { EstiloEmpresaContext } from "../context/EstiloEmpresaContext";

export default function ReclutadorHome() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null); 
  const [modalLicenciaOpen, setModalLicenciaOpen] = useState(false);
  const [formLicencia, setFormLicencia] = useState({ tipo: "", descripcion: "" });
  const [mensajeLicencia, setMensajeLicencia] = useState("");
  const [licencias, setLicencias] = useState([]);
  const [modalLicenciasOpen, setModalLicenciasOpen] = useState(false);
  const [licenciaId, setLicenciaId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/reclutador-home`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("Error al autenticar");
        return res.json();
      })
      .then(data => setUser(data))
      .catch(err => console.error("❌ Error al obtener usuario:", err))
      .finally(() => setLoadingUser(false));
  }, []);

  const estilosSafe = {
    color_principal: "#2563eb",
    color_secundario: "#f3f4f6",
    color_texto: "#000000",
    slogan: "Bienvenido al panel de administración de Reclutador",
  };



  const solicitarLicencia = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/solicitud-licencia`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lic_type: formLicencia.tipo,
          description: formLicencia.descripcion
        })
      });
  
      const data = await res.json();
      if (res.ok) {
        setMensajeLicencia("Solicitud enviada correctamente.");
        setFormLicencia({ tipo: "", descripcion: "" });
      } else {
        setMensajeLicencia(`Error: ${data.error}`);
      }
    } catch (err) {
      setMensajeLicencia("Error al conectar con el servidor.");
    }
  };
  


 // func para obtener licencias 
  const fetchLicencias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/mis-licencias`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        console.log("Licencias obtenidas:", data);
        setLicencias(data);
        setModalLicenciasOpen(true);
      } else {
        console.error("Error al obtener licencias:", data.error);
      }
    } catch (err) {
      console.error("Error al conectar con el servidor:", err);
    }
  };

  //  abre modal y selecciona licencia
  const seleccionarLicencia = (id_licencia) => {
    console.log("ID recibido para subir certificado:", id_licencia);
    if (!id_licencia) {
      console.error("No se recibió un ID válido para la licencia.");
      return;
    }
    setLicenciaId(id_licencia);
  };

  // subir certificado
  const subirCertificado = async () => {
    if (!selectedFile) {
      setMensajeCertificado("Debes seleccionar un archivo PDF.");
      return;
    }

    if (!licenciaId) {
      setMensajeCertificado("No se encontró la licencia a la cual subir el certificado.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    console.log("Subiendo certificado para la licencia ID:", licenciaId);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/subir-certificado/${licenciaId}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMensajeCertificado(`Certificado subido correctamente`);
        setModalLicenciasOpen(false); 
      } else {
        setMensajeCertificado(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error al subir el certificado:", error);
      setMensajeCertificado("Error al conectar con el servidor.");
    }
  };


  const acciones = [

    {
      icon: FilePlus,
      titulo: "Cargar Licencias",
      descripcion: "Carga una nueva licencia.",
      onClick: () => setModalLicenciaOpen(true)
    },
    {
      icon: FilePlus,
      titulo: "Gestionar Licencias",
      descripcion: "Visualizá y administrá tus licencias cargadas.",
      onClick: fetchLicencias,
    },

  ];


  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then(res => {
        if (!res.ok) throw new Error("Error al cerrar sesión");
        navigate("/login");
      })
      .catch(err => console.error("Error al cerrar sesión:", err));
  };

  if (loadingUser) return <div className="p-10 text-center">Cargando usuario…</div>;
  if (!user) return <div className="p-10 text-center text-red-600">No se pudo cargar el usuario.</div>;

  return (
    <EstiloEmpresaContext.Provider value={{ estilos: estilosSafe }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <PageLayout>
          <TopBar
            username={`${user.nombre} ${user.apellido}`}
            onLogout={handleLogout}
            style={{ backgroundColor: estilosSafe.color_principal }}
          />

          <div className="px-4 py-6">
            <div
              className="mx-auto w-fit text-sm font-medium px-4 py-2 rounded-full border shadow-sm"
              style={{
                backgroundColor: estilosSafe.color_secundario,
                borderColor: estilosSafe.color_principal,
                color: estilosSafe.color_texto,
              }}
            >
              {estilosSafe.slogan}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="relative">
              <ProfileCard
                nombre={`${user?.nombre} ${user?.apellido}`}
                correo={user?.correo}
                fotoUrl="https://i.postimg.cc/3x2SrWdX/360-F-64676383-Ldbmhi-NM6-Ypzb3-FM4-PPu-FP9r-He7ri8-Ju.webp"
                showCvLink={false}
                size="xl"
                style={{ borderColor: estilosSafe.color_principal }}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="md:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold text-black">Acciones disponibles: Reclutador de RRHH</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {acciones.map(({ icon: Icon, titulo, descripcion, onClick }, idx) => (
                  <motion.div
                    key={idx}
                    onClick={onClick}
                    className="cursor-pointer border p-5 rounded-xl shadow-sm hover:shadow-md"
                    style={{
                      backgroundColor: estilosSafe.color_secundario,
                      borderColor: estilosSafe.color_secundario,
                      color: estilosSafe.color_texto,
                    }}
                  >
                    <Icon className="w-6 h-6 mb-2" style={{ color: estilosSafe.color_texto }} />
                    <h3 className="text-base font-semibold">{titulo}</h3>
                    <p className="text-sm mt-1">{descripcion}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </PageLayout>


{modalLicenciaOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow space-y-4 text-black">
      <h2 className="text-xl font-semibold">Solicitud de Licencia</h2>

      {mensajeLicencia && (
        <div className="text-sm text-indigo-700 bg-indigo-100 p-2 rounded">
          {mensajeLicencia}
        </div>
      )}

      <div className="space-y-2">
        <div>
          <label className="text-sm font-medium">Tipo de licencia</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="vacaciones, enfermedad, etc."
            value={formLicencia.tipo}
            onChange={(e) =>
              setFormLicencia({ ...formLicencia, tipo: e.target.value })
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium">Descripción</label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Motivo o detalles adicionales"
            value={formLicencia.descripcion}
            onChange={(e) =>
              setFormLicencia({ ...formLicencia, descripcion: e.target.value })
            }
          ></textarea>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={() => {
            setModalLicenciaOpen(false);
            setMensajeLicencia("");
          }}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancelar
        </button>
        <button
          onClick={solicitarLicencia}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Enviar
        </button>
      </div>
    </div>
  </div>
)}


{/* modal de gestionar licencias */}
{modalLicenciasOpen && (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
    onClick={() => {
      setModalLicenciasOpen(false);
      setLicenciaId(null);
      setSelectedFile(null);
      setMensajeCertificado("");
    }}
  >
    <div
      className="bg-white p-6 rounded-2xl w-1/3 max-h-[70vh] overflow-auto text-black"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Seleccionar Licencia y Subir Certificado
      </h2>

      
      {licencias.length === 0 ? (
        <p className="text-center text-gray-500">
          No tienes licencias registradas.
        </p>
      ) : (
        <ul className="space-y-2 mb-4">
          {licencias.map((item, idx) => {
            const { id_licencia, tipo, descripcion, estado } =
              item.licencias.licencia;
            return (
              <li
                key={idx}
                onClick={() => setLicenciaId(id_licencia)}
                className={`p-3 border rounded cursor-pointer hover:bg-indigo-200 ${
                  licenciaId === id_licencia ? "bg-indigo-100" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{tipo}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      estado === "activa"
                        ? "bg-green-100 text-green-800"
                        : estado === "aprobada"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {estado}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{descripcion}</p>
              </li>
            );
          })}
        </ul>
      )}

      {/* sube el PDF <==> ya elegiste una licencia */}
      {licenciaId && (
        <>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4 file:rounded-lg
                       file:border-0 file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />

          {mensajeCertificado && (
            <div
              className={`mb-4 mt-2 text-center font-semibold p-2 rounded ${
                mensajeCertificado.includes("Error")
                  ? "bg-red-100 text-red-700"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {mensajeCertificado}
            </div>
          )}

          <div className="mt-4 text-right flex gap-2">
            <button
              onClick={async () => {
                if (!selectedFile) {
                  setMensajeCertificado("Debes seleccionar un PDF.");
                  return;
                }
                const formData = new FormData();
                formData.append("file", selectedFile);

                try {
                  const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/subir-certificado/${licenciaId}`,
                    {
                      method: "POST",
                      credentials: "include",
                      body: formData,
                    }
                  );
                  const data = await res.json();
                  if (res.ok) {
                    setMensajeCertificado(
                      `Certificado subido: ${data.certificado_url}`
                    );
                    setTimeout(() => {
                      setModalLicenciasOpen(false);
                      setLicenciaId(null);
                      setSelectedFile(null);
                      setMensajeCertificado("");
                    }, 1500);
                  } else {
                    setMensajeCertificado(`Error: ${data.error}`);
                  }
                } catch {
                  setMensajeCertificado("Error al conectar con el servidor.");
                }
              }}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Subir
            </button>
            <button
              onClick={() => {
                setModalLicenciasOpen(false);
                setLicenciaId(null);
                setSelectedFile(null);
                setMensajeCertificado("");
              }}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}

      </motion.div>
    </EstiloEmpresaContext.Provider>
  );
}