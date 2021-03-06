import axios from "axios";
import React from "react";
import ReactDOM from "react-dom";


export default class Cumulus extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      searchTerm: "",
      currSearchResult: [],
      currentDay: new Date().getTime() / 1000, // Current date in Unix time
      appID: "ad68367b5cd8c50e58be5a2923aa7ff4",
      temperature: "",
      cityName: "",
      cityID: "",
      weatherType: "",
      dataList: [],
      selectOption: "metric",
      forecastData: [],
      forecastList: [],
      forecastTemps: [],
      testDate: "",
      hasRequested: false
    };
    this.onHandleChange = this.onHandleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.initSearch = this.initSearch.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.changeTemperature = this.changeTemperature.bind(this);
    this.getForecastWeather = this.getForecastWeather.bind(this);
    this.handleDateConversionToWeekday = this.handleDateConversionToWeekday.bind(this);
    this.sortDates = this.sortDates.bind(this);
    this.processForecastData = this.processForecastData.bind(this);
    this.displayForecastList = this.displayForecastList.bind(this);
    this.retrieveWeatherIcon = this.retrieveWeatherIcon.bind(this);
  }

  initSearch(searchTerm, inputUnit) {
    let self = this;
    this.getCurrentWeather(searchTerm, inputUnit);
  }

  getCurrentWeather(searchTerm, inputUnit) {
    let self = this;
    axios
      .get(
        "http://api.openweathermap.org/data/2.5/weather?q=" +
          searchTerm +
          "&APPID=" +
          this.state.appID +
          "&type=like&units=" +
          inputUnit
      )
      .then(response => {
        let firstResponse = response;
      
        this.getForecastWeather(
          response.data.id,
          firstResponse,
          this.processForecastData
        );
      })
      .catch(function(error) {
        console.log(error);
      });
  }

  getForecastWeather(cityID, firstResponse, callback) {
    let self = this;    
    axios
      .get(
        "http://api.openweathermap.org/data/2.5/forecast?id=" +
          cityID +
          "&APPID=" +
          this.state.appID +
          "&units=" +
          this.state.selectOption
      )
      .then(response => {
        self.setState({
          currSearchResult: firstResponse,
          temperature: firstResponse.data.main.temp,
          cityName: firstResponse.data.name,
          weatherType: firstResponse.data.weather[0].main,
          cityID: firstResponse.data.id,
          forecastData: response,
          testDate: response.data.list[0].dt,
          forecastList: [],
          hasRequested: true
        });
        callback();
      })
      .catch(function(error) {
        console.log(error);
      });
  }

  onHandleChange(event) {

    let currVal = event.target.value;
    let dataList = [];
    this.setState({
      dataList: []
    })

    let foundCities = [];

    // If greater than 3 input letters, begin async call to API

    if(currVal.length >= 3){
      axios
      .get(
        "http://localhost:8000/cities/" +
          currVal 
      )
      .then(response => {
        let firstResponse = response.data;

        // Within response, conduct logic to map matching records with countries for presentation. Push to array for later operation.

  firstResponse.forEach(city => {
    let option = document.createElement('option');
    let cityDetail = city.name + ", " + city.country;
    option.value = cityDetail;
    foundCities.push(option);
});

// Trim these returned cities to 10 responses for presentation

    let trimmedCities = foundCities.slice(0,10);

    
    // Append all found responses to the dataList object in HTML

    trimmedCities.forEach(city => {
      dataList.push(<option value={city.value}>{city.value}</option>);
    })

    this.setState({
      dataList: dataList
    })
   

    // reset arrays for future use.

    foundCities = [];
    trimmedCities = [];
    dataList = [];

      })
      .catch(function(error) {
        console.log(error);
      });
      this.setState({ searchTerm: event.target.value });
      
    } else {
      this.setState({ searchTerm: event.target.value });
    }
  }

  onSubmit(event) {
    event.preventDefault();
    this.initSearch(this.state.searchTerm, this.state.selectOption);
  }

  changeTemperature(currTemp) {
    let temp = this.state.temperature;
    let updatedTemp = "";

    if (currTemp) {
      if (this.state.selectOption === "metric") {
        updatedTemp = currTemp * 1.8 + 32;
      } else {
        updatedTemp = (currTemp - 32) / 1.8;
      }
      return updatedTemp;
    } else {
      if (this.state.selectOption === "metric") {
        updatedTemp = temp * 1.8 + 32;
      } else {
        updatedTemp = (temp - 32) / 1.8;
      }
      this.setState({ temperature: updatedTemp.toFixed(2) });
    }
  }

  handleOptionChange(event) {
    this.setState({ selectOption: event.target.value });
    let forecastTemps = this.state.forecastTemps;

    for (var temp in forecastTemps) {
      let updatedTemp = this.changeTemperature(forecastTemps[temp].temp);
      let updatedMaxTemp = this.changeTemperature(forecastTemps[temp].maxTemp);
      forecastTemps[temp].temp = updatedTemp.toFixed(2);
      forecastTemps[temp].maxTemp = updatedMaxTemp.toFixed(2);
      console.log(
        "​handleOptionChange -> forecastTemps[temp].maxTemp",
        forecastTemps[temp].maxTemp
      );
    }

    this.setState({
      forecastTemps: forecastTemps
    });

    this.displayForecastList(this.state.forecastTemps);
    this.changeTemperature();
  }

  handleDateConversionToWeekday(unixDate) {
    var weekday = new Array(7);
    weekday[0] = "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";

    let d = new Date(0);
    d.setUTCSeconds(unixDate);
    return weekday[d.getDay()];
  }

// Date sorting unused currently, but worth keeping!

  sortDates(unsortedDates) {
    let sortedDays = [];
    let days = [];

    for (var day in unsortedDates) {
      days.push(day);
    }

    sortedDays = days.sort(function(a, b) {
      return new Date(a.value).getDate() - new Date(b.value).getDate();
    });
    return sortedDays;
  }

  retrieveWeatherIcon(weatherType) {
    let forecastWeather = weatherType.toLowerCase();
    let weatherIcon = "";

    switch (forecastWeather) {
      case "rain":
        weatherIcon = "./img/004-rain.svg";
        break;

      case "clear":
        weatherIcon = "./img/003-sun.svg";
        break;

      case "clouds":
        weatherIcon = "./img/005-cloud.svg";
        break;

      default:
        weatherIcon = "./img/003-sun.svg";
        break;
    }
    return weatherIcon;
  }

  processForecastData() {
    //Get array of data from state
    let data = [];
    let date = "";

    data = this.state.forecastData.data.list;

    //Reduce data into days of the week by matching dateTime to Weekday.

    const weekdays = data.reduce((weekdays, day) => {
      date = this.handleDateConversionToWeekday(day.dt);
      if (!weekdays[date]) {
        weekdays[date] = [];
      }
      weekdays[date].push(day);
      return weekdays;
    }, {});

    // Setup to reduce weather information into each Weekeday

    let weatherAggregate = [];
    let tempTotal = 0;
    let tempStore = [];
    let currDayWeather = "";

    /* Loop through each record within each weekday, and output:
            - Average temp
            - Maximum temp
            - Minimum Temp - to be implemented
            - Weather Type
        */

    for (var record in weekdays) {
      if (weekdays.hasOwnProperty(record)) {
        let currDay = weekdays[record];
        let convDate = this.handleDateConversionToWeekday(currDay[0].dt);
        let dayOfMonth = new Date(currDay[0].dt);

        for (var subData in currDay) {
          let currTemp = currDay[subData].main.temp;
          tempStore.push(currTemp);
        }

        // For each temperature, go through and calculate total.

        tempStore.forEach(temp => {
          tempTotal = tempTotal + temp;
        });

        // Calc average temperature

        tempTotal = tempTotal / tempStore.length;

        // Use reduce to work through each day to determine the maximum temperature.

        const maxTemp = currDay.reduce(function(previous, record) {
          return previous === undefined || record.main.temp_max > previous
            ? record.main.temp_max
            : previous;
        }, undefined);

        // Final data per day. Output via component (mapped to .results-tiles element via displayForecastList())

        let tempDate = {
          date: convDate,
          dayOfMonth: dayOfMonth.getDate(),
          currYear: dayOfMonth.getFullYear(),
          temp: tempTotal.toFixed(0),
          maxTemp: maxTemp.toFixed(0),
          weatherType: currDayWeather,
          weatherIcon: this.retrieveWeatherIcon(currDayWeather)
        };

        weatherAggregate.push(tempDate);


        tempStore = [];
        tempTotal = 0;
      }
    }

    this.displayForecastList(weatherAggregate);
    console.log("​processForecastData -> weatherAggregate", weatherAggregate);

    this.setState({
      forecastTemps: weatherAggregate
    });
  }

  displayForecastList(list) {
    const listItems = list.map(list => (
      <div className="results-tiles">
        <li className="tile">
          <ul className="tile__data">
            <li>
              <label className="tile__data__label--primary">{list.date}</label>
            </li>
            <li>
              <label className="tile__data__label--weather">
                {list.weatherType}
              </label>
            </li>
            <li>
              <label className="tile__data__label">Average:</label> {list.temp}
              &deg;
            </li>
            <li>
              <label className="tile__data__label">Maximum:</label>{" "}
              {list.maxTemp}
              &deg;{" "}
            </li>
          </ul>
          <img src={list.weatherIcon} />
        </li>
      </div>
    ));
    this.setState({
      forecastList: listItems
    });
  }

  render() {
    return (
      <form onSubmit={this.onSubmit} className="search-form">
        <datalist id="cities">
          {this.state.dataList}
        </datalist>
        <div className="search-form__search-group">
          <input
            type="text"
            value={this.state.searchTerm}
            onChange={this.onHandleChange}
            list="cities"
            className="search-form__searchbar"
          />
          <button className="search-form__search-bar__button" type="submit">
            Search now
          </button>
        </div>
        <div className="search-form__radio-group">
          <label>
            {" "}Celsius{" "}
            <input
              type="radio"
              value="metric"
              checked={this.state.selectOption === "metric"}
              onChange={this.handleOptionChange}
            />
          </label>
          <label>
            {" "}Fahrenheit{" "}
            <input
              type="radio"
              value="imperial"
              checked={this.state.selectOption === "imperial"}
              onChange={this.handleOptionChange}
            />
          </label>
        </div>
        <div className="search-form__results">
          <h1>{this.state.cityName}</h1>
          <h3>{this.handleDateConversionToWeekday(this.state.currentDay)}</h3>
          <div className="search-form__results__tiles">
            {this.state.forecastList}
          </div>
        </div>
      </form>
    );
  }
}
