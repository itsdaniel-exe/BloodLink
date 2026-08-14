// Wraps an async Express route handler so a rejected promise (e.g. a failed Firestore write)
// is passed to next() instead of becoming an unhandled rejection that crashes the process.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
