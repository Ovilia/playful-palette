export class Color {

    /**
     * @param r red, 0~255
     * @param g green, 0~255
     * @param b blue, 0~255
     */
    constructor(public r: number, public g: number, public b: number) {

    }


    toArray(): number[] {
        return [this.r, this.g, this.b];
    }

    toHex(): string {
        return '#'
            + decimalToHex(this.r)
            + decimalToHex(this.g)
            + decimalToHex(this.b);
    }

    /**
     * Color distance to another color, in RGB space
     *
     * @param color another color
     * @return distance 0~1
     */
    distance(color: Color): number {
        const dr = (this.r - color.r) / 255;
        const dg = (this.g - color.g) / 255;
        const db = (this.b - color.b) / 255;
        return (dr * dr + dg * dg + db * db) / 3;
    }

    clone(): Color {
        return new Color(this.r, this.g, this.b);
    }

}


/**
 * Convert from color number to hex
 *
 * @param n r, g, or b, 0~255
 */
function decimalToHex(n: number): string {
    const hex = n.toString(16);
    if (hex.length < 2) {
        return '0' + hex;
    }
    else {
        return hex;
    }
}
