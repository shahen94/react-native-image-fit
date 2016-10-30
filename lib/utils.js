export const getPitagorasZ = (x, y) => (
	Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
);

export const backgroundValueCalculation = (x, y, BACKGROUND_VALUES) => (
	4 / 3 * BACKGROUND_VALUES.MAX - getPitagorasZ(x, y)
);

export const pow2abs = (a, b) => (
	Math.pow(Math.abs(a - b), 2)
);

export const centerCoords = (touches) => {
	const finger1 = touches[0];
	const finger2 = touches[2];

	return {
		x: (finger1.pageX + finger2.pageX) / 2,
		y: (finger1.pageY + finger2.pageY) / 2
	};
};

export const distance = (touches) => {
	const finger1 = touches[0];
	const finger2 = touches[1];

	return Math.sqrt(
		pow2abs(finger1.pageX, finger2.pageX) +
		pow2abs(finger1.pageY, finger2.pageY)
	);
};

export const toDegree = (radian) => (
	radian * 180 / Math.PI
);

export const angle = (touches) => {
	const finger1 = touches[0];
	const finger2 = touches[1];
	const mathAtan2 = Math.atan2(
		finger2.pageY - finger1.pageY,
		finger2.pageX -finger1.pageX
	);

	let degree = toDegree(mathAtan2);

	if (degree < 0) {
		deg += 360;
	}

	return degree;
};
