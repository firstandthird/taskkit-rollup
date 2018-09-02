var app = (function () {
  'use strict';

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

  function addClass(selector, cls) {
    if (Array.isArray(selector)) {
      return selector.forEach(function (item) {
        return addClass(item, cls);
      });
    }
    var els = find(selector);
    if (els.length) {
      var clsArray = [].concat(cls);
      els.forEach(function (el) {
        clsArray.forEach(function (item) {
          el.classList.add(item);
        });
      });
      return els;
    }
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

    window._domassistevents['_' + event] = data;
    var el = find(selector);
    if (el.length) {
      el.forEach(function (item) {
        item.addEventListener(event, cb, capture);
      });
    }
  }

  function matches(el, selector) {
    var proto = Element.prototype;
    var match = false;

    var prefixes = ['matches', 'matchesSelector', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'];

    prefixes.forEach(function (prefix) {
      if (proto.hasOwnProperty(prefix)) {
        match = proto[prefix];
      }
    });

    if (match) {
      return el ? match.call(el, selector) : null;
    }
  }

  function delegate(el, event, selector, cb) {
    var capture = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

    on(el, event, function (e) {
      if (e.target && matches(e.target, selector)) {
        return cb(e);
      }
    }, capture);
  }

  function findOne(selector, el) {
    var found = find(selector, el);

    if (found.length) {
      return found[0];
    }

    return null;
  }

  var NativeCustomEvent = window.CustomEvent;

  //
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
  }

  // Lousy polyfill for the Custom Event constructor for IE.
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

  function hasClass(selector, cls) {
    var el = findOne(selector);
    if (!el) {
      return false;
    }
    return el.classList.contains(cls);
  }

  function hide(selector) {
    if (Array.isArray(selector)) {
      selector.forEach(function (item) {
        return hide(item);
      });
    }
    var els = find(selector);
    if (els.length) {
      els.forEach(function (el) {
        var currentDisplay = window.getComputedStyle(el).getPropertyValue('display');

        if (currentDisplay !== 'none') {
          el.dataset._currentDisplay = currentDisplay;
          el.style.display = 'none';
        }
      });
    }
  }

  function hover(el, enter, exit) {
    on(el, 'mouseenter', enter);
    on(el, 'mouseleave', exit);
  }

  function off(selector, event) {
    if (Array.isArray(selector)) {
      selector.forEach(function (item) {
        return off(item, event);
      });
    }
    if (!window._domassistevents) {
      window._domassistevents = {};
    }

    var data = window._domassistevents['_' + event];

    if (!data) {
      return;
    }
    var el = find(selector);
    if (el.length) {
      el.forEach(function (item) {
        item.removeEventListener(event, data.cb, data.capture);
      });
    }
  }

  function once(el, event, run) {
    var capture = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    on(el, event, function (e) {
      off(el, event);
      run(e);
    }, capture);
  }

  var transform = null;

  function prefixedTransform() {
    if (transform) {
      return transform;
    }

    var testEl = document.createElement('div');

    if (testEl.style.transform === null) {
      var vendors = ['Webkit', 'webkit', 'Moz', 'ms'];
      var property = null;

      for (var i = 0, len = vendors.length; i < len && !property; i++) {
        var tProperty = vendors[i] + 'Transform';
        if (typeof testEl.style[tProperty] !== 'undefined') {
          property = tProperty;
        }
      }

      transform = property;
    } else {
      transform = 'transform';
    }

    return transform;
  }

  function removeClass(selector, cls) {
    if (Array.isArray(selector)) {
      return selector.forEach(function (item) {
        return removeClass(item, cls);
      });
    }

    var els = find(selector);
    if (els.length) {
      var clsArray = [].concat(cls);
      els.forEach(function (el) {
        clsArray.forEach(function (item) {
          el.classList.remove(item);
        });
      });
      return els;
    }
  }

  var SCROLLABLE_CONTAINER = void 0;

  function getScrollableContainer() {
    if (SCROLLABLE_CONTAINER) {
      return SCROLLABLE_CONTAINER;
    }

    var documentElement = window.document.documentElement;
    var scrollableContainer = void 0;

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

  function show(selector) {
    if (Array.isArray(selector)) {
      selector.forEach(function (item) {
        return show(item);
      });
    }
    var els = find(selector);
    if (els.length) {
      els.forEach(function (el) {
        el.style.display = el.dataset._currentDisplay || 'block';
      });
    }
  }

  function toggleClass(el, value) {
    if (hasClass(el, value)) {
      removeClass(el, value);
    } else {
      addClass(el, value);
    }
  }

  function closest(el, selector) {
    var parent = el.parentElement;
    while (parent.parentElement && !matches(parent, selector)) {
      parent = parent.parentElement;
    }
    return matches(parent, selector) ? parent : null;
  }

  var setupReady = function setupReady(callbacks) {
    return function (callback) {
      callbacks.push(callback);
      function execute() {
        while (callbacks.length) {
          var fn = callbacks.shift();
          if (typeof fn === 'function') {
            fn();
          }
        }
      }
      function loaded() {
        document.removeEventListener('DOMContentLoaded', loaded);
        execute();
      }

      setTimeout(function () {
        if (document.readyState !== 'loading') {
          return execute();
        }
      }, 0);

      document.addEventListener('DOMContentLoaded', loaded);
    };
  };
  var ready = setupReady([]);

  function styles(selector, css) {
    if (Array.isArray(selector)) {
      selector.forEach(function (item) {
        return styles(item, css);
      });
    }
    var els = find(selector);
    if (els.length) {
      els.forEach(function (el) {
        Object.keys(css).forEach(function (key) {
          el.style[key] = css[key];
        });
      });
    }
  }

  function addAttrs(selector, attrs) {
    if (Array.isArray(selector)) {
      return selector.forEach(function (item) {
        return addAttrs(item, attrs);
      });
    }
    var els = find(selector);
    if (els.length) {
      els.forEach(function (item) {
        Object.keys(attrs).forEach(function (attr) {
          if (attr in item) {
            item[attr] = attrs[attr];
          } else {
            item.dataset[attr] = attrs[attr];
          }
        });
      });
    }
    return els;
  }

  function html(selector, value) {
    if (Array.isArray(selector)) {
      selector.forEach(function (item) {
        return html(item, value);
      });
    }
    var el = find(selector);
    if (el.length) {
      var length = el.length;
      for (var i = 0; i < length; i += 1) {
        el[i].innerHTML = value;
      }
    }
  }

  /* global DocumentTouch */

  function isTouch() {
    return 'ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch;
  }

  function bindEvents(el, events) {
    Object.keys(events).forEach(function (event) {
      on(el, event, events[event]);
    });
  }

  function modify(selector, params) {
    if (Array.isArray(selector)) {
      selector.forEach(function (item) {
        return modify(item, params);
      });
    }
    var modules = {
      addClass: addClass,
      removeClass: removeClass,
      html: html,
      events: on,
      styles: styles
    };
    var els = find(selector);
    if (els.length) {
      els.forEach(function (el) {
        Object.keys(params).forEach(function (param, index) {
          if (param in modules) {
            if (param === 'events') {
              bindEvents(el, params[param]);
            }
            modules[param](el, params[param]);
          }
        });
      });
    }
  }

  function append(selector, value) {
    if (Array.isArray(selector)) {
      return selector.forEach(function (item) {
        return append(item, value);
      });
    }
    var els = find(selector);
    if (els.length) {
      els.forEach(function (el) {
        if (typeof value === 'string') {
          el.insertAdjacentHTML('beforeend', value);
        } else {
          el.appendChild(value);
        }
      });
    }
  }

  function toArray(value) {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value;
    }
    if (value instanceof Node) {
      return [value];
    }
    return [].slice.call(value);
  }

  var find$1 = {
    addClass: addClass,
    delegate: delegate,
    find: find,
    findOne: findOne,
    fire: fire,
    hasClass: hasClass,
    hide: hide,
    hover: hover,
    isWindow: isWindow,
    off: off,
    on: on,
    once: once,
    prefixedTransform: prefixedTransform,
    removeClass: removeClass,
    scrollableContainer: getScrollableContainer,
    show: show,
    matches: matches,
    toggleClass: toggleClass,
    closest: closest,
    ready: ready,
    styles: styles,
    addAttrs: addAttrs,
    html: html,
    isTouch: isTouch,
    modify: modify,
    append: append,
    toArray: toArray
  };

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var inherits = function (subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };

  var possibleConstructorReturn = function (self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };

  var Test = function () {
    function Test() {
      classCallCheck(this, Test);

      console.log('test');
    }

    createClass(Test, [{
      key: 'type',
      value: function type() {
        console.log(typeof find$1 === 'undefined' ? 'undefined' : _typeof(find$1));
      }
    }]);
    return Test;
  }();

  var Do = function (_Test) {
    inherits(Do, _Test);

    function Do() {
      classCallCheck(this, Do);

      var _this = possibleConstructorReturn(this, (Do.__proto__ || Object.getPrototypeOf(Do)).call(this));

      _this.echo();
      return _this;
    }

    createClass(Do, [{
      key: 'echo',
      value: function echo() {
        var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'something';

        console.log(message);
      }
    }]);
    return Do;
  }(Test);

  return Do;

}());

//# sourceMappingURL=domassist.js.map