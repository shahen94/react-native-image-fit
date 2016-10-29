export const getPitagorasZ = (x, y) => {
	return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

export const backgroundValueCalculation = (x, y, BACKGROUND_VALUES) => {
	return 4 / 3 * BACKGROUND_VALUES.MAX - getPitagorasZ(x, y);
}