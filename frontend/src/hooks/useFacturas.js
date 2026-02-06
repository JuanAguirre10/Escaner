import { useState, useEffect } from 'react';
import { facturaService } from '../services';
import toast from 'react-hot-toast';

export function useFacturas(filtros = {}) {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await facturaService.listar(filtros);
      setFacturas(data);
    } catch (err) {
      setError(err);
      toast.error('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [JSON.stringify(filtros)]);

  const recargar = () => {
    cargar();
  };

  return { facturas, loading, error, recargar };
}

export function useFactura(id) {
  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await facturaService.obtener(id);
        setFactura(data);
      } catch (err) {
        setError(err);
        toast.error('Error al cargar factura');
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [id]);

  return { factura, loading, error };
}

export function useEstadisticas() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await facturaService.estadisticas();
      setStats(data);
    } catch (err) {
      setError(err);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const recargar = () => {
    cargar();
  };

  return { stats, loading, error, recargar };
}