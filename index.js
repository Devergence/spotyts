require('dotenv').config();
const express = require('express');
const port = 8888;
const app = express();

const axios = require('axios');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;

const generateRandomString = length => {
    let text = '';
    const possible = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for(let i = 0; i < length; i ++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const stateKey = 'spotify_auth_state';

app.get('/login', (req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    const scope = 'user-read-private user-read-email';

    const queryParams = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        state: state,
        scope: scope,
    });
   res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});


app.get('/callback', (req, res) => {
    const code = req.query.code || null;

    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }),
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
        }
    })
        .then(response => {
            if (response.status === 200) {
                const { access_token, token_type } = response.data;

                axios.get('https://api.spotify.com/v1/me', {
                    headers: {
                        Authorization: `${token_type} ${access_token}`
                    }
                })
                    .then(response => {
                        res.send(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`)
                    })
                    .catch(error => {
                        res.send(error)
                    })
            } else {
                res.send(response)
            }
        })
        .catch(error => {
            res.send(error)
        });
});

app.listen(port, () =>{
    console.log('Started');
});
