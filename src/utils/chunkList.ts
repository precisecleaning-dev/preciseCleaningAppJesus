export const chunkList = <Item>(items: Item[], size: number): Item[][] => {
    const chunks: Item[][] = [];
    for (let start = 0; start < items.length; start += size) chunks.push(items.slice(start, start + size));
    return chunks;
};
