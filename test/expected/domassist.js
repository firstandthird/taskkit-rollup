var app = (function () {
  'use strict';

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

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

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
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
      if (data.match(new RegExp("^".concat(key))) && data !== key) {
        var optionName = data.replace(key, '');
        var isGlobal = false;

        if (optionName.match(/^Global/)) {
          optionName = optionName.replace('Global', '');
          isGlobal = true;
        }

        optionName = "".concat(optionName[0].toLowerCase()).concat(optionName.slice(1));

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

        if (type === 'deep' && _typeof(propValue) === 'object' && typeof org[propName] !== 'undefined') {
          if (_typeof(org[propName]) !== 'object') {
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

  function find(selector) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

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

  function on(selector, event, cb) {
    var capture = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

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

    window._domassistevents["_".concat(event)] = data;
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

  function fire(selector, type) {
    var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    if (Array.isArray(selector)) {
      return selector.forEach(function (item) {
        return fire(item, type, params);
      });
    }

    var els = find(selector);

    if (els.length) {
      if (params.bubbles !== false) {
        params.bubbles = true;
      }

      els.forEach(function (el) {
        var event = new DomassistCustomEvent(type, params);
        el.dispatchEvent(event);
      });
      return els;
    }
  }

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

  /* global DocumentTouch */

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
      _classCallCheck(this, Domodule);

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

    _createClass(Domodule, [{
      key: "preInit",
      value: function preInit() {}
    }, {
      key: "postInit",
      value: function postInit() {}
    }, {
      key: "verifyRequired",
      value: function verifyRequired() {
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
              throw new Error("".concat(value, " is required as ").concat(required, " for ").concat(_this.moduleName, ", but is missing!"));
            }
          });
        });
        return this;
      }
    }, {
      key: "setupActions",
      value: function setupActions() {
        var _this2 = this;

        this.setupAction(this.el);
        this.find(ACTION_SELECTOR).forEach(function (action) {
          var parent = findParent(action);

          if (parent === _this2.el) {
            _this2.setupAction(action);
          }
        });
      }
    }, {
      key: "setupAction",
      value: function setupAction(actionEl) {
        if (actionEl.dataset.domoduleActionProcessed === 'true') {
          return;
        }

        var _Domodule$parseAction = Domodule.parseAction(actionEl),
            actionName = _Domodule$parseAction.name,
            actionType = _Domodule$parseAction.type;

        if (!actionName) {
          return;
        } else if (typeof this[actionName] !== 'function') {
          this.log("".concat(actionName, " was registered, but there is no function set up"));
          return;
        }

        this.log("".concat(actionName, " bound"));
        this.storeSetUp(actionName, 'actions');
        DOMAssist.on(actionEl, actionType, this.boundActionRouter);
        actionEl.dataset.domoduleActionProcessed = 'true';
      }
    }, {
      key: "actionRouter",
      value: function actionRouter(event) {
        var actionEl = event.currentTarget;

        var _Domodule$parseAction2 = Domodule.parseAction(actionEl),
            actionName = _Domodule$parseAction2.name;

        var actionData = attrObj('action', actionEl);
        this[actionName].call(this, actionEl, event, actionData);
      }
    }, {
      key: "setupNamed",
      value: function setupNamed() {
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
      }
    }, {
      key: "storeRef",
      value: function storeRef() {
        if (typeof window.domorefs === 'undefined') {
          window.domorefs = {};
        }

        if (typeof window.domorefs[this.el.dataset.moduleUid] !== 'undefined') {
          return false;
        }

        this.id = this.uuid;
        this.el.dataset.moduleUid = this.id;
        window.domorefs[this.el.dataset.moduleUid] = this;
      }
    }, {
      key: "find",
      value: function find$$1(selector) {
        return DOMAssist.find(selector, this.el);
      }
    }, {
      key: "findOne",
      value: function findOne$$1(selector) {
        return DOMAssist.findOne(selector, this.el);
      }
    }, {
      key: "findByName",
      value: function findByName(name) {
        return this.els[name];
      }
    }, {
      key: "getOption",
      value: function getOption(option) {
        return this.options[option];
      }
    }, {
      key: "storeSetUp",
      value: function storeSetUp(name, dict) {
        if (this.setUps[dict].indexOf(name) < 0) {
          this.setUps[dict].push(name);
        }
      }
    }, {
      key: "destroy",
      value: function destroy() {
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

    }, {
      key: "log",
      //used inside instance
      value: function log(msg) {
        Domodule.log("".concat(this.constructor.name, ": ").concat(msg));
      }
    }, {
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
    }], [{
      key: "parseAction",
      value: function parseAction(el) {
        var _el$dataset = el.dataset,
            name = _el$dataset.action,
            _el$dataset$actionTyp = _el$dataset.actionType,
            type = _el$dataset$actionTyp === void 0 ? 'click' : _el$dataset$actionTyp;
        return {
          name: name,
          type: type
        };
      }
    }, {
      key: "getInstance",
      value: function getInstance(element) {
        if (element instanceof Node) {
          return window.domorefs[element.dataset.moduleUid];
        }

        throw new Error('getInstance expects a dom node');
      }
    }, {
      key: "register",
      value: function register(name, cls) {
        if (typeof name === 'function') {
          cls = name;
          name = cls.prototype.constructor.name;
        }

        if (!window.domodules) {
          window.domodules = {};
        }

        Domodule.log("Registering ".concat(name));
        window.domodules[name] = cls;
      }
    }, {
      key: "discover",
      value: function discover() {
        var el = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'body';
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
              if (_typeof(window.domorefs) === 'object' && typeof window.domorefs[moduleEl.dataset.moduleUid] !== 'undefined') {
                return;
              }

              Domodule.log("".concat(moduleName, " found"));
              instances.push(new window.domodules[moduleName](moduleEl));
            }
          });
        });
        return instances;
      }
    }, {
      key: "log",
      value: function log(msg) {
        if (Domodule.debug) {
          console.log("[DOMODULE] ".concat(msg)); //eslint-disable-line no-console
        }
      }
    }]);

    return Domodule;
  }();

  Domodule.debug = _typeof(window.localStorage) === 'object' && window.localStorage.getItem('DomoduleDebug');
  Domodule.autoDiscover = true;
  window.addEventListener('DOMContentLoaded', function () {
    if (Domodule.autoDiscover) {
      Domodule.discover();
    }
  });

  var Reload =
  /*#__PURE__*/
  function (_Domodule) {
    _inherits(Reload, _Domodule);

    function Reload() {
      _classCallCheck(this, Reload);

      return _possibleConstructorReturn(this, _getPrototypeOf(Reload).apply(this, arguments));
    }

    _createClass(Reload, [{
      key: "postInit",
      value: function postInit() {
        on(this.el, 'click', this.onClick.bind(this));
      }
    }, {
      key: "onClick",
      value: function onClick(event) {
        event.preventDefault();
        fire(this.el, 'tessst', {
          bubbles: true
        });
      }
    }]);

    return Reload;
  }(Domodule);

  Domodule.register('Reload', Reload);

  var Test =
  /*#__PURE__*/
  function () {
    function Test() {
      _classCallCheck(this, Test);

      console.log('test');
    }

    _createClass(Test, [{
      key: "type",
      value: function type() {
        console.log(_typeof(find));
      }
    }]);

    return Test;
  }();

  var Do =
  /*#__PURE__*/
  function (_Test) {
    _inherits(Do, _Test);

    function Do() {
      var _this;

      _classCallCheck(this, Do);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(Do).call(this));

      _this.echo();

      return _this;
    }

    _createClass(Do, [{
      key: "echo",
      value: function echo() {
        var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'something';
        console.log(message);
      }
    }]);

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

  return Do;

}());

//# sourceMappingURL=domassist.js.map