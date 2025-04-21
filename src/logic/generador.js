import enfermeros_original from '../data/datos/enfermeros.json'; // Cambiar el nombre por ejemplo_de_enfermeros.json
import feriados2021 from '../data/feriados/feriados_2021.json';
import feriados2022 from '../data/feriados/feriados_2022.json';
import feriados2023 from '../data/feriados/feriados_2023.json';
import feriados2024 from '../data/feriados/feriados_2024.json';
import feriados2025 from '../data/feriados/feriados_2025.json';
import feriados2026 from '../data/feriados/feriados_2026.json';
// Cargar enfermeros desde el JSON
let enfermeros = JSON.parse(JSON.stringify(enfermeros_original));

if (!enfermeros || enfermeros.length === 0) {
    throw new Error("No se encontraron datos de enfermeros");
}

export let enfermeros_Copia = enfermeros_original; 

// Función para restaurar los datos originales
const restaurarEnfermeros = () => {
    enfermeros = JSON.parse(JSON.stringify(enfermeros_Copia));
    // Inicializar la propiedad francos para cada enfermero
    enfermeros.forEach(enfermero => {
        enfermero.francos = [];
    });
};

//Cargar feriados desde el JSON
export const feriados = (anio) => {
    switch(anio) {
      case 2021: return feriados2021;
      case 2022: return feriados2022;
      case 2023: return feriados2023;
      case 2024: return feriados2024;
      case 2025: return feriados2025;
      case 2026: return feriados2026;
      default: return [];
    }
};

/**
 * Genera listas de días no laborables (feriados y fines de semana)
 */
const obtenerDiasNoLaborables = (anio, mes) => {
    const diasFinde = [];
    const diasFeriados = [];
    const diasEntreS = [];
    let dias = [];

    // Obtener feriados
    const listaFeriados = feriados(anio).filter(f => parseInt(f.fecha.split('-')[1]) === mes);
    listaFeriados.forEach(f => {
        diasFeriados.push(parseInt(f.fecha.split('-')[2]));
    });

    // Encontrar fines de semana
    const ultimoDia = new Date(anio, mes, 0).getDate();
    for (let dia = 1; dia <= ultimoDia; dia++) {
        const fecha = new Date(anio, mes - 1, dia);
        if (fecha.getDay() === 0 || fecha.getDay() === 6) { // 0 = Domingo, 6 = Sábado
            diasFinde.push(dia);
        } else if([1,2,3,4,5].includes(fecha.getDay())) {
            dias.push(dia);
        } 
    }
    
    
    let semanaActual = [dias[0]];

    for (let i = 1; i < dias.length; i++) {
    const dia = dias[i];
    const diaAnterior = dias[i - 1];

    if (dia - diaAnterior > 1) {
            diasEntreS.push(semanaActual);
            semanaActual = [dia];
        } else {
            semanaActual.push(dia);
        }
    }

    // Agregar la última semana
    diasEntreS.push(semanaActual);

    return {
        diasTotales: ultimoDia,
        diasEntreS,
        diasFinde,
        diasFeriados,
        diasNoLaborables: [...new Set([...diasFinde, ...diasFeriados])].sort((a, b) => a - b)
    };
};

/**
 * Normaliza formatos de fecha para comparación (handler)
 */
function formatToComparable(dateStr) {
    const partes = dateStr.split('-');
    if (partes[0].length === 4) return dateStr;
    if (partes[2].length === 4) return `${partes[2]}-${partes[1]}-${partes[0]}`;
    const añoCompleto = partes[2].length === 2 ? `20${partes[2]}` : partes[2];
    return `${añoCompleto}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
}

/**
 * Genera la matriz de turnos base considerando licencias
 */
const generarMatrizTurnos = (anio, mes) => {
    const { diasTotales } = obtenerDiasNoLaborables(anio, mes);
    
    // Asigna el turno a cada enfermero
    return enfermeros.map(enfermero => {
        return Array.from({ length: diasTotales }, (_, i) => {
            const diaNumero = i + 1;
            const fechaActual = `${String(diaNumero).padStart(2, '0')}-${String(mes).padStart(2, '0')}-${anio}`;

            // Verifica si el día es no laborable
            if (enfermero.diasLicencia.length >= 2) {
                const [inicioStr, finStr] = enfermero.diasLicencia.map(formatToComparable); // Convertir a formato comparable [AAAA-MM-DD]
                const fechaComparable = formatToComparable(fechaActual);
                if (fechaComparable >= inicioStr && fechaComparable <= finStr) {
                    return 'L';
                }
            }
            
            return enfermero.turno;
        });
    });
};

// los protegidos son los enfermeros que si o si tienen franco los fines de semana y feriados
const protegidos = [26, 27]; //se les dice "protegidos" porque hacen lo que se conoce como "tareas livianas"

const asignarFrancos = (anio, mes) => {

    let { diasTotales, diasFinde, diasFeriados, diasEntreS, diasNoLaborables } = obtenerDiasNoLaborables(anio, mes);

    // asignar la cantidad de francos que le corresponden a cada enfermero
    enfermeros.forEach(enfermero => {
        if (enfermero.horasLaborales === 40) {
            enfermero.francos.push(diasNoLaborables.length);
        } else {
            enfermero.francos.push(diasNoLaborables.length - 2);
        }
    });

    

    return enfermeros.map(enfermero => {
        let matriz = Array(diasTotales).fill('');
        
        // Asignar días feriados y fines de semana como francos a los enfermeros protegidos 
        for (let dia = 1; dia <= diasTotales; dia++) {

            // Si es protegido y es feriado o finde => Franco
            if (protegidos.includes(enfermero.id) && (diasFinde.includes(dia) || diasFeriados.includes(dia))) {
                if (enfermero.francos[0] > 0) {
                    matriz[dia - 1] = 'F';
                    enfermero.francos[0]--;
                }
            }
        }

        // Franco en dos fines de semana completos (sábado + domingo)
        const diasSD = [];
        for (let dia of diasFinde) {
            const fecha = new Date(anio, mes - 1, dia);
            const fechaMasUno = new Date(anio, mes - 1, dia + 1);
        
            const esSabado = fecha.getDay() === 6;
            const esDomingoSiguiente = fechaMasUno.getDay() === 0 && fechaMasUno.getMonth() === (mes - 1);
        
            if (esSabado && esDomingoSiguiente) {
                diasSD.push([dia, dia + 1]);
            }
        }

        
        diasSD.sort(() => Math.random() - 0.5); // aleatoriza los fines de semana
        matriz[diasSD[0][0] - 1] = 'F';
        matriz[diasSD[0][1] - 1] = 'F';
        matriz[diasSD[1][0] - 1] = 'F';
        matriz[diasSD[1][1] - 1] = 'F';
        enfermero.francos[0] -= 4;

        diasEntreS.map(semana => semana.sort(() => Math.random() - 0.5));
        diasEntreS.sort(() => Math.random() - 0.5);

        //Franco en días entre semana
        let contF = 1;
        while (enfermero.francos[0] > 0) { 
            for (let semana of diasEntreS) {
                if (enfermero.francos[0] <= 0) break; 
                if (matriz[semana[0] - 1] === 'F') {
                    matriz[semana[contF] - 1] = 'F'; 
                    contF++;
                }
                matriz[semana[0] - 1] = 'F'; 
                enfermero.francos[0]--; 
            }
        }

        return matriz;
    });
};

// Fusiona las matrices de turnos y licencias
function matrizFusionada(matrizTurnos, matrizLicencias) {
    return matrizTurnos.map((fila, i) =>
        fila.map((turno, j) => {
        const licencia = matrizLicencias[i]?.[j];
        // Si hay una licencia 'F' y el turno no es 'L', se reemplaza por 'F'
        if (licencia === 'F' && turno !== 'L') {
            return 'F';
        }
            return turno;
        })
    );
}

// Transponer Matriz (convertir filas en columnas y viceversa)
function transponerMatriz(matriz) {
    return matriz[0].map((_, i) => matriz.map(fila => fila[i])); 
}

//
function planificarNoches(matrizTranspuesta) {
    let matriz = [];
    const nochesMinimas = 3;
    const nochesMaximas = 5;
    const nochesTotales = new Array(enfermeros.length).fill(0);
    
    // Identificar enfermeros que pueden hacer noche (tienen N en horarioRotativo)
    const enfermerosNocturnos = enfermeros.map((enfermero, index) => ({
        index,
        id: enfermero.id,
        puedeNoche: enfermero.horarioRotativo && enfermero.horarioRotativo.includes('N')
    })).filter(e => e.puedeNoche);

    matrizTranspuesta.forEach(dia => {
        let cont_M = [];
        let cont_T = [];
        let cont_N = [];
        let cont_F = [];
        let cont_L = [];
        let rotativosDisponibles = [];
        let i = 0;
        
        // Contar turnos actuales y verificar disponibilidad para noche
        dia.forEach(turno => {
            const enfermero = enfermeros[i];
            if (turno === 'M') {
                cont_M.push({id: enfermero.id, index: i});
                if (enfermero.horarioRotativo && enfermero.horarioRotativo.includes('N')) {
                    rotativosDisponibles.push({
                        id: enfermero.id, 
                        index: i, 
                        noches: nochesTotales[i],
                        turnoActual: 'M'
                    });
                }
            } else if (turno === 'T') {
                cont_T.push({id: enfermero.id, index: i});
                if (enfermero.horarioRotativo && enfermero.horarioRotativo.includes('N')) {
                    rotativosDisponibles.push({
                        id: enfermero.id, 
                        index: i, 
                        noches: nochesTotales[i],
                        turnoActual: 'T'
                    });
                }
            } else if (turno === 'N') {
                cont_N.push({id: enfermero.id, index: i});
                nochesTotales[i]++;
            } else if (turno === 'F') {
                cont_F.push({id: enfermero.id, index: i});
            } else if (turno === 'L') {
                cont_L.push({id: enfermero.id, index: i});
            }
            i++;
        });

        // Ordenar rotativos disponibles por cantidad de noches (menor a mayor)
        rotativosDisponibles.sort((a, b) => a.noches - b.noches);

        // Asignar noches priorizando enfermeros con menos noches totales
        while (cont_N.length < 4 && rotativosDisponibles.length > 0) {
            const candidato = rotativosDisponibles[0];
            
            // Verificar si el enfermero no excederá el máximo de noches
            if (nochesTotales[candidato.index] < nochesMaximas) {
                // Remover de su turno actual
                if (candidato.turnoActual === 'M') {
                    const index = cont_M.findIndex(e => e.id === candidato.id);
                    if (index !== -1) cont_M.splice(index, 1);
                } else {
                    const index = cont_T.findIndex(e => e.id === candidato.id);
                    if (index !== -1) cont_T.splice(index, 1);
                }
                
                // Asignar a noche
                cont_N.push({id: candidato.id, index: candidato.index});
                nochesTotales[candidato.index]++;
            }
            
            rotativosDisponibles.shift();
        }

        // Asignar turnos en la matriz final
        let diaMatriz = Array(enfermeros.length).fill('');
        cont_M.forEach(({index}) => diaMatriz[index] = 'M');
        cont_T.forEach(({index}) => diaMatriz[index] = 'T');
        cont_N.forEach(({index}) => diaMatriz[index] = 'N');
        cont_F.forEach(({index}) => diaMatriz[index] = 'F');
        cont_L.forEach(({index}) => diaMatriz[index] = 'L');

        matriz.push(diaMatriz);
    });

    // Asegurar mínimo de noches por enfermero
    const matrizResultado = transponerMatriz(matriz);
    
    // Para cada enfermero que puede hacer noche y no alcanzó el mínimo
    enfermerosNocturnos.forEach(enfermeroNocturno => {
        const nochesActuales = nochesTotales[enfermeroNocturno.index];
        if (nochesActuales < nochesMinimas) {
            const nochesNecesarias = nochesMinimas - nochesActuales;
            let nochesAgregadas = 0;
            
            // Buscar días donde podemos agregar noches
            matriz.forEach((dia, diaIndex) => {
                if (nochesAgregadas >= nochesNecesarias) return;
                
                const turnoActual = dia[enfermeroNocturno.index];
                if ((turnoActual === 'M' || turnoActual === 'T') && 
                    dia.filter(t => t === 'N').length < 4) {
                    dia[enfermeroNocturno.index] = 'N';
                    nochesAgregadas++;
                }
            });
        }
    });

    return matrizResultado;
}

/**
    Generador de turnos para enfermeros en un mes específico.
    @param {number} anio - Año del calendario.
    @param {number} mes - Mes del calendario (1-12).
    @param {number} maxNochesPorMes - Máximo de noches por enfermero por mes (opcional, por defecto 5).
    @returns {Array} Matriz de turnos generada.
**/
export function generadorTurnos(anio, mes, maxNochesPorMes = 5) {
    restaurarEnfermeros();

    // Inicializar arrays de enfermeros por turno
    let enfermeros_M = [];
    let enfermeros_T = [];
    let enfermeros_N = [];

    // Separar los enfermeros por turnos
    enfermeros.forEach(enfermero => {
        if (!protegidos.includes(enfermero.id) && enfermero.turno === 'M') {
            enfermeros_M.push(enfermero.id);
        } else if (!protegidos.includes(enfermero.id) && enfermero.turno === 'T') {
            enfermeros_T.push(enfermero.id);
        } else if (!protegidos.includes(enfermero.id) && enfermero.turno === 'N') {
            enfermeros_N.push(enfermero.id);
        }
    });

    // Aleatorizar los grupos
    enfermeros_M.sort(() => Math.random() - 0.5);
    enfermeros_T.sort(() => Math.random() - 0.5);
    enfermeros_N.sort(() => Math.random() - 0.5);

    const turnos = generarMatrizTurnos(anio, mes);
    const francos = asignarFrancos(anio, mes);
    const matrizFusionadaV = matrizFusionada(turnos, francos);
    const matrizTranspuesta = transponerMatriz(matrizFusionadaV);  
    const matrizFinal = planificarNoches(matrizTranspuesta);

    // Reequilibrar los turnos incluyendo el límite de noches por enfermero
    return reequilibrarTurnos(matrizFinal, anio, mes, undefined, undefined, maxNochesPorMes);
}

/**
 * Función para reequilibrar la distribución de enfermeros entre días con exceso y déficit
 * @param {Array} matrizTurnos - Matriz final generada por generadorTurnos(anio, mes)
 * @param {number} anio - Año del calendario
 * @param {number} mes - Mes del calendario (1-12)
 * @param {Object} minimos - Mínimos requeridos por turno para días de semana
 * @param {Object} minimosFinDeSemana - Mínimos requeridos por turno para fines de semana (opcional)
 * @param {number} maxNochesPorMes - Máximo de noches por enfermero por mes (opcional)
 * @returns {Array} Matriz de turnos reequilibrada
 */
export function reequilibrarTurnos(matrizTurnos, anio, mes, minimos = {M: 6, T: 6, N: 4}, minimosFinDeSemana = {M: 4, T: 4, N: 4}, maxNochesPorMes = 5) {
    // Crear copia de la matriz para no modificar la original
    const matrizCopia = JSON.parse(JSON.stringify(matrizTurnos));
    
        // Función para equilibrar noches por enfermero
    const equilibrarNochesPorEnfermero = (matriz) => {
        const nochesEnfermero = new Array(matriz.length).fill(0);
        const matrizTranspuesta = transponerMatriz(matriz);

        // Contar noches actuales por enfermero
        matriz.forEach((enfermero, enfIndex) => {
            enfermero.forEach(turno => {
                if (turno === 'N') nochesEnfermero[enfIndex]++;
            });
        });

        // Para cada día, revisar y ajustar si es necesario
        matrizTranspuesta.forEach((dia, diaIndex) => {
            const enfermerosConExceso = [];
            const enfermerosDisponibles = [];

            // Identificar enfermeros con exceso de noches y posibles reemplazos
            dia.forEach((turno, enfIndex) => {
                const enfermero = enfermeros[enfIndex];
                const puedeHacerNoche = enfermero.horarioRotativo && enfermero.horarioRotativo.includes('N');

                if (turno === 'N' && nochesEnfermero[enfIndex] > maxNochesPorMes) {
                    enfermerosConExceso.push(enfIndex);
                } else if (turno !== 'N' && turno !== 'F' && turno !== 'L' && 
                        puedeHacerNoche && nochesEnfermero[enfIndex] < maxNochesPorMes) {
                    // Verificar que el enfermero pueda rotar desde su turno actual
                    const turnoActual = turno;
                    if (enfermero.horarioRotativo.includes(turnoActual)) {
                        enfermerosDisponibles.push({
                            index: enfIndex,
                            turnoActual: turnoActual
                        });
                    }
                }
            });

            // Realizar intercambios necesarios
            enfermerosConExceso.forEach(excesoIndex => {
                if (enfermerosDisponibles.length > 0) {
                    const disponible = enfermerosDisponibles.shift();
                    const enfermeroExceso = enfermeros[excesoIndex];
                    
                    // Verificar que ambos enfermeros puedan hacer el intercambio según sus horarios rotativos
                    if (enfermeroExceso.horarioRotativo.includes(disponible.turnoActual)) {
                        matriz[disponible.index][diaIndex] = 'N';
                        matriz[excesoIndex][diaIndex] = disponible.turnoActual;
                        
                        // Actualizar contadores
                        nochesEnfermero[excesoIndex]--;
                        nochesEnfermero[disponible.index]++;
                    }
                }
            });
        });

        return matriz;
    };

    // Transponer la matriz para trabajar con días como filas
    const matrizPorDias = transponerMatriz(matrizCopia);
    const diasTotales = matrizPorDias.length;
    
    // Analizar cada día para determinar déficit y exceso
    const analisisDias = [];
    
    for (let dia = 0; dia < diasTotales; dia++) {
        const fecha = new Date(anio, mes - 1, dia + 1);
        const esFinDeSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
const feriadosDelMes = feriados(anio);
        const esFeriado = feriadosDelMes.some(f => {
            const [, fechaMes, fechaDia] = f.fecha.split('-').map(Number);
            return fechaMes === mes && fechaDia === dia + 1;
        });
        const minimosActuales = (esFinDeSemana || esFeriado) ? minimosFinDeSemana : minimos;
        
        // Contar enfermeros por turno en este día
        let conteoTurnos = {M: 0, T: 0, N: 0, F: 0, L: 0};
        matrizPorDias[dia].forEach(turno => {
            if (turno in conteoTurnos) {
                conteoTurnos[turno]++;
            }
        });
        
        // Calcular déficit o exceso por turno usando los mínimos correspondientes
        const deficitExceso = {
            M: conteoTurnos.M - minimosActuales.M,
            T: conteoTurnos.T - minimosActuales.T,
            N: conteoTurnos.N - minimosActuales.N
        };
        
        analisisDias.push({
            dia: dia + 1,
            conteoTurnos,
            deficitExceso,
            esFinDeSemana
        });
    }

    // Primero identificar días entre semana con exceso para posibles intercambios
    const diasEntreSemanaConExceso = analisisDias
        .filter(d => !d.esFinDeSemana && 
            (d.deficitExceso.M > 0 || d.deficitExceso.T > 0 || d.deficitExceso.N > 0))
        .sort((a, b) => {
            const excesoA = Math.max(a.deficitExceso.M, a.deficitExceso.T, a.deficitExceso.N);
            const excesoB = Math.max(b.deficitExceso.M, b.deficitExceso.T, b.deficitExceso.N);
            return excesoB - excesoA;
        });

    // Procesar fines de semana con déficit primero
    const finesDeSemanaCriticos = analisisDias
        .filter(d => d.esFinDeSemana && 
            (d.deficitExceso.M < 0 || d.deficitExceso.T < 0 || d.deficitExceso.N < 0))
        .sort((a, b) => {
            const deficitA = Math.min(a.deficitExceso.M, a.deficitExceso.T, a.deficitExceso.N);
            const deficitB = Math.min(b.deficitExceso.M, b.deficitExceso.T, b.deficitExceso.N);
            return deficitA - deficitB;
        });

    // Intentar resolver los déficits de fines de semana
    for (const diaFinDeSemana of finesDeSemanaCriticos) {
        const turnosConDeficit = ['M', 'T', 'N']
            .filter(turno => diaFinDeSemana.deficitExceso[turno] < 0)
            .sort((a, b) => diaFinDeSemana.deficitExceso[a] - diaFinDeSemana.deficitExceso[b]);

        for (const turnoDeficit of turnosConDeficit) {
            const deficit = Math.abs(diaFinDeSemana.deficitExceso[turnoDeficit]);
            let cambiosRealizados = 0;

            // Buscar enfermeros con Franco en el fin de semana que puedan trabajar
            matrizPorDias[diaFinDeSemana.dia - 1].forEach((turno, enfermeroIndex) => {
                if (cambiosRealizados >= deficit) return;
                
                if (turno === 'F' && enfermeros[enfermeroIndex].horarioRotativo.includes(turnoDeficit)) {
                    // Buscar un día entre semana con exceso para intercambiar
                    for (const diaEntreSemana of diasEntreSemanaConExceso) {
                        if (matrizPorDias[diaEntreSemana.dia - 1][enfermeroIndex] === turnoDeficit &&
                            diaEntreSemana.deficitExceso[turnoDeficit] > 0) {
                            // Realizar el intercambio
                            matrizPorDias[diaFinDeSemana.dia - 1][enfermeroIndex] = turnoDeficit;
                            matrizPorDias[diaEntreSemana.dia - 1][enfermeroIndex] = 'F';
                            
                            // Actualizar conteos
                            diaFinDeSemana.deficitExceso[turnoDeficit]++;
                            diaFinDeSemana.conteoTurnos[turnoDeficit]++;
                            diaFinDeSemana.conteoTurnos.F--;
                            
                            diaEntreSemana.deficitExceso[turnoDeficit]--;
                            diaEntreSemana.conteoTurnos[turnoDeficit]--;
                            diaEntreSemana.conteoTurnos.F++;
                            
                            cambiosRealizados++;
                            break;
                        }
                    }
                }
            });
        }
    }

    // Procesar el resto de los días con déficit
    const otrosDiasConDeficit = analisisDias
        .filter(d => !d.esFinDeSemana && 
            (d.deficitExceso.M < 0 || d.deficitExceso.T < 0 || d.deficitExceso.N < 0))
        .sort((a, b) => {
            const deficitA = Math.min(a.deficitExceso.M, a.deficitExceso.T, a.deficitExceso.N);
            const deficitB = Math.min(b.deficitExceso.M, b.deficitExceso.T, b.deficitExceso.N);
            return deficitA - deficitB;
        });

    // Procesar el resto de días con déficit usando la lógica original
    for (const diaDeficit of otrosDiasConDeficit) {
        const turnosConDeficit = ['M', 'T', 'N']
            .filter(turno => diaDeficit.deficitExceso[turno] < 0)
            .sort((a, b) => diaDeficit.deficitExceso[a] - diaDeficit.deficitExceso[b]);

        if (turnosConDeficit.length === 0) continue;

        for (const turnoDeficit of turnosConDeficit) {
            const deficit = Math.abs(diaDeficit.deficitExceso[turnoDeficit]);
            let enfermerosCambiados = 0;

            for (const diaExceso of diasEntreSemanaConExceso) {
                if (enfermerosCambiados >= deficit) break;
                if (diaExceso.dia === diaDeficit.dia) continue;

                const enfermeroIds = [];
                matrizPorDias[diaExceso.dia - 1].forEach((turno, index) => {
                    if (turno === turnoDeficit && enfermeros[index].horarioRotativo.length > 0) {
                        enfermeroIds.push({ index, id: enfermeros[index].id });
                    }
                });

                if (diaExceso.deficitExceso[turnoDeficit] <= 0) continue;

                enfermeroIds.sort(() => Math.random() - 0.5);

                const disponiblesParaCambio = Math.min(
                    enfermeroIds.length,
                    diaExceso.deficitExceso[turnoDeficit],
                    deficit - enfermerosCambiados
                );

                for (let i = 0; i < disponiblesParaCambio; i++) {
                    const enfermeroIndex = enfermeroIds[i].index;

                    if (matrizPorDias[diaDeficit.dia - 1][enfermeroIndex] === 'F' ||
                        matrizPorDias[diaDeficit.dia - 1][enfermeroIndex] === 'L') {
                        continue;
                    }

                    matrizPorDias[diaExceso.dia - 1][enfermeroIndex] = 'F';
                    matrizPorDias[diaDeficit.dia - 1][enfermeroIndex] = turnoDeficit;

                    enfermerosCambiados++;
                    diaExceso.deficitExceso[turnoDeficit]--;
                    diaExceso.conteoTurnos[turnoDeficit]--;
                    diaExceso.conteoTurnos.F++;

                    if (diaExceso.deficitExceso[turnoDeficit] <= 0) break;
                }
            }
        }
    }

    // Después de todos los reequilibrios, aplicar el límite de noches por enfermero
    const matrizReequilibrada = transponerMatriz(matrizPorDias);
    const matrizFinal = equilibrarNochesPorEnfermero(matrizReequilibrada);

    return matrizFinal;
}