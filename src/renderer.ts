import { Color } from './color';
import { Blob } from './blob';
import { Palette } from './palette';


export class Renderer {

    width: number;
    height: number;

    // ctx: CanvasRenderingContext2D;
    gl: WebGLRenderingContext;

    beforeRender?: Function;
    afterRender?: Function;

    private _shaderProgram: WebGLShader;
    private _positionAttr: number;
    private _positionBuffer: WebGLBuffer | null;

    private _blobCount: number;

    constructor(public canvas: HTMLCanvasElement) {
        this.width = canvas.width;
        this.height = canvas.height;

        this._blobCount = 0;

        this._initGl();
        this._initShaders();
        this._initBuffers();
    }


    /**
     * Render a new frame.
     * Only need to be called outside when force to render.
     */
    render(palette: Palette): void {
        if (typeof this.beforeRender === 'function') {
            // Callback
            this.beforeRender();
        }

        const gl = this.gl;

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        gl.clearColor(0.5, 0.5, 0.5, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this._shaderProgram);

        if (palette.blobs.length !== this._blobCount
            || palette.blobs.some(blob => blob.isDirty)
        ) {
            // Rebuild shader when blob number changes
            this._blobCount = palette.blobs.length;
            this._initShaders();
            this._initBlobBuffers(palette.blobs);

            palette.blobs.forEach(blob => blob.isDirty = false);
        }

        // Window width and height as uniform
        const uW =
            gl.getUniformLocation(this._shaderProgram, 'uW');
        if (uW) {
            gl.uniform1f(uW, this.width);
        }
        const uH =
            gl.getUniformLocation(this._shaderProgram, 'uH');
        if (uW) {
            gl.uniform1f(uH, this.height);
        }

        gl.enableVertexAttribArray(this._positionAttr);
        if (this._positionBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        }
        gl.vertexAttribPointer(this._positionAttr, 2, gl.FLOAT, false, 0, 0);
        // Draw a rectangle for screen
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        if (typeof this.afterRender === 'function') {
            // Callback
            this.afterRender();
        }

    }

    /**
     * Get color of a given canvas position
     *
     * @param x x position
     * @param y y position
     */
    getColor(x: number, y: number, palette: Palette): Color | null {
        this.render(palette);

        const data = new Uint8Array(4);
        this.gl.readPixels(x, this.canvas.height - y, 1, 1, this.gl.RGBA,
            this.gl.UNSIGNED_BYTE, data);

        if (data[3] === 0) {
            return null;
        }
        else {
            return new Color(data[0], data[1], data[2]);
        }
    }


    /**
     * Resize canvas width and height.
     * Note that this should NOT be called by user.
     * Not palette is allowed to call this.
     *
     * @param width new canvas width
     * @param height new canvas height
     */
    _resize(width: number, height: number): void {
        this.width = this.canvas.width = width;
        this.height = this.canvas.height = height;
    }

    private _initGl(): void {
        try {
            this.gl = <WebGLRenderingContext>(
                this.canvas.getContext('webgl')
                || this.canvas.getContext('experimental-webgl')
            );
        }
        catch (e) {
            console.error(e);
        }

        if (!this.gl) {
            console.error('Failed to create GL.');
        }
    }

    private _initShaders(): void {
        const gl = this.gl;

        // Cannot create 0-length array
        const blobArrLen = this._blobCount || 1;

        const uBlobStr = `uniform vec2 uBlobPos[${blobArrLen}];`;
        const vBlobStr = `varying vec2 vBlobPos[${blobArrLen}];`;

        const uBlobColorStr = `uniform vec3 uBlobColor[${blobArrLen}];`;
        const vBlobColorStr = `varying vec3 vBlobColor[${blobArrLen}];`;

        const uBlobRadiusStr = `uniform float uBlobRadius[${blobArrLen}];`;
        const vBlobRadiusStr = `varying float vBlobRadius[${blobArrLen}];`;

        const vertex = `
            attribute vec4 aPos;
            uniform float uW;
            uniform float uH;
            varying float vW;
            varying float vH;
            ${uBlobStr}
            ${vBlobStr}
            ${uBlobColorStr}
            ${vBlobColorStr}
            ${uBlobRadiusStr}
            ${vBlobRadiusStr}

            void main() {
                vW = uW;
                vH = uH;

                for (int i = 0; i < ${this._blobCount}; ++i) {
                    vBlobPos[i] = uBlobPos[i];
                    vBlobColor[i] = uBlobColor[i];
                    vBlobRadius[i] = uBlobRadius[i];
                }

                gl_Position = aPos;
            }
        `;

        const vShader = this._getShader(vertex, gl.VERTEX_SHADER);
        if (!vShader) {
            return;
        }

        const fragment = `
            precision highp float;
            varying float vW;
            varying float vH;
            varying float vBlobCnt;
            ${vBlobStr}
            ${vBlobColorStr}
            ${vBlobRadiusStr}

            void main(void) {
                const int blobCnt = ${this._blobCount};

                if (blobCnt == 0) {
                    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                    return;
                }

                float b2 = 0.25;
                float b4 = b2 * b2;
                float b6 = b4 * b2;

                float influenceSum = 0.0;
                vec3 colors = vec3(0.0, 0.0, 0.0);
                for (int i = 0; i < blobCnt; ++i) {
                    float r = vBlobRadius[i];
                    vec2 pos = vBlobPos[i];
                    float dx = pos.x - float(gl_FragCoord.x);
                    float dy = pos.y - float(gl_FragCoord.y);
                    float d2 = (dx * dx + dy * dy) / r / r;

                    if (d2 <= b2) {
                        float d4 = d2 * d2;
                        float influence = 1.0 - (4.0 * d4 * d2 / b6 - 17.0 * d4
                            / b4 + 22.0 * d2 / b2) / 9.0;

                        if (influence < 0.001) {
                            continue;
                        }

                        colors = colors + vBlobColor[i] * influence;

                        influenceSum += influence;
                    }
                }

                if (influenceSum < 0.4) {
                    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                }
                else {
                    gl_FragColor = vec4(colors / influenceSum, 1.0);
                }
            }
        `;
        // console.log(fragment)
        const fShader = this._getShader(fragment, gl.FRAGMENT_SHADER);
        if (!fShader) {
            return;
        }

        this._shaderProgram = <WebGLProgram>gl.createProgram();
        gl.attachShader(this._shaderProgram, vShader);
        gl.attachShader(this._shaderProgram, fShader);
        gl.linkProgram(this._shaderProgram);

        if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
            console.error('Could not initialise shaders');
        }

        gl.useProgram(this._shaderProgram);
    }

    private _getShader(text: string, type: number): WebGLShader | null {
        const gl = this.gl;

        const shader = gl.createShader(type);
        gl.shaderSource(shader, text);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: '
                + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    private _initBuffers(): void {
        const gl = this.gl;

        this._positionAttr = gl.getAttribLocation(this._shaderProgram, 'aPos');
        this._positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        const positions = [
            -1, -1,
            1, -1,
            -1, 1,
            1, 1
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions),
            gl.STATIC_DRAW);
    }

    private _initBlobBuffers(blobs: Blob[]): void {
        const gl = this.gl;

        const blobPos: number[] = [];
        const blobColor: number[] = [];
        const blobRadius: number[] = [];
        blobs.forEach(blob => {
            blobPos.push(blob.x);
            blobPos.push(blob.y);
            blobColor.push(blob.color.r / 256);
            blobColor.push(blob.color.g / 256);
            blobColor.push(blob.color.b / 256);
            blobRadius.push(blob.radius);
        });

        const uPos =
            gl.getUniformLocation(this._shaderProgram, 'uBlobPos');
        if (uPos) {
            gl.uniform2fv(uPos, new Float32Array(blobPos));
        }

        const uColor =
            gl.getUniformLocation(this._shaderProgram, 'uBlobColor');
        if (uColor) {
            gl.uniform3fv(uColor, new Float32Array(blobColor));
        }

        const uRadius =
            gl.getUniformLocation(this._shaderProgram, 'uBlobRadius');
        if (uRadius) {
            gl.uniform1fv(uRadius, new Float32Array(blobRadius));
        }
    }

}
