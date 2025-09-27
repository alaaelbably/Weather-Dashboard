const apiKey = "ede93f447792d49d16c2f8dd356471ad";
const weatherURL = "https://api.openweathermap.org/data/2.5/weather";
const airURL = "https://api.openweathermap.org/data/2.5/air_pollution";
const forecastURL = "https://api.openweathermap.org/data/2.5/forecast";
// ---------------------------------------------------------------------- //
const locationValue = document.getElementById("user-location");
const timeValue = document.getElementById("time");
const currentWeatherValue = document.getElementById("current-weather");
const airQualityValue = document.getElementById("airQuality");
const windValue = document.getElementById("wind");
const humidityValue = document.getElementById("humidity");
const pressureValue = document.getElementById("pressure");
const sunriseValue = document.getElementById("sunrise");
const rainValue = document.getElementById("rain-chance");
const hourlyContainer = document.querySelector(".weather-hourly-container");
const input = document.getElementById("city-search");
const datalist = document.getElementById("cities");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");
const celsiusBtn = document.getElementById("celsiusBtn");
const unitCelsius = "metric";
const unitFahrenheit = "imperial";
let currentUnit = localStorage.getItem("unit") || "metric";
let unitSymbol = currentUnit === "metric" ? "°C" : "°F";
let timeInterval = null;
let currentCity = null;
// ----------------------------- ICONS ------------------------------------- //
const iconMap = {
    "01d": "bi-sun-fill text-warning",
    "01n": "bi-moon-stars-fill",
    "02d": "bi-cloud-sun-fill text-warning",
    "02n": "bi-cloud-moon-fill",
    "03d": "bi-cloud-fill text-secondary",
    "03n": "bi-cloud-fill text-secondary",
    "04d": "bi-clouds-fill text-secondary",
    "04n": "bi-clouds-fill text-secondary",
    "09d": "bi-cloud-drizzle-fill text-info",
    "09n": "bi-cloud-drizzle-fill text-info",
    "10d": "bi-cloud-rain-fill text-primary",
    "10n": "bi-cloud-rain-fill text-primary",
    "11d": "bi-cloud-lightning-fill text-warning",
    "11n": "bi-cloud-lightning-fill text-warning",
    "13d": "bi-snow2 text-info",
    "13n": "bi-snow2 text-info",
    "50d": "bi-cloud-fog2 text-secondary",
    "50n": "bi-cloud-fog2 text-secondary",
};
// -------------------------- CHANGING UNITS ---------------------------- //
function setUnit(unit) {
    currentUnit = unit;
    unitSymbol = unit === "metric" ? "°C" : "°F";
    localStorage.setItem("unit", currentUnit);
    if (currentCity) fetchWeather(currentCity);
}
fahrenheitBtn.addEventListener("click", () => setUnit(unitFahrenheit));
celsiusBtn.addEventListener("click", () => setUnit(unitCelsius));
// ---------------------- MOBILE CHANGING UNITS ------------------------- //
const fahrenheitBtnMobile = document.getElementById("fahrenheitBtnMobile");
const celsiusBtnMobile = document.getElementById("celsiusBtnMobile");
fahrenheitBtnMobile.addEventListener("click", () => setUnit(unitFahrenheit));
celsiusBtnMobile.addEventListener("click", () => setUnit(unitCelsius));
// ---------------------------------------------------------------------- //
// -------------------------- WEATHER FETCH ----------------------------- //
async function fetchWeather(city = "Cairo") {
    try {
        const response = await fetch(
            `${weatherURL}?q=${city}&appid=${apiKey}&units=${currentUnit}`
        );
        if (!response.ok) throw new Error("City not found");
        const data = await response.json();
        currentCity = data.name;
        displayWeather(data);
        fetchAirQuality(data.coord.lat, data.coord.lon);
        fetchHourlyForecast(city);
    } catch (error) {
        alert(error.message);
    }
}
async function fetchAirQuality(lat, lon) {
    try {
        const response = await fetch(`${airURL}?lat=${lat}&lon=${lon}&appid=${apiKey}`);
        const data = await response.json();
        const aqi = data.list[0].main.aqi;
        airQualityValue.textContent = `${aqi}`;
    } catch {
        airQualityValue.textContent = "N/A";
    }
}
function displayWeather(data) {
    const { name, sys, main, weather, wind } = data;
    locationValue.textContent = `${name}, ${sys.country}`;
    if (timeInterval) clearInterval(timeInterval);
    function updateTime() {
        timeValue.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    updateTime();
    timeInterval = setInterval(updateTime, 1000);

    currentWeatherValue.textContent = `${Math.round(main.temp)}${unitSymbol}`;
    const iconCode = weather[0].icon;
    const iconClass = iconMap[iconCode] || "bi-cloud text-secondary";
    document.getElementById("weatherIcon").className = `bi ${iconClass} display-4`;

    document.querySelector(".weather__summary").innerHTML = `
        <span>${weather[0].description}</span> | 
        <span>FeelsLike ${Math.round(main.feels_like)}${unitSymbol}</span>`;
    document.querySelector(".weather__note").textContent = `The highest will be ${Math.round(
        main.temp_max
    )}${unitSymbol}`;

    windValue.textContent = `${wind.speed} m/s`;
    humidityValue.textContent = `${main.humidity}%`;
    let rainPercent = 0;
    if (data.rain && data.rain["1h"]) {
        const rainMM = data.rain["1h"];
        if (rainMM < 1) rainPercent = 30;
        else if (rainMM < 5) rainPercent = 60;
        else rainPercent = 90;
    }
    rainValue.textContent = `${rainPercent}%`;
    pressureValue.textContent = `${main.pressure} hPa`;
    const sunTitle = document.querySelector(".sun-title");
    const now = Date.now() / 1000;
    const sunrise = sys.sunrise;
    const sunset = sys.sunset;
    if (now < sunrise) {
        sunTitle.textContent = "Sunrise";
        sunriseValue.textContent = new Date(sunrise * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    } else if (now >= sunrise && now < sunset) {
        sunTitle.textContent = "Sunset";
        sunriseValue.textContent = new Date(sunset * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    } else {
        sunTitle.textContent = "Sunrise";
        sunriseValue.textContent = new Date((sunrise + 86400) * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
}
// -------------------------- HOURLY FORECAST --------------------------- //
async function fetchHourlyForecast(city = "Cairo") {
    try {
        const response = await fetch(
            `${forecastURL}?q=${city}&appid=${apiKey}&units=${currentUnit}`
        );
        if (!response.ok) throw new Error("Forecast not found");
        const data = await response.json();
        displayHourlyForecast(data.list);
    } catch (error) {
        console.error(error);
    }
}
function displayHourlyForecast(hourlyData) {
    hourlyContainer.innerHTML = "";
    hourlyData.slice(0, 6).forEach((item) => {
        const time = new Date(item.dt * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        const temp = Math.round(item.main.temp);
        const condition = item.weather[0].description;
        const wind = item.wind.speed;
        const humidity = item.main.humidity;
        const iconCode = item.weather[0].icon;
        const iconClass = iconMap[iconCode] || "bi-cloud text-secondary";

        const card = document.createElement("div");
        card.className = "weather__hourly-card row justify-content-between";
        card.innerHTML = `
    <div class="col-6">
        <div class="weather__hourly-left d-flex pe-1">
        <div class="weather__hourly-icon d-flex align-items-center">
            <i class="bi ${iconClass}"></i>
        </div>
        <div class="weather__hourly-details d-flex flex-column ms-3">
            <span class="weather__hourly-time text-secondary">${time}</span>
            <span class="weather__hourly-condition">${condition}</span>
        </div>
        </div>
    </div>
    <div class="col-6 align-content-center">
        <div class="weather__hourly-right d-flex justify-content-between align-items-center">
        <span class="weather__hourly-temp">${temp}${unitSymbol}</span>
        <div class="weather__hourly-extra">
            <div class="weather__hourly-extra-item text-secondary">
            <span class="weather__hourly-extra-label">Wind</span>
            <span class="weather__hourly-extra-value">${wind} m/s</span>
            </div>
            <div class="weather__hourly-extra-item text-secondary">
            <span class="weather__hourly-extra-label">Humidity</span>
            <span class="weather__hourly-extra-value">${humidity}%</span>
            </div>
        </div>
        </div>
    </div>`;
        hourlyContainer.appendChild(card);
    });
}
// -------------------------- SEARCH FORM ------------------------------- //
input.addEventListener("input", async () => {
    const query = input.value.trim();
    if (query.length < 2) {
        datalist.innerHTML = "";
        return;
    }
    const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=3&appid=${apiKey}`
    );
    const cities = await res.json();
    datalist.innerHTML = cities
        .map((c) => `<option value="${c.name}, ${c.country}"></option>`)
        .join("");
});
document.querySelector(".header__search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const city = input.value.trim();
    if (city) {
        currentCity = city;
        fetchWeather(currentCity);
    }
});
// -------------------------- GEOLOCATION ------------------------------- //
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            const response = await fetch(
                `${weatherURL}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${currentUnit}`
            );
            const data = await response.json();
            currentCity = data.name;
            displayWeather(data);
            fetchAirQuality(latitude, longitude);
            fetchHourlyForecast(data.name);
        },
        () => fetchWeather("Cairo")
    );
} else {
    fetchWeather("Cairo");
}
// ------------------------- USER GREETING ------------------------------ //
function updateGreeting() {
    const greetingElement = document.getElementById("greeting");
    const hour = new Date().getHours();
    if (hour < 12) greetingElement.innerHTML = `Good Morning <i class="fa-solid fa-sun"></i>`;
    else if (hour < 17)
        greetingElement.innerHTML = `Good Afternoon <i class="fa-solid fa-cloud-sun"></i>`;
    else greetingElement.innerHTML = `Good Evening <i class="fa-solid fa-cloud-moon"></i>`;
}
updateGreeting();
// ------------------------ CHANGING THEME ------------------------------ //
const toggleThemeBtn = document.getElementById("toggleTheme");
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    toggleThemeBtn.innerHTML = '<i class="bi bi-moon-fill text-light"></i>';
}
toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
        toggleThemeBtn.innerHTML = '<i class="bi bi-moon-fill text-light"></i>';
        localStorage.setItem("theme", "dark");
    } else {
        toggleThemeBtn.innerHTML = '<i class="bi bi-brightness-low text-dark"></i>';
        localStorage.setItem("theme", "light");
    }
});
// ---------------------- MOBILE CHANGING THEME ------------------------- //
const toggleThemeMobileBtn = document.getElementById("toggleThemeMobile");
toggleThemeMobileBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
});
