const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_notes_db');
const app = express();

app.use(express.json());
app.use(require('morgan')('dev'));
app.get('/api/flavours', async (req, res, next) => {
    try {
        const SQL = `SELECT * from flavours ORDER BY created_at DESC;`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error)
    }
});
app.get('/api/flavours/:id', async (req, res, next) => {
    try {
        const SQL = `SELECT * from flavours WHERE id=$1 ;`;
        const response = await client.query(SQL,[req.params.id]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error)
    }
});
app.post('/api/flavours', async (req, res, next) => {
    try {
        const SQL = `
        INSERT INTO flavours (name,is_favorite) 
        VALUES($1,$2) RETURNING *; `;
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error)
    }
});
app.put('/api/flavours/:id', async (req, res, next) => {
    try {
        const SQL = `
        UPDATE flavours 
        SET name=$1, is_favorite=$2,updated_at=now()
        WHERE id=$3 RETURNING *; `;
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error)
    }
});
app.delete('/api/flavours/:id', async (req, res, next) => {
    try {
        const SQL = `
        DELETE from flavours 
        WHERE id=$1; `;
        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (error) {
        next(error)
    }
});


const init = async () => {
    await client.connect();
    console.log('Database connected');
    let SQL = `
    DROP TABLE IF EXISTS flavours;
    CREATE TABLE flavours (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now());
    `;
    await client.query(SQL);
    console.log('tables created');
    SQL = `
    INSERT INTO flavours(name,is_favorite) VALUES('chocolate',true);
    INSERT INTO flavours(name,is_favorite) VALUES('vanilla',true);
    INSERT INTO flavours(name,is_favorite) VALUES('strawberry',false);
    INSERT INTO flavours(name,is_favorite) VALUES('blueberry',false);
    `;
    await client.query(SQL);
    console.log('data seeded');
    const port = process.env.PORT || 3001;
    app.listen(port, () => console.log(`listening on port ${port}`))
};

init();