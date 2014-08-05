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
    var options = this.getSettings();
    connectHandlers
      .use(bodyParser.json(options.bodyParser['json']))
      .use(bodyParser.urlencoded(options.bodyParser['urlencoded']))
      .use(multipartyBodyParser(options.multiparty))
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
  },

  getSettings: function () {
    var options = {
      bodyParser: {},
      multiparty: {}
    };
    ironRouterOpts = Meteor.settings['ironRouter'];
    if (ironRouterOpts) {
      var bodyParser = ironRouterOpts['bodyParser'],
          multiparty = ironRouterOpts['multiparty'];
      if (bodyParser) {
        if (bodyParser.json) {
          options.bodyParser.json = _.extend({}, bodyParser.json);
        }
        if (bodyParser.urlencoded) {
          options.bodyParser.urlencoded = _.extend({ extended: true }, bodyParser.urlencoded);
        }
      }
      if (multiparty) {
        options.multiparty = _.extend({}, multiparty);
      }
    }
    return options;
  }
});

Router = new IronRouter;
