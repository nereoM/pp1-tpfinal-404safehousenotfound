import React, { useState } from 'react';

const etiquetasSugeridas = [
  // tecnologia
  'Python', 'React', 'Node.js', 'SQL', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'TypeScript', 'Kotlin',
  'AWS', 'Docker', 'Kubernetes', 'Azure', 'Linux', 'Windows Server', 'DevOps', 'Machine Learning',
  'Data Science', 'Cybersecurity', 'Cloud Computing', 'Front-end', 'Back-end', 'Full Stack',
  
  // construccion
  'Obra Civil', 'Arquitectura', 'Ingeniería Civil', 'Albañilería', 'Plomería', 'Electricidad',
  'Instalaciones Sanitarias', 'Carpintería', 'Construcción en Seco', 'Pintura', 'Maquinista',
  'Topografía', 'Control de Obras', 'Seguridad Industrial', 'Obras Públicas',

  // eventos
  'Organización de Eventos', 'Catering', 'Montaje de Escenarios', 'Iluminación', 'Sonido',
  'Decoración', 'Seguridad en Eventos', 'Protocolo', 'Hostelería', 'Banquetes', 'Animación de Eventos',
  'Coordinación de Eventos', 'Logística de Eventos', 'Wedding Planner', 'Festival Organizer',

  // arte y diseño
  'Diseño Gráfico', 'Diseño Web', 'Diseño de Interiores', 'Diseño Industrial', 'Arte Visual',
  'Fotografía', 'Edición de Video', 'Producción Audiovisual', 'Animación 3D', 'Motion Graphics',
  'Ilustración', 'Pintura', 'Escultura', 'Diseño de Moda', 'Decoración de Espacios',

  // salud
  'Enfermería', 'Medicina General', 'Odontología', 'Fisioterapia', 'Farmacia', 'Nutrición',
  'Psicología', 'Terapia Ocupacional', 'Salud Mental', 'Veterinaria', 'Laboratorio Clínico',
  'Paramédico', 'Geriatría', 'Cuidado Domiciliario', 'Radiología',

  // educacion
  'Docencia', 'Educación Infantil', 'Educación Primaria', 'Educación Secundaria',
  'Profesor de Inglés', 'Tutoría', 'Educación Especial', 'Formación Profesional',
  'Instrucción Deportiva', 'Entrenador Personal', 'Capacitación Empresarial',
  'Orientación Vocacional', 'Pedagogía', 'Didáctica',

  // marketing y Ventas
  'Marketing Digital', 'SEO', 'SEM', 'Community Manager', 'Copywriting', 'Ventas',
  'Gestión Comercial', 'Atención al Cliente', 'Telemarketing', 'Branding',
  'Gestión de Redes Sociales', 'Comercio Electrónico', 'Relaciones Públicas',
  'Fidelización de Clientes', 'Publicidad',

  // Logistica
  'Logística', 'Transporte', 'Almacén', 'Distribución', 'Gestión de Inventarios',
  'Operador de Montacargas', 'Conductor Profesional', 'Paquetería',
  'Gestión de Flotas', 'Importación', 'Exportación', 'Comercio Exterior',
  'Carga y Descarga',

  // finanzas 
  'Contabilidad', 'Finanzas', 'Auditoría', 'Gestión de Proyectos',
  'Administración de Empresas', 'Gestión de Recursos Humanos', 'Tesorería',
  'Análisis Financiero', 'Impuestos', 'Gestión de Nómina', 'Compliance',
  'Planificación Estratégica', 'Control de Gestión',

  // otros rubros
  'Agronomía', 'Veterinaria', 'Ingeniería Química', 'Ingeniería Mecánica',
  'Ingeniería Eléctrica', 'Seguridad y Salud Ocupacional', 'Medio Ambiente',
  'Agricultura', 'Ganadería', 'Pesca', 'Minería', 'Energías Renovables',
  'Mecánica Automotriz', 'Soldadura', 'Electricidad Industrial',
  'Cuidado Infantil', 'Cuidado de Personas Mayores', 'Jardinería',
  'Paisajismo', 'Mantenimiento de Edificios', 'Limpieza',
];


const TagInput = ({ etiquetas, setEtiquetas }) => {
  const [etiquetaInput, setEtiquetaInput] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);

  const agregarEtiqueta = (event) => {
    if ((event.key === 'Enter') && etiquetaInput.trim() !== '') {
      event.preventDefault();
      if (!etiquetas.includes(etiquetaInput)) {
        setEtiquetas([...etiquetas, etiquetaInput]);
        setEtiquetaInput('');
        setSugerencias([]);
      }
    }
  };

  const eliminarEtiqueta = (index) => {
    const nuevasEtiquetas = etiquetas.filter((_, i) => i !== index);
    setEtiquetas(nuevasEtiquetas);
  };

  const manejarCambio = (e) => {
    const valor = e.target.value;
    setEtiquetaInput(valor);
    if (valor.length > 0) {
      const filtro = etiquetasSugeridas.filter((etiqueta) =>
        etiqueta.toLowerCase().startsWith(valor.toLowerCase())
      );
      setSugerencias(filtro);
    } else {
      setSugerencias([]);
    }
  };

  const seleccionarSugerencia = (sugerencia) => {
    if (!etiquetas.includes(sugerencia)) {
      setEtiquetas([...etiquetas, sugerencia]);
    }
    setEtiquetaInput('');
    setSugerencias([]);
  };

  return (
    <div className='relative'>
      <label className='text-sm font-medium text-black'>Etiquetas (Presioná Enter para agregar etiquetas)</label>
      <input
        value={etiquetaInput}
        onChange={manejarCambio}
        onKeyDown={agregarEtiqueta}
        className='w-full p-2 border border-gray-300 rounded text-black'
      />

      {sugerencias.length > 0 && (
        <ul className='absolute z-10 w-full border border-gray-300 rounded bg-white shadow mt-1'>
          {sugerencias.map((sugerencia, index) => (
            <li
              key={index}
              onClick={() => seleccionarSugerencia(sugerencia)}
              className={`p-2 cursor-pointer transition-all duration-200 ease-in-out text-black ${seleccionada === index ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-600 hover:text-white'}`}
              style={{ backgroundColor: '#4f46e5' }}
              onMouseEnter={() => setSeleccionada(index)}
              onMouseLeave={() => setSeleccionada(null)}
            >
              {sugerencia}
            </li>
          ))}
        </ul>
      )}

      <div className='flex gap-2 mt-2 flex-wrap'>
        {etiquetas.map((etiqueta, index) => (
          <div key={index} className='bg-indigo-600 text-white p-1 px-3 rounded-full flex items-center gap-2 shadow-md'>
            <span>{etiqueta}</span>
            <button
              onClick={() => eliminarEtiqueta(index)}
              className='text-white hover:text-red-500 p-0.5 rounded-full flex items-center justify-center w-5 h-5 text-xs border border-transparent hover:border-red-500'
              title='Eliminar'
            >
              <svg xmlns='http://www.w3.org/2000/svg' className='h-3 w-3' viewBox='0 0 20 20' fill='currentColor'>
                <path fillRule='evenodd' d='M10 9.293l4.646-4.647a.5.5 0 01.708.708L10.707 10l4.647 4.646a.5.5 0 01-.708.708L10 10.707l-4.646 4.647a.5.5 0 01-.708-.708L9.293 10 4.646 5.354a.5.5 0 01.708-.708L10 9.293z' clipRule='evenodd' />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagInput;
