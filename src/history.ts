import { Color } from './color';
import { Dish } from './dish';


export class HistoryRecord {

    color: string; // In hex

    /**
     * @param x event.x * pixelRatio / canvas.width, 0~1
     * @param y
     * @param color
     */
    constructor(public x: number, public y: number, color: Color) {
        this.color = color.toHex();
    }

}


export class HistorySnapshot {

    records: HistoryRecord[];
    dishes: Dish[];

    constructor(dishes: Dish[]) {
        this.records = [];
        this.dishes = dishes.map(dish => dish.clone());
    }

}


export class History {

    snapshots: HistorySnapshot[];
    lastDishes: Dish[];

    constructor() {
        this.snapshots = [];
        this.lastDishes = [];
    }

    addRecord(dishes: Dish[], x: number, y: number, color: Color) {
        if (this.areDishesChangedSufficiently(this.lastDishes, dishes)) {
            const snapshot = new HistorySnapshot(dishes);

            snapshot.records.push(new HistoryRecord(x, y, color));

            this.snapshots.push(snapshot);
            this.lastDishes = snapshot.dishes;
        }
    }

    createNewSnapshot(dishes: Dish[]) {
        this.snapshots.push(new HistorySnapshot(dishes));
    }

    areDishesChangedSufficiently(aDishes: Dish[], bDishes: Dish[]) {
        if (aDishes.length !== bDishes.length) {
            return true;
        }

        for (let len = aDishes.length, i = 0; i < len; ++i) {
            if (aDishes[i].color.distance(bDishes[i].color) > 0.2) {
                return true;
            }
        }
        return false;
    }

}
