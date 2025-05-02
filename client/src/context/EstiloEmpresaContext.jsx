import { createContext, useContext } from "react";

export const EstiloEmpresaContext = createContext({
  estilos: null,
  loading: true
});

export const useEstiloEmpresa = () => useContext(EstiloEmpresaContext);
