const ACTIVATED_CLASSNAME = "activated"

function getTheme() {
    return localStorage.getItem("theme")
}

function setTheme(theme) {
    localStorage.setItem("theme", theme)
    setActiveButton()
    setBodyClass()
}

function removeTheme() {
    localStorage.removeItem("theme")
    setActiveButton()
    setBodyClass()
}

function getButtons() {
    return {
        system: document.querySelector("#theme-system-btn"),
        light: document.querySelector("#theme-light-btn"),
        dark: document.querySelector("#theme-dark-btn"),
    }
}

function setActiveButton() {

    const buttons = getButtons()
    const theme = getTheme()

    buttons.light.classList.remove(ACTIVATED_CLASSNAME)
    buttons.dark.classList.remove(ACTIVATED_CLASSNAME)
    buttons.system.classList.remove(ACTIVATED_CLASSNAME)
    if(!theme) {
        buttons.system.classList.add(ACTIVATED_CLASSNAME)
    } else {
        buttons[theme].classList.add(ACTIVATED_CLASSNAME)
    }
}

function setBodyClass() {
    if(getTheme() == "dark") {
        document.body.classList.add("dark")
        document.body.classList.remove("light")
    } else if(getTheme() == "light") {
        document.body.classList.add("light")
        document.body.classList.remove("dark")
    } else {
        document.body.classList.remove("dark")
        document.body.classList.remove("light")
    }
}

function hookButtons() {
    getButtons().dark.addEventListener("click", () => setTheme("dark"))
    getButtons().light.addEventListener("click", () => setTheme("light"))
    getButtons().system.addEventListener("click", () => removeTheme())
}

setActiveButton()
hookButtons()
setBodyClass()