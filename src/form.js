(function() { 
    let form = document.querySelector(".contact-form")
    let button = form.querySelector("button")
    form.addEventListener("submit", e => {
        e.preventDefault()
        e.stopImmediatePropagation()
        button.textContent = "Sending"
        button.disabled = true
            setTimeout(() => {
            button.textContent = "Sent!"
        }, 500)
    })
})()