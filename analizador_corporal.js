// analizador_corporal.js

module.exports = {
  json: () => (req, res, next) => {
    // Middleware ficticio o de ejemplo
    console.log("Middleware de análisis corporal ejecutado");
    next();
  }
};
