/**
 * Async handler wrapper to catch errors in async route handlers
 * and pass them to Express error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
