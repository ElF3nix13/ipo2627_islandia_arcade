"use strict";

export class Model {
    constructor() {
        this.anchoCanvas = 800;
        this.altoCanvas = 500;
        this.vidas = 3;
        this.tiempo = 0;
        this.juegoTerminado = false;
        this.victoria = false;
        
        this.bola = { x: 400, y: 300, dx: 0, dy: 0, radio: 8 };
        this.paleta = { x: 350, y: 460, w: 100, h: 12 };
        this.ladrillos = [];
        this.filas = 4;
        this.columnas = 10;
        
        this.config = {
            velocidadBase: 5,
            tamanoPaleta: 100
        };
    }

    iniciarPartida(config) {
        this.vidas = 3;
        this.tiempo = 0;
        this.juegoTerminado = false;
        this.victoria = false;
        
        // Mapear configuración
        this.filas = config.filas;
        this.config.tamanoPaleta = config.paleta === 'pequena' ? 60 : (config.paleta === 'grande' ? 140 : 100);
        this.config.velocidadBase = config.velocidad === 'lenta' ? 4 : (config.velocidad === 'rapida' ? 8 : 6);
        this.paleta.w = this.config.tamanoPaleta;

        this.resetBola();
        this.generarLadrillos();
    }

    resetBola() {
        this.bola.x = this.anchoCanvas / 2;
        this.bola.y = this.altoCanvas - 60;
        this.bola.dx = this.config.velocidadBase * (Math.random() > 0.5 ? 1 : -1);
        this.bola.dy = -this.config.velocidadBase;
        this.paleta.x = (this.anchoCanvas - this.paleta.w) / 2;
    }

    generarLadrillos() {
        this.ladrillos = [];
        const anchoLad = 65;
        const altoLad = 20;
        const padding = 10;
        const offsetSup = 50;
        const offsetIzq = (this.anchoCanvas - (this.columnas * (anchoLad + padding))) / 2 + padding/2;

        for (let c = 0; c < this.columnas; c++) {
            this.ladrillos[c] = [];
            for (let r = 0; r < this.filas; r++) {
                this.ladrillos[c][r] = {
                    x: c * (anchoLad + padding) + offsetIzq,
                    y: r * (altoLad + padding) + offsetSup,
                    w: anchoLad,
                    h: altoLad,
                    estado: 1, // 1 = vivo, 0 = roto
                    colorIdx: r % 3
                };
            }
        }
    }

    moverPaleta(xRelativo) {
        if (xRelativo > 0 && xRelativo < this.anchoCanvas) {
            this.paleta.x = xRelativo - this.paleta.w / 2;
            // Límites
            if (this.paleta.x < 0) this.paleta.x = 0;
            if (this.paleta.x + this.paleta.w > this.anchoCanvas) this.paleta.x = this.anchoCanvas - this.paleta.w;
        }
    }

    incrementarTiempo() {
        if (!this.juegoTerminado) this.tiempo++;
    }

    actualizarFisicas() {
        if (this.juegoTerminado) return;

        this.bola.x += this.bola.dx;
        this.bola.y += this.bola.dy;

        // Choque con paredes
        if (this.bola.x + this.bola.dx > this.anchoCanvas - this.bola.radio || this.bola.x + this.bola.dx < this.bola.radio) {
            this.bola.dx = -this.bola.dx;
        }
        if (this.bola.y + this.bola.dy < this.bola.radio) {
            this.bola.dy = -this.bola.dy;
        }

        // Choque con fondo (pierde vida)
        if (this.bola.y + this.bola.dy > this.altoCanvas - this.bola.radio) {
            this.vidas--;
            if (this.vidas <= 0) {
                this.juegoTerminado = true;
                this.victoria = false;
            } else {
                this.resetBola();
            }
        }

        // Choque con paleta
        if (this.bola.y + this.bola.radio > this.paleta.y &&
            this.bola.x > this.paleta.x && 
            this.bola.x < this.paleta.x + this.paleta.w) {
            
            this.bola.dy = -this.config.velocidadBase;
            // Modificar ángulo (dx) según zona de impacto
            let puntoImpacto = this.bola.x - (this.paleta.x + this.paleta.w / 2);
            this.bola.dx = (puntoImpacto / (this.paleta.w / 2)) * this.config.velocidadBase;
        }

        // Choque con ladrillos (AABB básico)
        let quedanLadrillos = false;
        for (let c = 0; c < this.columnas; c++) {
            for (let r = 0; r < this.filas; r++) {
                let b = this.ladrillos[c][r];
                if (b.estado === 1) {
                    quedanLadrillos = true;
                    if (this.bola.x > b.x && this.bola.x < b.x + b.w &&
                        this.bola.y > b.y && this.bola.y < b.y + b.h) {
                        this.bola.dy = -this.bola.dy;
                        b.estado = 0;
                    }
                }
            }
        }

        if (!quedanLadrillos) {
            this.juegoTerminado = true;
            this.victoria = true;
        }
    }

    getEstado() {
        return {
            bola: this.bola,
            paleta: this.paleta,
            ladrillos: this.ladrillos,
            vidas: this.vidas,
            tiempo: this.tiempo,
            juegoTerminado: this.juegoTerminado,
            victoria: this.victoria
        };
    }
}