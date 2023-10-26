import { useEffect } from "react";
import { useState } from "react";
// const { country, id, latitude, longitude } = location;

export default function App() {
  const [location, setLocation] = useState("");
  const [info, setInfo] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [weatherData, setWeatherData] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setIsFetching(true);
  }
  function convertToFlag(countryCode) {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  }

  useEffect(
    function () {
      if (!isFetching || location.length <= 3) return;
      async function fetchWeather() {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
        );
        const data = await res.json();
        console.log(data.results[0]);

        setInfo(data.results[0]);
      }
      fetchWeather();

      return () => setIsFetching(false);
    },
    [location, isFetching]
  );

  useEffect(
    function () {
      async function getData() {
        if (!info) return;
        const { country, id, latitude, longitude, timezone } = info;
        // console.log(country, id, latitude, longitude, timezone);

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
        );
        const weatherData = await weatherRes.json();
        console.log(weatherData.daily);
        setWeatherData(weatherData.daily);
      }
      getData();
    },
    [info]
  );

  return (
    <div className="app">
      <Display
        handleSubmit={handleSubmit}
        location={location}
        setLocation={setLocation}
      />
      <h2>
        {info?.name} {info ? convertToFlag(info.country_code) : ""}
      </h2>
      <DayList weatherData={weatherData} />
    </div>
  );
}

function Display({ handleSubmit, location, setLocation }) {
  return (
    <>
      <h1>Classy Weather</h1>
      <form onSubmit={(e) => handleSubmit(e)}>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          type="text"
          placeholder="search for location..."
        />
        <button>Get location</button>
      </form>
    </>
  );
}

function DayList({ weatherData }) {
  function getWeatherIcon(wmoCode) {
    const icons = new Map([
      [[0], "☀️"],
      [[1], "🌤"],
      [[2], "⛅️"],
      [[3], "☁️"],
      [[45, 48], "🌫"],
      [[51, 56, 61, 66, 80], "🌦"],
      [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
      [[71, 73, 75, 77, 85, 86], "🌨"],
      [[95], "🌩"],
      [[96, 99], "⛈"],
    ]);
    const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
    if (!arr) return "NOT FOUND";
    return icons.get(arr);
  }
  function formatDay(dateStr) {
    return new Intl.DateTimeFormat("en", {
      weekday: "short",
    }).format(new Date(dateStr));
  }

  return (
    <ul className="weather">
      {weatherData?.time.map((_, index) => (
        <li className="day" key={index}>
          <span>{getWeatherIcon(weatherData.weathercode.at(index))}</span>
          <p>{formatDay(weatherData.time[index])}</p>{" "}
          <p>
            {Math.floor(weatherData.temperature_2m_max[index])}&deg; &ndash;
            <strong>
              {" "}
              {Math.ceil(weatherData.temperature_2m_min[index])}&deg;
            </strong>
          </p>{" "}
        </li>
      ))}
    </ul>
  );
}
