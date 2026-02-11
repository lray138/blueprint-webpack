// Accordion docs copy-to-clipboard handlers.
document.addEventListener('DOMContentLoaded', function() {
    function copyToClipboard(button, text) {
        navigator.clipboard.writeText(text).then(function() {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg>';
            button.classList.remove('btn-outline-secondary');
            button.classList.add('btn-success');

            setTimeout(function() {
                button.innerHTML = originalHTML;
                button.classList.remove('btn-success');
                button.classList.add('btn-outline-secondary');
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
        });
    }

    function ensureButtonForCode(codeElement) {
        const container = codeElement.closest('.tab-pane') || codeElement.parentElement;
        if (!container) {
            return;
        }

        let button = container.querySelector('.js-copy-html-btn');
        if (!button) {
            button = document.createElement('button');
            button.type = 'button';
            button.title = 'Copy HTML';
            button.className = 'btn btn-sm btn-outline-secondary border-0 position-absolute top-0 end-0 m-2 js-copy-html-btn';
            button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>';

            if (!container.classList.contains('position-relative')) {
                container.classList.add('position-relative');
            }

            container.appendChild(button);
        }

        button.addEventListener('click', function() {
            const text = codeElement.textContent || codeElement.innerText;
            copyToClipboard(button, text);
        });
    }

    document.querySelectorAll('pre > code').forEach(ensureButtonForCode);
});
