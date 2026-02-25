function attrsReducer(acc, value, key) {
	const v = value && typeof value.extract === 'function' ? value.extract() : value;
	if (v == null || v === false) {
		return acc;
	}

	const chunk = v === true
		? key
		: `${key}="${String(v).replace(/"/g, '&quot;')}"`;

	return acc === '' ? chunk : `${acc} ${chunk}`;
}

module.exports = attrsReducer;
