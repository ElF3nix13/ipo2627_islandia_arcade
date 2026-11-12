"use strict";

export class Model {
    constructor() {
        this.anchoCanvas = 800;
        this.altoCanvas = 500;
        this.vidas = 3;
        this.tiempo = 0;
        this.juegoTerminado = false;
        this.victoria = false;
        this.bolaEsperando = false;
        
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

        // La primera bola se lanza automáticamente al comenzar la partida.
        this.resetBola(true);
        this.generarLadrillos();
    }

    resetBola(lanzar = false) {
        this.bola.x = this.anchoCanvas / 2;
        this.bola.y = this.altoCanvas - 60;
        this.paleta.x = (this.anchoCanvas - this.paleta.w) / 2;

        // Primero se prepara la bola; lanzarBola() cambiará este estado si procede.
        this.bolaEsperando = true;
        this.bola.dx = 0;
        this.bola.dy = 0;

        if (lanzar) {
            this.lanzarBola();
        }
    }

    lanzarBola() {
        if (!this.bolaEsperando || this.juegoTerminado) return;

        this.bola.dx = this.config.velocidadBase * (Math.random() > 0.5 ? 1 : -1);
        this.bola.dy = -this.config.velocidadBase;
        this.bolaEsperando = false;
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
        if (this.juegoTerminado || this.bolaEsperando) return;

        this.bola.x += this.bola.dx;
        this.bola.y += this.bola.dy;

        // Choque con paredes laterales
        if (this.bola.x - this.bola.radio < 0) {
            this.bola.x = this.bola.radio;
            this.bola.dx = Math.abs(this.bola.dx);
        } else if (this.bola.x + this.bola.radio > this.anchoCanvas) {
            this.bola.x = this.anchoCanvas - this.bola.radio;
            this.bola.dx = -Math.abs(this.bola.dx);
        }

        // Choque con techo
        if (this.bola.y - this.bola.radio < 0) {
            this.bola.y = this.bola.radio;
            this.bola.dy = Math.abs(this.bola.dy);
        }

        // Choque con fondo (pierde vida)
        if (this.bola.y - this.bola.radio > this.altoCanvas) {
            this.vidas--;
            if (this.vidas <= 0) {
                this.juegoTerminado = true;
                this.victoria = false;
            } else {
                // La siguiente bola queda preparada hasta que el jugador haga click.
                this.resetBola();
            }
            return;
        }

        // Choque con paleta (solo cuando la bola cae hacia abajo)
        if (this.bola.dy > 0 &&
            this.bola.y + this.bola.radio >= this.paleta.y &&
            this.bola.y - this.bola.radio <= this.paleta.y + this.paleta.h &&
            this.bola.x + this.bola.radio >= this.paleta.x && 
            this.bola.x - this.bola.radio <= this.paleta.x + this.paleta.w) {
            
            this.bola.y = this.paleta.y - this.bola.radio;
            this.bola.dy = -this.config.velocidadBase;
            // Modificar ángulo (dx) según zona de impacto
            let puntoImpacto = this.bola.x - (this.paleta.x + this.paleta.w / 2);
            this.bola.dx = (puntoImpacto / (this.paleta.w / 2)) * this.config.velocidadBase;
        }

        // Choque con ladrillos (AABB con detección de lados y reposicionamiento)
        let quedanLadrillos = false;
        let colisionDetectada = false;

        for (let c = 0; c < this.columnas; c++) {
            for (let r = 0; r < this.filas; r++) {
                let b = this.ladrillos[c][r];
                if (b.estado === 1) {
                    quedanLadrillos = true;

                    if (!colisionDetectada &&
                        this.bola.x + this.bola.radio > b.x &&
                        this.bola.x - this.bola.radio < b.x + b.w &&
                        this.bola.y + this.bola.radio > b.y &&
                        this.bola.y - this.bola.radio < b.y + b.h) {

                        // Calcular solapamiento en cada uno de los 4 lados del ladrillo
                        const overlapLeft = (this.bola.x + this.bola.radio) - b.x;
                        const overlapRight = (b.x + b.w) - (this.bola.x - this.bola.radio);
                        const overlapTop = (this.bola.y + this.bola.radio) - b.y;
                        const overlapBottom = (b.y + b.h) - (this.bola.y - this.bola.radio);

                        // La penetración mínima indica por qué cara impactó la bola
                        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                        if (minOverlap === overlapLeft) {
                            this.bola.x = b.x - this.bola.radio;
                            this.bola.dx = -Math.abs(this.bola.dx);
                        } else if (minOverlap === overlapRight) {
                            this.bola.x = b.x + b.w + this.bola.radio;
                            this.bola.dx = Math.abs(this.bola.dx);
                        } else if (minOverlap === overlapTop) {
                            this.bola.y = b.y - this.bola.radio;
                            this.bola.dy = -Math.abs(this.bola.dy);
                        } else if (minOverlap === overlapBottom) {
                            this.bola.y = b.y + b.h + this.bola.radio;
                            this.bola.dy = Math.abs(this.bola.dy);
                        }

                        b.estado = 0;
                        colisionDetectada = true;
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
            victoria: this.victoria,
            bolaEsperando: this.bolaEsperando
        };
    }
}
