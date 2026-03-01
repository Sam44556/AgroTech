import http from 'http';

function doReq(path, method, body) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 10000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3000'
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ headers: res.headers, status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    const loginRes = await doReq('/api/auth/sign-in/email', 'POST', {
        email: 'samuelgirma888@gmail.com',
        password: '11111111'
    });
    console.log("Login Status:", loginRes.status);
    console.log("Set-Cookie:", loginRes.headers['set-cookie']);
    console.log("Body:", loginRes.body);
}

test();
