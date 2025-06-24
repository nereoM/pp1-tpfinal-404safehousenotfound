import { useEffect, useState } from 'react';
import TagInput from './TagInput';

const provincias = [
  'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán',
  'Salta', 'Entre Ríos', 'Misiones', 'Chaco', 'Corrientes',
  'Santiago del Estero', 'San Juan', 'Jujuy', 'Río Negro',
  'Neuquén', 'Formosa', 'Chubut', 'San Luis', 'Catamarca',
  'La Rioja', 'La Pampa', 'Santa Cruz', 'Tierra del Fuego'
];

const modalidades = ['Remoto', 'Presencial', 'Híbrido'];
const nivelesExperiencia = ['Junior', 'Semi Senior', 'Senior', 'Sin experiencia'];
const tiposEmpleo = ['Full-Time', 'Part-Time', 'Medio tiempo', 'Contratado'];
const monedas = ['USD', 'EURO', 'PESO'];

const ModalOfertaFull = ({
  modalOfertaOpen,
  setModalOfertaOpen,
  crearOfertaLaboral,
  formOferta,
  setFormOferta
}) => {
  const [mensajeOferta, setMensajeOferta] = useState('');
  const [etiquetas, setEtiquetas] = useState([]);
  const [errores, setErrores] = useState({}); 


  // Inyecta etiquetas como string separado por comas
  useEffect(() => {
    const etiquetasString = etiquetas.join(',');
    setFormOferta(prev => ({ ...prev, etiquetas: etiquetasString }));
  }, [etiquetas, setFormOferta]);

  const validarFormulario = () => {
    const nuevosErrores = {};
    const {
      nombre,
      descripcion,
      location,
      employment_type,
      workplace_type,
      salary_min,
      salary_max,
      currency,
      experience_level,
      fecha_cierre,
      umbral_individual 
    } = formOferta;

    if (!nombre) nuevosErrores.nombre = 'El nombre es obligatorio.';
    if (!location) nuevosErrores.location = 'La ubicación es obligatoria.';
    if (!employment_type) nuevosErrores.employment_type = 'El tipo de empleo es obligatorio.';
    if (!workplace_type) nuevosErrores.workplace_type = 'La modalidad es obligatoria.';
    if (!salary_min) nuevosErrores.salary_min = 'El salario mínimo es obligatorio.';
    if (!salary_max) nuevosErrores.salary_max = 'El salario máximo es obligatorio.';

    if (parseInt(salary_min) < 0) {
      nuevosErrores.salary_min = 'El salario mínimo no puede ser negativo.';
    }
    if (parseInt(salary_max) < 0) {
      nuevosErrores.salary_max = 'El salario máximo no puede ser negativo.';
    }
    if (parseInt(salary_min) >= parseInt(salary_max)) {
      nuevosErrores.salary_min = 'El salario mínimo no puede ser mayor o igual al salario máximo.';
    }

    if (umbral_individual && parseInt(umbral_individual) <= 0) {
      nuevosErrores.umbral_individual = 'El nivel mínimo de coincidencia debe ser mayor a 0.'; // <-- Agregado
    }

    if (!currency) nuevosErrores.currency = 'La moneda es obligatoria.';
    if (!experience_level) nuevosErrores.experience_level = 'El nivel de experiencia es obligatorio.';

    if (!fecha_cierre) {
      nuevosErrores.fecha_cierre = 'La fecha de cierre es obligatoria.';
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Eliminar la hora para comparar solo fechas

      const fecha = new Date(fecha_cierre);
      if (fecha < hoy) {
        nuevosErrores.fecha_cierre = 'La fecha de cierre no puede ser anterior a hoy.'; // <-- Agregado
      }
    }
    if (etiquetas.length === 0) {
      nuevosErrores.etiquetas = 'Debes agregar al menos una etiqueta.';
    }
    if (parseInt(salary_min) >= parseInt(salary_max)) {
      nuevosErrores.salary_min = 'El salario mínimo no puede ser mayor o igual al salario máximo.';
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      setMensajeOferta('Por favor, corregí los errores antes de continuar.');
      return false;
    }

    setMensajeOferta('');
    return true;
  };

const handleConfirmar = () => {
  if (validarFormulario()) {
    console.log("Todo validado correctamente. Enviando...");
    crearOfertaLaboral();
    
    setFormOferta({
      nombre: '',
      descripcion: '',
      location: '',
      employment_type: '',
      workplace_type: '',
      salary_min: '',
      salary_max: '',
      currency: '',
      experience_level: '',
      fecha_cierre: '',
      umbral_individual: '',
      etiquetas: ''
    });

    setEtiquetas([]);
    setErrores({});

    setTimeout(() => {
      setMensajeOferta('');
      setModalOfertaOpen(false);
    }, 2000);
  }
};


  if (!modalOfertaOpen) return null;

  return (
    <div className='fixed p-6 inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto' onClick={() => setModalOfertaOpen(false)}>
      <div className='bg-white rounded-lg p-6 w-full max-w-6xl max-h-[100vh] overflow-y-auto shadow space-y-4' onClick={e => e.stopPropagation()}>
        {mensajeOferta && (
          <div
            className={`text-sm p-2 rounded text-center mx-auto w-2/3 ${
              mensajeOferta.includes('exitosamente')
                ? 'text-green-700 bg-green-100'
                : 'text-red-700 bg-red-100'
            }`}
          >
            {mensajeOferta}
          </div>
        )}

        <h2 className='text-lg font-semibold text-black'>Nueva Oferta Laboral</h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
          {/* Nombre */}
          <div className="flex-1 min-w-[220px]">
            <label className="text-sm font-medium text-black">Nombre de la Oferta</label>
            <input
              type="text"
              placeholder="Nombre de la Oferta"
              value={formOferta.nombre || ''}
              onChange={e => setFormOferta({ ...formOferta, nombre: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
            {errores.nombre && <p className='text-red-600 text-sm mt-1'>{errores.nombre}</p>}
          </div>

          <div className="flex-[2] min-w-[300px]">
            <label className="text-sm font-medium text-black">Descripción *Opcional</label>
            <textarea
              placeholder="Descripción de la Oferta"
              value={formOferta.descripcion || ''}
              onChange={e => setFormOferta({ ...formOferta, descripcion: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-black h-[100px] resize-none"
            />
          </div>


          <div>
            <label className='text-sm font-medium text-black'>Tipo de Empleo</label>
            <select
              value={formOferta.employment_type || ''}
              onChange={e => setFormOferta({ ...formOferta, employment_type: e.target.value })}
              className='w-full p-2 border border-gray-300 rounded text-black'
            >
              <option value='' disabled>Seleccionar Tipo de Empleo</option>
              {tiposEmpleo.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            {errores.employment_type && <p className='text-red-600 text-sm mt-1'>{errores.employment_type}</p>} 
          </div>

          <div>
            <label className='text-sm font-medium text-black'>Salario Mínimo</label>
            <input
              type='number'
              placeholder='Salario Mínimo'
              value={formOferta.salary_min || ''}
              onChange={e => setFormOferta({ ...formOferta, salary_min: e.target.value })}
              className='w-full p-2 border border-gray-300 rounded text-black'
            />
            {errores.salary_min && <p className='text-red-600 text-sm mt-1'>{errores.salary_min}</p>} 
          </div>

 
          <div>
            <label className='text-sm font-medium text-black'>Salario Máximo</label>
            <input
              type='number'
              placeholder='Salario Máximo'
              value={formOferta.salary_max || ''}
              onChange={e => setFormOferta({ ...formOferta, salary_max: e.target.value })}
              className='w-full p-2 border border-gray-300 rounded text-black'
            />
            {errores.salary_max && <p className='text-red-600 text-sm mt-1'>{errores.salary_max}</p>}
          </div>

          <div>
            <label className='text-sm font-medium text-black'>Moneda</label>
            <select
              value={formOferta.currency || ''}
              onChange={e => setFormOferta({ ...formOferta, currency: e.target.value })}
              className='w-full p-2 border border-gray-300 rounded text-black'
            >
              <option value='' disabled>Seleccionar Moneda</option>
              {monedas.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errores.currency && <p className='text-red-600 text-sm mt-1'>{errores.currency}</p>}
          </div>


          <div>
            <label className='text-sm font-medium text-black'>Fecha de Cierre</label>
            <input
              type='date'
              value={formOferta.fecha_cierre || ''}
              onChange={e => setFormOferta({ ...formOferta, fecha_cierre: e.target.value })}
              className='w-full p-2 border border-gray-300 rounded text-black'
            />
            {errores.fecha_cierre && <p className='text-red-600 text-sm mt-1'>{errores.fecha_cierre}</p>}
          </div>


          <div>
            <label className='text-sm font-medium text-black'>Ubicación</label>
            <select
              value={formOferta.location || ''}
              onChange={e => setFormOferta({ ...formOferta, location: e.target.value })}
              className='w-full p-2 border border-gray-300 rounded text-black'
            >
              <option value='' disabled>Seleccionar Provincia</option>
              {provincias.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errores.location && <p className='text-red-600 text-sm mt-1'>{errores.location}</p>}
          </div>


          <div>
            <label className='text-sm font-medium text-black'>Modalidad</label>
            <select
              value={formOferta.workplace_type || ''}
              onChange={e => setFormOferta({ ...formOferta, workplace_type: e.target.value })}
              className='w-full p-2 border border-gray-300 rounded text-black'
            >
              <option value='' disabled>Seleccionar Modalidad</option>
              {modalidades.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errores.workplace_type && <p className='text-red-600 text-sm mt-1'>{errores.workplace_type}</p>}
          </div>


          <div>
            <label className='text-sm font-medium text-black'>Nivel de Experiencia</label>
            <select
              value={formOferta.experience_level || ''}
              onChange={e => setFormOferta({ ...formOferta, experience_level: e.target.value })}
              className='w-full p-2 border border-gray-300 rounded text-black'
            >
              <option value='' disabled>Seleccionar Nivel</option>
              {nivelesExperiencia.map(ne => (
                <option key={ne} value={ne}>{ne}</option>
              ))}
            </select>
            {errores.experience_level && <p className='text-red-600 text-sm mt-1'>{errores.experience_level}</p>}
          </div>


          <div className='col-span-2'>
            <TagInput etiquetas={etiquetas} setEtiquetas={setEtiquetas} />
            {errores.etiquetas && (
              <p className="text-red-600 text-sm mt-1">{errores.etiquetas}</p>
            )}
          </div>


          <div>
            <label className='text-sm font-medium text-black'>Nivel mínimo de coincidencia (%)</label>
            <input
              type='number'
              placeholder='Nivel de Busqueda por Defecto (55%)'
              value={formOferta.umbral_individual || ''}
              onChange={e => setFormOferta({ ...formOferta, umbral_individual: e.target.value })}
              className='w-full p-2 border border-gray-300 rounded text-black'
            />
            <p className='text-red-600 text-sm mt-1'>{errores.umbral_individual}</p> 
          </div>
        </div>

        {/* Botones */}
        <div className='flex justify-end gap-2 pt-4'>
          <button
            onClick={() => {
              setFormOferta({
                nombre: '',
                descripcion: '',
                location: '',
                employment_type: '',
                workplace_type: '',
                salary_min: '',
                salary_max: '',
                currency: '',
                experience_level: '',
                fecha_cierre: '',
                umbral_individual: '',
                etiquetas: ''
              });
              setEtiquetas([]);
              setErrores({});
              setMensajeOferta('');
              setModalOfertaOpen(false);
            }}
            className='px-4 py-2 bg-gray-300 rounded hover:bg-gray-400'
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            className='px-4 py-2 text-white rounded bg-indigo-600'
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalOfertaFull;