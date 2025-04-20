import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { generadorTurnos, enfermeros_Copia, feriados, reequilibrarTurnos } from '../../logic/generador';
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
  const [selectedCell, setSelectedCell] = useState(null);
  const [editType, setEditType] = useState('swap'); // 'swap' para intercambiar, 'insert' para insertar

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
        const turnosReequilibrados = reequilibrarTurnos(nuevosTurnos, year, month, {M: 4, T: 4, N: 4});
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
    
    // Si la celda tiene "L", no permitir cambios
    if (matriz[rowIndex][colIndex] === 'L') {
      return;
    }

    if (editType === 'swap') {
      if (selectedCell === null) {
        // Primera selección
        setSelectedCell({ rowIndex, colIndex });
      } else {
        // Segunda selección - intercambiar valores
        const newMatriz = matriz.map(row => [...row]);
        
        // Verificar que la segunda celda no sea "L"
        if (newMatriz[rowIndex][colIndex] === 'L') {
          setSelectedCell(null);
          return;
        }

        // Intercambiar valores
        const temp = newMatriz[selectedCell.rowIndex][selectedCell.colIndex];
        newMatriz[selectedCell.rowIndex][selectedCell.colIndex] = newMatriz[rowIndex][colIndex];
        newMatriz[rowIndex][colIndex] = temp;
        
        setMatriz(newMatriz);
        setSelectedCell(null); // Limpiar selección
      }
    } else if (editType !== 'swap') {
      // Insertar el turno seleccionado
      const newMatriz = matriz.map(row => [...row]);
      newMatriz[rowIndex][colIndex] = editType;
      setMatriz(newMatriz);
    }
  };

  const handleEditTypeChange = (type) => {
    setEditType(type);
    setSelectedCell(null); // Limpiar selección al cambiar el modo
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
      const turnosReequilibrados = reequilibrarTurnos(nuevosTurnos, year, month, {M: 4, T: 4, N: 4});
      setMatriz(turnosReequilibrados);
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

  const MINIMUM_SHIFTS = { M: 5, T: 5, N: 4 };

  // Función para contar turnos por día
  const countShiftsForDay = (dayIndex) => {
    const counts = { M: 0, T: 0, N: 0 };
    matriz.forEach(row => {
      if (row[dayIndex] === 'M') counts.M++;
      if (row[dayIndex] === 'T') counts.T++;
      if (row[dayIndex] === 'N') counts.N++;
    });
    return counts;
  };

  // Función para obtener el texto de horarios rotativos
  const getHorariosRotativos = (index) => {
    const enfermero = enfermeros_Copia[index];
    if (!enfermero || !enfermero.horarioRotativo || enfermero.horarioRotativo.length === 0) {
      return 'Fijo';
    }
    return enfermero.horarioRotativo.join(', ');
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
          <div className="edit-modes">
            <p>Modo edición activado.</p>
            <div className="edit-buttons">
              <button 
                className={`edit-button ${editType === 'swap' ? 'active' : ''}`}
                onClick={() => handleEditTypeChange('swap')}
              >
                Intercambiar Turnos
              </button>
              <button 
                className={`edit-button M ${editType === 'M' ? 'active' : ''}`}
                onClick={() => handleEditTypeChange('M')}
              >
                Mañana
              </button>
              <button 
                className={`edit-button T ${editType === 'T' ? 'active' : ''}`}
                onClick={() => handleEditTypeChange('T')}
              >
                Tarde
              </button>
              <button 
                className={`edit-button N ${editType === 'N' ? 'active' : ''}`}
                onClick={() => handleEditTypeChange('N')}
              >
                Noche
              </button>
              <button 
                className={`edit-button F ${editType === 'F' ? 'active' : ''}`}
                onClick={() => handleEditTypeChange('F')}
              >
                Franco
              </button>
            </div>
            {editType === 'swap' && (
              <p>Selecciona dos celdas para intercambiar sus turnos.</p>
            )}
            {editType !== 'swap' && (
              <p>Haz click en una celda para asignar turno {editType}.</p>
            )}
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="info-column nombre-column">Enfermero</th>
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
                      {diaInfo.esFeriado && '✨'}
                    </div>
                  </th>
                );
              })}
              <th className="info-column rotativo-column">Rotativo</th>
            </tr>
          </thead>
          <tbody>
            {matriz.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="nombre">{enfermeros_Copia[rowIndex]?.nombre || `Enfermero ${rowIndex + 1}`}</td>
                {row.map((cell, colIndex) => {
                  const diaInfo = getDiaInfo(colIndex + 1);
                  const esDiaEspecial = diaInfo.esFinDeSemana || diaInfo.esFeriado;
                  
                  return (
                    <td 
                      key={colIndex}
                      className={`cell ${cell} ${editMode ? 'editable' : ''} ${
                        selectedCell && 
                        selectedCell.rowIndex === rowIndex && 
                        selectedCell.colIndex === colIndex ? 'selected' : ''
                      } ${esDiaEspecial ? 'special-day-column' : ''}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      title={selectedCell ? 'Intercambiar con celda seleccionada' : 'Seleccionar para intercambiar'}
                    >
                      {cell}
                    </td>
                  );
                })}
                <td className={`rotativo ${getHorariosRotativos(rowIndex) === 'Fijo' ? 'fijo' : 'rotativo'}`}>
                  {getHorariosRotativos(rowIndex)}
                </td>
              </tr>
            ))}
            {/* Fila de conteo de turnos */}
            <tr className="shift-counts">
              <td>Turnos</td>
              {matriz[0]?.map((_, colIndex) => {
                const diaInfo = getDiaInfo(colIndex + 1);
                const esDiaEspecial = diaInfo.esFinDeSemana || diaInfo.esFeriado;
                const counts = countShiftsForDay(colIndex);
                
                return (
                  <td key={colIndex} className={`counts-cell ${esDiaEspecial ? 'special-day-column' : ''}`}>
                    <div className={counts.M < MINIMUM_SHIFTS.M ? 'below-minimum' : 'above-minimum'}>
                      M: {counts.M}
                    </div>
                    <div className={counts.T < MINIMUM_SHIFTS.T ? 'below-minimum' : 'above-minimum'}>
                      T: {counts.T}
                    </div>
                    <div className={counts.N < MINIMUM_SHIFTS.N ? 'below-minimum' : 'above-minimum'}>
                      N: {counts.N}
                    </div>
                  </td>
                );
              })}
              <td></td> {/* Celda vacía para alinear con la columna de rotativos */}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleTable;