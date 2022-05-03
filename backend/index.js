import 'dotenv/config';
import express from 'express';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {v4 as uuidvs} from 'uuid';
import seedDatabase from './seedDatabase.js';

//console.log(Number(process.env.SALT_ROUNDS))

await seedDatabase();

const app = express();
const port = 8080;
const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,x-access-token",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST",
    "Access-Control-Expose-Headers": "Content-Type,x-access-token"
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

app.get("/health", (req, res) => {
    console.log("Health check endpoint is reached");
    res.send("Healthy");
});

app.get("/hello", (req, res) => {
    console.log("GET Hello World");
    //console.log("Body:", req.body);
    res.set(headers);

    const db = new sqlite3.Database('../database/myapp.sqlite3', async (err) => {
        if (err)
            console.error(err);
        else {
            db.all("SELECT * FROM users;", [], (err, rows) => {
                if (rows && err == null) {
                    res.send({message: "Hello World from backend", rows: rows});
                }
            });
        }
    });
});

app.get("/login", (req ,res) => {
    console.log("login attempt:", req.query.id);
    res.set(headers);
    const db = new sqlite3.Database('../database/myapp.sqlite3', async (err) => {
        if (err) {
            console.error(err);
            res.send({login: false});
        } else {
            db.all("SELECT * FROM users WHERE id=?;", [req.query.id], (err, rows) => {
                
                if (rows.length > 0 && err == null) {
                    bcrypt.compare(req.query.password + process.env.SECRET_KEY, rows[0].password, (err, result) => {
                        if (err == null && result === true) {
                            delete rows[0].password;
                            res.set(getTokenHeader(rows[0].id));
                            res.send({login: true, user: rows[0]});
                        } else
                            res.send({login: false});
                    });
                } else 
                    res.send({login: false});
            });
        }
    });
});

app.get("/login-verify", (req, res) => {
    console.log("login verifying");
    res.set(headers);
    jwt.verify(req.header('x-access-token'), process.env.SECRET_KEY, (err, decoded) => {
        if (err == null) {
            console.log("user:", decoded.id);
            res.set(getTokenHeader(decoded.id));
            res.send({login: true});
        } else  {
            res.send({login: false});
        }
    })
});

function getTokenHeader(id) {
    const token = jwt.sign({id: id}, process.env.SECRET_KEY, { algorithm: 'HS256', expiresIn: 10 });
    const tokenHeader = {...headers, 'x-access-token': token};
    return tokenHeader;
}

app.options("/hello", (req, res) => {
    res.set(headers);
    res.send("preflight response");
});

app.options("/login", (req, res) => {
    res.set(headers);
    res.send("preflight response");
});

app.options("/login-verify", (req, res) => {
    res.set(headers);
    res.send("preflight response");
});

const logger = (req, res, next) => {
    console.log("Unexpected path:", req.url);
    next();
}

app.use(logger);

const server = app.listen(port, () => {
    console.log("Listening on port:", port);
});

async function closeGracefully(signal) {
    console.log(`Received termated signal: ${signal}; process terminated...`);
    await server.close();
    process.exit();
}
process.on("SIGINT", closeGracefully);
process.on("SIGTERM", closeGracefully);