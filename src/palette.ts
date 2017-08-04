import { History } from './history';
import { Gui, GuiStatus } from './gui';
import { Color } from './color';
import { Renderer } from './renderer';
import { Blob } from './blob';


const MAX_DISH_CNT = 7;
const PALETTE_RADIUS_RATIO = 0.5;

export class Palette {

    width: number;
    height: number;
    canvas: HTMLCanvasElement;

    blobs: Blob[];
    maxBlobRadius: number;

    gui: Gui;
    history: History;

    renderer: Renderer;
    pixelRatio: number;

    radius: number;

    private _isMouseDown: boolean;
    private _isMouseMoved: boolean;
    private _blobDoms: HTMLDivElement[];
    private _activeBlob?: Blob;

    constructor(public container: HTMLDivElement) {
        this.pixelRatio = 2;

        if (!container.style.position || container.style.position === 'auto') {
            container.style.position = 'absulute';
        }

        this.canvas = document.createElement('canvas');
        this.canvas.width = container.offsetWidth * this.pixelRatio;
        this.canvas.height = container.offsetHeight * this.pixelRatio;
        container.appendChild(this.canvas);

        const canvasStyle = `
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
        `;
        this.canvas.setAttribute('style', canvasStyle);

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this._updateRadius();

        this.gui = new Gui(container);
        this.history = new History();

        this.blobs = [];
        this.maxBlobRadius = 400;

        this._blobDoms = [];

        this._initEventHandle();

        this.renderer = new Renderer(this.canvas);
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
    resize(width?: number, height?: number): void {
        // Auto-detect width and height
        width = width || this.renderer.canvas.width;
        height = height || this.renderer.canvas.height;

        this.renderer._resize(width, height);

        this._updateRadius();

        if (width !== this.width || height !== this.height) {
            // Update blob position when width or height changed
            this.blobs.forEach(blob => {
                const x = blob.x * <number>width / this.width;
                const y = blob.y * <number>height / this.height;

                if (blob.dom) {
                    blob.dom.style.left = x / this.pixelRatio + 'px';
                    blob.dom.style.top =
                        (<number>height - y) / this.pixelRatio + 'px';
                }

                blob.move(x, y);
            });

            this.width = width;
            this.height = height;
        }
    }

    /**
     * Add a new blob to canvas
     *
     * @param x x position to container
     * @param y y position to container
     * @return if succeed
     */
    addBlob(x: number, y: number): boolean {
        if (this.blobs.length >= MAX_DISH_CNT) {
            return false;
        }

        const dx = x * this.pixelRatio - this.width / 2;
        const dy = y * this.pixelRatio - this.height / 2;
        if (dx * dx + dy * dy > this.radius * this.radius) {
            // Outside
            return false;
        }

        const blob = new Blob(
            x * this.pixelRatio,
            this.height - y * this.pixelRatio,
            Math.round((Math.random() * 0.5 + 0.5) * this.maxBlobRadius),
            new Color(
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256)
            )
        );
        this.blobs.push(blob);

        this.gui.updateCurrentColor(blob.color);

        const dom = document.createElement('div');
        const style = `
            left: ${x}px;
            top: ${y}px;
        `;
        dom.setAttribute('style', style);
        dom.setAttribute('class', 'blob-hint');

        dom.addEventListener('mousedown', () => {
            this._isMouseDown = true;
            this._activeBlob = blob;
        });

        this.container.appendChild(dom);
        blob.dom = dom;
        return true;
    }

    /**
     * If can create another blob
     */
    canAddBlob(): boolean {
        return this.blobs.length < MAX_DISH_CNT;
    }

    /**
     * Move blob to new position
     *
     * @param blob blob to be moved
     * @param x x positoin to container
     * @param y y positoin to container
     */
    moveBlob(blob: Blob, x: number, y: number): void {
        const x0 = this.width / this.pixelRatio / 2;
        const y0 = this.height / this.pixelRatio / 2;
        const d2 = (x - x0) * (x - x0) + (y - y0) * (y - y0);
        const r = this.radius / this.pixelRatio;

        if (d2 > r * r) {
            // Outside of the radius
            const d = Math.sqrt(d2);
            x = r / d * (x - x0) + x0;
            y = r / d * (y - y0) + y0;
        }

        blob.move(
            x * this.pixelRatio,
            this.height - y * this.pixelRatio
        );

        if (blob.dom) {
            blob.dom.style.left = x + 'px';
            blob.dom.style.top = y + 'px';
        }
    }

    /**
     * Clear and empty all blobs
     */
    clearBlobes(): void {
        this.blobs.forEach(blob => {
            // Remove from DOM
            if (blob.dom) {
                this.container.removeChild(blob.dom);
            }
        });
        this.blobs = [];
    }

    pickColor(x: number, y: number): Color | null {
        x *= this.pixelRatio;
        y *= this.pixelRatio;
        return this.renderer.getColor(x, y, this);
    }

    useColor(x: number, y: number): Color | null {
        const color = this.pickColor(x, y);
        if (color) {
            this.history.addRecord(
                this.blobs,
                x / this.width,
                y / this.height,
                color
            );
            return color;
        }
        else {
            return null;
        }
    }

    private _initEventHandle(): void {
        this._isMouseDown = false;
        this._isMouseMoved = false;

        this.container.addEventListener('mousedown', () => {
            this._isMouseDown = true;
        });

        this.container.addEventListener('mousemove', event => {
            const x = event.clientX - this.container.offsetLeft;
            const y = event.clientY - this.container.offsetTop;
            if (this._isMouseDown && this._activeBlob) {
                this.moveBlob(this._activeBlob, x, y);
                this._isMouseMoved = true;
            }
            if (this.gui.status === GuiStatus.PICK) {
                this.gui.updateCurrentColor(
                    this.pickColor(x, y)
                );
            }
        });

        this.container.addEventListener('mouseup', event => {
            if (this._isMouseDown && !this._isMouseMoved
            ) {
                const x = event.clientX - this.container.offsetLeft;
                const y = event.clientY - this.container.offsetTop;
                if (this.gui.status === GuiStatus.ADD) {
                    this.addBlob(x, y);
                }
                else if (this.gui.status === GuiStatus.PICK) {
                    this.useColor(x, y);
                }
            }

            this._isMouseDown = false;
            this._isMouseMoved = false;
            this._activeBlob = undefined;
        });
    }

    private _updateRadius(): void {
        this.radius = Math.min(this.width, this.height) / 2
            * PALETTE_RADIUS_RATIO;
    }

}
