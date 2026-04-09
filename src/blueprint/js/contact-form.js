import {
    Left,
    Right,
    Task,
    Just,
    getElementById,
    addEventListener,
    querySelectorWithin,
} from './lray138fp.min.js';

const SUBMIT_FEEDBACK_MS = 600;

document.addEventListener('DOMContentLoaded', function () {
    getElementById('contact-form').map(addEventListener('submit', handleSubmit));
});

document.addEventListener('up:fragment:loaded', function () {
    getElementById('contact-form').map(addEventListener('submit', handleSubmit));
});

document.addEventListener('up:fragment:inserted', function () {
    getElementById('contact-form').map(addEventListener('submit', handleSubmit));
});

const handleSubmit = (e) => {
    e.preventDefault();

    Right(e.target)
        .bind((form) => (form.checkValidity() ? Right(form) : Left(form)))
        .fork(
            (form) => {
                form.classList.add('was-validated');
                return Left('invalid form elements');
            },
            (form) => {
                disableFormElements(form);
                getElementById('alerts-bottom').tap((x) => (x.style.display = 'none'));

                toggleButtonText(form);

                submitForm(form).fork(
                    (rej) => {
                        setTimeout(
                            () => onFailure({ form, rej }),
                            SUBMIT_FEEDBACK_MS,
                        );
                    },
                    (res) => {
                        setTimeout(
                            () => onSuccess({ form, res }),
                            SUBMIT_FEEDBACK_MS,
                        );
                    },
                );
            },
        );
};

const disableFormElements = (form) => {
    for (const element of form.elements) {
        element.disabled = true;
    }
    return form;
};

const enableFormElements = (form) => {
    for (const element of form.elements) {
        element.disabled = false;
    }
};

const hideFormElements = (form) => {
    for (const element of form.elements) {
        element.style.display = 'none';

        const label = form.querySelector(`label[for="${element.id}"]`);
        if (label) {
            label.style.display = 'none';
        }
    }
};

const submitForm = (form) =>
    new Task((rej, res) => {
        const formData = {};
        for (const element of form.elements) {
            if (element.name) {
                formData[element.name] = element.value;
            }
        }

        try {
            fetch(form.action, {
                method: form.method,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(formData),
            })
                .then(res)
                .catch(rej);
        } catch (err) {
            rej(err);
        }
    });

const onFailure = (data) => {
    const form = data.form;

    getElementById('alerts-bottom')
        .map((x) => {
            x.style.display = 'block';
            return x;
        })
        .fork(
            () => {},
            (x) => {
                x.innerHTML =
                    '<div class="alert alert-danger" role="alert">There was a problem submitting your information.  Please try again.</div>';
            },
        );

    if (form) {
        enableFormElements(form);
        toggleButtonText(form);
    }
};

const toggleButtonText = (form) => {
    querySelectorWithin('button[type=submit]', form).tap((x) => {
        x.innerHTML =
            x.innerHTML.trim() === 'Send message' ? 'Sending...' : 'Send message';
    });
};

const alertBottom = (html) =>
    getElementById('alerts-bottom').map((el) => (el.innerHTML = html));

const switchCode = (code, message) => {
    switch (code) {
        case 200:
            return Just(
                `<div class="alert alert-success" role="alert">${message}</div>`,
            );
        case 404:
            return Just(
                '<div class="alert alert-warning" role="alert">The requested resource was not found.</div>',
            );
        case 409:
            return Just(
                `<div class="alert alert-warning" role="alert">${message}</div>`,
            );
        case 500:
            return Just(
                '<div class="alert alert-danger" role="alert">There was an error processing your request.  Please try again later.</div>',
            );
        default:
            return Just(
                `<div class="alert alert-info" role="alert">An unexpected status code was received: ${message}</div>`,
            );
    }
};

const onSuccess = (data) => {
    const form = data.form;
    const res = data.res;

    if (!res || typeof res.json !== 'function') {
        onFailure({ form, rej: new Error('Invalid response') });
        return;
    }

    const bodyPromise =
        res.status === 204 ? Promise.resolve({}) : res.json();

    bodyPromise
        .then((body) => {
            const httpOk = res.status === 200 || res.status === 204;
            const httpConflict = res.status === 409;

            if (httpOk || httpConflict) {
                hideFormElements(form);
            } else {
                enableFormElements(form);
            }

            getElementById('alerts-bottom').tap((el) => {
                el.style.display = 'block';
            });

            const appStatus = body && typeof body.status === 'number' ? body.status : res.status;
            const message =
                body && body.message != null ? String(body.message) : res.statusText || '';

            switchCode(appStatus, message).map(alertBottom);
        })
        .catch((error) => {
            console.error('Error parsing JSON:', error);
            onFailure({ form, rej: error });
        });
};
