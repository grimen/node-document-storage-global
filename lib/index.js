require('sugar')
var util = require('util');

// HACK: ...until Node.js `require` supports `instanceof` on modules loaded more than once. (bug in Node.js)
var Storage = global.NodeDocumentStorage || (global.NodeDocumentStorage = require('node-document-storage'));

// -----------------------
//  Constructor
// --------------------

// new Global ();
// new Global (options);
// new Global (url);
// new Global (url, options);
function Global () {
  var self = this;

  self.klass = Global;
  self.klass.super_.apply(self, arguments);

  self.options.server.db = self.options.server.db.replace(/^\//, '');
}

util.inherits(Global, Storage);

// -----------------------
//  Class
// --------------------

Global.defaults = {
  url: process.env.MEMORY_URL || 'global:///{db}-{env}'.assign({db: 'default', env: (process.env.NODE_ENV || 'development')}),
  options: {}
};

Global.url = Global.defaults.url;
Global.options = Global.defaults.options;

Global.reset = Storage.reset;

// -----------------------
//  Client
// --------------------

// FIXME: Respect `Global.url` parameters - just for the purpose of conventions. :)
Global.Client = function() {
  this.set = function(key, value, callback) {
    callback = callback || function(){};
    try {
      global.memory = global.memory || {};
      global.memory[key] = value;
      var result = (global.memory[key] === value);
      callback(null, result, result);
    } catch (err) {
      callback(err);
    }
  };

  this.get = function(key, callback) {
    callback = callback || function(){};
    try {
      global.memory = global.memory || {};
      var result = global.memory[key] || null;
      callback(null, result, result);
    } catch (err) {
      callback(err);
    }
  };

  this.del = function(key, callback) {
    callback = callback || function(){};
    try {
      global.memory = global.memory || {};
      var result = !!global.memory[key];
      delete global.memory[key];
     callback(null, result, result);
    } catch (err) {
      callback(err);
    }
  },

  this.exists = function(key, callback) {
    callback = callback || function(){};
    this.get(key, function(err, result) {
      callback(err, !!result);
    });
  }
};

// -----------------------
//  Instance
// --------------------

// #connect ()
Global.prototype.connect = function() {
  var self = this;

  self._connect(function() {
    self.client = new Global.Client(); // TODO: Pass URL to constructor - parse out global variable name from URL.

    self.emit('ready');
  });
};

// #key (key)
Global.prototype.key = function(key) {
  var self = this;
  var _key = [self.options.server.db, key].join('/');
  return _key;
};

// #set (key, value, [options], callback)
// #set (keys, values, [options], callback)
Global.prototype.set = function() {
  var self = this;

  self._set(arguments, function(key_values, options, done, next) {
    key_values.each(function(key, value) {
      self.client.set(key, value, function(err, result, response) {
        next(key, err, result, response);
      });
    });
  });
};

// #get (key, [options], callback)
// #get (keys, [options], callback)
Global.prototype.get = function() {
  var self = this;

  self._get(arguments, function(keys, options, done, next) {
    keys.each(function(key) {
      self.client.get(key, function(err, result, response) {
        next(key, err, result, response);
      });
    });
  });
};

// #del (key, [options], callback)
// #del (keys, [options], callback)
Global.prototype.del = function() {
  var self = this;

  self._del(arguments, function(keys, options, done, next) {
    keys.each(function(key) {
      self.client.del(key, function(err, response) {
        next(key, err, response, response);
      });
    });
  });
};

// #exists (key, [options], callback)
// #exists (keys, [options], callback)
Global.prototype.exists = function() {
  var self = this;

  self._exists(arguments, function(keys, options, done, next) {
    keys.each(function(key) {
      self.client.exists(key, function(err, response) {
        next(key, err, response, response);
      });
    });
  });
};

// -----------------------
//  Export
// --------------------

module.exports = Global;
