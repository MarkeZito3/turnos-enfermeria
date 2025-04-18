
# 🏥 Generador de Turnos para Enfermería

Este proyecto (actualmente en desarrollo) está diseñado específicamente para ajustarse a las necesidades organizativas del Hospital Perrando. Su objetivo es ofrecer una solución integral para la generación y gestión de turnos rotativos del personal de enfermería, teniendo en cuenta la lógica de funcionamiento interna del hospital: distribución de horas laborales, turnos base, licencias, feriados y un esquema justo de rotación entre el personal.

Actualmente se ha incorporado una interfaz moderna utilizando **React**, mientras que el backend y la base de datos aún están en desarrollo. La idea es integrar próximamente:

- **Node.js** + **Express** para el backend.
- **MongoDB** y **MongoDB Atlas** como base de datos principal.

> ⚠️ Nota importante: para ejecutar correctamente el generador, es necesario **renombrar el archivo `ejemplo_de_enfermeros.json` a `enfermeros.json`**.

---

## ✅ Estado del Proyecto

- ✅ Interfaz React funcional y amigable.
- ✅ Los turnos generados se almacenan temporalmente en **localStorage**.
- 🔄 En proceso de implementación del backend con Express y MongoDB.
- 🔄 CRUD de enfermeros, licencias y turnos aún **no funcional** (falta la conexión con la DB del servidor).
- ⚠️ La organización de carpetas ha sido mejorada para mayor claridad, aunque **aún sujeta a cambios** cuando se implemente el backend.

---

## 📂 Estructura del Proyecto (parcial)

```
turnos-enfermeria/
├── 📂public/
│   ├── favicon.ico
│   └── ...
│
├── 📂src/
│   ├── 📂components/
│   │   └── 📂EmployeeManager/
│   │   │   ├── EmployeeManager.css
│   │   │   └── EmployeeManager.js
│   │   └── 📂ScheduleTable/
│   │       ├── ScheduleTable.css
│   │       └── ScheduleTable.js
│   │
│   ├── 📂data/
│   │   └── 📂datos/
│   │   │   └── ejemplo_de_enfermeros.json
│   │   └── 📂feriados/
│   │       ├── feriados_2021.json
│   │       └── ...hasta 2026
│   │
│   ├── 📂logic/
│   │   └── generador.js
│   │
│   ├── App.css
│   ├── App.js
│   ├── App.test.js
│   ├── index.css
│   ├── index.js
│   ├── logo.svg
│   ├── reportWebVitals.js
│   └── setupTests.js
│
├── .gitignire
├── README.md
├── package-lock.json
└── package.json
```

---

## 🧠 Lógica del Generador

El archivo `generador.js` contiene la lógica para:

- Asignar francos obligatorios (2 fines de semana por enfermero).
- Considerar turnos base y rotaciones permitidas.
- Incluir licencias y feriados (cuando estén disponibles).
- Balancear la cantidad de personal por turno (respetando mínimos y máximos).

Esta lógica se moverá al backend en futuras versiones para una mejor separación de responsabilidades y escalabilidad.

---

## 🚀 Cómo usar (modo script, aún sin backend)

```bash
git clone https://github.com/MarkeZito3/turnos-enfermeria.git
cd turnos-enfermeria
npm install
npm start
```

> Asegurate de tener Node.js instalado: https://nodejs.org

---

## 🛠️ Personalización

Podés editar el archivo `enfermeros.json` para agregar nuevos empleados, ajustar turnos, horas o disponibilidades.  
También es posible modificar `generador.js` si querés adaptar las reglas a tu institución.

---

## 📅 En el futuro...

Este proyecto tendrá:

- Login de usuarios
- CRUD completo para personal, turnos, licencias
- Exportación de datos
- Almacenamiento en MongoDB (local o Atlas)

---

## 🙌 Créditos

Desarrollado con mucho cariño para mi mamá, Licenciada en Enfermería, que necesitaba una solución práctica para organizar los turnos del hospital.

---

## 🛡️ Licencia

MIT License – Este proyecto es de uso libre y abierto a cualquier institución o desarrollador que desee adaptarlo.
