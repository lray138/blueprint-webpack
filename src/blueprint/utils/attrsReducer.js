function attrsReducer(acc, value, key) {
	// Keys used for composition, not rendered as HTML attributes.
	if (key === 'class_add') {
		return acc;
	}

	const v = value && typeof value.extract === 'function' ? value.extract() : value;
	if (v == null || v === false) {
		return acc;
	}

	const attrKey = key === 'class_names' ? 'class' : key;
	const chunk = v === true
		? attrKey
		: `${attrKey}="${String(v).replace(/"/g, '&quot;')}"`;

	return acc === '' ? chunk : `${acc} ${chunk}`;
}

module.exports = attrsReducer;
