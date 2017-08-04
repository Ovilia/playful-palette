import { Color } from './color';
import { Blob } from './blob';


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
    blobs: Blob[];

    constructor(blobs: Blob[]) {
        this.records = [];
        this.blobs = blobs.map(blob => blob.clone());
    }

}


export class History {

    snapshots: HistorySnapshot[];
    lastBlobes: Blob[];

    constructor() {
        this.snapshots = [];
        this.lastBlobes = [];
    }

    addRecord(blobs: Blob[], x: number, y: number, color: Color) {
        if (this.areBlobesChangedSufficiently(this.lastBlobes, blobs)) {
            const snapshot = new HistorySnapshot(blobs);

            snapshot.records.push(new HistoryRecord(x, y, color));

            this.snapshots.push(snapshot);
            this.lastBlobes = snapshot.blobs;
        }
    }

    createNewSnapshot(blobs: Blob[]) {
        this.snapshots.push(new HistorySnapshot(blobs));
    }

    areBlobesChangedSufficiently(aBlobes: Blob[], bBlobes: Blob[]) {
        if (aBlobes.length !== bBlobes.length) {
            return true;
        }

        for (let len = aBlobes.length, i = 0; i < len; ++i) {
            if (aBlobes[i].color.distance(bBlobes[i].color) > 0.2) {
                return true;
            }
        }
        return false;
    }

}
