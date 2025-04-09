import { readFileSync, writeFileSync } from 'fs';

// Cargar enfermeros desde el JSON
const enfermeros = JSON.parse(readFileSync('enfermeros.json'));
if (!enfermeros || enfermeros.length === 0) {
    throw new Error("No se encontraron datos de enfermeros");
}

// Cargar feriados desde el JSON
const feriados = (anio) => {
    const feriados = JSON.parse(readFileSync(`feriados/feriados_${anio}.json`));
    return feriados;
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
        diasNoLaborales: [...new Set([...diasFinde, ...diasFeriados])].sort((a, b) => a - b)
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
let protegidos = [26, 27]; //se les dice "protegidos" porque hacen lo que se conoce como "tareas livianas"
let enfermeros_M = []
let enfermeros_T = []
let enfermeros_N = []

// separa los enfermeros por turnos. 
enfermeros.forEach(enfermero => {
    if (!protegidos.includes(enfermero.id) && enfermero.turno === 'M') {
        enfermeros_M.push(enfermero.id);
    } else if (!protegidos.includes(enfermero.id) && enfermero.turno === 'T') {
        enfermeros_T.push(enfermero.id);
    } else if (!protegidos.includes(enfermero.id) && enfermero.turno === 'N') {
        enfermeros_N.push(enfermero.id);
    }
});

//divido los grupos de enfermeros en dos, pero primero los aleatorizo
enfermeros_M = enfermeros_M.sort(() => Math.random() - 0.5);
enfermeros_T = enfermeros_T.sort(() => Math.random() - 0.5);
enfermeros_N = enfermeros_N.sort(() => Math.random() - 0.5);


const asignarFrancos = (anio, mes) => {

    let { diasTotales, diasFinde, diasFeriados, diasEntreS, diasNoLaborales } = obtenerDiasNoLaborables(anio, mes);

    // asignar la cantidad de francos que le corresponden a cada enfermero
    enfermeros.forEach(enfermero => {
        if (enfermero.horasLaborales === 40) {
            enfermero.francos.push(diasNoLaborales.length);
        } else {
            enfermero.francos.push(diasNoLaborales.length - 2);
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
        while (enfermero.francos[0] > 0) { // si ya no tiene francos, salir del bucle
            for (let semana of diasEntreS) {
                if (enfermero.francos[0] <= 0) break; // si ya no tiene francos, salir del bucle
                if (matriz[semana[0] - 1] === 'F') {
                    matriz[semana[contF] - 1] = 'F'; // asignar franco
                    contF++;
                }
                matriz[semana[0] - 1] = 'F'; // asignar franco
                enfermero.francos[0]--; // restar un franco
            }
        }

        return matriz;
    });
};

// uso de la función
try {
    const turnos = generarMatrizTurnos(2025, 4);
    const francos = asignarFrancos(2025, 4);
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

    console.log(matrizFusionada(turnos, francos));
    writeFileSync('matriz_fusion.json', JSON.stringify(matrizFusionada(turnos, francos), null, 2));

} catch (error) {
    console.error("Error:", error.message);
}
