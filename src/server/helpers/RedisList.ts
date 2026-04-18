import {redis} from "@devvit/web/server";

export class RedisList {
    readonly #key: string;

    constructor(key: string) {
        this.#key = `${key}`;
    }

    addElement(value: string): Promise<number> {
        const member = `${value}`;
        return redis.zAdd(this.#key, {member, score: Date.now()});
    }

    lengthInList(): Promise<number> {
        return redis.zCard(this.#key);
    }

    getItemsInsertedBetween(start: Date | number, end: Date | number): Promise<{ member: string; score: number; }[]> {
        return redis.zRange(this.#key, +start, +end, {by: 'score'});
    }

    deleteAllElementsBefore(end: Date): Promise<number> {
        return redis.zRemRangeByScore(this.#key, 0, +end);
    }

    deleteRange(start: Date | number, end: Date | number): Promise<number> {
        return redis.zRemRangeByScore(this.#key, +start, +end);
    }
}
