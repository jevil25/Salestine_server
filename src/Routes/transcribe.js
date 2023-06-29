const speech = require('@google-cloud/speech');

const client = new speech.SpeechClient();

async function transcribe(req, res) {
  const { audioFile } = req.body;

  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };

  const audio = {
    content: audioFile.buffer.toString('base64'),
  };

  const request = {
    audio: audio,
    config: config,
  };

  const [response] = await client.recognize(request);

  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');

  res.status(200).json({ transcription });
}

module.exports = transcribe;