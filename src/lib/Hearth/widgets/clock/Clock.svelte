<script lang="ts">
	import { timer } from '$lib/core/app/clock';
	import { lang, selectedLanguage } from '$lib/core/i18n';
	import {
		clockTimeOptions,
		hourInTimeZone,
		validTimeZone,
		type ClockHourFormat
	} from '../../clock';

	let {
		timezone,
		hour_format = 'auto',
		show_seconds = false,
		size = 'large'
	}: {
		timezone?: string;
		hour_format?: ClockHourFormat;
		show_seconds?: boolean;
		size?: 'small' | 'medium' | 'large';
	} = $props();

	const MAX_SIZE = {
		small: 'var(--h-type-hero)',
		medium: 'var(--h-type-clock-medium)',
		large: 'var(--h-type-clock)'
	};

	let now = $derived($timer);

	let activeTimezone = $derived(validTimeZone(timezone));
	let time = $derived(
		now.toLocaleTimeString(
			$selectedLanguage,
			clockTimeOptions(activeTimezone, hour_format, show_seconds)
		)
	);
	let date = $derived(
		now.toLocaleDateString($selectedLanguage, {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			...(activeTimezone ? { timeZone: activeTimezone } : {})
		})
	);
	let hour = $derived(hourInTimeZone(now, $selectedLanguage, activeTimezone));
	let greeting = $derived(
		$lang(
			hour < 12
				? 'hearth_good_morning'
				: hour < 18
					? 'hearth_good_afternoon'
					: 'hearth_good_evening'
		)
	);
</script>

<div class="face" style:--clock-max={MAX_SIZE[size]} style:--clock-chars={time.length}>
	<div class="clock">{time}</div>
	<div class="date">{date}</div>
	<div class="greeting">{greeting}</div>
</div>

<style>
	.face {
		container-type: inline-size;
	}

	/* the chosen size, shrunk so the time never overflows the rail's width */
	.clock {
		font-size: min(
			var(--clock-max),
			var(--clock-cap, var(--clock-max)),
			calc(100cqi / (var(--clock-chars) * 0.62))
		); /* literal ok: type tokens shrunk to the rail's width */
		font-weight: 600;
		line-height: 0.9;
		letter-spacing: -3px;
		color: var(--h-text-1);
	}

	.date {
		font-size: var(--h-type-emphasis);
		color: var(--h-text-4);
		margin-top: 10px;
		letter-spacing: 0.2px;
	}

	.greeting {
		font-size: var(--h-type-body);
		color: var(--h-text-5);
		margin-top: 2px;
	}
	@media (max-width: 900px) {
		.face {
			--clock-cap: var(--h-type-hero);
		}
	}

	@supports not (container-type: inline-size) {
		.clock {
			font-size: min(
				var(--clock-max),
				var(--clock-cap, var(--clock-max))
			); /* literal ok: the smaller of two type tokens */
		}
	}
</style>
