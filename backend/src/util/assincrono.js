module.exports = function assincrono(fn) {
  return (req, res, next) => fn(req, res, next).catch(next)
}
