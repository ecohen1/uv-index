const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const request = require('request');
const path = require('path');
const config = require('./config');
const port = process.env.PORT || 1337;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


// Add headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});

const findRiskAndRecommendation = (UVIndex) => {

  let risk = null;
  let recommendation = null;
  if (UVIndex <= 2.9) {
    risk = "Green";
    recommendation = "Wear sunglasses on bright days; use sunscreen if there is snow on the ground, which reflects UV radiation, or if you have particularly fair skin."
  } else if (UVIndex >= 3 && UVIndex <= 5.9)  {
    risk  = "Yellow";
    recommendation = "Take precautions, such as covering up, if you will be outside. Stay in shade near midday when the sun is strongest."
  } else if (UVIndex >= 6 && UVIndex <= 7.9) {
    risk = "Orange";
    recommendation = "Cover the body with sun protective clothing, use SPF 30+ sunscreen, wear a hat, reduce time in the ssun within three hours of solar noon, and wear sunglasses."
  } else if (UVIndex >= 8 && UVIndex <= 10.9) {
    risk = "Red";
    recommendation = "Wear SPF 30+ sunscreen, a shirt, sunglasses, and a wide-brimmed hat. Do not stay in the sun for too long."
  } else {
    risk = "Violet";
    recommendation = "Take all precautions: Wear SPF 30+ sunscreen, a long-sleeved shirt and trousers, sunglasses, and a very broad hat. Avoid the sun within three hours of solar noon."
  }
  return [risk, recommendation];
};


const findUVIndex = (req, response) => {

  // Send the api call to the weather ground
  // process the result of it and send back to the FE

  // Step1: Get the request and process it
  let UVIndex;
  let risk;
  let url = 'http://api.wunderground.com/api/' + config.apiKey() + '/hourly10day/q/' + req.body.zipcode + '.json';

  // Process the epoch time sent to us and find the date
  let date = new Date(req.body.timestamp).getDate();
  let values = request.get(url, (err, res, body) => {

    let Fcttime = [];
    let parsed_json = JSON.parse(body);
    
    // Returns  a lot of objects in an array
    let hourly_forecast = parsed_json['hourly_forecast'];

    for (let i = 0; i < hourly_forecast.length; i++) {
      // check the date
      if (date == hourly_forecast[i]['FCTTIME']['mday']) {
        values = findRiskAndRecommendation(hourly_forecast['uvi'])
        Fcttime.push(
          { 'hour':  hourly_forecast[i]['FCTTIME']['hour'],
            'UVIndex' : hourly_forecast[i]['uvi'],
            'risk': values[0],
            'temp': hourly_forecast[i]['temp']['english']
          });
      }
    }

    response.json({ response : Fcttime })
  });
}

app.post('/findUVIndex', [findUVIndex]);

app.get('/mapkey', (req,res) => {
  res.send(config.mapKey());
});

app.listen(port, () => {
  console.log('app listening on port 1337!')
});
