import { createContext, useContext, useState } from 'react';

const FacturaContext = createContext();

export function FacturaProvider({ children }) {
  const [facturaActual, setFacturaActual] = useState(null);
  const [filtros, setFiltros] = useState({
    estado: '',
    buscar: '',
    fecha_desde: null,
    fecha_hasta: null,
  });

  const value = {
    facturaActual,
    setFacturaActual,
    filtros,
    setFiltros,
  };

  return (
    <FacturaContext.Provider value={value}>
      {children}
    </FacturaContext.Provider>
  );
}

export function useFacturaContext() {
  const context = useContext(FacturaContext);
  if (!context) {
    throw new Error('useFacturaContext debe usarse dentro de FacturaProvider');
  }
  return context;
}