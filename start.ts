import app from './server';

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`EasyBookly Server running on http://localhost:${PORT}`);
});
