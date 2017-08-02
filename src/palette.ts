import { Color } from './color';
import { Renderer } from './renderer';
import { Dish } from './dish';


export class Palette {

    width: number;
    height: number;

    dishes: Dish[];

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
        this.renderer.resize(width, height);

        this.width = this.renderer.width;
        this.height = this.renderer.height;
    }

    /**
     * Add a new dish to canvas
     *
     * @param x x position
     * @param y y position
     */
    addDish(x: number, y: number): void {
        const dish = new Dish(
            x * this.pixelRatio,
            this.height - y * this.pixelRatio,
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
                console.log('down');
        });

        if (this.canvas.parentNode) {
            this.canvas.parentNode.appendChild(dom);
        }
        dish.dom = dom;
    }

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
                this.moveDish(this._activeDish, event.clientX, event.clientY);
                this._isMouseMoved = true;
            }
        });

        parent.addEventListener('mouseup', event => {
            if (this._isMouseDown && !this._isMouseMoved) {
                this.addDish(event.clientX, event.clientY);
            }

            this._isMouseDown = false;
            this._isMouseMoved = false;
            this._activeDish = undefined;
        });
    }

}
