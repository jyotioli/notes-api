function normalizeToUtcDate(value) {
	const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

	if (Number.isNaN(date.getTime())) {
		throw new Error('Invalid date value');
	}

	return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function calculateDaysBetween(startDate, endDate) {
	const startUtc = normalizeToUtcDate(startDate);
	const endUtc = normalizeToUtcDate(endDate);
	const millisecondsPerDay = 24 * 60 * 60 * 1000;

	return Math.round(Math.abs(endUtc - startUtc) / millisecondsPerDay);
}

module.exports = {
	calculateDaysBetween,
};
