const express = require('express');
const { users, documents, employees } = require('./data');

const app = express();
const PORT = 3000;

// 1. Спочатку ВИЗНАЧАЄМО функцію логування
const loggingMiddleware = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;

  console.log(`[${timestamp}] ${method} ${url}`);
  next();
};

// 2. Вбудований middleware Express
app.use(express.json());

// 3. ГЛОБАЛЬНО застосовуємо наш логер
// Тепер він спрацює для всіх запитів до того, як вони дійдуть до маршрутів
app.use(loggingMiddleware);

// --- ІНШІ MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
  const login = req.headers['x-login'];
  const password = req.headers['x-password'];
  const user = users.find(u => u.login === login && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Authentication failed. Please provide valid credentials.' });
  }

  req.user = user;
  next();
};

const adminOnlyMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// --- МАРШРУТИ ДЛЯ РЕСУРСІВ ---

app.get('/documents', authMiddleware, (req, res) => {
  res.status(200).json(documents);
});

app.post('/documents', authMiddleware, (req, res) => {
  const newDocument = req.body;
  newDocument.id = Date.now();
  documents.push(newDocument);
  res.status(201).json(newDocument);
});

app.get('/employees', authMiddleware, adminOnlyMiddleware, (req, res) => {
  res.status(200).json(employees);
});

// --- СТАРТ СЕРВЕРА ---

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});