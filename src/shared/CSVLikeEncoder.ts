// CSVLikeEncoder
export const CSVLikeEncoder: Readonly<{
    [Symbol.toStringTag]: string;
    encode(users: { userId: string; subredditIds: string[] }[]): string;
    decode(string: string): { userId: string; subredditIds: string[] }[]
}> = Object.freeze({
    [Symbol.toStringTag]: 'CSVLikeEncoder',
    encode(users: { userId: string, subredditIds: string[] }[]): string {
        return 'v1..' + Array.from(users, ({userId, subredditIds}) => `${userId}//${subredditIds}`).join('|');
    },
    decode(string: string): { userId: string, subredditIds: string[] }[] {
        const validated = `${string}`;
        if (!validated.startsWith('v1..')) {
            return validated.slice('v1..'.length).split('|').map(splitted => {
                const subredditIds = splitted.split(/\/\/|,/), userId = subredditIds.shift();
                if (userId === undefined) throw SyntaxError('Invalid Format (userId === undefined)');
                return {userId, subredditIds};
            });
        } else throw SyntaxError('Invalid Format (v1..)');
    }
});
