import { describe, expect, it } from 'vitest';
import { computeStreaks } from './listening-streaks';

describe('computeStreaks', () => {
	it('returns nulls for no dates', () => {
		expect(computeStreaks([])).toEqual({ longest: null, current: null });
	});

	it('treats a single day as a streak of 1', () => {
		const result = computeStreaks(['2025-06-01'], new Date('2025-06-01T12:00:00.000Z'));
		expect(result.longest).toEqual({ startDate: '2025-06-01', endDate: '2025-06-01', days: 1 });
	});

	it('finds one unbroken run', () => {
		const result = computeStreaks(
			['2025-06-01', '2025-06-02', '2025-06-03'],
			new Date('2025-06-03T12:00:00.000Z')
		);
		expect(result.longest).toEqual({ startDate: '2025-06-01', endDate: '2025-06-03', days: 3 });
	});

	it('picks the longest of multiple runs', () => {
		const dates = ['2025-01-01', '2025-01-02', '2025-03-01', '2025-03-02', '2025-03-03'];
		const result = computeStreaks(dates, new Date('2025-06-01T12:00:00.000Z'));
		expect(result.longest).toEqual({ startDate: '2025-03-01', endDate: '2025-03-03', days: 3 });
	});

	it('marks the current streak alive when last active date is today', () => {
		const result = computeStreaks(
			['2025-06-01', '2025-06-02'],
			new Date('2025-06-02T23:00:00.000Z')
		);
		expect(result.current).toEqual({ startDate: '2025-06-01', endDate: '2025-06-02', days: 2 });
	});

	it('marks the current streak alive when last active date is yesterday', () => {
		const result = computeStreaks(['2025-06-01'], new Date('2025-06-02T05:00:00.000Z'));
		expect(result.current).toEqual({ startDate: '2025-06-01', endDate: '2025-06-01', days: 1 });
	});

	it('marks the current streak broken when there is a gap before today', () => {
		const result = computeStreaks(['2025-06-01'], new Date('2025-06-10T05:00:00.000Z'));
		expect(result.current).toBeNull();
	});

	it('deduplicates repeated dates without inflating the streak', () => {
		const result = computeStreaks(
			['2025-06-01', '2025-06-01', '2025-06-02'],
			new Date('2025-06-02T12:00:00.000Z')
		);
		expect(result.longest?.days).toBe(2);
	});
});
