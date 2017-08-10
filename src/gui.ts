import { Palette } from './palette';
import { Blob } from './blob';
import { Color } from './color';


export enum GuiStatus {
    PICK = 1,
    MOVE,
    DELETE,
    ADD // TMP
};

const SVG_URI = 'http://www.w3.org/2000/svg';

const MAX_WHEEL_RADIAN = Math.PI / 32;
// const FULL_WHEEL_SIZE = Math.floor(Math.PI * 2 / MAX_WHEEL_RADIAN);


export class Gui {

    status: GuiStatus;

    wheelInnerRadius: number;
    wheelOutterRadius: number;
    wheelWidth: number;

    private _btnDoms: any;
    private _wheelDom: SVGSVGElement;

    private _usedColors: Color[];
    private _usedColorDoms: SVGPathElement[];

    private _isMouseDown: boolean;
    private _isMouseMoved: boolean;

    private _blobDoms: HTMLDivElement[];
    private _activeBlob?: Blob;

    constructor(
        public palette: Palette,
        public container: HTMLDivElement,
        diskRadius: number
    ) {
        this.status = GuiStatus.ADD;

        this.wheelWidth = 30;
        this.wheelInnerRadius = diskRadius + 2;
        this.wheelOutterRadius = this.wheelInnerRadius + this.wheelWidth;

        this._usedColors = [];
        this._usedColorDoms = [];

        this._initCss();
        this._initDom();
        this._initEventHandle();
    }


    setStatus(status: GuiStatus) {
        if (status === GuiStatus.PICK) {
            this.container.setAttribute('class', 'pp-pick');
        }
        else if (status === GuiStatus.MOVE) {
            this.container.setAttribute('class', 'pp-move');
        }
        else {
            this.container.setAttribute('class', '');
        }

        this.status = status;
    }

    updateCurrentColor(color: Color | null): void {
        if (color) {
            this._btnDoms['current'].style.backgroundColor = color.toHex();
        }
    }

    useColor(color: Color): void {
        if (this._getColorId(color) >= 0) {
            // Color has been used, do nothing
            return;
        }

        const id = this._getColorInsertIndex(color);
        console.log(id)

        const cnt = this._usedColors.length + 1;
        // if (cnt <= FULL_WHEEL_SIZE) {
            // Wheel is not full
            this._usedColors.forEach((color, i) => {
                // New id after insert new color
                const colorId = i < id ? i : i + 1;
                const d = getPath(
                    this.wheelOutterRadius,
                    this.wheelOutterRadius,
                    colorId,
                    cnt,
                    MAX_WHEEL_RADIAN,
                    this.wheelInnerRadius,
                    this.wheelOutterRadius
                );

                const path = this._usedColorDoms[i];
                path.setAttribute('d', d);
                path.setAttribute('fill', color.toHex());
            });

            // Create new color in wheel
            const path = document.createElementNS(SVG_URI, 'path');
            const d = getPath(
                this.wheelOutterRadius,
                this.wheelOutterRadius,
                id,
                cnt,
                MAX_WHEEL_RADIAN,
                this.wheelInnerRadius,
                this.wheelOutterRadius
            );
            path.setAttribute('d', d);
            path.setAttribute('fill', color.toHex());

            this._wheelDom.appendChild(path);
            this._usedColorDoms.push(path);
            this._usedColors.push(color);
        // }
    }

    addBlob(blob: Blob, x: number, y: number): HTMLDivElement {
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
        return dom;
    }


    private _initCss() {
        const style = document.createElement('style');
        style.type = 'text/css';

        const diameter = '36px';
        const padding = '5px';
        style.innerHTML = `
            .pp-main-canvas {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
            }

            .pp-wheel {
                position: absolute;
                left: 50%;
                top: 50%;
                width: ${this.wheelOutterRadius * 2}px;
                height: ${this.wheelOutterRadius * 2}px;
                margin-left: -${this.wheelOutterRadius}px;
                margin-top: -${this.wheelOutterRadius}px;
            }

                .pp-wheel-inner {
                    fill: none;
                    stroke: #ccc;
                }

            .pp-pick {
                cursor: crosshair;
            }

            .pp-btn {
                position: absolute;
                width: ${diameter};
                height: ${diameter};
                border-radius: 50%;
                border: 1px solid #ddd;
                cursor: pointer;
            }

                .pp-btn:after {
                    content: attr(data-txt); /* TMP */
                }

                .pp-btn-current {
                    top: ${padding};
                    right: ${padding};
                }

                .pp-btn-pick {
                    top: ${padding};
                    left: ${padding};
                }

                .pp-btn-move {
                    left: ${padding};
                    bottom: ${padding};
                }

                .pp-btn-delete {
                    bottom: ${padding};
                    right: ${padding};
                }

            .blob-hint {
                display: none;
                position: absolute;
                width: 10px;
                height: 10px;
                margin-left: -5px;
                margin-top: -5px;
                border-radius: 50%;
                border: 1px solid #ddd;
                cursor: move;
            }

                .pp-move .blob-hint {
                    display: block;
                }
        `;

        let head: any = document.getElementsByTagName('head');
        if (head) {
            head = head[0];
        }
        else {
            head = document.createElement('head');
            document.body.appendChild(head);
        }

        head.appendChild(style);
    }

    private _initDom(): void {
        this._blobDoms = [];

        this._btnDoms = {};

        const names = ['current', 'pick', 'delete', 'move'];
        names.forEach(btn => {
            const dom = document.createElement('a');
            dom.setAttribute('class', 'pp-btn pp-btn-' + btn);
            this.container.appendChild(dom);

            if (btn !== 'current') {
                dom.setAttribute('data-txt', btn);
            }

            if (btn === 'pick') {
                dom.addEventListener('click', () => {
                    // TMP
                    // this.setStatus(GuiStatus.PICK);
                    if (this.status === GuiStatus.PICK) {
                        this.setStatus(GuiStatus.ADD);
                    }
                    else {
                        this.setStatus(GuiStatus.PICK);
                    }
                });
            }
            else if (btn === 'delete') {
                dom.addEventListener('click', () => {
                    this.setStatus(GuiStatus.DELETE);
                });
            }
            else if (btn === 'move') {
                dom.addEventListener('click', () => {
                    this.setStatus(GuiStatus.MOVE);
                });
            }

            this._btnDoms[btn] = dom;
        });

        const diameter = this.wheelOutterRadius * 2 + '';
        this._wheelDom = document.createElementNS(SVG_URI, 'svg');
        this._wheelDom.setAttribute('width', diameter);
        this._wheelDom.setAttribute('height', diameter);
        this._wheelDom.setAttribute('class', 'pp-wheel');
        this.container.appendChild(this._wheelDom);

        const innerCircle = document.createElementNS(SVG_URI, 'circle');
        innerCircle.setAttribute('class', 'pp-wheel-inner');
        const xy = this.wheelOutterRadius + '';
        innerCircle.setAttribute('cx', xy);
        innerCircle.setAttribute('cy', xy);
        innerCircle.setAttribute('r', this.wheelInnerRadius + '');
        this._wheelDom.appendChild(innerCircle);
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
                this.palette.moveBlob(this._activeBlob, x, y);
                this._isMouseMoved = true;
            }
            if (this.status === GuiStatus.PICK) {
                this.updateCurrentColor(
                    this.palette.pickColor(x, y)
                );
            }
        });

        this.container.addEventListener('mouseup', event => {
            if (this._isMouseDown && !this._isMouseMoved
            ) {
                const x = event.clientX - this.container.offsetLeft;
                const y = event.clientY - this.container.offsetTop;
                if (this.status === GuiStatus.ADD) {
                    this.palette.addBlob(x, y);
                }
                else if (this.status === GuiStatus.PICK) {
                    this.palette.useColor(x, y);
                }
            }

            this._isMouseDown = false;
            this._isMouseMoved = false;
            this._activeBlob = undefined;
        });
    }

    /**
     * Get index in this._usedColors that a new color should be
     *
     * @param colorToInsert color to be inserted into this._usedColors
     */
    private _getColorInsertIndex(colorToInsert: Color): number {
        const hue = colorToInsert.getHue();
        return this._usedColors
            .filter(color => color.getHue() < hue)
            .length;
    }

    /**
     * Get index in this._usedColors if color is equal to any of it
     *
     * @param color color to query
     */
    private _getColorId(color: Color): number {
        for (let i = this._usedColors.length - 1; i >= 0; --i) {
            if (this._usedColors[i].isEqual(color)) {
                // The color to be inserted has already be there
                return i;
            }
        }
        return -1;
    }

}

function getPath(
    rx: number,
    ry: number,
    id: number,
    cnt: number,
    maxRadian: number,
    r0: number,
    r1: number
): string {
    if (cnt <= 0) {
        return '';
    }

    const radian = Math.min(Math.PI * 2 / cnt, maxRadian);
    const theta0 = radian * id - Math.PI / 2;
    const theta1 = theta0 + radian;

    const cosTheta0 = Math.cos(theta0);
    const sinTheta0 = Math.sin(theta0);
    const x0 = rx + r0 * cosTheta0;
    const y0 = ry + r0 * sinTheta0;
    const x1 = rx + r1 * cosTheta0;
    const y1 = ry + r1 * sinTheta0;

    const cosTheta1 = Math.cos(theta1);
    const sinTheta1 = Math.sin(theta1);
    const x2 = rx + r1 * cosTheta1;
    const y2 = rx + r1 * sinTheta1;
    const x3 = rx + r0 * cosTheta1;
    const y3 = ry + r0 * sinTheta1;

    return `
        M ${x0} ${y0}
        L ${x1} ${y1}
        A ${rx} ${ry} 0 0 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${rx} ${ry} 0 0 0 ${x0} ${y0}
        Z
    `;
}
