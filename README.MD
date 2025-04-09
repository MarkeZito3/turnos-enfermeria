# 🏥 Generador de Turnos para Enfermería

Este proyecto [aún incompleto] es una herramienta de generación automática de turnos rotativos para personal de enfermería, teniendo en cuenta distintos criterios como:

- Cantidad de horas laborales semanales.
- Turno principal de cada enfermero/a (mañana, tarde o noche).
- Horarios rotativos disponibles.
- Asignación justa de francos (días libres).
- Reglas especiales como proteger a ciertos trabajadores los fines de semana.
- Feriados y licencias (por ahora vacíos para mantener anonimato en los datos).

> ⚠️ Todos los nombres en este repositorio son ficticios (personas famosas) y los datos personales han sido removidos para proteger la privacidad. [cambiar el nombre del archivo a enfermeros.json]

---

## 📂 Estructura del Proyecto

```
turnos-enfermeria/
├── feriados/
│   ├── feriados_2021.json
│   ├── feriados_2022.json
│   ├── feriados_2023.json
│   ├── feriados_2024.json
│   ├── feriados_2025.json
│   ├── feriados_2026.json
├── .gitignore
├── ejemplo_de_enfermeros.json // Lista de enfermeros/as (nombres ficticios)
├── generador.js
├── package.json
├── package-lock.json
```

---

## ⚙️ Cómo usar

1. **Cloná el proyecto:**

```
git clone https://github.com/tu-usuario/generador-turnos-enfermeria.git
cd generador-turnos-enfermeria
```
Instalá Node.js si no lo tenés:
https://nodejs.org

Ejecutá el generador:
```bash
node generador.js
```
El script generará una matriz de turnos con base en los datos disponibles y la lógica implementada.

---

## 🧠 Lógica principal

Cada enfermero tiene un turno base (M, T, N).

Hay algunos con disponibilidad de rotar (por ejemplo: [M, N] o [T, N]).

Se generan francos obligatorios en dos fines de semana completos (sábado y domingo).

Se busca balancear la cantidad de personal por turno según reglas internas (mínimo y máximo).

---

## 📅 Personalización
Podés editar el archivo enfermeros.js para agregar más personas o ajustar los horarios.
También podés modificar las reglas en generador.js para adaptarlo a otras instituciones o necesidades.

## 🛡️ Licencia
MIT License. Este proyecto es de uso libre y puede ser modificado según las necesidades de cada institución.

## 🙌 Créditos
Desarrollado con para mi mamá, Licenciada en enfermería, que requería un programa así para facilitar la organización de turnos en contextos hospitalarios.