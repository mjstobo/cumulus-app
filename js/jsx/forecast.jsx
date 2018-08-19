<div className="results-tiles">
    <li className="tile"> 
        <ul class="tile__data">
        <li><label className="tile__data__label--primary">{list.date}</label></li>
        <li><label className="tile__data__label">Average:</label> {list.temp}</li>
        <li><label className="tile__data__label">Maximum:</label> {list.maxTemp}. </li>
        </ul>
    </li>
    <img src={this.weatherIcon}/>     
</div>
