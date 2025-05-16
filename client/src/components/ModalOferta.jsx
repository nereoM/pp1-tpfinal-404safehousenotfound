import React, { useState, useEffect } from 'react';
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

  // Inyecta etiquetas como string separado por comas
  useEffect(() => {
    const etiquetasString = etiquetas.join(',');
    setFormOferta(prev => ({ ...prev, etiquetas: etiquetasString }));
  }, [etiquetas, setFormOferta]);

  const validarFormulario = () => {
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
      fecha_cierre
    } = formOferta;

    if (
      !nombre ||
      !descripcion ||
      !location ||
      !employment_type ||
      !workplace_type ||
      !salary_min ||
      !salary_max ||
      !currency ||
      !experience_level ||
      !fecha_cierre
    ) {
      setMensajeOferta('Todos los campos son obligatorios.');
      return false;
    }

    if (parseInt(salary_min) >= parseInt(salary_max)) {
      setMensajeOferta('El salario mínimo no puede ser mayor o igual al salario máximo.');
      return false;
    }

    setMensajeOferta('');
    return true;
  };

  const handleConfirmar = () => {
    if (validarFormulario()) {
      crearOfertaLaboral();
    }
  };

  if (!modalOfertaOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto'>
      <div className='bg-white rounded-lg p-6 w-full max-w-2xl shadow space-y-4'>
        {mensajeOferta && (
          <div className='text-sm text-red-700 bg-red-100 p-2 rounded'>
            {mensajeOferta}
          </div>
        )}

        <h2 className='text-lg font-semibold text-black'>Nueva Oferta Laboral</h2>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Nombre */}
          <div>
            <label className='text-sm font-medium text-black'>Nombre de la Oferta</label>
            <input
              type='text'
              placeholder='Nombre de la Oferta'
              value={formOferta.nombre || ''}
              onChange={e => setFormOferta({ ...formOferta, nombre: e.target.value })}
              className='w-full p-2 border border-gray-300 rounded text-black'
            />
          </div>

          <div className='col-span-2'>
            <label className='text-sm font-medium text-black'>Descripción</label>
            <textarea
              placeholder='Descripción de la Oferta'
              value={formOferta.descripcion || ''}
              onChange={e => setFormOferta({ ...formOferta, descripcion: e.target.value })}
              className='w-full p-2 border border-gray-300 rounded text-black'
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
          </div>


          <div>
            <label className='text-sm font-medium text-black'>Fecha de Cierre</label>
            <input
              type='date'
              value={formOferta.fecha_cierre || ''}
              onChange={e => setFormOferta({ ...formOferta, fecha_cierre: e.target.value })}
              className='w-full p-2 border border-gray-300 rounded text-black'
            />
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
          </div>


          <div className='col-span-2'>
            <TagInput etiquetas={etiquetas} setEtiquetas={setEtiquetas} />
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
          </div>
        </div>

        {/* Botones */}
        <div className='flex justify-end gap-2 pt-4'>
          <button
            onClick={() => setModalOfertaOpen(false)}
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