var connect = Npm.require('connect');
var Fiber = Npm.require('fibers');
var bodyParser = Npm.require('body-parser');

var root = global;

var connectHandlers;

if (typeof __meteor_bootstrap__.app !== 'undefined') {
  connectHandlers = __meteor_bootstrap__.app;
} else {
  connectHandlers = WebApp.connectHandlers;
}

IronRouter = Utils.extend(IronRouter, {
  constructor: function (options) {
    var self = this;
    IronRouter.__super__.constructor.apply(this, arguments);
    Meteor.startup(function () {
      setTimeout(function () {
        if (self.options.autoStart !== false)
          self.start();
      });
    });
  },

  start: function () {
    connectHandlers
      .use(bodyParser.json())
      .use(bodyParser.urlencoded({extended: true}))
      .use(multipartyBodyParser())
      .use(_.bind(this.onRequest, this));
  },

  onRequest: function (req, res, next) {
    var self = this;
    Fiber(function () {
      self.dispatch(req.url, {
        request: req,
        response: res,
        next: next
      });
    }).run();
  },

  run: function (controller, cb) {
    IronRouter.__super__.run.apply(this, arguments);
    if (controller === this._currentController)
      cb && cb(controller);
  },

  stop: function () {
  },

  onUnhandled: function (path, options) {
    options.next();
  },

  onRouteNotFound: function (path, options) {
    options.next();
  }
});

Router = new IronRouter;
