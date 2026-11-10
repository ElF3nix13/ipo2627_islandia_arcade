"use strict";

export class Model {
    constructor() {
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        
        // Parámetros por defecto
        this.ajustes = {
            tamanoPaleta: 'mediana',
            velocidadBola: 'normal',
            filasLadrillos: 5
        };

        this.resetEstado();
    }

    resetEstado() {
        this.vidas = 3;
        this.tiempo = 0;
        this.jugando = false;
        this.pausa = false;
        
        // Configuraciones traducidas de los ajustes
        const anchosPaleta = { pequena: 80, mediana: 120, grande: 160 };
        const velocidadesBola = { lenta: 4, normal: 6, rapida: 9 };

        this.paleta = {
            w: anchosPaleta[this.ajustes.tamanoPaleta],
            h: 15,
            x: this.canvasWidth / 2 - (anchosPaleta[this.ajustes.tamanoPaleta] / 2),
            y: this.canvasHeight - 30,
            velocidad: 8
        };

        this.bola = {
            x: this.canvasWidth / 2,
            y: this.paleta.y - 10,
            radio: 8,
            dx: velocidadesBola[this.ajustes.velocidadBola],
            dy: -velocidadesBola[this.ajustes.velocidadBola],
            velocidadBase: velocidadesBola[this.ajustes.velocidadBola]
        };

        this.ladrillos = [];
        this.crearLadrillos();
    }

    crearLadrillos() {
        const cols = 10;
        const width = 65;
        const height = 25;
        const padding = 10;
        const offsetTop = 50;
        const offsetLeft = 30;

        for (let c = 0; c < cols; c++) {
            this.ladrillos[c] = [];
            for (let r = 0; r < this.ajustes.filasLadrillos; r++) {
                this.ladrillos[c][r] = { 
                    x: (c * (width + padding)) + offsetLeft, 
                    y: (r * (height + padding)) + offsetTop, 
                    estado: 1, // 1 = vivo, 0 = roto
                    fila: r
                };
            }
        }
    }

    actualizarParametro(clave, valor) {
        this.ajustes[clave] = valor;
    }

    actualizarFisica() {
        if (!this.jugando || this.pausa) return;

        // Movimiento bola
        this.bola.x += this.bola.dx;
        this.bola.y += this.bola.dy;

        // Colisión paredes izquierda/derecha
        if (this.bola.x + this.bola.dx > this.canvasWidth - this.bola.radio || this.bola.x + this.bola.dx < this.bola.radio) {
            this.bola.dx = -this.bola.dx;
        }

        // Colisión techo
        if (this.bola.y + this.bola.dy < this.bola.radio) {
            this.bola.dy = -this.bola.dy;
        } 
        // Suelo (Pierde vida)
        else if (this.bola.y + this.bola.dy > this.canvasHeight - this.bola.radio) {
            this.vidas--;
            if (this.vidas > 0) {
                this.resetBolaPaleta();
            } else {
                this.jugando = false; // Derrota
            }
        }

        // Colisión Paleta
        if (this.bola.y + this.bola.radio > this.paleta.y && 
            this.bola.y < this.paleta.y + this.paleta.h && 
            this.bola.x > this.paleta.x && 
            this.bola.x < this.paleta.x + this.paleta.w) {
            
            // Alterar ángulo según donde golpee en la paleta
            let puntoImpacto = this.bola.x - (this.paleta.x + this.paleta.w / 2);
            this.bola.dx = puntoImpacto * 0.15;
            this.bola.dy = -this.bola.dy;
            
            // Normalizar velocidad para que no pierda energía
            let magnitud = Math.sqrt(this.bola.dx * this.bola.dx + this.bola.dy * this.bola.dy);
            this.bola.dx = (this.bola.dx / magnitud) * this.bola.velocidadBase;
            this.bola.dy = (this.bola.dy / magnitud) * this.bola.velocidadBase;
        }

        // Colisión Ladrillos
        let quedanLadrillos = false;
        for (let c = 0; c < this.ladrillos.length; c++) {
            for (let r = 0; r < this.ajustes.filasLadrillos; r++) {
                let lad = this.ladrillos[c][r];
                if (lad.estado === 1) {
                    quedanLadrillos = true;
                    // AABB simplificado
                    if (this.bola.x > lad.x && this.bola.x < lad.x + 65 && this.bola.y > lad.y && this.bola.y < lad.y + 25) {
                        this.bola.dy = -this.bola.dy;
                        lad.estado = 0;
                    }
                }
            }
        }

        if (!quedanLadrillos) this.jugando = false; // Victoria
    }

    resetBolaPaleta() {
        this.paleta.x = this.canvasWidth / 2 - (this.paleta.w / 2);
        this.bola.x = this.canvasWidth / 2;
        this.bola.y = this.paleta.y - 10;
        this.bola.dx = this.bola.velocidadBase;
        this.bola.dy = -this.bola.velocidadBase;
    }

    moverPaleta(x) {
        let relativaX = x - (this.paleta.w / 2);
        if (relativaX > 0 && relativaX < this.canvasWidth - this.paleta.w) {
            this.paleta.x = relativaX;
        }
    }

    incrementarTiempo() {
        if (this.jugando && !this.pausa) this.tiempo++;
    }
}