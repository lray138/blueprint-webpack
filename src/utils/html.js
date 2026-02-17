function getAttributes(locals) {
    var { utils, class_add, element, content, ...attrs } = locals;

    // allow class_names as an alias for class
    if (attrs.class_names !== undefined) {
        attrs.class = attrs.class_names;
        delete attrs.class_names;
    }

    var attributes = Object.entries(attrs)
        .filter(([key, val]) => val !== undefined && val !== null && val !== false)
        .map(([key, val]) => {
            if (val === true) return key; // boolean attributes like "disabled"
            return `${key}="${val}"`;
        })
        .join(' ');

    return attributes.length ? ` ${attributes}` : '';
}

module.exports = getAttributes;