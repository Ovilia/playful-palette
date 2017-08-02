export class Color {

    constructor(public r: number, public g: number, public b: number) {

    }

    toArray(): number[] {
        return [this.r, this.g, this.b];
    }

}