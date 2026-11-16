"use strict";

export class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        
        this.animacionID = null;
        this.ultimoFrame = 0;
        this.enPausa = false;

        this.inicializarControlador();
    }

    inicializarControlador() {
        this.view.bindEventosInicio(() => this.iniciarJuego());
        
        this.view.bindEventosJuego(
            (x) => this.manejarMovimiento(x),
            () => this.lanzarBola(),
            () => this.pausarJuego(),
            () => this.reanudarJuego(),
            () => this.salirAlMenu()
        );
    }

    iniciarJuego() {
        const config = this.view.getConfiguracion();
        this.model.iniciarPartida(config);
        this.view.mostrarPantalla('juego');
        this.enPausa = false;
        
        this.ultimoFrame = performance.now();
        this.animacionID = requestAnimationFrame((ts) => this.loop(ts));
    }

    manejarMovimiento(x) {
        if (!this.enPausa) {
            this.model.moverPaleta(x);
        }
    }

    lanzarBola() {
        if (!this.enPausa) {
            this.model.lanzarBola();
        }
    }

    pausarJuego() {
        this.enPausa = true;
        cancelAnimationFrame(this.animacionID);
        this.view.abrirModal('pausa');
    }

    reanudarJuego() {
        this.enPausa = false;
        this.view.cerrarModal('pausa');
        this.ultimoFrame = performance.now();
        this.animacionID = requestAnimationFrame((ts) => this.loop(ts));
    }

    salirAlMenu() {
        this.enPausa = true;
        cancelAnimationFrame(this.animacionID);
        this.view.cerrarModal('pausa');
        this.view.mostrarPantalla('inicio');
    }

    loop(timestamp) {
        if (this.enPausa) return;

        const deltaMs = timestamp - this.ultimoFrame;
        this.ultimoFrame = timestamp;

        this.model.actualizarTiempo(deltaMs);
        this.model.actualizarFisicas();
        const estado = this.model.getEstado();
        this.view.renderizarJuego(estado);

        if (estado.juegoTerminado) {
            this.view.mostrarFin(estado.victoria, estado.tiempo);
        } else {
            this.animacionID = requestAnimationFrame((ts) => this.loop(ts));
        }
    }
}