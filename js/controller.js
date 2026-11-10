"use strict";

export class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.animacionFrame = null;
        this.intervaloTiempo = null;

        this.inicializarControlador();
    }

    inicializarControlador() {
        this.view.bindEventosNavegacion(
            () => this.iniciarPartida(),
            null,
            () => this.volverAInicio()
        );

        this.view.bindEventosAjustes((clave, valor) => this.model.actualizarParametro(clave, valor));
        
        this.view.bindEventosJuego(
            () => this.pausarJuego(),
            (x) => { if(this.model.jugando && !this.model.pausa) this.model.moverPaleta(x); }
        );

        this.view.bindModales(
            () => this.reanudarJuego(),
            () => this.volverAInicio()
        );
    }

    iniciarPartida() {
        this.model.resetEstado();
        this.model.jugando = true;
        this.view.mostrarPantalla('vista-juego');
        
        // Iniciar reloj
        if(this.intervaloTiempo) clearInterval(this.intervaloTiempo);
        this.intervaloTiempo = setInterval(() => {
            this.model.incrementarTiempo();
        }, 1000);

        this.bucleJuego();
    }

    pausarJuego() {
        this.model.pausa = true;
        this.view.abrirModalPausa();
    }

    reanudarJuego() {
        this.model.pausa = false;
        this.bucleJuego();
    }

    volverAInicio() {
        this.model.jugando = false;
        if(this.animacionFrame) cancelAnimationFrame(this.animacionFrame);
        if(this.intervaloTiempo) clearInterval(this.intervaloTiempo);
        this.view.mostrarPantalla('vista-inicio');
    }

    bucleJuego() {
        if (!this.model.jugando || this.model.pausa) return;

        this.model.actualizarFisica();
        this.view.dibujarJuego(this.model);

        // Comprobar fin tras actualizar físicas
        if (!this.model.jugando) {
            clearInterval(this.intervaloTiempo);
            const victoria = this.model.vidas > 0;
            this.view.mostrarFin(victoria, this.model.tiempo);
            return;
        }

        this.animacionFrame = requestAnimationFrame(() => this.bucleJuego());
    }
}