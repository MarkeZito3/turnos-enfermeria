import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ScheduleTable from './components/ScheduleTable/ScheduleTable';
import EmployeeManager from './components/EmployeeManager/EmployeeManager';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">Gestor de Turnos Hospitalarios</h1>
            <nav className="main-nav">
              <ul className="nav-list">
                <li className="nav-item">
                  <Link to="/" className="nav-link">Inicio</Link>
                </li>
                <li className="nav-item">
                  <Link to="/turnos" className="nav-link">Gestor de Turnos</Link>
                </li>
                <li className="nav-item">
                  <Link to="/empleados" className="nav-link">Gestor de Empleados</Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/turnos" element={<ScheduleTable />} />
            <Route path="/empleados" element={<EmployeeManager />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Componente de Página de Inicio
function Home() {
  return (
    <div className="home-page">
      <h2>Bienvenido al Sistema de Gestión Hospitalaria</h2>
      <div className="project-description">
        <p>
          Este sistema permite la gestión eficiente de turnos del personal médico y administrativo
          del hospital, garantizando una cobertura adecuada en todos los servicios.
        </p>
        <h3>Características principales:</h3>
        <ul className="features-list">
          <li>Generación automática de turnos equilibrados</li>
          <li>Visualización clara de horarios y francos</li>
          <li>Gestión de licencias y días especiales</li>
          <li>Exportación de datos para análisis</li>
        </ul>
      </div>
    </div>
  );
}

export default App;