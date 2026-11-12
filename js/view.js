"use strict";

export class View {
    constructor() {
        // Elementos DOM con data-attributes
        this.pantallas = {
            inicio: document.querySelector('[data-pantalla="inicio"]'),
            juego: document.querySelector('[data-pantalla="juego"]'),
            fin: document.querySelector('[data-pantalla="fin"]')
        };
        
        this.menus = {
            principal: document.querySelector('[data-menu="principal"]'),
            ajustes: document.querySelector('[data-menu="ajustes"]')
        };
        
        // Canvas y HUD
        this.canvas = document.querySelector('[data-canvas="juego"]');
        this.ctx = this.canvas.getContext('2d');
        this.imgClick = new Image();
        this.imgClick.src = 'img/click.svg';
        this.ui = {
            corazones: document.querySelectorAll('[data-hud="vidas"] .icono-corazon'),
            tiempo: document.querySelector('[data-bind="tiempo"]'),
            tiempoFinal: document.querySelector('[data-bind="tiempo-final"]'),
            tituloFin: document.querySelector('[data-bind="titulo-fin"]')
        };
        
        // Modales
        this.modales = {
            ayuda: document.querySelector('[data-modal="ayuda"]'),
            pausa: document.querySelector('[data-modal="pausa"]')
        };

        this.extraerColoresCSS();
    }

    extraerColoresCSS() {
        const root = getComputedStyle(document.documentElement);
        this.colores = {
            ladrillos: [
                root.getPropertyValue('--color-ladrillo-1').trim(),
                root.getPropertyValue('--color-ladrillo-2').trim(),
                root.getPropertyValue('--color-ladrillo-3').trim()
            ],
            bola: root.getPropertyValue('--color-bola').trim(),
            paleta: root.getPropertyValue('--color-paleta').trim()
        };
    }

    getConfiguracion() {
        return {
            paleta: document.querySelector('[data-setting-group="paleta"] .activo').dataset.val,
            velocidad: document.querySelector('[data-setting-group="velocidad"] .activo').dataset.val,
            filas: parseInt(document.querySelector('[data-setting="filas"]').value, 10)
        };
    }

    mostrarPantalla(nombre) {
        Object.values(this.pantallas).forEach(p => {
            p.classList.add('oculto');
            p.classList.remove('pantalla--activa');
        });
        this.pantallas[nombre].classList.remove('oculto');
        this.pantallas[nombre].classList.add('pantalla--activa');
    }

    toggleAjustes(mostrar) {
        this.menus.principal.classList.toggle('oculto', mostrar);
        this.menus.ajustes.classList.toggle('oculto', !mostrar);
    }

    abrirModal(nombre) { this.modales[nombre].showModal(); }
    cerrarModal(nombre) { this.modales[nombre].close(); }

    bindEventosInicio(handlerJugar) {
        document.querySelector('[data-action="jugar"]').addEventListener('click', handlerJugar);
        document.querySelector('[data-action="nueva-partida"]').addEventListener('click', handlerJugar);
        document.querySelector('[data-action="volver-menu"]').addEventListener('click', () => this.mostrarPantalla('inicio'));
        document.querySelector('[data-action="abrir-ajustes"]').addEventListener('click', () => this.toggleAjustes(true));
        document.querySelector('[data-action="guardar-ajustes"]').addEventListener('click', () => this.toggleAjustes(false));
        
        // Segmented controls UI logic
        document.querySelectorAll('.control-segmentado').forEach(grupo => {
            grupo.addEventListener('click', e => {
                if(e.target.classList.contains('btn-seg')) {
                    grupo.querySelectorAll('.btn-seg').forEach(b => b.classList.remove('activo'));
                    e.target.classList.add('activo');
                }
            });
        });

        // Slider UI logic
        const slider = document.querySelector('[data-setting="filas"]');
        const valorSpan = document.querySelector('[data-bind="valor-filas"]');
        slider.addEventListener('input', e => valorSpan.textContent = e.target.value);
    }

    bindEventosJuego(handlerMover, handlerLanzar, handlerPausa, handlerAyuda, handlerContinuar, handlerSalir) {
        this.canvas.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            const escalaX = this.canvas.width / rect.width;
            handlerMover((e.clientX - rect.left) * escalaX);
        });
        this.canvas.addEventListener('click', handlerLanzar);

        document.querySelector('[data-action="pausar"]').addEventListener('click', handlerPausa);
        document.querySelector('[data-action="continuar"]').addEventListener('click', handlerContinuar);
        document.querySelector('[data-action="salir"]').addEventListener('click', handlerSalir);
        
        document.querySelector('[data-action="abrir-ayuda"]').addEventListener('click', handlerAyuda);
        document.querySelector('[data-action="cerrar-ayuda"]').addEventListener('click', () => this.cerrarModal('ayuda'));
    }

    renderizarJuego(estado) {
        // (El renderizado del canvas se mantiene intacto porque no utilizaba IDs)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = this.colores.paleta;
        this.ctx.fillRect(estado.paleta.x, estado.paleta.y, estado.paleta.w, estado.paleta.h);

        this.ctx.beginPath();
        this.ctx.arc(estado.bola.x, estado.bola.y, estado.bola.radio, 0, Math.PI * 2);
        this.ctx.fillStyle = this.colores.bola;
        this.ctx.fill();
        this.ctx.closePath();

        estado.ladrillos.forEach(col => {
            col.forEach(b => {
                if (b.estado === 1) {
                    this.ctx.fillStyle = this.colores.ladrillos[b.colorIdx];
                    this.ctx.fillRect(b.x, b.y, b.w, b.h);
                }
            });
        });

        if (estado.bolaEsperando) {
            this.ctx.font = 'bold 18px sans-serif';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textBaseline = 'middle';
            const texto = 'Haz clic para lanzar';
            const anchoTexto = this.ctx.measureText(texto).width;
            const tam = 36;
            const gap = 12;
            const x = (this.canvas.width - (anchoTexto + tam + gap)) / 2;
            const y = this.canvas.height - 100;

            this.ctx.drawImage(this.imgClick, x, y - tam / 2, tam, tam);
            this.ctx.textAlign = 'left';
            this.ctx.fillText(texto, x + tam + gap, y);
        }

        this.ui.corazones.forEach((c, i) => c.classList.toggle('icono-corazon--perdido', i >= estado.vidas));
        this.ui.tiempo.textContent = estado.tiempo;
    }

    mostrarFin(victoria, tiempo) {
        this.ui.tituloFin.textContent = victoria ? "¡Victoria!" : "Fin de la Partida";
        this.ui.tituloFin.style.color = victoria ? "var(--color-primario)" : "var(--color-peligro)";
        this.ui.tiempoFinal.textContent = tiempo;
        this.mostrarPantalla('fin');
    }
}