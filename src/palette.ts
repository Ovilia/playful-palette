import { History } from './history';
import { Gui, GuiStatus } from './gui';
import { Color } from './color';
import { Renderer } from './renderer';
import { Dish } from './dish';


const MAX_DISH_CNT = 7;
const PALETTE_RADIUS_RATIO = 0.5;

export class Palette {

    width: number;
    height: number;
    canvas: HTMLCanvasElement;

    dishes: Dish[];
    maxDishRadius: number;

    gui: Gui;
    history: History;

    renderer: Renderer;
    pixelRatio: number;

    radius: number;

    private _isMouseDown: boolean;
    private _isMouseMoved: boolean;
    private _dishDoms: HTMLDivElement[];
    private _activeDish?: Dish;

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

        this.dishes = [];
        this.maxDishRadius = 400;

        this._dishDoms = [];

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
            // Update dish position when width or height changed
            this.dishes.forEach(dish => {
                const x = dish.x * <number>width / this.width;
                const y = dish.y * <number>height / this.height;

                if (dish.dom) {
                    dish.dom.style.left = x / this.pixelRatio + 'px';
                    dish.dom.style.top =
                        (<number>height - y) / this.pixelRatio + 'px';
                }

                dish.move(x, y);
            });

            this.width = width;
            this.height = height;
        }
    }

    /**
     * Add a new dish to canvas
     *
     * @param x x position to container
     * @param y y position to container
     * @return if succeed
     */
    addDish(x: number, y: number): boolean {
        if (this.dishes.length >= MAX_DISH_CNT) {
            return false;
        }

        const dx = x * this.pixelRatio - this.width / 2;
        const dy = y * this.pixelRatio - this.height / 2;
        if (dx * dx + dy * dy > this.radius * this.radius) {
            // Outside
            return false;
        }

        const dish = new Dish(
            x * this.pixelRatio,
            this.height - y * this.pixelRatio,
            Math.round((Math.random() * 0.5 + 0.5) * this.maxDishRadius),
            new Color(
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256)
            )
        );
        this.dishes.push(dish);

        this.gui.updateCurrentColor(dish.color);

        const dom = document.createElement('div');
        const style = `
            left: ${x}px;
            top: ${y}px;
        `;
        dom.setAttribute('style', style);
        dom.setAttribute('class', 'dish-hint');

        dom.addEventListener('mousedown', () => {
            this._isMouseDown = true;
            this._activeDish = dish;
        });

        this.container.appendChild(dom);
        dish.dom = dom;
        return true;
    }

    /**
     * If can create another dish
     */
    canAddDish(): boolean {
        return this.dishes.length < MAX_DISH_CNT;
    }

    /**
     * Move dish to new position
     *
     * @param dish dish to be moved
     * @param x x positoin to container
     * @param y y positoin to container
     */
    moveDish(dish: Dish, x: number, y: number): void {
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

        dish.move(
            x * this.pixelRatio,
            this.height - y * this.pixelRatio
        );

        if (dish.dom) {
            dish.dom.style.left = x + 'px';
            dish.dom.style.top = y + 'px';
        }
    }

    /**
     * Clear and empty all dishes
     */
    clearDishes(): void {
        this.dishes.forEach(dish => {
            // Remove from DOM
            if (dish.dom) {
                this.container.removeChild(dish.dom);
            }
        });
        this.dishes = [];
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
                this.dishes,
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
            if (this._isMouseDown && this._activeDish) {
                this.moveDish(this._activeDish, x, y);
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
                    this.addDish(x, y);
                }
                else if (this.gui.status === GuiStatus.PICK) {
                    this.useColor(x, y);
                }
            }

            this._isMouseDown = false;
            this._isMouseMoved = false;
            this._activeDish = undefined;
        });
    }

    private _updateRadius(): void {
        this.radius = Math.min(this.width, this.height) / 2
            * PALETTE_RADIUS_RATIO;
    }

}
