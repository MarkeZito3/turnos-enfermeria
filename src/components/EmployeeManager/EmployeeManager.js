import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './EmployeeManager.css';
import enfermerosData from '../../data/datos/enfermeros.json';


const EmployeeManager = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    turno: 'M',
    horasLaborales: 40,
    diasLicencia: [],
    fechaInicioLicencia: '',
    fechaFinLicencia: '',
    horarioRotativo: []
  });
  
  const navigate = useNavigate();

  // Cargar datos iniciales
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setEmployees(enfermerosData);
        setFilteredEmployees(enfermerosData);
      } catch (error) {
        console.error('Error cargando empleados:', error);
        console.log('afsdfasdfas');
      }
    };
    
    loadEmployees();
  }, []);

  // Filtrar empleados
  useEffect(() => {
    const results = employees.filter(emp =>
      emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.id.toString().includes(searchTerm)
    );
    setFilteredEmployees(results);
  }, [searchTerm, employees]);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'horasLaborales' ? parseInt(value) : value
    }));
  };

  // Agregar nuevo empleado
  const handleAddEmployee = () => {
    const newEmployee = {
      ...formData,
      id: employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1
    };
    
    setEmployees([...employees, newEmployee]);
    resetForm();
  };

  // Editar empleado existente
  const handleEditEmployee = () => {
    setEmployees(employees.map(emp => 
      emp.id === editingId ? { ...formData, id: editingId } : emp
    ));
    setEditingId(null);
    resetForm();
  };

  // Eliminar empleado
  const handleDeleteEmployee = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este empleado?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  // Cargar datos para edición
  const loadEmployeeForEdit = (employee) => {
    setFormData(employee);
    setEditingId(employee.id);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      id: '',
      nombre: '',
      turno: 'M',
      horasLaborales: 36,
      diasLicencia: [],
      horarioRotativo: []
    });
  };

  // Exportar a Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredEmployees);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Empleados');
    XLSX.writeFile(workbook, 'empleados.xlsx');
  };

  return (
    <div className="employee-manager">
      <h2>Gestor de Empleados</h2>
      
      <div className="controls">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Volver
        </button>
        
        <input
          type="text"
          placeholder="Buscar empleado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <button onClick={exportToExcel} className="export-btn">
          Exportar a Excel
        </button>
      </div>

      <div className="employee-form">
        <h3>{editingId ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}</h3>
        
        <div className="form-group">
          <label>Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="form-group">
          <label>Turno Base:</label>
          <select
            name="turno"
            value={formData.turno}
            onChange={handleInputChange}
          >
            <option value="M">Mañana</option>
            <option value="T">Tarde</option>
            <option value="N">Noche</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Horas Laborales:</label>
          <input
            type="number"
            name="horasLaborales"
            value={formData.horasLaborales}
            onChange={handleInputChange}
            min="20"
            max="40"
          />
        </div>

        <div className="form-group">
          <label>Inicio de Licencia:</label>
          <input
            type="date"
            name="fechaInicioLicencia"
            value={formData.fechaInicioLicencia}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label>Fin de Licencia:</label>
          <input
            type="date"
            name="fechaFinLicencia"
            value={formData.fechaFinLicencia}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="form-actions">
          {editingId ? (
            <>
              <button onClick={handleEditEmployee} className="save-btn">
                Guardar Cambios
              </button>
              <button onClick={resetForm} className="cancel-btn">
                Cancelar
              </button>
            </>
          ) : (
            <button onClick={handleAddEmployee} className="add-btn">
              Agregar Empleado
            </button>
          )}
        </div>
      </div>

      

      <div className="employee-list">
        <h3>Lista de Empleados</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Turno</th>
              <th>Horas</th>
              <th>Licencia Desde</th>
              <th>Licencia Hasta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(employee => (
              <tr key={employee.id}>
                <td>{employee.id}</td>
                <td>{employee.nombre}</td>
                <td>
                  <span className={`turno-badge ${employee.turno}`}>
                    {employee.turno === 'M' ? 'Mañana' : 
                     employee.turno === 'T' ? 'Tarde' : 'Noche'}
                  </span>
                </td>
                <td>{employee.horasLaborales}h</td>
                <td>{employee.fechaInicioLicencia || '-'}</td>
                <td>{employee.fechaFinLicencia || '-'}</td>
                <td className="actions">
                  <button 
                    onClick={() => loadEmployeeForEdit(employee)}
                    className="edit-btn"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteEmployee(employee.id)}
                    className="delete-btn"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeManager;