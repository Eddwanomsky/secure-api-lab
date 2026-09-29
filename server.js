const express = require('express');
const { users, documents, employees } = require('./data');

const app = express();
const PORT = 3000;

// --- MIDDLEWARE ---

// Логуючий middleware
const loggingMiddleware = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;

  console.log(`[${timestamp}] ${method} ${url}`);
  next();
};

// Вбудований middleware Express для парсингу JSON
app.use(express.json());

// Глобальне підключення логера
app.use(loggingMiddleware);

// Middleware авторизації
const authMiddleware = (req, res, next) => {
  const login = req.headers['x-login'];
  const password = req.headers['x-password'];

  const user = users.find(u => u.login === login && u.password === password);

  if (!user) {
    return res.status(401).json({ 
      message: 'Authentication failed. Please provide valid credentials in headers X-Login and X-Password.' 
    });
  }

  req.user = user;
  next();
};

// Middleware обмеження доступу за роллю
const adminOnlyMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }

  next();
};

// --- МАРШРУТИ ДЛЯ РЕСУРСІВ ---

// 1. Отримання списку всіх документів
app.get('/documents', authMiddleware, (req, res) => {
  res.status(200).json(documents);
});

// 2. Створення нового документа (з валідацією полів)
app.post('/documents', authMiddleware, (req, res) => {
  const { title, content } = req.body;

  // Перевірка наявності обов'язкових полів
  if (!title || !content) {
    return res.status(400).json({ 
      message: 'Bad Request. Fields "title" and "content" are required.' 
    });
  }

  const newDocument = {
    id: Date.now(),
    title,
    content,
  };

  documents.push(newDocument);
  res.status(201).json(newDocument);
});

// 3. Видалення документа за ID
app.delete('/documents/:id', authMiddleware, (req, res) => {
  const documentId = parseInt(req.params.id);
  const documentIndex = documents.findIndex(doc => doc.id === documentId);

  // Якщо документ не знайдено
  if (documentIndex === -1) {
    return res.status(404).json({ message: 'Document not found' });
  }

  // Видалення з масиву
  documents.splice(documentIndex, 1);

  // Відповідь 204 No Content (без тіла)
  res.status(204).send();
});

// 4. Отримання списку співробітників (тільки для admin)
app.get('/employees', authMiddleware, adminOnlyMiddleware, (req, res) => {
  res.status(200).json(employees);
});

// --- СТАРТ СЕРВЕРА ---

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});