const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function handler(req, res) {
    let data = new FormData();
    data.append('audio_data', fs.createReadStream('video1113803898.wav'));
    data.append('num_speaker', '1');
    
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://18.211.146.70:5555/diarizer/',
      headers: { 
        ...data.getHeaders()
      },
      data : data
    };
    
    axios.request(config)
    .then((response) => {
      res.json(JSON.stringify(response.data));
    })
    .catch((error) => {
      res.json(error);
    });  
}

module.exports = handler;