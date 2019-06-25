'use strict';

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

function findParent(elem) {
  if (elem.parentNode) {
    // Accounting for https://bugs.webkit.org/show_bug.cgi?id=161454
    var dataset = JSON.parse(JSON.stringify(elem.parentNode.dataset));

    if (dataset.module) {
      return elem.parentNode;
    }

    return findParent(elem.parentNode);
  }

  return elem;
}

/* global window */
function attrObj (key, el) {
  var values = {};
  Object.keys(el.dataset).forEach(function (data) {
    if (data.match(new RegExp("^" + key)) && data !== key) {
      var optionName = data.replace(key, '');
      var isGlobal = false;

      if (optionName.match(/^Global/)) {
        optionName = optionName.replace('Global', '');
        isGlobal = true;
      }

      optionName = "" + optionName[0].toLowerCase() + optionName.slice(1);

      if (isGlobal) {
        values[optionName] = window[el.dataset[data]];
      } else {
        values[optionName] = el.dataset[data];
      }
    }
  });
  return values;
}

var aug = function aug() {
  var args = Array.prototype.slice.call(arguments); //eslint-disable-line prefer-rest-params

  var org = args.shift();
  var type = '';

  if (typeof org === 'string' || typeof org === 'boolean') {
    type = org === true ? 'deep' : org;
    org = args.shift();

    if (type === 'defaults') {
      org = aug({}, org); //clone defaults into new object

      type = 'strict';
    }
  }

  args.forEach(function (prop) {
    for (var propName in prop) {
      //eslint-disable-line
      var propValue = prop[propName]; // just overwrite arrays:

      if (Array.isArray(propValue)) {
        org[propName] = propValue;
        continue;
      }

      if (type === 'deep' && typeof propValue === 'object' && typeof org[propName] !== 'undefined') {
        if (typeof org[propName] !== 'object') {
          org[propName] = propValue;
          continue;
        }

        aug(type, org[propName], propValue);
      } else if (type !== 'strict' || type === 'strict' && typeof org[propName] !== 'undefined') {
        org[propName] = propValue;
      }
    }
  });
  return org;
};

var aug_1 = aug;

function isWindow(obj) {
  return obj != null && obj === obj.window;
}

function find(selector, context) {
  if (context === void 0) {
    context = null;
  }

  if (selector instanceof HTMLElement || selector instanceof Node || isWindow(selector)) {
    return [selector];
  } else if (selector instanceof NodeList) {
    return [].slice.call(selector);
  } else if (typeof selector === 'string') {
    var startElement = context ? find(context)[0] : document;
    return [].slice.call(startElement.querySelectorAll(selector));
  }

  return [];
}

function on(selector, event, cb, capture) {
  if (capture === void 0) {
    capture = false;
  }

  if (Array.isArray(selector)) {
    selector.forEach(function (item) {
      return on(item, event, cb, capture);
    });
    return;
  }

  var data = {
    cb: cb,
    capture: capture
  };

  if (!window._domassistevents) {
    window._domassistevents = {};
  }

  window._domassistevents["_" + event] = data;
  var el = find(selector);

  if (el.length) {
    el.forEach(function (item) {
      item.addEventListener(event, cb, capture);
    });
  }
}

function findOne(selector, el) {
  var found = find(selector, el);

  if (found.length) {
    return found[0];
  }

  return null;
}

var NativeCustomEvent = window.CustomEvent; //
// Check for the usage of native support for CustomEvents which is lacking
// completely on IE.
//

function canIuseNativeCustom() {
  try {
    var p = new NativeCustomEvent('t', {
      detail: {
        a: 'b'
      }
    });
    return p.type === 't' && p.detail.a === 'b';
  } catch (e) {
    return false;
  }
} // Lousy polyfill for the Custom Event constructor for IE.


var IECustomEvent = function CustomEvent(type, params) {
  var e = document.createEvent('CustomEvent');

  if (params) {
    e.initCustomEvent(type, params.bubbles, params.cancelable, params.detail);
  } else {
    e.initCustomEvent(type, false, false, undefined);
  }

  return e;
};

var DomassistCustomEvent = canIuseNativeCustom() ? NativeCustomEvent : IECustomEvent;

var SCROLLABLE_CONTAINER;

function getScrollableContainer() {
  if (SCROLLABLE_CONTAINER) {
    return SCROLLABLE_CONTAINER;
  }

  var documentElement = window.document.documentElement;
  var scrollableContainer;
  documentElement.scrollTop = 1;

  if (documentElement.scrollTop === 1) {
    documentElement.scrollTop = 0;
    scrollableContainer = documentElement;
  } else {
    scrollableContainer = document.body;
  }

  SCROLLABLE_CONTAINER = scrollableContainer;
  return scrollableContainer;
}

SCROLLABLE_CONTAINER = getScrollableContainer();

var ACTION_SELECTOR = '[data-action]';
var DOMAssist = {
  find: find,
  findOne: findOne,
  on: on
};

var Domodule =
/*#__PURE__*/
function () {
  function Domodule(el) {
    this.log('begin setup');
    this.el = el;
    this.els = {};
    this.options = aug_1({}, this.defaults, attrObj('module', this.el));
    this.moduleName = this.el.dataset.module;
    this.setUps = {
      actions: [],
      named: [],
      options: []
    };
    this.boundActionRouter = this.actionRouter.bind(this);
    this.preInit();
    this.storeRef();
    this.setupActions();
    this.setupNamed();
    this.verifyRequired();
    this.postInit();
    this.log('initalized');

    if (Domodule.debug) {
      this.el.module = this;
    }

    return this;
  }

  var _proto = Domodule.prototype;

  _proto.preInit = function preInit() {};

  _proto.postInit = function postInit() {};

  _proto.verifyRequired = function verifyRequired() {
    var _this = this;

    if (this.required === {}) {
      return this;
    }

    if (typeof this.required.options !== 'undefined') {
      this.setUps.options = Object.keys(this.options);
    }

    Object.keys(this.required).forEach(function (required) {
      _this.required[required].forEach(function (value) {
        if (_this.setUps[required].indexOf(value) < 0) {
          throw new Error(value + " is required as " + required + " for " + _this.moduleName + ", but is missing!");
        }
      });
    });
    return this;
  };

  _proto.setupActions = function setupActions() {
    var _this2 = this;

    this.setupAction(this.el);
    this.find(ACTION_SELECTOR).forEach(function (action) {
      var parent = findParent(action);

      if (parent === _this2.el) {
        _this2.setupAction(action);
      }
    });
  };

  _proto.setupAction = function setupAction(actionEl) {
    if (actionEl.dataset.domoduleActionProcessed === 'true') {
      return;
    }

    var _Domodule$parseAction = Domodule.parseAction(actionEl),
        actionName = _Domodule$parseAction.name,
        actionType = _Domodule$parseAction.type;

    if (!actionName) {
      return;
    } else if (typeof this[actionName] !== 'function') {
      this.log(actionName + " was registered, but there is no function set up");
      return;
    }

    this.log(actionName + " bound");
    this.storeSetUp(actionName, 'actions');
    DOMAssist.on(actionEl, actionType, this.boundActionRouter);
    actionEl.dataset.domoduleActionProcessed = 'true';
  };

  _proto.actionRouter = function actionRouter(event) {
    var actionEl = event.currentTarget;

    var _Domodule$parseAction2 = Domodule.parseAction(actionEl),
        actionName = _Domodule$parseAction2.name;

    var actionData = attrObj('action', actionEl);
    this[actionName].call(this, actionEl, event, actionData);
  };

  _proto.setupNamed = function setupNamed() {
    var _this3 = this;

    this.find('[data-name]').forEach(function (named) {
      var parent = findParent(named);

      if (parent !== _this3.el) {
        return;
      }

      if (!named.dataset.domoduleNameProcessed) {
        _this3.els[named.dataset.name] = named;

        _this3.storeSetUp(named.dataset.name, 'named');

        named.dataset.domoduleNameProcessed = 'true';
        named.dataset.domoduleOwner = _this3.id;
      }
    });
  };

  _proto.storeRef = function storeRef() {
    if (typeof window.domorefs === 'undefined') {
      window.domorefs = {};
    }

    if (typeof window.domorefs[this.el.dataset.moduleUid] !== 'undefined') {
      return false;
    }

    this.id = this.uuid;
    this.el.dataset.moduleUid = this.id;
    window.domorefs[this.el.dataset.moduleUid] = this;
  };

  _proto.find = function find(selector) {
    return DOMAssist.find(selector, this.el);
  };

  _proto.findOne = function findOne(selector) {
    return DOMAssist.findOne(selector, this.el);
  };

  _proto.findByName = function findByName(name) {
    return this.els[name];
  };

  _proto.getOption = function getOption(option) {
    return this.options[option];
  };

  _proto.storeSetUp = function storeSetUp(name, dict) {
    if (this.setUps[dict].indexOf(name) < 0) {
      this.setUps[dict].push(name);
    }
  };

  _proto.destroy = function destroy() {
    var _this4 = this;

    DOMAssist.find(ACTION_SELECTOR, this.el.parentNode).forEach(function (el) {
      if (el.dataset.domoduleActionProcessed === 'true') {
        var _Domodule$parseAction3 = Domodule.parseAction(el),
            actionType = _Domodule$parseAction3.type;

        el.removeEventListener(actionType, _this4.boundActionRouter);
        el.dataset.domoduleActionProcessed = 'false';
      }
    });
  } // static methods can't access `this` so they go last
  ;

  Domodule.parseAction = function parseAction(el) {
    var _el$dataset = el.dataset,
        name = _el$dataset.action,
        _el$dataset$actionTyp = _el$dataset.actionType,
        type = _el$dataset$actionTyp === void 0 ? 'click' : _el$dataset$actionTyp;
    return {
      name: name,
      type: type
    };
  };

  Domodule.getInstance = function getInstance(element) {
    if (element instanceof Node) {
      return window.domorefs[element.dataset.moduleUid];
    }

    throw new Error('getInstance expects a dom node');
  };

  Domodule.register = function register(name, cls) {
    if (typeof name === 'function') {
      cls = name;
      name = cls.prototype.constructor.name;
    }

    if (!window.domodules) {
      window.domodules = {};
    }

    Domodule.log("Registering " + name);
    window.domodules[name] = cls;
  };

  Domodule.discover = function discover(el) {
    if (el === void 0) {
      el = 'body';
    }

    Domodule.log('Discovering modules...');

    if (!window.domodules) {
      Domodule.log('No modules found');
      return;
    }

    var els;

    if (el instanceof Node) {
      els = [el];
    } else if (Array.isArray(el)) {
      els = el;
    } else {
      els = DOMAssist.find(el);
    }

    var instances = [];
    els.forEach(function (matched) {
      var foundModules = DOMAssist.find('[data-module]', matched);
      foundModules.forEach(function (moduleEl) {
        var moduleName = moduleEl.dataset.module;

        if (moduleName && typeof window.domodules[moduleName] === 'function') {
          if (typeof window.domorefs === 'object' && typeof window.domorefs[moduleEl.dataset.moduleUid] !== 'undefined') {
            return;
          }

          Domodule.log(moduleName + " found");
          instances.push(new window.domodules[moduleName](moduleEl));
        }
      });
    });
    return instances;
  } //used inside instance
  ;

  _proto.log = function log(msg) {
    Domodule.log(this.constructor.name + ": " + msg);
  };

  Domodule.log = function log(msg) {
    if (Domodule.debug) {
      console.log("[DOMODULE] " + msg); //eslint-disable-line no-console
    }
  };

  _createClass(Domodule, [{
    key: "required",
    get: function get() {
      return {};
    }
  }, {
    key: "defaults",
    get: function get() {
      return {};
    }
  }, {
    key: "uuid",
    get: function get() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
      });
    }
  }]);

  return Domodule;
}();

Domodule.debug = typeof window.localStorage === 'object' && window.localStorage.getItem('DomoduleDebug');
Domodule.autoDiscover = true;
window.addEventListener('DOMContentLoaded', function () {
  if (Domodule.autoDiscover) {
    Domodule.discover();
  }
});

function isWindow$1(obj) {
  return obj != null && obj === obj.window;
}

function find$1(selector, context) {
  if (context === void 0) {
    context = null;
  }

  if (selector instanceof HTMLElement || selector instanceof Node || isWindow$1(selector)) {
    return [selector];
  } else if (selector instanceof NodeList) {
    return [].slice.call(selector);
  } else if (typeof selector === 'string') {
    var startElement = context ? find$1(context)[0] : document;
    return [].slice.call(startElement.querySelectorAll(selector));
  }

  return [];
}

function on$1(selector, event, cb, capture) {
  if (capture === void 0) {
    capture = false;
  }

  if (Array.isArray(selector)) {
    selector.forEach(function (item) {
      return on$1(item, event, cb, capture);
    });
    return;
  }

  var data = {
    cb: cb,
    capture: capture
  };

  if (!window._domassistevents) {
    window._domassistevents = {};
  }

  window._domassistevents["_" + event] = data;
  var el = find$1(selector);

  if (el.length) {
    el.forEach(function (item) {
      item.addEventListener(event, cb, capture);
    });
  }
}

var NativeCustomEvent$1 = window.CustomEvent; //
// Check for the usage of native support for CustomEvents which is lacking
// completely on IE.
//

function canIuseNativeCustom$1() {
  try {
    var p = new NativeCustomEvent$1('t', {
      detail: {
        a: 'b'
      }
    });
    return p.type === 't' && p.detail.a === 'b';
  } catch (e) {
    return false;
  }
} // Lousy polyfill for the Custom Event constructor for IE.


var IECustomEvent$1 = function CustomEvent(type, params) {
  var e = document.createEvent('CustomEvent');

  if (params) {
    e.initCustomEvent(type, params.bubbles, params.cancelable, params.detail);
  } else {
    e.initCustomEvent(type, false, false, undefined);
  }

  return e;
};

var DomassistCustomEvent$1 = canIuseNativeCustom$1() ? NativeCustomEvent$1 : IECustomEvent$1;

function fire(selector, type, params) {
  if (params === void 0) {
    params = {};
  }

  if (Array.isArray(selector)) {
    return selector.forEach(function (item) {
      return fire(item, type, params);
    });
  }

  var els = find$1(selector);

  if (els.length) {
    if (params.bubbles !== false) {
      params.bubbles = true;
    }

    els.forEach(function (el) {
      var event = new DomassistCustomEvent$1(type, params);
      el.dispatchEvent(event);
    });
    return els;
  }
}

var SCROLLABLE_CONTAINER$1;

function getScrollableContainer$1() {
  if (SCROLLABLE_CONTAINER$1) {
    return SCROLLABLE_CONTAINER$1;
  }

  var documentElement = window.document.documentElement;
  var scrollableContainer;
  documentElement.scrollTop = 1;

  if (documentElement.scrollTop === 1) {
    documentElement.scrollTop = 0;
    scrollableContainer = documentElement;
  } else {
    scrollableContainer = document.body;
  }

  SCROLLABLE_CONTAINER$1 = scrollableContainer;
  return scrollableContainer;
}

SCROLLABLE_CONTAINER$1 = getScrollableContainer$1();

var Reload =
/*#__PURE__*/
function (_Domodule) {
  _inheritsLoose(Reload, _Domodule);

  function Reload() {
    return _Domodule.apply(this, arguments) || this;
  }

  var _proto = Reload.prototype;

  _proto.postInit = function postInit() {
    on$1(this.el, 'click', this.onClick.bind(this));
  };

  _proto.onClick = function onClick(event) {
    event.preventDefault();
    fire(this.el, 'tessst', {
      bubbles: true
    });
  };

  return Reload;
}(Domodule);

Domodule.register('Reload', Reload);

var Test =
/*#__PURE__*/
function () {
  function Test() {
    console.log('test');
  }

  var _proto2 = Test.prototype;

  _proto2.type = function type() {
    console.log(typeof find$1);
  };

  return Test;
}();

var Do =
/*#__PURE__*/
function (_Test) {
  _inheritsLoose(Do, _Test);

  function Do() {
    var _this;

    _this = _Test.call(this) || this;

    _this.echo();

    return _this;
  }

  var _proto3 = Do.prototype;

  _proto3.echo = function echo(message) {
    if (message === void 0) {
      message = 'something';
    }

    console.log(message);
  };

  return Do;
}(Test);

var matrix = ['a', 'b', 'c'];
var first = matrix[0];
var obj = {
  first: first
};

var f = function f() {
  return obj;
};

function foo() {
  var _f = f(),
      a = _f.a;

  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  console.log(args);
  return a;
}

console.log(foo(matrix, Test));

module.exports = Do;
//# sourceMappingURL=domassist.cjs.js.map
