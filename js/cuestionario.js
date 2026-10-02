'use strict';

document.addEventListener('DOMContentLoaded', () => {

    /* ============================================================
       1. MENÚ HAMBURGUESA
    ============================================================ */
    const btnHamburguesa = document.getElementById('btnHamburguesa');
    const navPrincipal   = document.getElementById('navPrincipal');

    btnHamburguesa?.addEventListener('click', () => {
        const abierto = navPrincipal.classList.toggle('abierto');
        btnHamburguesa.setAttribute('aria-expanded', abierto);
    });

    // Cerrar menú al hacer clic en un enlace
    navPrincipal?.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navPrincipal.classList.remove('abierto');
            btnHamburguesa.setAttribute('aria-expanded', 'false');
        });
    });

    /* ============================================================
       2. SCROLL SPY — resaltar enlace activo de la navegación
    ============================================================ */
    const secciones    = document.querySelectorAll('section[id], div[id="inicio"]');
    const navLinks     = document.querySelectorAll('.nav-link');
    const indiceLinks  = document.querySelectorAll('.indice-link');

    const observadorNav = new IntersectionObserver((entradas) => {
        entradas.forEach(entrada => {
            if (entrada.isIntersecting) {
                const id = entrada.target.id;
                navLinks.forEach(l => l.classList.toggle('activo-scroll', l.getAttribute('href') === `#${id}`));
                indiceLinks.forEach(l => l.classList.toggle('activo', l.getAttribute('href') === `#${id}`));
            }
        });
    }, { rootMargin: '-60px 0px -40% 0px' });

    secciones.forEach(s => observadorNav.observe(s));

    /* ============================================================
       3. PROGRESO DE LECTURA
    ============================================================ */
    const barraProgreso = document.getElementById('progresoLectura');
    const textoPct      = document.getElementById('progresoPct');

    function actualizarProgreso() {
        const total  = document.documentElement.scrollHeight - window.innerHeight;
        const avance = total > 0 ? Math.round((window.scrollY / total) * 100) : 0;
        const pct    = Math.min(avance, 100);
        if (barraProgreso) barraProgreso.style.width = pct + '%';
        if (textoPct)      textoPct.textContent = pct + '%';
    }

    window.addEventListener('scroll', actualizarProgreso, { passive: true });
    actualizarProgreso();

    /* ============================================================
       4. ANIMACIÓN FADE-IN AL HACER SCROLL
    ============================================================ */
    const observadorFade = new IntersectionObserver((entradas) => {
        entradas.forEach(entrada => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add('visible');
                observadorFade.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.07 });

    document.querySelectorAll('.fade-in').forEach(el => observadorFade.observe(el));

    /* ============================================================
       5. GUÍA DE 5 PASOS
    ============================================================ */
    const paneles        = document.querySelectorAll('.paso-panel');
    const indicadores    = document.querySelectorAll('.paso-indicador');
    const lineas         = document.querySelectorAll('.paso-linea');
    const btnAnterior    = document.getElementById('btnAnterior');
    const btnSiguiente   = document.getElementById('btnSiguiente');
    const pasoContador   = document.getElementById('pasoContador');
    let   pasoActual     = 0;

    function mostrarPaso(nuevo) {
        // Paneles
        paneles[pasoActual].classList.remove('activo');
        paneles[nuevo].classList.add('activo');

        // Indicadores
        indicadores.forEach((ind, i) => {
            ind.classList.remove('activo', 'completado');
            if (i < nuevo)  ind.classList.add('completado');
            if (i === nuevo) ind.classList.add('activo');
        });

        // Líneas
        lineas.forEach((linea, i) => {
            linea.classList.toggle('completada', i < nuevo);
        });

        pasoActual = nuevo;

        btnAnterior.disabled = pasoActual === 0;
        btnSiguiente.disabled = pasoActual === paneles.length - 1;
        if (pasoContador) pasoContador.textContent = `Paso ${pasoActual + 1} de ${paneles.length}`;

        // Accesibilidad
        document.querySelector('.pasos-progreso')?.setAttribute('aria-valuenow', pasoActual + 1);
    }

    btnAnterior?.addEventListener('click', () => {
        if (pasoActual > 0) mostrarPaso(pasoActual - 1);
    });

    btnSiguiente?.addEventListener('click', () => {
        if (pasoActual < paneles.length - 1) mostrarPaso(pasoActual + 1);
    });

    // Clic en indicadores de número
    indicadores.forEach((ind, i) => {
        ind.addEventListener('click', () => mostrarPaso(i));
        ind.setAttribute('tabindex', '0');
        ind.setAttribute('role', 'button');
        ind.setAttribute('aria-label', `Ir al paso ${i + 1}`);
        ind.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') mostrarPaso(i); });
    });

    mostrarPaso(0); // inicializar

    /* ============================================================
       6. CALCULADORA FLSM
    ============================================================ */
    const btnCalcular    = document.getElementById('btnCalcular');
    const btnLimpiarCalc = document.getElementById('btnLimpiarCalc');
    const calcResultado  = document.getElementById('calcResultado');

    function ipAEntero(ip) {
        const partes = ip.trim().split('.');
        if (partes.length !== 4) return null;
        const entero = partes.reduce((acc, p) => {
            const n = parseInt(p, 10);
            if (isNaN(n) || n < 0 || n > 255) return NaN;
            return (acc << 8) + n;
        }, 0);
        return isNaN(entero) ? null : (entero >>> 0);
    }

    function enteroAIp(n) {
        return [
            (n >>> 24) & 0xff,
            (n >>> 16) & 0xff,
            (n >>> 8)  & 0xff,
             n         & 0xff
        ].join('.');
    }

    function prefijAMascara(prefijo) {
        return prefijo === 0 ? 0 : (0xFFFFFFFF << (32 - prefijo)) >>> 0;
    }

    function calcularFLSM(redStr, prefijo, numSubredes) {
        const redBase = ipAEntero(redStr);
        if (redBase === null) return { error: 'La dirección IP no es válida.' };

        prefijo   = parseInt(prefijo,    10);
        numSubredes = parseInt(numSubredes, 10);

        if (isNaN(prefijo) || prefijo < 8 || prefijo > 30)
            return { error: 'El prefijo debe estar entre 8 y 30.' };
        if (isNaN(numSubredes) || numSubredes < 2)
            return { error: 'Se necesitan al menos 2 subredes.' };

        const hostBitsDisponibles = 32 - prefijo;
        if (hostBitsDisponibles < 2)
            return { error: 'No quedan bits disponibles para hacer subredes.' };

        // Bits a prestar
        let n = 1;
        while (Math.pow(2, n) < numSubredes) n++;

        if (n >= hostBitsDisponibles)
            return { error: `No hay suficientes bits para ${numSubredes} subredes con el prefijo /${prefijo}.` };

        const nuevoPrefijo  = prefijo + n;
        const hostBits      = 32 - nuevoPrefijo;
        const totalSubredes = Math.pow(2, n);
        const tamSubred     = Math.pow(2, hostBits);
        const hostsUtiles   = tamSubred - 2;
        const mascara       = prefijAMascara(nuevoPrefijo);

        // Calcular la dirección de red base (asegurar que es la dirección de red correcta)
        const redBaseAjustada = (redBase & prefijAMascara(prefijo)) >>> 0;

        const subredes = [];
        for (let i = 0; i < totalSubredes; i++) {
            const redAddr      = (redBaseAjustada + i * tamSubred) >>> 0;
            const primerHost   = (redAddr + 1) >>> 0;
            const broadcast    = (redAddr + tamSubred - 1) >>> 0;
            const ultimoHost   = (broadcast - 1) >>> 0;
            subredes.push({
                num:        i + 1,
                red:        enteroAIp(redAddr),
                primerHost: enteroAIp(primerHost),
                ultimoHost: enteroAIp(ultimoHost),
                broadcast:  enteroAIp(broadcast),
                enUso:      i < numSubredes
            });
        }

        return {
            nuevoPrefijo,
            mascara: enteroAIp(mascara),
            n,
            totalSubredes,
            hostsUtiles,
            incremento: tamSubred,
            subredes
        };
    }

    function renderizarResultado(r) {
        if (r.error) {
            calcResultado.innerHTML = `<div class="calc-error">⚠️ ${r.error}</div>`;
            return;
        }

        const filas = r.subredes.map(s => `
            <tr class="${s.enUso ? 'subred-activa' : 'subred-reserva'}">
                <td>${s.num}</td>
                <td>${s.red}/${r.nuevoPrefijo}</td>
                <td>${s.primerHost}</td>
                <td>${s.ultimoHost}</td>
                <td>${s.broadcast}</td>
                <td><span class="badge ${s.enUso ? 'badge-uso' : 'badge-reserva'}">${s.enUso ? 'En uso' : 'Reserva'}</span></td>
            </tr>`).join('');

        calcResultado.innerHTML = `
            <div class="calc-info">
                <div class="calc-info-item"><strong>Bits prestados</strong> n = ${r.n}</div>
                <div class="calc-info-item"><strong>Nueva máscara</strong> /${r.nuevoPrefijo} (${r.mascara})</div>
                <div class="calc-info-item"><strong>Total subredes</strong> 2<sup>${r.n}</sup> = ${r.totalSubredes}</div>
                <div class="calc-info-item"><strong>Hosts útiles/subred</strong> ${r.hostsUtiles}</div>
                <div class="calc-info-item"><strong>Incremento de red</strong> ${r.incremento}</div>
            </div>
            <div class="calc-tabla-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>N.°</th>
                            <th>Red /${r.nuevoPrefijo}</th>
                            <th>Primer host</th>
                            <th>Último host</th>
                            <th>Broadcast</th>
                            <th>Uso</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    }

    btnCalcular?.addEventListener('click', () => {
        const red       = document.getElementById('calcRed').value;
        const prefijo   = document.getElementById('calcPrefijo').value;
        const subredes  = document.getElementById('calcSubredes').value;
        renderizarResultado(calcularFLSM(red, prefijo, subredes));
        calcResultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    btnLimpiarCalc?.addEventListener('click', () => {
        document.getElementById('calcRed').value      = '192.168.1.0';
        document.getElementById('calcPrefijo').value  = '24';
        document.getElementById('calcSubredes').value = '5';
        calcResultado.innerHTML = '';
    });

    /* ============================================================
       7. CUESTIONARIO INTERACTIVO
    ============================================================ */
    const PREGUNTAS = {
        p1: { correcta: 'b', texto: 'Bits para 6 subredes', explicacion: '2³ = 8 ≥ 6 ✔ — Con solo 2 bits obtendrías 4, insuficiente.' },
        p2: { correcta: 'a', texto: 'Hosts útiles con /26', explicacion: '2⁶ = 64 − 2 = <strong>62 hosts útiles</strong>. Siempre resta dirección de red y broadcast.' },
        p3: { correcta: 'b', texto: 'Salto con máscara .192', explicacion: '256 − 192 = <strong>64</strong>. El incremento es la diferencia entre 256 y el último octeto de la máscara.' },
        p4: { correcta: 'a', texto: 'Broadcast de 192.168.1.0/27', explicacion: 'Incremento = 32. Siguiente red = 192.168.1.32. Broadcast = 192.168.1.<strong>31</strong>.' },
        p5: { correcta: 'a', texto: 'Máscaras en FLSM', explicacion: 'FLSM = <em>Fixed Length</em> Subnet Mask. Todas las subredes tienen la misma máscara y el mismo tamaño.' }
    };

    const formulario      = document.getElementById('formularioCuestionario');
    const btnVerificar    = document.getElementById('btnVerificar');
    const btnLimpiar      = document.getElementById('btnLimpiar');
    const resultadoDiv    = document.getElementById('resultado');
    const quizBarra       = document.getElementById('quizProgresoBarra');
    const quizContador    = document.getElementById('quizPuntajeLive');

    let respondidas = 0;

    function actualizarContadorQuiz() {
        respondidas = 0;
        Object.keys(PREGUNTAS).forEach(key => {
            const sel = document.querySelector(`input[name="${key}"]:checked`);
            if (sel) respondidas++;
        });
        const pct = Math.round((respondidas / Object.keys(PREGUNTAS).length) * 100);
        if (quizBarra) quizBarra.style.width = pct + '%';
        if (quizContador) quizContador.textContent = `Respondidas: ${respondidas} / ${Object.keys(PREGUNTAS).length}`;
    }

    formulario?.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', actualizarContadorQuiz);
    });

    function verificarCuestionario() {
        const respuestas = {};
        let incompleto = false;

        Object.keys(PREGUNTAS).forEach(key => {
            const sel = document.querySelector(`input[name="${key}"]:checked`);
            respuestas[key] = sel ? sel.value : null;
            if (!sel) incompleto = true;
        });

        if (incompleto) {
            resultadoDiv.innerHTML = `
                <div class="calc-error">
                    ⚠️ Responde todas las preguntas antes de verificar.
                </div>`;
            return;
        }

        let puntaje = 0;
        let retros  = '';

        Object.keys(PREGUNTAS).forEach((key, i) => {
            const preg     = PREGUNTAS[key];
            const esCorr   = respuestas[key] === preg.correcta;
            const pregDiv  = document.getElementById(`preg${i + 1}`);
            const opciones = formulario.querySelectorAll(`input[name="${key}"]`);

            if (esCorr) puntaje++;

            // Resaltar bloque de pregunta
            pregDiv?.classList.remove('correcta-bg', 'incorrecta-bg');
            pregDiv?.classList.add(esCorr ? 'correcta-bg' : 'incorrecta-bg');

            // Resaltar opciones individuales
            opciones.forEach(inp => {
                const label = inp.closest('.opcion');
                label?.classList.remove('opcion-correcta', 'opcion-incorrecta');
                if (inp.value === preg.correcta) label?.classList.add('opcion-correcta');
                else if (inp.value === respuestas[key] && !esCorr) label?.classList.add('opcion-incorrecta');
            });

            retros += `
                <div class="retro-item">
                    <span>${esCorr ? '✅' : '❌'}</span>
                    <div>
                        <strong>Pregunta ${i + 1} — ${esCorr ? 'Correcta' : 'Incorrecta'}:</strong>
                        ${preg.explicacion}
                    </div>
                </div>`;
        });

        const nivel = puntaje === 5 ? 'perfecto' : puntaje >= 4 ? 'bueno' : puntaje >= 3 ? 'regular' : 'malo';
        const emoji = puntaje === 5 ? '🏆' : puntaje >= 4 ? '👍' : puntaje >= 3 ? '📚' : '💪';
        const msg   = puntaje === 5 ? '¡Perfecto! Dominas FLSM.' :
                      puntaje >= 4 ? '¡Muy bien! Casi perfecto.' :
                      puntaje >= 3 ? 'Buen intento. Repasa los pasos.' :
                                     'Sigue practicando. ¡Tú puedes!';

        resultadoDiv.innerHTML = `
            <div class="quiz-resultado-cabecera ${nivel}">
                <div>
                    <div style="font-size:1.6rem">${emoji} ${msg}</div>
                </div>
                <div class="quiz-resultado-puntaje">${puntaje} / 5</div>
            </div>
            <div class="quiz-resultado-cuerpo">
                ${retros}
            </div>`;

        resultadoDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function reiniciarQuiz() {
        formulario?.reset();
        resultadoDiv.innerHTML = '';

        document.querySelectorAll('.pregunta').forEach(p => {
            p.classList.remove('correcta-bg', 'incorrecta-bg');
        });
        document.querySelectorAll('.opcion').forEach(o => {
            o.classList.remove('opcion-correcta', 'opcion-incorrecta');
        });

        actualizarContadorQuiz();
    }

    btnVerificar?.addEventListener('click', verificarCuestionario);
    btnLimpiar?.addEventListener('click', reiniciarQuiz);

    /* ============================================================
       8. BOTÓN "LIMPIAR" EN CALCULADORA también resetea color btn-secundario
    ============================================================ */
    // (ya gestionado arriba)

    /* ============================================================
       9. INICIALIZACIÓN GENERAL
    ============================================================ */
    actualizarContadorQuiz();
});
