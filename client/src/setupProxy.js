const { createProxyMiddleware } = require('http-proxy-middleware');
const proxy = require('http-proxy-middleware');
module.exports = function(app) {
    app.use(createProxyMiddleware('/auth/google', 
        { target: 'http://localhost:5000' } 
    ));
    app.use(createProxyMiddleware('/api/*', 
    { target: 'http://localhost:5000' } 
));
    app.use(createProxyMiddleware('/upload', 
    { target: 'http://localhost:5000' } 
));
    app.use(createProxyMiddleware('/sendemails', 
    { target: 'http://localhost:5000' } 
));
};