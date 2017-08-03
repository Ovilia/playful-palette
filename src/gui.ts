export enum GuiStatus {
    PICK = 1,
    SELECT
};


export class Gui {

    status: GuiStatus;

    private _currentDom: HTMLElement;

    constructor(public container: HTMLDivElement) {
        this.status = GuiStatus.PICK;

        this._initCss();

        this._currentDom = document.createElement('a');
        this._currentDom.setAttribute('class', 'current-color');
    }

    setStatus(status: GuiStatus) {
        if (status === GuiStatus.PICK) {
            this.container.setAttribute('class', 'pp-pick');
        }
        else {
            this.container.setAttribute('class', '');
        }

        this.status = status;
    }


    private _initCss() {
        const style = document.createElement('style');
        style.type = 'text/css';

        const diameter = '20px';
        style.innerHTML = `
            .current-color {
                position: absolute;
                top: 0;
                right: 0;
                width: ${diameter};
                height: ${diameter};
                border-radius: 50%;
            }

            .dish-hint {
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

            .pp-pick .dish-hint {
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

}
