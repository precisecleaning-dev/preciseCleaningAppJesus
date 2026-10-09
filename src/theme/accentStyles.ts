import { StyleSheet } from 'react-native';
import { accents, type AccentName } from './tokens';

const names = Object.keys(accents) as AccentName[];
const build = (pick: (a: (typeof accents)[AccentName]) => object) => StyleSheet.create(Object.fromEntries(names.map((n) => [n, pick(accents[n])])) as Record<AccentName, object>);

export const solidBg = build((a) => ({ backgroundColor: a.solid }));
export const softBg = build((a) => ({ backgroundColor: a.soft }));
export const inkText = build((a) => ({ color: a.ink }));
