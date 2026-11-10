"use strict";

export class View {
    constructor() {
        // Pantallas
        this.vistaInicio = document.getElementById('vista-inicio');
        this.vistaJuego = document.getElementById('vista-juego');
        this.vistaFin = document.getElementById('vista-fin');
        
        // Menús
        this.menuPrincipal = document.getElementById('menu-principal');
        this.menuAjustes = document.getElementById('menu-ajustes');
        
        // Elementos UI
        this.canvas = document.getElementById('canvas-juego');
        this.ctx = this.canvas.getContext('2d');
        this.indicadorVidas = document.getElementById('indicador-vidas');
        this.indicadorTiempo = document.getElementById('indicador-tiempo');
        this.tituloFin = document.getElementById('titulo-fin');
        this.tiempoFinal = document.getElementById('tiempo-final');
        this.valorFilas = document.getElementById('valor-filas');
        
        // Modales
        this.modalAyuda = document.getElementById('modal-ayuda');
        this.modalPausa = document.getElementById('modal-pausa');

        // Colores de ladrillos mapeados
        this.coloresFila = ['#e94560', '#f9a03f', '#f7d060', '#4ecca3', '#e94560', '#f9a03f', '#f7d060', '#4ecca3'];
    }

    mostrarPantalla(pantallaId) {
        [this.vistaInicio, this.vistaJuego, this.vistaFin].forEach(p => {
            p.classList.remove('activa');
            p.classList.add('oculto');
        });
        document.getElementById(pantallaId).classList.remove('oculto');
        document.getElementById(pantallaId).classList.add('activa');
    }

    toggleAjustes(mostrar) {
        if (mostrar) {
            this.menuPrincipal.classList.add('oculto');
            this.menuAjustes.classList.remove('oculto');
        } else {
            this.menuAjustes.classList.add('oculto');
            this.menuPrincipal.classList.remove('oculto');
        }
    }

    dibujarJuego(modelo) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar Paleta
        this.ctx.fillStyle = '#4ecca3';
        this.ctx.fillRect(modelo.paleta.x, modelo.paleta.y, modelo.paleta.w, modelo.paleta.h);

        // Dibujar Bola
        this.ctx.beginPath();
        this.ctx.arc(modelo.bola.x, modelo.bola.y, modelo.bola.radio, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
        this.ctx.closePath();

        // Dibujar Ladrillos
        for (let c = 0; c < modelo.ladrillos.length; c++) {
            for (let r = 0; r < modelo.ajustes.filasLadrillos; r++) {
                let lad = modelo.ladrillos[c][r];
                if (lad.estado === 1) {
                    this.ctx.fillStyle = this.coloresFila[lad.fila];
                    this.ctx.fillRect(lad.x, lad.y, 65, 25);
                }
            }
        }

        // Actualizar HUD textual
        this.indicadorVidas.textContent = '❤️'.repeat(modelo.vidas) + '🤍'.repeat(3 - modelo.vidas);
        this.indicadorTiempo.textContent = modelo.tiempo;
    }

    mostrarFin(victoria, tiempo) {
        this.tituloFin.textContent = victoria ? "¡Victoria! 🎉" : "Fin de la Partida";
        this.tituloFin.style.color = victoria ? "#4ecca3" : "#e94560";
        this.tiempoFinal.textContent = tiempo;
        this.mostrarPantalla('vista-fin');
    }

    bindEventosNavegacion(handlerInicio, handlerAjustes, handlerNuevaPartida) {
        document.getElementById('btn-jugar-inicio').addEventListener('click', handlerInicio);
        document.getElementById('btn-mostrar-ajustes').addEventListener('click', () => this.toggleAjustes(true));
        document.getElementById('btn-guardar-ajustes').addEventListener('click', () => this.toggleAjustes(false));
        document.getElementById('btn-nueva-partida').addEventListener('click', handlerNuevaPartida);
    }

    bindEventosAjustes(handlerParametros) {
        // Interacción Segmented Controls
        ['control-paleta', 'control-velocidad'].forEach(id => {
            const contenedor = document.getElementById(id);
            const clave = id === 'control-paleta' ? 'tamanoPaleta' : 'velocidadBola';
            
            contenedor.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    contenedor.querySelectorAll('button').forEach(b => b.classList.remove('activo'));
                    e.target.classList.add('activo');
                    handlerParametros(clave, e.target.dataset.val);
                });
            });
        });

        // Interacción Slider
        document.getElementById('control-filas').addEventListener('input', (e) => {
            this.valorFilas.textContent = e.target.value;
            handlerParametros('filasLadrillos', parseInt(e.target.value));
        });
    }

    bindEventosJuego(handlerPausa, handlerRaton) {
        document.getElementById('btn-pausa').addEventListener('click', handlerPausa);
        
        // Movimiento de paleta
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const ratonX = e.clientX - rect.left;
            handlerRaton(ratonX);
        });
    }

    bindModales(handlerContinuar, handlerSalir) {
        // Modal Ayuda
        const btnAyuda = document.getElementById('btn-ayuda');
        btnAyuda.addEventListener('click', () => this.modalAyuda.showModal());
        document.getElementById('btn-cerrar-ayuda').addEventListener('click', () => this.modalAyuda.close());

        // Modal Pausa
        document.getElementById('btn-continuar').addEventListener('click', () => {
            this.modalPausa.close();
            handlerContinuar();
        });
        document.getElementById('btn-salir').addEventListener('click', () => {
            this.modalPausa.close();
            handlerSalir();
        });
    }

    abrirModalPausa() {
        this.modalPausa.showModal();
    }
}