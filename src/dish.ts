import { Color } from './color';


export class Dish {

    public isDirty: boolean;
    public dom?: HTMLDivElement;

    constructor(public x: number, public y: number, public color: Color) {
        this.isDirty = true;
    }


    move(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.isDirty = true;
    }

}
