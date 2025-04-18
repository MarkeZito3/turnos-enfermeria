import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { generadorTurnos, enfermeros_Copia, feriados } from '../../logic/generador';
import './ScheduleTable.css';

const ScheduleTable = () => {
  // Obtener fecha actual
  const date = new Date();
  const anio_actual = date.getFullYear();
  const mes_actual = date.getMonth() + 1;

  // Estados
  const [matriz, setMatriz] = useState([]);
  const [year, setYear] = useState(anio_actual);
  const [month, setMonth] = useState(mes_actual);
  const [editMode, setEditMode] = useState(false);

  // Memoizar la función getStorageKey
  const getStorageKey = useCallback(() => `turnos-${year}-${month}`, [year, month]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = () => {
      const savedData = localStorage.getItem(getStorageKey());
      if (savedData) {
        setMatriz(JSON.parse(savedData));
      } else {
        const nuevosTurnos = generadorTurnos(year, month);
        setMatriz(nuevosTurnos);
      }
    };
    
    loadData();
  }, [year, month, getStorageKey]); // Añadido getStorageKey a las dependencias

  // Guardar cambios automáticamente
  useEffect(() => {
    if (matriz.length > 0) {
      localStorage.setItem(getStorageKey(), JSON.stringify(matriz));
    }
  }, [matriz, year, month]);

  const handleCellClick = (rowIndex, colIndex) => {
    if (!editMode) return;
    
    const newMatriz = matriz.map(row => [...row]);
    const currentValue = newMatriz[rowIndex][colIndex];
    
    // Check if the cell value is "L" and return early if it is
    if (currentValue === 'L') {
      return;
    }

    // Rotar entre los valores posibles: M → T → N → F → M...
    const values = ['M', 'T', 'N', 'F'];
    const currentIndex = values.indexOf(currentValue);
    const nextIndex = (currentIndex + 1) % values.length;
    
    newMatriz[rowIndex][colIndex] = values[nextIndex];
    setMatriz(newMatriz);
  };

  const exportToExcel = () => {
    try {
      const header = ['Enfermero', ...Array.from({ length: matriz[0].length }, (_, i) => i + 1)];
      
      const excelData = [
        header,
        ...matriz.map((row, rowIndex) => [
          enfermeros_Copia[rowIndex]?.nombre || `Enfermero ${rowIndex + 1}`,
          ...row
        ])
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Horarios');

      // Mejor método de descarga
      XLSX.writeFile(wb, `Turnos-${month}-${year}.xlsx`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Ocurrió un error al exportar');
    }
  };

  const resetToDefault = () => {
    if (window.confirm('¿Desea generar nuevamente los turnos?\nSe perderán los cambios no guardados.')) {
      const nuevosTurnos = generadorTurnos(year, month);
      setMatriz(nuevosTurnos);
    }
  };

  // Función para obtener información del día (incluyendo feriados)
  const getDiaInfo = (diaDelMes) => {
    const fecha = new Date(year, month - 1, diaDelMes);
    const diaSemana = fecha.getDay(); // 0=domingo, 6=sábado
    
    // Obtener lista de feriados para el mes/año actual
    const feriadosDelMes = feriados(year);
    const esFeriado = feriadosDelMes.some(f => {
      const [, fechaMes, fechaDia] = f.fecha.split('-').map(Number);
      return fechaMes === month && fechaDia === diaDelMes;
    });

    return {
      numero: diaDelMes,      
      nombre: fecha.toLocaleDateString('es-ES', { weekday: 'short' }),
      esFinDeSemana: diaSemana === 0 || diaSemana === 6,
      esFeriado,
      feriadoNombre: esFeriado 
        ? feriadosDelMes.find(f => {
            const [, fm, fd] = f.fecha.split('-').map(Number);
            return fm === month && fd === diaDelMes;
          })?.nombre 
        : null
    };
  };

  return (
    <div className="schedule-container">
      
      <div className="controls">
        <select value={month} className = "select-month" onChange={(e) => setMonth(parseInt(e.target.value))}>
          {Array.from({length: 12}, (_, i) => (
            <option key={i+1} value={i+1}>
              {new Date(year, i, 1).toLocaleString('es-ES', {month: 'long'})}
            </option>
          ))}
        </select>
        
        <select value={year} className = "select-year" onChange={(e) => setYear(parseInt(e.target.value))}>
          {[2021, 2022, 2023, 2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        
        <button 
          onClick={() => setEditMode(!editMode)}
          className={editMode ? 'active' : ''}
        >
          {editMode ? 'Desactivar Edición' : 'Activar Edición'}
        </button>

        <button onClick={exportToExcel} className="export-btn">
          📊 Exportar a Excel
        </button>

        <button onClick={resetToDefault} className="reset-btn">
          🔄 Generar Nuevamente
        </button>
      </div>
      
      {editMode && (
        <div className="edit-notice">
          <p>Modo edición activado. Haz clic en cualquier celda para cambiar el turno.</p>
          <div className="legend">
            <span className="legend-item"><span className="box M"></span> Mañana</span>
            <span className="legend-item"><span className="box T"></span> Tarde</span>
            <span className="legend-item"><span className="box N"></span> Noche</span>
            <span className="legend-item"><span className="box F"></span> Franco</span>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table>
        <thead>
            <tr>
            <th>Enfermero</th>
            {matriz[0]?.map((_, dayIndex) => {
              const diaInfo = getDiaInfo(dayIndex + 1);
              const esDiaEspecial = diaInfo.esFinDeSemana || diaInfo.esFeriado;
              
              return (
                <th 
                  key={dayIndex} 
                  className={esDiaEspecial ? 'weekend-day' : ''}
                  title={diaInfo.esFeriado ? diaInfo.feriadoNombre : undefined}
                >
                  <div>{diaInfo.numero}</div>
                  <div className={`day-name ${esDiaEspecial ? 'special-day' : ''}`}>
                    {diaInfo.nombre}
                    {diaInfo.esFeriado && '✨'} {/* Icono para feriados */}
                  </div>
                </th>
              );
            })}
            </tr>
          </thead>
          <tbody>
            {matriz.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="nombre">{enfermeros_Copia[rowIndex]?.nombre || `Enfermero ${rowIndex + 1}`}</td>
                {row.map((cell, colIndex) => (
                  <td 
                    key={colIndex}
                    className={`cell ${cell} ${editMode ? 'editable' : ''}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    title={`Editar: ${cell}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleTable;