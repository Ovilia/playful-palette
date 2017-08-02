import { Dish } from './dish';
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

    private _dishCount: number;

    constructor(public canvas: HTMLCanvasElement) {
        this.width = canvas.width;
        this.height = canvas.height;

        this._dishCount = 0;

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

        if (palette.dishes.length !== this._dishCount
            || palette.dishes.some(dish => dish.isDirty)
        ) {
            // Rebuild shader when dish number changes
            this._dishCount = palette.dishes.length;
            this._initShaders();
            this._initDishBuffers(palette.dishes);

            palette.dishes.forEach(dish => dish.isDirty = false);
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
        const dishArrLen = this._dishCount || 1;

        const uDishStr = `uniform vec2 uDishPos[${dishArrLen}];`;
        const vDishStr = `varying vec2 vDishPos[${dishArrLen}];`;

        const uDishColorStr = `uniform vec3 uDishColor[${dishArrLen}];`;
        const vDishColorStr = `varying vec3 vDishColor[${dishArrLen}];`;

        const uDishRadiusStr = `uniform float uDishRadius[${dishArrLen}];`;
        const vDishRadiusStr = `varying float vDishRadius[${dishArrLen}];`;

        const vertex = `
            attribute vec4 aPos;
            uniform float uW;
            uniform float uH;
            varying float vW;
            varying float vH;
            ${uDishStr}
            ${vDishStr}
            ${uDishColorStr}
            ${vDishColorStr}
            ${uDishRadiusStr}
            ${vDishRadiusStr}

            void main() {
                vW = uW;
                vH = uH;

                for (int i = 0; i < ${this._dishCount}; ++i) {
                    vDishPos[i] = uDishPos[i];
                    vDishColor[i] = uDishColor[i];
                    vDishRadius[i] = uDishRadius[i];
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
            varying float vDishCnt;
            ${vDishStr}
            ${vDishColorStr}
            ${vDishRadiusStr}

            void main(void) {
                const int dishCnt = ${this._dishCount};

                if (dishCnt == 0) {
                    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                    return;
                }

                float b2 = 0.25;
                float b4 = b2 * b2;
                float b6 = b4 * b2;

                float influenceSum = 0.0;
                vec3 colors = vec3(0.0, 0.0, 0.0);
                for (int i = 0; i < dishCnt; ++i) {
                    float r = vDishRadius[i];
                    vec2 pos = vDishPos[i];
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

                        colors = colors + vDishColor[i] * influence;

                        influenceSum += influence;
                    }
                }

                if (influenceSum < 0.2) {
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

    private _initDishBuffers(dishes: Dish[]): void {
        const gl = this.gl;

        const dishPos: number[] = [];
        const dishColor: number[] = [];
        const dishRadius: number[] = [];
        dishes.forEach(dish => {
            dishPos.push(dish.x);
            dishPos.push(dish.y);
            dishColor.push(dish.color.r / 256);
            dishColor.push(dish.color.g / 256);
            dishColor.push(dish.color.b / 256);
            dishRadius.push(dish.radius);
        });

        const uPos =
            gl.getUniformLocation(this._shaderProgram, 'uDishPos');
        if (uPos) {
            gl.uniform2fv(uPos, new Float32Array(dishPos));
        }

        const uColor =
            gl.getUniformLocation(this._shaderProgram, 'uDishColor');
        if (uColor) {
            gl.uniform3fv(uColor, new Float32Array(dishColor));
        }

        const uRadius =
            gl.getUniformLocation(this._shaderProgram, 'uDishRadius');
        if (uRadius) {
            gl.uniform1fv(uRadius, new Float32Array(dishRadius));
        }
    }

}
