function cors(req, res, next) {
    const allowedOrigin = 'https://denirant.github.io/MeMetricsClient/'; // Укажите свой домен
  
    const requestOrigin = req.get('Origin');
    if (requestOrigin && requestOrigin === allowedOrigin) {
      res.header('Access-Control-Allow-Origin', requestOrigin);
      res.header('Access-Control-Allow-Methods', 'GET, PUT, PATCH, POST, DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    } else {
      res.status(403).send('Forbidden');
    }
  }
  
  module.exports = cors;