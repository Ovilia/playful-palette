import { Color } from './color';


export class Dish {

    isDirty: boolean;
    dom?: HTMLDivElement;

    constructor(
        public x: number,
        public y: number,
        public radius: number,
        public color: Color
    ) {
        this.isDirty = true;
    }


    move(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.isDirty = true;
    }

    setRadius(r: number): void {
        this.radius = r;
        this.isDirty;
    }

}
