const apiKey = 'dc4c37f61a4d0973c247f29387986b4b';
let currentWeatherData = null; // To hold the current weather data
let weatherChart = null; // To hold the chart instance

document.getElementById('fetchWeatherBtn').addEventListener('click', () => {
  const city = document.getElementById('cityInput').value.trim();
  if (city) {
    clearWeatherData();
    getWeatherByCity(city);
  } else {
    alert('Please enter a city name');
  }
});

document.getElementById('currentCityBtn').addEventListener('click', () => {
  if (navigator.geolocation) {
    clearWeatherData();
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude.toFixed(2);
      const lon = position.coords.longitude.toFixed(2);
      getWeatherByCoords(lat, lon);
    });
  } else {
    alert('Geolocation is not supported by this browser.');
  }
});

document.getElementById('themeToggleCheckbox').addEventListener('change', (event) => {
  document.body.classList.toggle('dark-theme', event.target.checked);
});

document.getElementById('pauseReadingBtn').addEventListener('click', () => {
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
  }
});

document.getElementById('resumeReadingBtn').addEventListener('click', () => {
  if (speechSynthesis.paused) {
    speechSynthesis.resume();
  }
});

document.getElementById('switchCityBtn').addEventListener('click', () => {
  clearWeatherData();
});

async function getWeatherByCity(city) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&cnt=7&units=metric&appid=${apiKey}`;
  fetchWeatherData(apiUrl, city);
}

async function getWeatherByCoords(lat, lon) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&cnt=7&units=metric&appid=${apiKey}`;
  fetchWeatherData(apiUrl);
}

async function fetchWeatherData(apiUrl, city = '') {
  try {
    console.log('Fetching weather data from:', apiUrl);

    // Cancel any ongoing speech synthesis
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error('Error response:', errorDetails);
      throw new Error('Failed to fetch weather data');
    }

    currentWeatherData = await response.json();
    console.log('Weather data fetched:', currentWeatherData);
    
    displayWeather(currentWeatherData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    document.querySelector('.output-container').style.display = 'none';
    alert('Failed to fetch weather data. Please check your network or API key.');
  }
}

function displayWeather(data) {
  const cityName = data.city.name;
  document.getElementById('cityName').innerText = `Weather Forecast for ${cityName}`;

  const forecastDetails = document.getElementById('forecastDetails');
  forecastDetails.innerHTML = '';

  const forecastData = data.list.slice(0, 7);
  let weatherSummary = `Weather forecast for ${cityName}: `;

  forecastData.forEach(day => {
    const date = new Date(day.dt * 1000);
    const dateString = date.toDateString();
    const timeString = date.toLocaleTimeString();

    const dayDiv = document.createElement('div');
    dayDiv.classList.add('forecast-day');
    dayDiv.innerHTML = `
      <p><strong>Date:</strong> ${dateString}</p>
      <p><strong>Time:</strong> ${timeString}</p>
      <p><strong>Weather:</strong> ${day.weather[0].description}</p>
      <p><strong>Temperature:</strong> ${day.main.temp}°C</p>
      <p><strong>Humidity:</strong> ${day.main.humidity}%</p>
      <p><strong>Wind Speed:</strong> ${day.wind.speed} m/s</p>
    `;
    forecastDetails.appendChild(dayDiv);

    weatherSummary += `On ${dateString} at ${timeString}, the weather will be ${day.weather[0].description}, with a temperature of ${day.main.temp} degrees Celsius, humidity at ${day.main.humidity} percent, and wind speed of ${day.wind.speed} meters per second. `;
  });

  document.querySelector('.output-container').style.display = 'block';
  displayChart(forecastData);
  speakWeather(weatherSummary);
}

function displayChart(data) {
  const labels = data.map(day => new Date(day.dt * 1000).toLocaleDateString());
  const temperatures = data.map(day => day.main.temp);
  const humidities = data.map(day => day.main.humidity);
  const windSpeeds = data.map(day => day.wind.speed);

  const ctx = document.getElementById('weatherChart').getContext('2d');
  if (weatherChart) {
    weatherChart.destroy(); // Destroy the old chart instance if it exists
  }
  weatherChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: temperatures,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: false,
          yAxisID: 'y-axis-temp'
        },
        {
          label: 'Humidity (%)',
          data: humidities,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: false,
          yAxisID: 'y-axis-humidity'
        },
        {
          label: 'Wind Speed (m/s)',
          data: windSpeeds,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: false,
          yAxisID: 'y-axis-wind'
        }
      ]
    },
    options: {
      scales: {
        yAxes: [
          {
            id: 'y-axis-temp',
            type: 'linear',
            position: 'left',
            ticks: {
              beginAtZero: true
            },
            scaleLabel: {
              display: true,
              labelString: 'Temperature (°C)'
            }
          },
          {
            id: 'y-axis-humidity',
            type: 'linear',
            position: 'right',
            ticks: {
              beginAtZero: true
            },
            scaleLabel: {
              display: true,
              labelString: 'Humidity (%)'
            }
          },
          {
            id: 'y-axis-wind',
            type: 'linear',
            position: 'right',
            ticks: {
              beginAtZero: true
            },
            scaleLabel: {
              display: true,
              labelString: 'Wind Speed (m/s)'
            }
          }
        ]
      },
      responsive: true,
      maintainAspectRatio: false,
    }
  });
}

function speakWeather(weatherSummary) {
  const language = 'en-US'; // Use the default language for speech synthesis
  const utterance = new SpeechSynthesisUtterance(weatherSummary);
  utterance.lang = language;
  speechSynthesis.speak(utterance);
}

function clearWeatherData() {
  // Clear weather data display
  document.getElementById('cityName').innerText = '';
  document.getElementById('forecastDetails').innerHTML = '';
  const ctx = document.getElementById('weatherChart').getContext('2d');
  if (weatherChart) {
    weatherChart.destroy();
    weatherChart = null;
  }
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  document.querySelector('.output-container').style.display = 'none';

  // Cancel any ongoing speech synthesis
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  // Reset current weather data
  currentWeatherData = null;

  // Clear the city input field
  document.getElementById('cityInput').value = '';
}
