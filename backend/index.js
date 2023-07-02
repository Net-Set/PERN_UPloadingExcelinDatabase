const express = require('express');
const multer = require('multer');
const exceljs = require('exceljs');
const { Pool } = require('pg');

const app = express();
const port = 5000;

// Set up PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'excel_data',
  password: '12345',
  port: 5432,
});

// Set up Multer for file upload
const upload = multer({ dest: 'uploads/' });

// API endpoint for file upload
app.post('/upload', upload.single('file'), (req, res) => {
  const workbook = new exceljs.Workbook();
  const file = req.file;

  workbook.xlsx.readFile(file.path).then(() => {
    const worksheet = workbook.getWorksheet(1);
    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber !== 1) { // Exclude header row
        const rowData = row.values.slice(1); // Exclude first column
        rows.push(rowData);
      }
    });

    const query = 'INSERT INTO excel_data (column1, column2, column3) VALUES ($1, $2, $3)';

    rows.forEach((row) => {
      pool.query(query, row, (error) => {
        if (error) {
          console.error('Error inserting row:', error);
        }
      });
    });

    res.status(200).send('File uploaded and data inserted successfully.');
  });
});

app.get('/data', (req, res) => {
    pool.query('SELECT * FROM excel_data', (error, result) => {
      if (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(200).json(result.rows);
      }
    });
  });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
