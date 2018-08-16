import axios from 'axios';
import React from 'react';
import ReactDOM from 'react-dom';

export default class Cumulus extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            searchTerm: '',
            currSearchResult: [],
            appID: 'ad68367b5cd8c50e58be5a2923aa7ff4',
            temperature: '',
            cityName: '',
            cityID: '',
            weatherType: '',
            selectOption: 'metric',
            forecastData: [],
            forecastList: [],
            forecastTemps: [],
            testDate: '',
            hasRequested: false
        }
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
    }
   
    initSearch(searchTerm, inputUnit){
        let self = this;        
        this.getCurrentWeather(searchTerm, inputUnit);
}

getCurrentWeather(searchTerm, inputUnit){
 let self = this;
    axios.get('http://api.openweathermap.org/data/2.5/weather?q='+ searchTerm + '&APPID=' + this.state.appID+'&type=like&units='+ inputUnit )
    .then(response => {
        let firstResponse = response;
        this.getForecastWeather(response.data.id, firstResponse, this.processForecastData);
    })
    .catch(function (error) {
        console.log(error);
    });
}

getForecastWeather(cityID, firstResponse, callback){
    let self = this;
    axios.get('http://api.openweathermap.org/data/2.5/forecast?id='+ cityID + '&APPID=' + this.state.appID + '&units=' + this.state.selectOption)
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
        console.log("forecast added to state " + this.state.forecastData.toString());
        console.log("date " + this.state.testDate);
        callback();
    })
    .catch(function (error) {
        console.log(error);
    });
}

    onHandleChange(event){
        this.setState({searchTerm: event.target.value});
    }
    
    onSubmit(event) {
        event.preventDefault();
        this.initSearch(this.state.searchTerm, this.state.selectOption);  
    }

    changeTemperature(currTemp){
        let temp = this.state.temperature;
        let updatedTemp = "";

        if(currTemp){
            if(this.state.selectOption === 'metric'){
                updatedTemp = (currTemp * 1.8) + 32;
                } else {
                updatedTemp = (currTemp - 32) / 1.8;
            } 
            return updatedTemp;
        } else {
            if(this.state.selectOption === 'metric'){
                updatedTemp = (temp * 1.8) + 32;
                } else {
                updatedTemp = (temp - 32) / 1.8;
            } 
            this.setState({temperature: updatedTemp.toFixed(2)});
        }    
    }

    handleOptionChange(event){
        console.log(this.state.selectOption);
        this.setState({selectOption: event.target.value});
        let forecastTemps = this.state.forecastTemps

        for(var temp in forecastTemps){
            let updatedTemp = this.changeTemperature(forecastTemps[temp].temp);
            forecastTemps[temp].temp = updatedTemp.toFixed(2);
        }

        this.setState({
            forecastTemps: forecastTemps
        })

        console.log(this.state.forecastTemps);
        this.displayForecastList(this.state.forecastTemps);
        this.changeTemperature();
    }

    handleDateConversionToWeekday(unixDate){

        var weekday = new Array(7);
        weekday[0] =  "Sunday";
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

    sortDates(unsortedDates){
       let sortedDays = [];
       let days = [];

       for(var day in unsortedDates){
           days.push(day);
       }

       sortedDays = days.sort(function(a,b) {
        return new Date(a.value).getDate() - new Date(b.value).getDate();
    });
        return sortedDays;
    }

   

    processForecastData(){
        //Get array of data from state
        let data = [];
        let date = "";

        let day1 = new Object;
        let day2 = new Object;
        let day3 = new Object;
        let day4 = new Object;
        let day5 = new Object;

        data = this.state.forecastData.data.list;
        console.log(data);

        const groups = data.reduce((groups, day) =>{
            date = this.handleDateConversionToWeekday(day.dt);
            console.log(date);
            if(!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(day);
            return groups;
        }, {});

        console.log(groups);

        let sortedGroups = this.sortDates(groups);
        let weatherAggregate = [];
        let tempTotal = 0;
        let tempStore = [];

        let dateAggregate = [];

        for(var record in groups){
            if(groups.hasOwnProperty(record)) {

                var currDay = groups[record];
                let convDate = this.handleDateConversionToWeekday(currDay[0].dt);

                 for(var subData in currDay){
                    var currTemp = currDay[subData].main.temp;
                    tempStore.push(currTemp);
                }

                tempStore.forEach(temp => {
                    tempTotal = tempTotal + temp;
                    console.log("Temperature is " + temp);
                });

                tempTotal = tempTotal / tempStore.length;
                const maxTemp = currDay.reduce(function(previous, record) {
                    return previous === undefined || record.main.temp_max > previous ? record.main.temp_max : previous;
                }, undefined);

                let tempDate = {
                    date: convDate,
                    temp: tempTotal.toFixed(2),
                    maxTemp: maxTemp
                };

                weatherAggregate.push(tempDate);

                tempStore = [];
                tempTotal = 0;
            }
        }

       console.log(weatherAggregate);
        console.log("current temperature " + this.state.temperature);

       this.displayForecastList(weatherAggregate);
       this.setState({
           forecastTemps: weatherAggregate
       });
    }

    displayForecastList(list){
            const listItems = list.map((list) =>
            <div className="list-tile">
            <li className="list-item"><label className="results__label">{list.date}:</label> {list.temp}, <label className="results__label">Maximum:</label> {list.maxTemp}.</li></div>);
        this.setState({
            forecastList: listItems
        });
    }





    render(){
        return (
        <form onSubmit={this.onSubmit} className="search-form">
          <div class="search-form__search-group"><input type="text" value={this.state.searchTerm} onChange={this.onHandleChange} className="search-form__searchbar" />           
            <button className="search-form__search-bar__button" type="submit">Search now</button></div>
            <div className="search-form__radio-group">
            <label> Celsius <input type="radio" value="metric" checked={this.state.selectOption === 'metric'} onChange={this.handleOptionChange} /></label>
            <label> Fahrenheit <input type="radio" value="imperial" checked={this.state.selectOption === 'imperial'} onChange={this.handleOptionChange} /></label>
            </div>
            <div className="search-form__results">
            <p><label>City:</label> {this.state.cityName}</p>
                <div className="results__group">
                <label>Temperature:{this.state.temperature}</label>
                <label>Weather: {this.state.weatherType}</label>
                <label>Date: &nbsp; {this.handleDateConversionToWeekday(this.state.testDate)}</label>
                </div>
                <br/>
                <label>Forecast:</label> <div className="search-form__results__list">{this.state.forecastList}</div>
            </div>
            </form>
        )}

}
