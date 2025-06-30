// Weather API 
const API_KEY = '6f90a71f64c51c903fbbf900cdb94e1c'; // Replace with your actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const currentWeather = document.getElementById('currentWeather');
const forecastContainer = document.getElementById('forecastContainer');
const errorMessage = document.getElementById('errorMessage');
const recentSearches = document.getElementById('recentSearches');
const recentSearchesList = document.getElementById('recentSearchesList');

// Recent searches array
let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

// Initialize the app
function init() {
    // Load recent searches if any
    updateRecentSearches();
    
    // Event Listeners
    searchBtn.addEventListener('click', handleSearch);
    currentLocationBtn.addEventListener('click', getCurrentLocationWeather);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// Handling  city search
function handleSearch() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    getWeatherByCity(city);
}

//  Weather by city name
async function getWeatherByCity(city) {
    try {
        const currentResponse = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`);
        
        if (!currentResponse.ok) {
            throw new Error('City not found. Please try another location.');
        }
        
        const currentData = await currentResponse.json();
        
        // Fetch 5-day forecast
        const forecastResponse = await fetch(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`);
        const forecastData = await forecastResponse.json();
        
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        
        // Add to recent searches
        addToRecentSearches(city);
        
        // Clear input
        cityInput.value = '';
        
        // Hide error message
        hideError();
    } catch (error) {
        showError(error.message);
    }
}

// Weather by current location
function getCurrentLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                  
                    const currentResponse = await fetch(`${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`);
                    const currentData = await currentResponse.json();
                    
                    // Fetch 5-day forecast
                    const forecastResponse = await fetch(`${BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`);
                    const forecastData = await forecastResponse.json();
                    
                  
                    displayCurrentWeather(currentData);
                    displayForecast(forecastData);
                    
                    // Add to recent searches
                    addToRecentSearches(currentData.name);
                    
                    // Hide error message
                    hideError();
                } catch (error) {
                    showError('Failed to fetch weather data. Please try again.');
                }
            },
            (error) => {
                showError('Geolocation error: ' + error.message);
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

// Display current weather
function displayCurrentWeather(data) {
    const { name, dt, weather, main, wind } = data;
    const { description, icon } = weather[0];
    const { temp, humidity } = main;
    const { speed } = wind;
    
    // Update DOM
    document.getElementById('currentCity').textContent = name;
    document.getElementById('currentDate').textContent = formatDate(dt);
    document.getElementById('currentTemp').textContent = Math.round(temp);
    document.getElementById('weatherDescription').textContent = description;
    document.getElementById('humidity').textContent = humidity;
    document.getElementById('windSpeed').textContent = Math.round(speed * 3.6); // Convert m/s to km/h
    
    // Set weather icon
    const weatherIcon = getWeatherIcon(icon);
    document.getElementById('weatherIcon').innerHTML = weatherIcon;
    
    // Show current weather section
    currentWeather.classList.remove('hidden');
}

// Display 5-day forecast
function displayForecast(data) {
    const forecastElement = document.getElementById('forecast');
    forecastElement.innerHTML = '';
    
    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create array for the next 5 days
    const nextFiveDays = [];
    for (let i = 1; i <= 5; i++) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + i);
        nextFiveDays.push(nextDay);
    }
    
    const dailyForecasts = nextFiveDays.map(targetDate => {
        const forecastsForDay = data.list.filter(item => {
            const forecastDate = new Date(item.dt * 1000);
            return (
                forecastDate.getDate() === targetDate.getDate() &&
                forecastDate.getMonth() === targetDate.getMonth() &&
                forecastDate.getFullYear() === targetDate.getFullYear()
            );
        });
        
        // Select forecast closest to noon
        if (forecastsForDay.length > 0) {
            return forecastsForDay.reduce((closest, current) => {
                const currentHour = new Date(current.dt * 1000).getHours();
                const closestHour = new Date(closest.dt * 1000).getHours();
                return (Math.abs(currentHour - 12) < Math.abs(closestHour - 12)) ? current : closest;
            });
        }
        return null;
    }).filter(Boolean); 
    
    // Display each day forecast
    dailyForecasts.forEach((dayData, index) => {
        if (!dayData) return;
        
        const { dt, weather, main, wind } = dayData;
        const { temp, humidity } = main;
        const { speed } = wind;
        const { icon } = weather[0];
        
        const dayElement = document.createElement('div');
        dayElement.className = 'forecast-day bg-white rounded-lg shadow p-4';
        
        const dayLabel = index === 0 ? 'Tomorrow' : 
            new Date(dt * 1000).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
        
        dayElement.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="font-semibold">${dayLabel}</div>
                <div class="text-3xl">${getWeatherIcon(icon)}</div>
            </div>
            <div class="flex justify-between mt-2">
                <div>
                    <span class="text-xl font-bold">${Math.round(temp)}</span>
                    <span>°C</span>
                </div>
                <div class="text-right text-gray-600">
                    <p>Humidity: ${humidity}%</p>
                    <p>Wind: ${Math.round(speed * 3.6)} km/h</p>
                </div>
            </div>
        `;
        
        forecastElement.appendChild(dayElement);
    });
    
    // Show forecast container
    forecastContainer.classList.remove('hidden');
}

// Add city to recent searches
function addToRecentSearches(city) {
    recentCities = recentCities.filter(c => c.toLowerCase() !== city.toLowerCase());
    recentCities.unshift(city);
    
    // Keeping only last 5 searches
    if (recentCities.length > 5) {
        recentCities.pop();
    }
    
    localStorage.setItem('recentCities', JSON.stringify(recentCities));
    updateRecentSearches();
}

function updateRecentSearches() {
    recentSearchesList.innerHTML = '';
    
    if (recentCities.length > 0) {
        recentSearches.classList.remove('hidden');
        
        recentCities.forEach(city => {
            const li = document.createElement('li');
            li.textContent = city;
            li.addEventListener('click', () => {
                cityInput.value = city;
                getWeatherByCity(city);
            });
            recentSearchesList.appendChild(li);
        });
    } else {
        recentSearches.classList.add('hidden');
    }
}

// function to format date
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// function to format forecast date
function formatForecastDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// function to get weather icon
function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': '<i class="fas fa-sun"></i>',
        '01n': '<i class="fas fa-moon"></i>',
        '02d': '<i class="fas fa-cloud-sun"></i>',
        '02n': '<i class="fas fa-cloud-moon"></i>',
        '03d': '<i class="fas fa-cloud"></i>',
        '03n': '<i class="fas fa-cloud"></i>',
        '04d': '<i class="fas fa-cloud"></i>',
        '04n': '<i class="fas fa-cloud"></i>',
        '09d': '<i class="fas fa-cloud-rain"></i>',
        '09n': '<i class="fas fa-cloud-rain"></i>',
        '10d': '<i class="fas fa-cloud-sun-rain"></i>',
        '10n': '<i class="fas fa-cloud-moon-rain"></i>',
        '11d': '<i class="fas fa-bolt"></i>',
        '11n': '<i class="fas fa-bolt"></i>',
        '13d': '<i class="fas fa-snowflake"></i>',
        '13n': '<i class="fas fa-snowflake"></i>',
        '50d': '<i class="fas fa-smog"></i>',
        '50n': '<i class="fas fa-smog"></i>'
    };
    
    return iconMap[iconCode] || '<i class="fas fa-cloud"></i>';
}

// Show error message
function showError(message) {
    errorMessage.classList.remove('hidden');
    document.getElementById('errorText').textContent = message;
}

// Hide error message
function hideError() {
    errorMessage.classList.add('hidden');
}

// Initialize the app
init();