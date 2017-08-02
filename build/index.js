var PP =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var color_1 = __webpack_require__(2);
var renderer_1 = __webpack_require__(1);
var dish_1 = __webpack_require__(3);
var Palette = (function () {
    function Palette(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.pixelRatio = 2;
        this.dishes = [];
        this._dishDoms = [];
        this._initEventHandle();
        this.renderer = new renderer_1.Renderer(canvas);
        this.renderer.render(this);
    }
    /**
     * Resize canvas width and height.
     * If width or height is not given, it's implied that canvas has been
     * resized outside, and only inner information should be changed.
     *
     * @param width new canvas width
     * @param height new canvas height
     */
    Palette.prototype.resize = function (width, height) {
        this.renderer.resize(width, height);
        this.width = this.renderer.width;
        this.height = this.renderer.height;
    };
    /**
     * Add a new dish to canvas
     *
     * @param x x position
     * @param y y position
     */
    Palette.prototype.addDish = function (x, y) {
        var _this = this;
        var dish = new dish_1.Dish(x * this.pixelRatio, this.height - y * this.pixelRatio, new color_1.Color(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)));
        this.dishes.push(dish);
        var dom = document.createElement('div');
        var style = "\n            border-radius: 50%;\n            width: 10px;\n            height: 10px;\n            background: #0ff;\n            margin-left: -5px;\n            margin-top: -5px;\n            position: absolute;\n            cursor: pointer;\n            left: " + x + "px;\n            top: " + y + "px;\n        ";
        dom.setAttribute('style', style);
        dom.addEventListener('mousedown', function () {
            _this._isMouseDown = true;
            _this._activeDish = dish;
            console.log('down');
        });
        if (this.canvas.parentNode) {
            this.canvas.parentNode.appendChild(dom);
        }
        dish.dom = dom;
    };
    Palette.prototype.moveDish = function (dish, x, y) {
        dish.move(x * this.pixelRatio, this.height - y * this.pixelRatio);
        if (dish.dom) {
            dish.dom.style.left = x + 'px';
            dish.dom.style.top = y + 'px';
        }
    };
    Palette.prototype._initEventHandle = function () {
        var _this = this;
        this._isMouseDown = false;
        this._isMouseMoved = false;
        var parent = this.canvas.parentNode;
        if (!parent) {
            return;
        }
        parent.addEventListener('mousedown', function () {
            _this._isMouseDown = true;
        });
        parent.addEventListener('mousemove', function (event) {
            if (_this._isMouseDown && _this._activeDish) {
                _this.moveDish(_this._activeDish, event.clientX, event.clientY);
                _this._isMouseMoved = true;
            }
        });
        parent.addEventListener('mouseup', function (event) {
            if (_this._isMouseDown && !_this._isMouseMoved) {
                _this.addDish(event.clientX, event.clientY);
            }
            _this._isMouseDown = false;
            _this._isMouseMoved = false;
            _this._activeDish = undefined;
        });
    };
    return Palette;
}());
exports.Palette = Palette;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Renderer = (function () {
    function Renderer(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this._dishCount = 0;
        this._initGl();
        this._initShaders();
        this._initBuffers();
    }
    /**
     * Resize canvas width and height.
     * If width or height is not given, it's implied that canvas has been
     * resized outside, and only inner information should be changed.
     *
     * @param width new canvas width
     * @param height new canvas height
     */
    Renderer.prototype.resize = function (width, height) {
        if (width != null) {
            this.canvas.width = width;
        }
        if (height != null) {
            this.canvas.height = height;
        }
    };
    /**
     * Render a new frame.
     * Only need to be called outside when force to render.
     */
    Renderer.prototype.render = function (palette) {
        if (typeof this.beforeRender === 'function') {
            // Callback
            this.beforeRender();
        }
        var gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0.5, 0.5, 0.5, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this._shaderProgram);
        if (palette.dishes.length !== this._dishCount
            || palette.dishes.some(function (dish) { return dish.isDirty; })) {
            // Rebuild shader when dish number changes
            this._dishCount = palette.dishes.length;
            this._initShaders();
            this._initDishBuffers(palette.dishes);
            palette.dishes.forEach(function (dish) { return dish.isDirty = false; });
        }
        // Window width and height as uniform
        var uW = gl.getUniformLocation(this._shaderProgram, 'uW');
        if (uW) {
            gl.uniform1f(uW, this.width);
        }
        var uH = gl.getUniformLocation(this._shaderProgram, 'uH');
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
    };
    Renderer.prototype._initGl = function () {
        try {
            this.gl = (this.canvas.getContext('webgl')
                || this.canvas.getContext('experimental-webgl'));
        }
        catch (e) {
            console.error(e);
        }
        if (!this.gl) {
            console.error('Failed to create GL.');
        }
    };
    Renderer.prototype._initShaders = function () {
        var gl = this.gl;
        var uDishStr = this._dishCount === 0
            ? 'uniform vec2 uDishPos[1];' // Cannot create 0-length array
            : "uniform vec2 uDishPos[" + this._dishCount + "];";
        var vDishStr = this._dishCount === 0
            ? 'varying vec2 vDishPos[1];'
            : "varying vec2 vDishPos[" + this._dishCount + "];";
        var uDishColorStr = this._dishCount === 0
            ? 'uniform vec3 uDishColor[1];'
            : "uniform vec3 uDishColor[" + this._dishCount + "];";
        var vDishColorStr = this._dishCount === 0
            ? 'varying vec3 vDishColor[1];'
            : "varying vec3 vDishColor[" + this._dishCount + "];";
        var vertex = "\n            attribute vec4 aPos;\n            uniform float uW;\n            uniform float uH;\n            varying float vW;\n            varying float vH;\n            " + uDishStr + "\n            " + vDishStr + "\n            " + uDishColorStr + "\n            " + vDishColorStr + "\n\n            void main() {\n                vW = uW;\n                vH = uH;\n\n                for (int i = 0; i < " + this._dishCount + "; ++i) {\n                    vDishPos[i] = uDishPos[i];\n                    vDishColor[i] = uDishColor[i];\n                }\n\n                gl_Position = aPos;\n            }\n        ";
        var vShader = this._getShader(vertex, gl.VERTEX_SHADER);
        if (!vShader) {
            return;
        }
        var fragment = "\n            precision highp float;\n            varying float vW;\n            varying float vH;\n            varying float vDishCnt;\n            " + vDishStr + "\n            " + vDishColorStr + "\n\n            void main(void) {\n                const int dishCnt = " + this._dishCount + ";\n\n                if (dishCnt == 0) {\n                    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n                    return;\n                }\n\n                float r = 500.0;\n                float b2 = 0.25;\n                float b4 = b2 * b2;\n                float b6 = b4 * b2;\n\n                float influenceSum = 0.0;\n                vec3 colors = vec3(0.0, 0.0, 0.0);\n                for (int i = 0; i < dishCnt; ++i) {\n                    vec2 pos = vDishPos[i];\n                    float dx = pos.x - float(gl_FragCoord.x);\n                    float dy = pos.y - float(gl_FragCoord.y);\n                    float d2 = (dx * dx + dy * dy) / r / r;\n\n                    if (d2 <= b2) {\n                        float d4 = d2 * d2;\n                        float influence = 1.0 - (4.0 * d4 * d2 / b6 - 17.0 * d4\n                            / b4 + 22.0 * d2 / b2) / 9.0;\n\n                        if (influence < 0.001) {\n                            continue;\n                        }\n\n                        colors = colors + vDishColor[i] * influence;\n\n                        influenceSum += influence;\n                    }\n                }\n\n                if (influenceSum < 0.2) {\n                    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n                }\n                else {\n                    gl_FragColor = vec4(colors / influenceSum, 1.0);\n                }\n            }\n        ";
        // console.log(fragment)
        var fShader = this._getShader(fragment, gl.FRAGMENT_SHADER);
        if (!fShader) {
            return;
        }
        this._shaderProgram = gl.createProgram();
        gl.attachShader(this._shaderProgram, vShader);
        gl.attachShader(this._shaderProgram, fShader);
        gl.linkProgram(this._shaderProgram);
        if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
            console.error('Could not initialise shaders');
        }
        gl.useProgram(this._shaderProgram);
    };
    Renderer.prototype._getShader = function (text, type) {
        var gl = this.gl;
        var shader = gl.createShader(type);
        gl.shaderSource(shader, text);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: '
                + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };
    Renderer.prototype._initBuffers = function () {
        var gl = this.gl;
        this._positionAttr = gl.getAttribLocation(this._shaderProgram, 'aPos');
        this._positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        var positions = [
            -1, -1,
            1, -1,
            -1, 1,
            1, 1
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    };
    Renderer.prototype._initDishBuffers = function (dishes) {
        var gl = this.gl;
        var dishPos = [];
        var dishColor = [];
        dishes.forEach(function (dish) {
            dishPos.push(dish.x);
            dishPos.push(dish.y);
            dishColor.push(dish.color.r / 256);
            dishColor.push(dish.color.g / 256);
            dishColor.push(dish.color.b / 256);
        });
        var uPos = gl.getUniformLocation(this._shaderProgram, 'uDishPos');
        if (uPos) {
            gl.uniform2fv(uPos, new Float32Array(dishPos));
        }
        var uColor = gl.getUniformLocation(this._shaderProgram, 'uDishColor');
        console.log(dishColor);
        if (uColor) {
            gl.uniform3fv(uColor, new Float32Array(dishColor));
        }
    };
    return Renderer;
}());
exports.Renderer = Renderer;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Color = (function () {
    function Color(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    Color.prototype.toArray = function () {
        return [this.r, this.g, this.b];
    };
    return Color;
}());
exports.Color = Color;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Dish = (function () {
    function Dish(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.isDirty = true;
    }
    Dish.prototype.move = function (x, y) {
        this.x = x;
        this.y = y;
        this.isDirty = true;
    };
    return Dish;
}());
exports.Dish = Dish;


/***/ })
/******/ ]);