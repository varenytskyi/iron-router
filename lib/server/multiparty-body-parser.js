multipartyBodyParser = (function (global) {

    var multiparty  = Npm.require('multiparty'),
        qs          = Npm.require('qs');

    return function (options) {
        options = options || {};

        return function multipart(req, res, next) {
            if (req._body) return next();
            req.body = req.body || {};
            req.files = req.files || {};

            if (!hasBody(req)) return next();
            if ('GET' === req.method || 'HEAD' === req.method) return next();
            if ('multipart/form-data' !== mime(req)) return next();

            req._body = true;

            var form = new multiparty.Form(options);
            var data = {};
            var files = {};
            var waitend = true;
            var done = false;

            req.on('aborted', cleanup)
            req.on('end', cleanup)
            req.on('error', cleanup)

            function cleanup() {
                waitend = false;
                req.removeListener('aborted', cleanup);
                req.removeListener('end', cleanup);
                req.removeListener('error', cleanup);
            }

            function ondata(name, val, data) {
                if (Array.isArray(data[name])) {
                    data[name].push(val);
                } else if (data[name]) {
                    data[name] = [data[name], val];
                } else {
                    data[name] = val;
                }
            }

            form.on('field', function(name, val) {
                ondata(name, val, data);
            });

            form.on('file', function(name, val) {
                val.name = val.originalFilename;
                val.type = val.headers['content-type'] || null;
                ondata(name, val, files);
            });

            form.on('error', function(err) {
                if (done) return;
                done = true;
                err.status = 400;
                if (waitend && req.readable) {
                    req.resume();
                    req.once('end', function onEnd () {
                        next(err)
                    });
                    return;
                }
                next(err);
            });

            form.on('close', function() {
                if (done) return;
                done = true;
                try {
                    req.body = qs.parse(data);
                    req.files = files
                    next();
                } catch (err) {
                    err.status = 400;
                    next(err);
                }
            });

            form.parse(req);
        }
    };

    function hasBody (req) {
        var encoding    = 'transfer-encoding' in req.headers,
            length      = 'content-length' in req.headers && req.headers['content-length'] !== '0';
        return encoding || length;
    }

    function mime (req) {
        var str = req.headers['content-type'] || '';
        return str.split(';')[0];
    }
})(this);