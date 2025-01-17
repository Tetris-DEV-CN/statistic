import data_ranks from '../src/data/ranks.json'

import { differenceInDays } from 'date-fns'
import Tetrio, { TetraLeagueRank } from 'tetrio.js'
import { writeFile } from 'node:fs/promises'
import { filter, isArray, isDefined, pipe, sortBy, sumBy } from 'remeda'
import { RankData } from '../src/types/data/ranks'

(async () => {
	const rank_percentiles: Record<Exclude<TetraLeagueRank, 'z'>, number> = {
		x: 1,
		u: 5,
		ss: 11,
		's+': 17,
		s: 23,
		's-': 30,
		'a+': 38,
		a: 46,
		'a-': 54,
		'b+': 62,
		b: 70,
		'b-': 78,
		'c+': 84,
		c: 90,
		'c-': 95,
		'd+': 97.5,
		d: 100
	} as const

	const players = await new Tetrio.Client()
		.getLeagueLeaderboard({
			all: true
		})

	const ranks: RankData[] = isArray(data_ranks) ? data_ranks : []

	for (const [rank, percentile] of Object.entries(rank_percentiles)) {
		const rank_players = players.filter(player => rank === player.league.rank)
		const position = Math.floor((percentile / 100) * players.length) - 1

		const apm_leaderboard = sortBy(rank_players, player => player.league.apm)
		const pps_leaderboard = sortBy(rank_players, player => player.league.pps)
		const vs_leaderboard = sortBy(rank_players, player => player.league.vs)

		const minimum_apm_player = apm_leaderboard.at(0)
		const minimum_pps_player = pps_leaderboard.at(0)
		const minimum_vs_player = vs_leaderboard.at(0)

		const maximum_apm_player = apm_leaderboard.at(-1)
		const maximum_pps_player = pps_leaderboard.at(-1)
		const maximum_vs_player = vs_leaderboard.at(-1)

		ranks.push({
			name: rank,
			player_count: rank_players.length,
			require_tr: players[position].league.rating,

			average_pps: pipe(
				rank_players,
				filter(player => isDefined(player.league.pps)),
				sumBy(player => player.league.pps)
			) / rank_players.length,
			average_apm: pipe(
				rank_players,
				filter(player => isDefined(player.league.apm)),
				sumBy(player => player.league.apm)
			) / rank_players.length,
			average_vs: pipe(
				rank_players,
				filter(player => isDefined(player.league.vs)),
				sumBy(player => player.league.vs)
			) / rank_players.length,

			minimum_apm_player: {
				id: minimum_apm_player.id,
				name: minimum_apm_player.name,
				value: minimum_apm_player.league.apm
			},
			minimum_pps_player: {
				id: minimum_pps_player.id,
				name: minimum_pps_player.name,
				value: minimum_pps_player.league.pps
			},
			minimum_vs_player: {
				id: minimum_vs_player.id,
				name: minimum_vs_player.name,
				value: minimum_vs_player.league.vs
			},

			maximum_apm_player: {
				id: maximum_apm_player.id,
				name: maximum_apm_player.name,
				value: maximum_apm_player.league.apm
			},
			maximum_pps_player: {
				id: maximum_pps_player.id,
				name: maximum_pps_player.name,
				value: maximum_pps_player.league.pps
			},
			maximum_vs_player: {
				id: maximum_vs_player.id,
				name: maximum_vs_player.name,
				value: maximum_vs_player.league.vs
			},
			updated_at: new Date().toLocaleString()
		})
	}

	const final_ranks = ranks.filter(rank => {
		return Math.abs(differenceInDays(Date.now(), new Date(rank.updated_at))) <= 7
	})

	await writeFile('src/data/ranks.json', JSON.stringify(final_ranks), {
		flag: 'w'
	})
})()