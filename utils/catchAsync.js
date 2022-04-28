module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch((err) => next(err));
};

// const catchAsync = (fn) => (req, res, next) => {
//   fn(req, res, next).catch(next);
// };
