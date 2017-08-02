import { Color } from './color';
import { Renderer } from './renderer';
import { Dish } from './dish';


export class Palette {

    width: number;
    height: number;

    dishes: Dish[];
    maxDishRadius: number;

    renderer: Renderer;
    pixelRatio: number;

    private _isMouseDown: boolean;
    private _isMouseMoved: boolean;
    private _dishDoms: HTMLDivElement[];
    private _activeDish?: Dish;

    constructor(public canvas: HTMLCanvasElement) {
        this.width = canvas.width;
        this.height = canvas.height;
        this.pixelRatio = 2;

        this.dishes = [];
        this.maxDishRadius = 500;

        this._dishDoms = [];

        this._initEventHandle();

        this.renderer = new Renderer(canvas);
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
     */
    addDish(x: number, y: number): void {
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

        const dom = document.createElement('div');
        const style = `
            border-radius: 50%;
            width: 10px;
            height: 10px;
            background: #0ff;
            margin-left: -5px;
            margin-top: -5px;
            position: absolute;
            cursor: pointer;
            left: ${x}px;
            top: ${y}px;
        `;
        dom.setAttribute('style', style);

        dom.addEventListener('mousedown', () => {
            this._isMouseDown = true;
            this._activeDish = dish;
        });

        if (this.canvas.parentNode) {
            this.canvas.parentNode.appendChild(dom);
        }
        dish.dom = dom;
    }

    /**
     * Move dish to new position
     *
     * @param dish dish to be moved
     * @param x x positoin to container
     * @param y y positoin to container
     */
    moveDish(dish: Dish, x: number, y: number): void {
        dish.move(
            x * this.pixelRatio,
            this.height - y * this.pixelRatio
        );

        if (dish.dom) {
            dish.dom.style.left = x + 'px';
            dish.dom.style.top = y + 'px';
        }
    }

    private _initEventHandle(): void {
        this._isMouseDown = false;
        this._isMouseMoved = false;
        const parent = <HTMLDivElement>this.canvas.parentNode;
        if (!parent) {
            return;
        }

        parent.addEventListener('mousedown', () => {
            this._isMouseDown = true;
        });

        parent.addEventListener('mousemove', event => {
            if (this._isMouseDown && this._activeDish) {
                var container = this.canvas.parentNode;
                if (container) {
                    const x = event.clientX - (<any>container).offsetLeft;
                    const y = event.clientY - (<any>container).offsetTop;
                    this.moveDish(this._activeDish, x, y);
                }
                this._isMouseMoved = true;
            }
        });

        parent.addEventListener('mouseup', event => {
            console.log(event);
            if (this._isMouseDown && !this._isMouseMoved) {
                var container = this.canvas.parentNode;
                if (container) {
                    const x = event.clientX - (<any>container).offsetLeft;
                    const y = event.clientY - (<any>container).offsetTop;
                    this.addDish(x, y);
                }
            }

            this._isMouseDown = false;
            this._isMouseMoved = false;
            this._activeDish = undefined;
        });
    }

}
