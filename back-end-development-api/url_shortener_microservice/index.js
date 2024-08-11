require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const shortid = require('shortid');
const validUrl = require('valid-url');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

mongoose.connect(process.env.DB)

const connection = mongoose.connection;

connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
})

const Schema = mongoose.Schema;
const urlSchema = new Schema({
    original_url: String,
    short_url: String
})
const URL = mongoose.model("URL", urlSchema);

// Your first API endpoint
app.get('/api/hello', function(req, res) {
    res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async(req, res) => {
    let url = req.body.url;
    const urlCode = shortid.generate();
    if (!validUrl.isWebUri(url)) {
        res.json({
          error: 'invalid url'
        })
    } else {
        try {
            let findOne = await URL.findOne({
                original_url: url
            })
            if (findOne) {
                res.json({
                    original_url: findOne.original_url,
                    short_url: findOne.short_url
                })
            } else {
                // if its not exist yet then create new one and response with the result
                findOne = new URL({
                    original_url: url,
                    short_url: urlCode
                })
                await findOne.save()
                res.json({
                    original_url: findOne.original_url,
                    short_url: findOne.short_url
                })
            }
        } catch (err) {
            console.error(err)
            res.json('Server error...')
        }
    }
})

app.get('/api/shorturl/:short_url?', async (req, res) => {
    try {
        const urlParams = await URL.findOne({
            short_url: req.params.short_url
        })
        if (urlParams) {
            return res.redirect(urlParams.original_url)
        } else {
            return res.status(404).json('No URL found')
        }
    } catch (err) {
        console.log(err)
        res.status(500).json('Server error')
    }
})

app.listen(port, function() {
    console.log(`Listening on port ${port}`);
});