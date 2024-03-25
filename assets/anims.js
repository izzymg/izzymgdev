function observeCards() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add("shown")
            } else {
                entry.target.classList.remove("shown")
            }
        })
    })

    Array.from(document.querySelectorAll(".observed")).forEach(card => observer.observe(card))
}
observeCards();