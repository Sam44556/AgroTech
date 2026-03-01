const http = require('http');

const data = JSON.stringify({
    email: 'samuelgirma888@gmail.com',
    password: '11111111'
});

const options = {
    hostname: 'localhost',
    port: 10000,
    path: '/api/auth/sign-in/email',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Origin': 'http://localhost:3000'
    }
};

const req = http.request(options, (res) => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', res.headers);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log('BODY:', chunk);
    });
});

req.on('error', (e) => {
    console.error('Problem with request:', e.message);
});

req.write(data);
req.end();
