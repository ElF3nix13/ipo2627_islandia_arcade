"use strict";

export class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        
        this.animacionID = null;
        this.intervaloTiempo = null;
        this.enPausa = false;

        this.inicializarControlador();
    }

    inicializarControlador() {
        this.view.bindEventosInicio(() => this.iniciarJuego());
        this.view.bindEventosJuego(
            (x) => this.manejarMovimiento(x),
            () => this.pausarJuego(),
            () => this.mostrarAyuda(),
            () => this.reanudarJuego(),
            () => this.salirAlMenu()
        );
    }

    iniciarJuego() {
        const config = this.view.getConfiguracion();
        this.model.iniciarPartida(config);
        this.view.mostrarPantalla('juego');
        this.enPausa = false;
        
        this.iniciarReloj();
        this.loop();
    }

    manejarMovimiento(x) {
        if (!this.enPausa) {
            this.model.moverPaleta(x);
        }
    }

    iniciarReloj() {
        if (this.intervaloTiempo) clearInterval(this.intervaloTiempo);
        this.intervaloTiempo = setInterval(() => {
            if (!this.enPausa) this.model.incrementarTiempo();
        }, 1000);
    }

    pausarJuego() {
        this.enPausa = true;
        cancelAnimationFrame(this.animacionID);
        this.view.abrirModal('pausa');
    }

    mostrarAyuda() {
        this.enPausa = true;
        cancelAnimationFrame(this.animacionID);
        this.view.abrirModal('ayuda');
    }

    reanudarJuego() {
        this.enPausa = false;
        this.view.cerrarModal('pausa');
        this.view.cerrarModal('ayuda');
        this.loop();
    }

    salirAlMenu() {
        this.enPausa = true;
        clearInterval(this.intervaloTiempo);
        cancelAnimationFrame(this.animacionID);
        this.view.cerrarModal('pausa');
        this.view.mostrarPantalla('inicio');
    }

    loop() {
        if (this.enPausa) return;

        this.model.actualizarFisicas();
        const estado = this.model.getEstado();
        this.view.renderizarJuego(estado);

        if (estado.juegoTerminado) {
            clearInterval(this.intervaloTiempo);
            this.view.mostrarFin(estado.victoria, estado.tiempo);
        } else {
            this.animacionID = requestAnimationFrame(() => this.loop());
        }
    }
}