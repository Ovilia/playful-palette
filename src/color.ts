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
     * Hue value 0~360. Returns 0 when is gray.
     */
    getHue(): number {
        const r = this.r;
        const g = this.g;
        const b = this.b;

        const max = Math.max(r, Math.max(g, b));
        const min = Math.min(r, Math.min(g, b));

        if (max === min) {
            // Gray
            return 0;
        }

        let hue;
        if (max === r) {
            hue = (g - b) / (max - min);
        }
        else if (max === g) {
            hue = 2 + (b - r) / (max - min);
        }
        else {
            hue = 4 + (r - g) / (max - min);
        }

        hue *= 60;
        if (hue < 0) {
            hue += 360;
        }

        return hue;
    }

    isEqual(color: Color): boolean {
        return this.r === color.r
            && this.g === color.g
            && this.b === color.b;
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
