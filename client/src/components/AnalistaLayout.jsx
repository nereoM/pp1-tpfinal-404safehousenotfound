import { Outlet } from 'react-router-dom';

export function AnalistaLayout(){
  // Aca se tendria que usar un layout para el analista, asi todas las
  // rutas del analista comparten la misma estructura
  return <Outlet/>
}
