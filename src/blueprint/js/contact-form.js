import { 
    Left, Right, Future, Arr, Num, Just,
    getElementById, addEventListener, querySelectorWithin
} from './lray138fp.min.js';

document.addEventListener('DOMContentLoaded', function() {
    
    getElementById('contact-form')
        .map(addEventListener('submit', handleSubmit));
});

document.addEventListener('up:fragment:loaded', function(event) {
    console.log("fragment loaded for asdasdf");
    getElementById('contact-form')
        .map(addEventListener('submit', handleSubmit));
});

document.addEventListener('up:fragment:inserted', function(event) {
    console.log("fragment inserted for asdasdf");
    getElementById('contact-form')
        .map(addEventListener('submit', handleSubmit));
});

const handleSubmit = (e) => {
    e.preventDefault();

    Right(e.target)
        .bind(form => form.checkValidity() ? Right(form) : Left(form))
        .fork(
            form => {
                form.classList.add('was-validated');
                return Left("invalid form elements");
            },
            form => {
                disableFormElements(form);
                getElementById('alerts-bottom')
                    .tap(x => x.style.display = "none");
                    
                toggleButtonText(form);

                submitForm(form)
                    .sleep(600)
                    .fork(
                        (rej) => onFailure(Arr({form, rej})), 
                        (res) => onSuccess(Arr({form, res}))
                    )
            }
        );
}

const disableFormElements = (form) => {
    for (const element of form.elements) {
        element.disabled = true;
    }
    return form;
}

const enableFormElements = (form) => {
    for (const element of form.elements) {
        element.disabled = false;
    }
}

const hideElement = (e) => {
    e.style.display = 'none';
}

const hideFormElements = (form) => {
    for (const element of form.elements) {
        element.style.display = 'none';

        const label = form.querySelector(`label[for="${element.id}"]`);
        if (label) {
            label.style.display = 'none';
        }
    }
}

const submitForm = (form) => {

    // querySelector('button[type="submit"]', form).map(activateSubmitButton);
    // disableFormElements(form);

    return Future(() => {

        // Alternative method to collect form values
        const formData = {};
        for (const element of form.elements) {
            if (element.name) {
                formData[element.name] = element.value;
            }
        }

        try {
            return fetch(form.action, {
                method: form.method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        } catch (Error) {
            return Promise.reject();
        }

    });

}

const onFailure = (data) => {

    getElementById('alerts-bottom')
        .map(x => {
            x.style.display = "block";
            return x;
        })
        .either(
            x => console.log(x),
            x => x.innerHTML = `<div class="alert alert-danger" role="alert">There was a problem submitting your information.  Please try again.</div>`
        );
    
    data.prop('form')
        .tap(enableFormElements)
        .tap(toggleButtonText);

};

const toggleButtonText = (form) => {
    querySelectorWithin('button[type=submit]', form)
        .tap(x => {
            x.innerHTML = (x.innerHTML.trim() == "Send message") ? "Sending..." : "Send message";
        });
}

const alertBottom = (x) => getElementById('alerts-bottom').map(el => el.innerHTML = x);

const switchCode = (code, message) => {
    switch(code) {
        case 200: // success
            return Just(`<div class="alert alert-success" role="alert">${message}</div>`);
        case 404: // not found
            return Just(`<div class="alert alert-warning" role="alert">The requested resource was not found.</div>`);
        case 409: // conflict
            return Just(`<div class="alert alert-warning" role="alert">${message}</div>`);
        case 500: // server error
            return Just(`<div class="alert alert-danger" role="alert">There was an error processing your request.  Please try again later.</div>`);
        default:  // everything else
            return Just(`<div class="alert alert-info" role="alert">An unexpected status code was received: ${message}</div>`);
    }
}

const onSuccess = (x) => {
    try {
        const res = x.res();

        res.json().then(data => {

            if (res.status().eq(200) || res.status().eq(409)) {
                hideFormElements(x.form().get());
            } else {
                x.form().map(enableFormElements);
            }

            getElementById('alerts-bottom')
                .map(x => {
                    x.style.display = "block";
                    return x;
                })
                .map(x => x.innerHTML = 'wtf');
            
            switchCode(data.status, data.message).map(alertBottom);
        }).catch(error => {
            console.error('Error parsing JSON:', error);
            onFailure(x);
        });

    } catch (error) {
        console.error('Error in onSuccess:', error);
        onFailure(x);
    }

};

// src/pages/contact.ejs