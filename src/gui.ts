import { Color } from './color';


export enum GuiStatus {
    PICK = 1,
    MOVE,
    DELETE,
    ADD // TMP
};


export class Gui {

    status: GuiStatus;

    private _btnDoms: any;

    constructor(public container: HTMLDivElement) {
        this.status = GuiStatus.ADD;

        this._initCss();
        this._initDom();
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


    private _initCss() {
        const style = document.createElement('style');
        style.type = 'text/css';

        const diameter = '36px';
        const padding = '5px';
        style.innerHTML = `
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
        })
    }

}
