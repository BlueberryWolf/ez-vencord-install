/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export interface Gif {
	format: number;
	id: string;
	src: string;
	url: string;
	height: number;
	width: number;
}

export type FavoritedGifsChangedCallback = (favorites: Gif[]) => void;

class FavoritedGifs {
	callbacks: FavoritedGifsChangedCallback[] = {} as FavoritedGifsChangedCallback[];
	favorites: Gif[] = {} as Gif[];
}

export const favoritedGifs = new FavoritedGifs();

export default definePlugin({
	name: "FavoritedGifsProvider",
	description: "Patch to export the favorited GIFs.",
	authors: [Devs.Aria, {
		name: "hexa",
		id: 573643611317600256n,
	}],

	patches: [
		{
			find: "renderHeaderContent()",
			replacement: [
				{
					match: /(,suggestions:\i,favorites:)(\i),/,
					replace: "$1$self.getFav($2),"
				}
			]
		},
	],

	getFav(favorites: Gif[]) {
		favoritedGifs.favorites = favorites;
		for (let index = 0; index < favoritedGifs.callbacks.length; index++) {
			favoritedGifs.callbacks[index](favorites);
		}

		return favoritedGifs.favorites;
	},
});
