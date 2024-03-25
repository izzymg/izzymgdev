const ACTIVATED_CLASSNAME = "activated"
const osPrefersDarkQuery = window.matchMedia("(prefers-color-scheme: dark)")

function getTheme() {
    const explicitThemePref = localStorage.getItem("theme")
    if(!explicitThemePref && osPrefersDarkQuery.matches) {
        return "dark"
    }
    return explicitThemePref
}

function setThemePref(theme) {
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
    console.log(getTheme())
    if(getTheme() == "dark") {
        document.body.classList.add("dark")
        document.body.classList.remove("light")
    } else {
        document.body.classList.add("light")
        document.body.classList.remove("dark")
    }
}

function hookButtons() {
    getButtons().dark.addEventListener("click", () => {
        setThemePref("dark");
    })
    getButtons().light.addEventListener("click", () => setThemePref("light"))
    getButtons().system.addEventListener("click", () => removeTheme())
}

setActiveButton()
hookButtons()
setBodyClass()
osPrefersDarkQuery.addEventListener("change", setBodyClass)