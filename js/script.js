// Clase principal de la aplicación
class CalculadoraInversiones {
    constructor() {
        this.inversiones = this.cargarDatos('inversiones') || [];
        this.calculos4x1000 = this.cargarDatos('calculos4x1000') || [];
        this.calculosFechas = this.cargarDatos('calculosFechas') || [];
        this.init();
    }

    init() {
        this.actualizarDateTime();
        this.configurarEventos();
        this.cargarTablas();
        
        // Actualizar fecha/hora cada minuto
        setInterval(() => this.actualizarDateTime(), 60000);
    }

    // Actualizar fecha y hora en el header
    actualizarDateTime() {
        const ahora = new Date();
        const opciones = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        document.getElementById('datetime').textContent = 
            ahora.toLocaleDateString('es-ES', opciones);
    }

    // Configurar eventos de formularios
    configurarEventos() {
        // Formulario de inversión
        document.getElementById('inversionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calcularInversion();
        });

        // Formulario 4x1000
        document.getElementById('cuatroMilForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calcular4x1000();
        });

        // Formulario de fechas
        document.getElementById('fechaForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarCalculoFecha();
        });

        // Calculadora de fechas en tiempo real
        document.getElementById('fechaBase').addEventListener('change', () => {
            this.calcularFecha();
        });
        document.getElementById('diasSumar').addEventListener('input', () => {
            this.calcularFecha();
        });

        // Botones de limpiar
        document.getElementById('clearInversiones').addEventListener('click', () => {
            this.limpiarTabla('inversiones');
        });
        document.getElementById('clear4x1000').addEventListener('click', () => {
            this.limpiarTabla('calculos4x1000');
        });
        document.getElementById('clearFechas').addEventListener('click', () => {
            this.limpiarTabla('calculosFechas');
        });

        // Configurar formateo de campos numéricos en tiempo real
        this.configurarCamposNumericos();

        // Configurar ordenamiento de tablas
        this.configurarOrdenamientoTablas();

        // Configurar modales
        this.configurarModales();

        // Configurar eventos de limpiar modal
        this.configurarEventosModal();

        // Configurar eventos de filtros
        this.configurarEventosFiltros();

        // Configurar toggle de filtros
        this.configurarToggleFiltros();

        // Establecer fecha actual por defecto
        document.getElementById('fechaBase').value = 
            new Date().toISOString().split('T')[0];
    }

    // Configurar campos numéricos con separadores de miles en tiempo real
    configurarCamposNumericos() {
        const campos = ['valorInvertir', 'valor4x1000'];
        
        campos.forEach(campoId => {
            const campo = document.getElementById(campoId);
            if (campo) {
                // Formatear en tiempo real mientras escribe
                campo.addEventListener('input', (e) => {
                    let valor = e.target.value;
                    let posicionCursor = e.target.selectionStart;
                    
                    // Limpiar caracteres no numéricos excepto punto
                    const valorSinFormato = valor.replace(/[^\d]/g, '');
                    
                    if (valorSinFormato.length > 0) {
                        // Contar puntos antes del formato
                        const puntosAntes = (valor.slice(0, posicionCursor).match(/\./g) || []).length;
                        
                        // Aplicar formato con separadores de miles
                        const valorFormateado = this.formatearConSeparadores(valorSinFormato);
                        
                        // Contar puntos después del formato hasta la posición del cursor
                        const puntosDesp = (valorFormateado.slice(0, posicionCursor + (valorFormateado.length - valor.length)).match(/\./g) || []).length;
                        
                        e.target.value = valorFormateado;
                        
                        // Calcular nueva posición del cursor
                        let nuevaPosicion = posicionCursor + (puntosDesp - puntosAntes);
                        nuevaPosicion = Math.max(0, Math.min(nuevaPosicion, valorFormateado.length));
                        
                        // Restaurar posición del cursor
                        setTimeout(() => {
                            e.target.setSelectionRange(nuevaPosicion, nuevaPosicion);
                        }, 0);
                    } else {
                        e.target.value = '';
                    }
                });

                // Solo formatear al perder el foco si no está formateado
                campo.addEventListener('blur', (e) => {
                    const valor = e.target.value;
                    if (valor && !valor.includes('.')) {
                        const valorLimpio = valor.replace(/\D/g, '');
                        if (valorLimpio) {
                            e.target.value = this.formatearConSeparadores(valorLimpio);
                        }
                    }
                });

                // Permitir selección completa al hacer foco
                campo.addEventListener('focus', (e) => {
                    setTimeout(() => {
                        e.target.select();
                    }, 0);
                });
            }
        });
    }

    // Limpiar separadores de un número para cálculos
    limpiarNumero(valor) {
        return valor.toString().replace(/\D/g, '');
    }

    // Formatear número con separadores de miles para campos de entrada
    formatearConSeparadores(numero) {
        // Asegurar que el número sea válido
        let num;
        if (typeof numero === 'string') {
            num = numero; // Mantener como string para números muy grandes
        } else {
            num = numero.toString();
        }
        
        if (!num || isNaN(parseFloat(num))) return '';
        
        // Agregar puntos cada 3 dígitos desde la derecha
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // Calcular inversión
    calcularInversion() {
        const entidad = document.getElementById('entidad').value;
        const valorInvertir = parseFloat(this.limpiarNumero(document.getElementById('valorInvertir').value));
        const tasaEfectiva = parseFloat(document.getElementById('tasaEfectiva').value);
        const plazoDias = parseInt(document.getElementById('plazoDias').value);
        const reteFuente = parseFloat(document.getElementById('reteFuente').value) || 0;
        const aplica4x1000 = document.getElementById('aplica4x1000').value === 'si';

        // Cálculos
        const tasaDiaria = Math.pow(1 + (tasaEfectiva / 100), 1/360) - 1;
        const rentabilidad = valorInvertir * (Math.pow(1 + tasaDiaria, plazoDias) - 1);
        const valorReteFuente = rentabilidad * (reteFuente / 100);
        const valor4x1000 = aplica4x1000 ? (rentabilidad * 0.004) : 0;
        const rentabilidadTotal = rentabilidad - valorReteFuente - valor4x1000;
        const valorFinalNeto = valorInvertir + rentabilidadTotal;

        const inversion = {
            id: Date.now(),
            entidad,
            valorInvertido: Math.round(valorInvertir),
            tasaEA: tasaEfectiva,
            dias: plazoDias,
            rentabilidad: Math.round(rentabilidad),
            reteFuente: Math.round(valorReteFuente),
            rentabilidadSinReteFuente: Math.round(rentabilidad - valorReteFuente),
            cuatroMil: Math.round(valor4x1000),
            rentabilidadTotal: Math.round(rentabilidadTotal),
            valorFinal: Math.round(valorFinalNeto)
        };

        this.inversiones.push(inversion);
        this.guardarDatos('inversiones', this.inversiones);
        this.cargarTablaInversiones();
        
        // Limpiar formulario
        document.getElementById('inversionForm').reset();
        document.getElementById('reteFuente').value = '4';
        document.getElementById('aplica4x1000').value = 'si';
    }

    // Calcular 4x1000
    calcular4x1000() {
        const valor = parseFloat(this.limpiarNumero(document.getElementById('valor4x1000').value));
        
        const valor4x1000 = valor * 0.004;
        const valorTotal = valor - valor4x1000;
        const valorTransferir = valor + valor4x1000;

        const calculo = {
            id: Date.now(),
            valor: Math.round(valor),
            cuatroMil: Math.round(valor4x1000),
            valorTotal: Math.round(valorTotal),
            valorTransferir: Math.round(valorTransferir)
        };

        this.calculos4x1000.push(calculo);
        this.guardarDatos('calculos4x1000', this.calculos4x1000);
        this.cargarTabla4x1000();
        
        // Limpiar formulario
        document.getElementById('cuatroMilForm').reset();
    }

    // Calcular fecha
    calcularFecha() {
        const fechaBase = document.getElementById('fechaBase').value;
        const diasSumar = parseInt(document.getElementById('diasSumar').value) || 0;

        if (fechaBase) {
            const fecha = new Date(fechaBase);
            fecha.setDate(fecha.getDate() + diasSumar);
            
            const resultado = fecha.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            document.getElementById('fechaResultado').textContent = resultado;
        }
    }

    // Guardar cálculo de fecha
    guardarCalculoFecha() {
        const fechaBase = document.getElementById('fechaBase').value;
        const diasSumar = parseInt(document.getElementById('diasSumar').value) || 0;

        if (fechaBase && diasSumar >= 0) {
            const fecha = new Date(fechaBase);
            fecha.setDate(fecha.getDate() + diasSumar);
            
            const fechaResultado = fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const calculo = {
                id: Date.now(),
                fechaBase: fechaBase,
                diasSumados: diasSumar,
                fechaResultado: fechaResultado
            };

            this.calculosFechas.push(calculo);
            this.guardarDatos('calculosFechas', this.calculosFechas);
            this.cargarTablaFechas();
            
            // Limpiar formulario
            document.getElementById('fechaForm').reset();
            document.getElementById('fechaBase').value = 
                new Date().toISOString().split('T')[0];
            document.getElementById('fechaResultado').textContent = '--';
        }
    }

    // Cargar todas las tablas
    cargarTablas() {
        this.cargarTablaInversiones();
        this.cargarTabla4x1000();
        this.cargarTablaFechas();
    }

    // Cargar tabla de inversiones
    cargarTablaInversiones() {
        // Actualizar opciones de filtros
        this.actualizarOpcionesFiltros();
        
        // Aplicar filtros
        this.aplicarFiltros();
    }

    // Actualizar opciones de filtros
    actualizarOpcionesFiltros() {
        const entidades = [...new Set(this.inversiones.map(inv => inv.entidad))].sort();
        const tasas = [...new Set(this.inversiones.map(inv => inv.tasaEA))].sort((a, b) => a - b);
        
        // Actualizar select de entidades
        const filtroEntidad = document.getElementById('filtroEntidad');
        if (filtroEntidad) {
            const valorActual = filtroEntidad.value;
            filtroEntidad.innerHTML = '<option value="">Todas</option>';
            entidades.forEach(entidad => {
                const option = document.createElement('option');
                option.value = entidad;
                option.textContent = entidad;
                if (entidad === valorActual) option.selected = true;
                filtroEntidad.appendChild(option);
            });
        }
        
        // Actualizar select de tasas
        const filtroTasa = document.getElementById('filtroTasa');
        if (filtroTasa) {
            const valorActual = filtroTasa.value;
            filtroTasa.innerHTML = '<option value="">Todas</option>';
            tasas.forEach(tasa => {
                const option = document.createElement('option');
                option.value = tasa;
                option.textContent = `${tasa}%`;
                if (tasa.toString() === valorActual) option.selected = true;
                filtroTasa.appendChild(option);
            });
        }
    }

    // Aplicar filtros a la tabla
    aplicarFiltros() {
        const tbody = document.querySelector('#tablaInversiones tbody');
        tbody.innerHTML = '';
        
        // Obtener valores de filtros
        const filtroEntidad = document.getElementById('filtroEntidad')?.value || '';
        const filtroTasa = document.getElementById('filtroTasa')?.value || '';
        const filtroValorMin = this.limpiarNumero(document.getElementById('filtroValorMin')?.value || '0') || 0;
        const filtroValorMax = this.limpiarNumero(document.getElementById('filtroValorMax')?.value || '') || Infinity;
        const filtroDiasMin = parseInt(document.getElementById('filtroDiasMin')?.value || '0') || 0;
        const filtroDiasMax = parseInt(document.getElementById('filtroDiasMax')?.value || '') || Infinity;
        
        // Filtrar datos
        const inversionesFiltradas = this.inversiones.filter(inversion => {
            const cumpleEntidad = !filtroEntidad || inversion.entidad === filtroEntidad;
            const cumpleTasa = !filtroTasa || inversion.tasaEA.toString() === filtroTasa;
            const cumpleValorMin = inversion.valorInvertido >= filtroValorMin;
            const cumpleValorMax = inversion.valorInvertido <= filtroValorMax;
            const cumpleDiasMin = inversion.dias >= filtroDiasMin;
            const cumpleDiasMax = inversion.dias <= filtroDiasMax;
            
            return cumpleEntidad && cumpleTasa && cumpleValorMin && cumpleValorMax && cumpleDiasMin && cumpleDiasMax;
        });
        
        // Calcular totales de datos filtrados
        let totales = {
            valorInvertido: 0,
            rentabilidad: 0,
            reteFuente: 0,
            rentabilidadSinReteFuente: 0,
            cuatroMil: 0,
            rentabilidadTotal: 0,
            valorFinal: 0
        };

        inversionesFiltradas.forEach(inversion => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${inversion.entidad}</td>
                <td>$${this.formatearNumero(inversion.valorInvertido, false)}</td>
                <td>${inversion.tasaEA}%</td>
                <td>${inversion.dias}</td>
                <td class="profit-positive">$${this.formatearNumero(inversion.rentabilidad, false)}</td>
                <td>$${this.formatearNumero(inversion.reteFuente, false)}</td>
                <td class="profit-positive">$${this.formatearNumero(inversion.rentabilidadSinReteFuente || (inversion.rentabilidad - inversion.reteFuente), false)}</td>
                <td>$${this.formatearNumero(inversion.cuatroMil || 0, false)}</td>
                <td class="profit-positive">$${this.formatearNumero(inversion.rentabilidadTotal, false)}</td>
                <td>$${this.formatearNumero(inversion.valorFinal, false)}</td>
                <td><button class="btn-delete" onclick="app.eliminarInversion(${inversion.id})">🗑️</button></td>
            `;
            tbody.appendChild(fila);

            // Sumar totales
            totales.valorInvertido += inversion.valorInvertido || 0;
            totales.rentabilidad += inversion.rentabilidad || 0;
            totales.reteFuente += inversion.reteFuente || 0;
            totales.rentabilidadSinReteFuente += inversion.rentabilidadSinReteFuente || (inversion.rentabilidad - inversion.reteFuente) || 0;
            totales.cuatroMil += inversion.cuatroMil || 0;
            totales.rentabilidadTotal += inversion.rentabilidadTotal || 0;
            totales.valorFinal += inversion.valorFinal || 0;
        });

        // Agregar fila de totales si hay datos filtrados
        if (inversionesFiltradas.length > 0) {
            const filaTotales = document.createElement('tr');
            filaTotales.style.backgroundColor = '#f1f5f9';
            filaTotales.style.fontWeight = 'bold';
            filaTotales.style.borderTop = '2px solid #334155';
            filaTotales.innerHTML = `
                <td style="font-weight: bold; color: #334155;">TOTALES</td>
                <td style="font-weight: bold; color: #334155;">$${this.formatearNumero(totales.valorInvertido, false)}</td>
                <td style="color: #64748b;">--</td>
                <td style="color: #64748b;">--</td>
                <td style="font-weight: bold; color: #16a34a;">$${this.formatearNumero(totales.rentabilidad, false)}</td>
                <td style="font-weight: bold; color: #334155;">$${this.formatearNumero(totales.reteFuente, false)}</td>
                <td style="font-weight: bold; color: #16a34a;">$${this.formatearNumero(totales.rentabilidadSinReteFuente, false)}</td>
                <td style="font-weight: bold; color: #334155;">$${this.formatearNumero(totales.cuatroMil, false)}</td>
                <td style="font-weight: bold; color: #16a34a;">$${this.formatearNumero(totales.rentabilidadTotal, false)}</td>
                <td style="font-weight: bold; color: #334155;">$${this.formatearNumero(totales.valorFinal, false)}</td>
                <td style="color: #64748b;">--</td>
            `;
            tbody.appendChild(filaTotales);
        }
    }
    
    // Limpiar filtros
    limpiarFiltros() {
        document.getElementById('filtroEntidad').value = '';
        document.getElementById('filtroTasa').value = '';
        document.getElementById('filtroValorMin').value = '';
        document.getElementById('filtroValorMax').value = '';
        document.getElementById('filtroDiasMin').value = '';
        document.getElementById('filtroDiasMax').value = '';
        this.aplicarFiltros();
    }

    // Cargar tabla de 4x1000
    cargarTabla4x1000() {
        const tbody = document.querySelector('#tabla4x1000 tbody');
        tbody.innerHTML = '';

        this.calculos4x1000.forEach(calculo => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>$${this.formatearNumero(calculo.valor || 0, false)}</td>
                <td>$${this.formatearNumero(calculo.cuatroMil || 0, false)}</td>
                <td>$${this.formatearNumero(calculo.valorTotal || 0, false)}</td>
                <td>$${this.formatearNumero(calculo.valorTransferir || 0, false)}</td>
                <td><button class="btn-delete" onclick="app.eliminarCalculo4x1000(${calculo.id})">🗑️</button></td>
            `;
            tbody.appendChild(fila);
        });
    }

    // Cargar tabla de fechas
    cargarTablaFechas() {
        const tbody = document.querySelector('#tablaFechas tbody');
        tbody.innerHTML = '';

        this.calculosFechas.forEach(calculo => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${new Date(calculo.fechaBase).toLocaleDateString('es-ES')}</td>
                <td>${calculo.diasSumados} días</td>
                <td>${calculo.fechaResultado}</td>
                <td><button class="btn-delete" onclick="app.eliminarCalculoFecha(${calculo.id})">🗑️</button></td>
            `;
            tbody.appendChild(fila);
        });
    }

    // Eliminar cálculo de fecha
    eliminarCalculoFecha(id) {
        this.calculosFechas = this.calculosFechas.filter(calc => calc.id !== id);
        this.guardarDatos('calculosFechas', this.calculosFechas);
        this.cargarTablaFechas();
    }

    // Eliminar inversión
    eliminarInversion(id) {
        this.inversiones = this.inversiones.filter(inv => inv.id !== id);
        this.guardarDatos('inversiones', this.inversiones);
        this.cargarTablaInversiones();
    }

    // Eliminar cálculo 4x1000
    eliminarCalculo4x1000(id) {
        this.calculos4x1000 = this.calculos4x1000.filter(calc => calc.id !== id);
        this.guardarDatos('calculos4x1000', this.calculos4x1000);
        this.cargarTabla4x1000();
    }

    // Limpiar tabla completa
    limpiarTabla(tipo) {
        Swal.fire({
            title: `¿Está seguro?`,
            text: `¿Desea eliminar todos los registros de ${tipo}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                if (tipo === 'inversiones') {
                    this.inversiones = [];
                    this.guardarDatos('inversiones', this.inversiones);
                    this.cargarTablaInversiones();
                } else if (tipo === 'calculos4x1000') {
                    this.calculos4x1000 = [];
                    this.guardarDatos('calculos4x1000', this.calculos4x1000);
                    this.cargarTabla4x1000();
                } else if (tipo === 'calculosFechas') {
                    this.calculosFechas = [];
                    this.guardarDatos('calculosFechas', this.calculosFechas);
                    this.cargarTablaFechas();
                }
                
                Swal.fire({
                    title: '¡Eliminado!',
                    text: `Todos los registros de ${tipo} han sido eliminados.`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    }

    // Formatear números para mostrar
    formatearNumero(numero, decimales = true) {
        // Asegurar que el número sea válido
        let num = numero;
        
        // Convertir a número si es string
        if (typeof numero === 'string') {
            num = parseFloat(numero);
        }
        
        // Si no es un número válido, retornar 0
        if (isNaN(num) || num === null || num === undefined) {
            num = 0;
        }
        
        // Redondear si no queremos decimales
        if (!decimales) {
            num = Math.round(num);
        }
        
        // Usar función personalizada para separadores de miles
        if (decimales) {
            return num.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } else {
            // Función personalizada para separadores de miles sin decimales
            const numStr = num.toString();
            const parts = numStr.split('.');
            const integerPart = parts[0];
            
            // Agregar puntos cada 3 dígitos desde la derecha
            const withSeparators = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            
            return withSeparators;
        }
    }

    // Guardar datos en localStorage
    guardarDatos(clave, datos) {
        localStorage.setItem(clave, JSON.stringify(datos));
    }

    // Cargar datos del localStorage
    cargarDatos(clave) {
        const datos = localStorage.getItem(clave);
        return datos ? JSON.parse(datos) : null;
    }

    // Configurar ordenamiento de tablas
    configurarOrdenamientoTablas() {
        const tablas = ['tablaInversiones', 'tabla4x1000', 'tablaFechas'];
        
        tablas.forEach(tablaId => {
            const tabla = document.getElementById(tablaId);
            if (tabla) {
                const cabeceras = tabla.querySelectorAll('th.sortable');
                
                cabeceras.forEach((cabecera, index) => {
                    cabecera.addEventListener('click', () => {
                        this.ordenarTabla(tablaId, index, cabecera.dataset.type);
                    });
                });
            }
        });
    }

    // Ordenar tabla por columna
    ordenarTabla(tablaId, columnIndex, dataType) {
        const tabla = document.getElementById(tablaId);
        const tbody = tabla.querySelector('tbody');
        const cabecera = tabla.querySelectorAll('th.sortable')[columnIndex];
        const todasLasFilas = Array.from(tbody.querySelectorAll('tr'));
        
        // Si no hay datos, salir
        if (todasLasFilas.length === 0) return;
        
        // Separar fila de totales de las filas de datos
        let filaTotales = null;
        const filasOrdenables = [];
        
        todasLasFilas.forEach(fila => {
            // Identificar fila de totales por el contenido de la primera celda
            const primeraCelda = fila.cells[0]?.textContent.trim();
            if (primeraCelda === 'TOTALES') {
                filaTotales = fila;
            } else {
                filasOrdenables.push(fila);
            }
        });
        
        // Si no hay filas ordenables, salir
        if (filasOrdenables.length === 0) return;
        
        // Determinar dirección de ordenamiento
        let esAscendente = true;
        if (cabecera.classList.contains('sort-asc')) {
            esAscendente = false;
        }
        
        // Limpiar iconos de ordenamiento anteriores
        tabla.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Agregar clase de ordenamiento actual
        cabecera.classList.add(esAscendente ? 'sort-asc' : 'sort-desc');
        
        // Ordenar solo las filas de datos
        filasOrdenables.sort((a, b) => {
            const cellA = a.cells[columnIndex];
            const cellB = b.cells[columnIndex];
            
            if (!cellA || !cellB) return 0;
            
            let valueA = cellA.textContent.trim();
            let valueB = cellB.textContent.trim();
            
            // Convertir valores según el tipo de dato
            switch (dataType) {
                case 'number':
                    // Limpiar formato de números (quitar puntos y símbolos)
                    valueA = parseFloat(valueA.replace(/[$.]/g, '').replace(/,/g, '.')) || 0;
                    valueB = parseFloat(valueB.replace(/[$.]/g, '').replace(/,/g, '.')) || 0;
                    break;
                    
                case 'date':
                    // Convertir fechas a timestamp
                    valueA = this.parsearFecha(valueA);
                    valueB = this.parsearFecha(valueB);
                    break;
                    
                case 'text':
                default:
                    // Mantener como texto, convertir a minúsculas para comparación
                    valueA = valueA.toLowerCase();
                    valueB = valueB.toLowerCase();
                    break;
            }
            
            // Comparar valores
            let resultado = 0;
            if (valueA < valueB) {
                resultado = -1;
            } else if (valueA > valueB) {
                resultado = 1;
            }
            
            // Invertir si es descendente
            return esAscendente ? resultado : -resultado;
        });
        
        // Limpiar tbody y reordenar
        tbody.innerHTML = '';
        
        // Agregar filas ordenadas
        filasOrdenables.forEach(fila => tbody.appendChild(fila));
        
        // Agregar fila de totales al final si existe
        if (filaTotales) {
            tbody.appendChild(filaTotales);
        }
    }

    // Parsear fecha para ordenamiento
    parsearFecha(fechaStr) {
        // Intentar varios formatos de fecha
        let fecha;
        
        // Formato DD/MM/YYYY
        if (fechaStr.includes('/')) {
            const partes = fechaStr.split('/');
            if (partes.length === 3) {
                fecha = new Date(partes[2], partes[1] - 1, partes[0]);
            }
        }
        // Formato YYYY-MM-DD
        else if (fechaStr.includes('-')) {
            fecha = new Date(fechaStr);
        }
        // Formato de fecha larga (ej: "lunes, 5 de enero de 2026")
        else {
            fecha = new Date(fechaStr);
        }
        
        // Si la fecha es inválida, retornar 0
        return fecha && !isNaN(fecha.getTime()) ? fecha.getTime() : 0;
    }

    // Configurar modales
    configurarModales() {
        // Formulario 4x1000 modal
        const form4x1000Modal = document.getElementById('cuatroMilModalForm');
        if (form4x1000Modal) {
            form4x1000Modal.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calcular4x1000Modal();
            });
        }

        // Formulario fechas modal
        const formFechasModal = document.getElementById('fechaModalForm');
        if (formFechasModal) {
            formFechasModal.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarCalculoFechaModal();
            });

            // Configurar cálculo en tiempo real para modal de fechas
            document.getElementById('fechaBaseModal').addEventListener('change', () => {
                this.calcularFechaModal();
            });
            document.getElementById('diasSumarModal').addEventListener('input', () => {
                this.calcularFechaModal();
            });
        }

        // Configurar formateo para campo modal de 4x1000
        const campoModal4x1000 = document.getElementById('valorModal4x1000');
        if (campoModal4x1000) {
            campoModal4x1000.addEventListener('input', (e) => {
                let valor = e.target.value;
                let posicionCursor = e.target.selectionStart;
                
                const valorSinFormato = valor.replace(/[^\d]/g, '');
                
                if (valorSinFormato.length > 0) {
                    const puntosAntes = (valor.slice(0, posicionCursor).match(/\./g) || []).length;
                    const valorFormateado = this.formatearConSeparadores(valorSinFormato);
                    const puntosDesp = (valorFormateado.slice(0, posicionCursor + (valorFormateado.length - valor.length)).match(/\./g) || []).length;
                    
                    e.target.value = valorFormateado;
                    let nuevaPosicion = posicionCursor + (puntosDesp - puntosAntes);
                    nuevaPosicion = Math.max(0, Math.min(nuevaPosicion, valorFormateado.length));
                    
                    setTimeout(() => {
                        e.target.setSelectionRange(nuevaPosicion, nuevaPosicion);
                    }, 0);
                } else {
                    e.target.value = '';
                }
            });
        }

        // Establecer fecha actual por defecto en modal
        const fechaBaseModal = document.getElementById('fechaBaseModal');
        if (fechaBaseModal) {
            fechaBaseModal.value = new Date().toISOString().split('T')[0];
        }
    }

    // Calcular 4x1000 en modal
    calcular4x1000Modal() {
        const valor = parseFloat(this.limpiarNumero(document.getElementById('valorModal4x1000').value));
        
        if (!valor || valor <= 0) {
            document.getElementById('resultado4x1000Modal').innerHTML = 
                '<span style="color: red;">Por favor ingrese un valor válido</span>';
            return;
        }

        const valor4x1000 = valor * 0.004;
        const valorTotal = valor - valor4x1000;
        const valorTransferir = valor + valor4x1000;

        // Guardar en datos principales
        const calculo = {
            id: Date.now(),
            valor: Math.round(valor),
            cuatroMil: Math.round(valor4x1000),
            valorTotal: Math.round(valorTotal),
            valorTransferir: Math.round(valorTransferir)
        };

        this.calculos4x1000.push(calculo);
        this.guardarDatos('calculos4x1000', this.calculos4x1000);
        this.cargarTabla4x1000();
        this.cargarTabla4x1000Modal(); // También actualizar modal

        // Mostrar resultado en modal
        document.getElementById('resultado4x1000Modal').innerHTML = `
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin-top: 10px;">
                <h4 style="color: #0369a1; margin-bottom: 10px;">Resultado del Cálculo:</h4>
                <p><strong>Valor:</strong> $${this.formatearNumero(valor, false)}</p>
                <p><strong>4x1000:</strong> $${this.formatearNumero(valor4x1000, false)}</p>
                <p><strong>Valor Total:</strong> $${this.formatearNumero(valorTotal, false)}</p>
                <p style="color: #16a34a;"><strong>Valor a Transferir:</strong> $${this.formatearNumero(valorTransferir, false)}</p>
            </div>
        `;

        // Limpiar formulario
        document.getElementById('cuatroMilModalForm').reset();
    }

    // Calcular fecha en modal
    calcularFechaModal() {
        const fechaBase = document.getElementById('fechaBaseModal').value;
        const diasSumar = parseInt(document.getElementById('diasSumarModal').value) || 0;

        if (fechaBase) {
            const fecha = new Date(fechaBase);
            fecha.setDate(fecha.getDate() + diasSumar);
            
            const resultado = fecha.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            document.getElementById('fechaResultadoModal').textContent = resultado;
        }
    }

    // Guardar cálculo de fecha desde modal
    guardarCalculoFechaModal() {
        const fechaBase = document.getElementById('fechaBaseModal').value;
        const diasSumar = parseInt(document.getElementById('diasSumarModal').value) || 0;

        if (fechaBase && diasSumar >= 0) {
            const fecha = new Date(fechaBase);
            fecha.setDate(fecha.getDate() + diasSumar);
            
            const fechaResultado = fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const calculo = {
                id: Date.now(),
                fechaBase: fechaBase,
                diasSumados: diasSumar,
                fechaResultado: fechaResultado
            };

            this.calculosFechas.push(calculo);
            this.guardarDatos('calculosFechas', this.calculosFechas);
            this.cargarTablaFechas();
            this.cargarTablaFechasModal(); // También actualizar modal
            
            // Limpiar formulario modal
            document.getElementById('fechaModalForm').reset();
            document.getElementById('fechaBaseModal').value = 
                new Date().toISOString().split('T')[0];
            document.getElementById('fechaResultadoModal').textContent = '--';

            // Mostrar mensaje de éxito
            Swal.fire({
                title: '¡Éxito!',
                text: 'Cálculo guardado exitosamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }
    }

    // Configurar eventos para botones de limpiar en modales
    configurarEventosModal() {
        // Botón limpiar 4x1000 modal
        const clear4x1000Modal = document.getElementById('clear4x1000Modal');
        if (clear4x1000Modal) {
            clear4x1000Modal.addEventListener('click', () => {
                this.limpiarTablaModal('calculos4x1000');
            });
        }

        // Botón limpiar fechas modal
        const clearFechasModal = document.getElementById('clearFechasModal');
        if (clearFechasModal) {
            clearFechasModal.addEventListener('click', () => {
                this.limpiarTablaModal('calculosFechas');
            });
        }
    }

    // Configurar toggle de filtros
    configurarToggleFiltros() {
        const toggleBtn = document.getElementById('toggleFiltros');
        const panelFiltros = document.getElementById('panelFiltros');
        
        if (toggleBtn && panelFiltros) {
            toggleBtn.addEventListener('click', () => {
                const isVisible = panelFiltros.classList.contains('show');
                
                if (isVisible) {
                    panelFiltros.classList.remove('show');
                    toggleBtn.classList.remove('active');
                    toggleBtn.innerHTML = '<i class="fas fa-filter"></i> Filtros';
                } else {
                    panelFiltros.classList.add('show');
                    toggleBtn.classList.add('active');
                    toggleBtn.innerHTML = '<i class="fas fa-filter"></i> Ocultar Filtros';
                }
            });
        }
    }

    // Configurar eventos de filtros
    configurarEventosFiltros() {
        const filtros = ['filtroEntidad', 'filtroTasa', 'filtroValorMin', 'filtroValorMax', 'filtroDiasMin', 'filtroDiasMax'];
        
        filtros.forEach(filtroId => {
            const filtro = document.getElementById(filtroId);
            if (filtro) {
                filtro.addEventListener('change', () => this.aplicarFiltros());
                filtro.addEventListener('input', () => this.aplicarFiltros());
            }
        });

        // Configurar formateo para campos de valor
        const camposValor = ['filtroValorMin', 'filtroValorMax'];
        camposValor.forEach(campoId => {
            const campo = document.getElementById(campoId);
            if (campo) {
                campo.addEventListener('input', (e) => {
                    let valor = e.target.value;
                    const valorSinFormato = valor.replace(/[^\d]/g, '');
                    
                    if (valorSinFormato.length > 0) {
                        e.target.value = this.formatearConSeparadores(valorSinFormato);
                    }
                });
            }
        });

        // Botón limpiar filtros
        const limpiarFiltros = document.getElementById('limpiarFiltros');
        if (limpiarFiltros) {
            limpiarFiltros.addEventListener('click', () => this.limpiarFiltros());
        }
    }

    // Cargar tabla 4x1000 en modal
    cargarTabla4x1000Modal() {
        const tbody = document.querySelector('#tabla4x1000Modal tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        this.calculos4x1000.forEach(calculo => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>$${this.formatearNumero(calculo.valor, false)}</td>
                <td>$${this.formatearNumero(calculo.cuatroMil, false)}</td>
                <td>$${this.formatearNumero(calculo.valorTotal, false)}</td>
                <td class="profit-positive">$${this.formatearNumero(calculo.valorTransferir, false)}</td>
                <td><button class="btn-delete" onclick="app.eliminarCalculo4x1000(${calculo.id})">🗑️</button></td>
            `;
            tbody.appendChild(fila);
        });
    }

    // Cargar tabla fechas en modal
    cargarTablaFechasModal() {
        const tbody = document.querySelector('#tablaFechasModal tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        this.calculosFechas.forEach(calculo => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${calculo.fechaBase}</td>
                <td>${calculo.diasSumados}</td>
                <td>${calculo.fechaResultado}</td>
                <td><button class="btn-delete" onclick="app.eliminarCalculoFecha(${calculo.id})">🗑️</button></td>
            `;
            tbody.appendChild(fila);
        });
    }

    // Limpiar tabla modal
    limpiarTablaModal(tipo) {
        Swal.fire({
            title: `¿Está seguro?`,
            text: `¿Desea eliminar todos los registros de ${tipo}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                if (tipo === 'calculos4x1000') {
                    this.calculos4x1000 = [];
                    this.guardarDatos('calculos4x1000', this.calculos4x1000);
                    this.cargarTabla4x1000();
                    this.cargarTabla4x1000Modal();
                } else if (tipo === 'calculosFechas') {
                    this.calculosFechas = [];
                    this.guardarDatos('calculosFechas', this.calculosFechas);
                    this.cargarTablaFechas();
                    this.cargarTablaFechasModal();
                }
                
                Swal.fire({
                    title: '¡Eliminado!',
                    text: `Todos los registros de ${tipo} han sido eliminados.`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    }
}

// Inicializar la aplicación
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CalculadoraInversiones();
});

// Funciones globales para modales
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    
    // Cargar datos del historial cuando se abra el modal
    if (modalId === 'modal4x1000' && app) {
        app.cargarTabla4x1000Modal();
        // Limpiar el resultado del cálculo
        const resultadoModal = document.getElementById('resultado4x1000Modal');
        if (resultadoModal) {
            resultadoModal.innerHTML = '';
        }
    } else if (modalId === 'modalFechas' && app) {
        app.cargarTablaFechasModal();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaurar scroll del body
}

// Cerrar modal al hacer click fuera de él
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}