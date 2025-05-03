import React, { createContext, useContext } from "react";

export const EstiloEmpresaContext = createContext({
  estilos: {},
  textColor: "#000",       
  loading: true,
});

export const useEstiloEmpresa = () => useContext(EstiloEmpresaContext);
