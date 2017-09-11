/*!
flyui-core v1.2.2
Licensed under ISC
Author: huanzhang & ueteam
Update: 2017-04-01 10:04:55 GMT+0800
*/
(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, l, l.exports, e, t, n, r)
        }
        return n[o].exports
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s
})({
    1: [
        function(require, module, exports) {
            /**
             * Ajax
             * form Zepto.js
             * @update: 2016-02-01 15:20
             */
            'use strict';

            var $ = require('./fly.jquery');

            var jsonpID = 0,
                document = window.document,
                escape = encodeURIComponent,
                scriptTypeRE = /^(?:text|application)\/javascript/i,
                xmlTypeRE = /^(?:text|application)\/xml/i,
                jsonType = 'application/json',
                htmlType = 'text/html',
                blankRE = /^\s*$/,
                originAnchor = document.createElement('a'),
                slice = Array.prototype.slice,
                key,
                name;

            var Deferred;

            // Number of active Ajax requests
            $.active = 0;

            originAnchor.href = window.location.href;

            // Empty function, used as default callback
            function empty() {}

            function ajaxSuccess(data, xhr, settings, deferred) {
                var context = settings.context,
                    status = 'success';

                if (settings.dataFilter) {
                    data = settings.dataFilter.call(context, data);
                }

                settings.success.call(context, data, status, xhr);

                if (deferred) {
                    deferred.resolveWith(context, [data, status, xhr]);
                }
            }

            // type: "timeout", "error", "abort", "parsererror"
            function ajaxError(error, type, xhr, settings, deferred) {
                var context = settings.context;
                settings.error.call(context, xhr, type, error);
                if (deferred) deferred.rejectWith(context, [xhr, type, error]);
            }

            // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
            function ajaxComplete(status, xhr, settings) {
                var context = settings.context;
                settings.complete.call(context, xhr, status);
            }

            function mimeToDataType(mime) {
                if (mime) mime = mime.split(';', 2)[0]
                return mime && (mime == htmlType ? 'html' :
                    mime == jsonType ? 'json' :
                    scriptTypeRE.test(mime) ? 'script' :
                    xmlTypeRE.test(mime) && 'xml') || 'text'
            }

            function appendQuery(url, query) {
                if (query == '') return url
                return (url + '&' + query).replace(/[&?]{1,2}/, '?')
            }

            // serialize payload and append it to the URL for GET requests
            function serializeData(options) {
                if (options.processData && options.data && $.type(options.data) != "string")
                    options.data = $.param(options.data, options.traditional)
                if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
                    options.url = appendQuery(options.url, options.data), options.data =
                    undefined
            }

            // handle optional data/success arguments
            function parseArguments(url, data, success, dataType) {
                if ($.isFunction(data)) dataType = success, success = data, data = undefined
                if (!$.isFunction(success)) dataType = success, success = undefined
                return {
                    url: url,
                    data: data,
                    success: success,
                    dataType: dataType
                }
            }

            function serialize(params, obj, traditional, scope) {
                var type, array = $.isArray(obj),
                    hash = $.isPlainObject(obj)
                $.each(obj, function(key, value) {
                    type = $.type(value)
                    if (scope) key = traditional ? scope :
                        scope + '[' + (hash || type == 'object' || type == 'array' ? key :
                            '') + ']'
                        // handle data in serializeArray() format
                    if (!scope && array) params.add(value.name, value.value)
                        // recurse into nested objects
                    else if (type == "array" || (!traditional && type == "object"))
                        serialize(params, value, traditional, key)
                    else params.add(key, value)
                })
            }

            $.ajaxJSONP = function(options, deferred) {
                if (!('type' in options)) return ajax(options)

                var _callbackName = options.jsonpCallback,
                    callbackName = ($.isFunction(_callbackName) ?
                        _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)),
                    script = document.createElement('script'),
                    originalCallback = window[callbackName],
                    responseData,
                    abort = function(errorType) {
                        // dispatchEvent 还未全部想好
                        // script.dispatchEvent(new CustomEvent('error', errorType || 'abort'));
                    },
                    xhr = {
                        abort: abort
                    },
                    loadHandler = function(e, errorType) {
                        clearTimeout(abortTimeout);
                        script.parentNode.removeChild(script);

                        if (e.type == 'error' || !responseData) {
                            ajaxError(null, errorType || 'error', xhr, options, deferred);
                        } else {
                            ajaxSuccess(responseData[0], xhr, options, deferred);
                        }

                        window[callbackName] = originalCallback;
                        if (responseData && $.isFunction(originalCallback))
                            originalCallback(responseData[0]);

                        originalCallback = responseData = undefined;
                    },
                    abortTimeout;

                if (deferred) deferred.promise(xhr);

                script.addEventListener('load', loadHandler);
                script.addEventListener('error', loadHandler);

                /*if (ajaxBeforeSend(xhr, options) === false) {
        abort('abort');
        return xhr;
    }*/

                window[callbackName] = function() {
                    responseData = arguments;
                }

                script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName);
                document.head.appendChild(script);

                if (options.timeout > 0) abortTimeout = setTimeout(function() {
                    abort('timeout');
                }, options.timeout);

                return xhr;
            }

            $.ajaxSettings = {
                type: 'GET',
                beforeSend: empty,
                success: empty,
                error: empty,
                complete: empty,
                context: null,
                global: true,
                // Transport
                xhr: function() {
                    return new window.XMLHttpRequest()
                },
                // MIME types mapping
                // IIS returns Javascript as "application/x-javascript"
                accepts: {
                    script: 'text/javascript, application/javascript, application/x-javascript',
                    json: jsonType,
                    xml: 'application/xml, text/xml',
                    html: htmlType,
                    text: 'text/plain'
                },
                // Whether the request is to another domain
                crossDomain: false,
                // Default timeout
                timeout: 0,
                // Whether data should be serialized to string
                processData: true,
                // Whether the browser should be allowed to cache GET responses
                cache: true
            };

            $.ajax = function(options) {
                var settings = $.extend({}, options || {}),
                    deferred = $.Deferred && $.Deferred(),
                    urlAnchor, hashIndex
                for (key in $.ajaxSettings)
                    if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

                    //ajaxStart(settings)

                if (!settings.crossDomain) {
                    urlAnchor = document.createElement('a')
                    urlAnchor.href = settings.url
                    // cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
                    urlAnchor.href = urlAnchor.href
                    settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !==
                        (
                        urlAnchor.protocol + '//' + urlAnchor.host)
                }

                if (!settings.url) settings.url = window.location.toString()
                if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(
                    0,
                    hashIndex)
                serializeData(settings)

                var dataType = settings.dataType,
                    hasPlaceholder = /\?.+=\?/.test(settings.url)
                if (hasPlaceholder) dataType = 'jsonp'

                if (settings.cache === false || (
                    (!options || options.cache !== true) &&
                    ('script' == dataType || 'jsonp' == dataType)
                ))
                    settings.url = appendQuery(settings.url, '_=' + Date.now())

                if ('jsonp' == dataType) {
                    if (!hasPlaceholder)
                        settings.url = appendQuery(settings.url,
                            settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ?
                            '' :
                            'callback=?')
                    return $.ajaxJSONP(settings, deferred)
                }

                var mime = settings.accepts[dataType],
                    headers = {},
                    setHeader = function(name, value) {
                        headers[name.toLowerCase()] = [name, value]
                    },
                    protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location
                    .protocol,
                    xhr = settings.xhr(),
                    nativeSetHeader = xhr.setRequestHeader,
                    abortTimeout

                if (deferred) deferred.promise(xhr)

                if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
                setHeader('Accept', mime || '*/*')
                if (mime = settings.mimeType || mime) {
                    if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
                    xhr.overrideMimeType && xhr.overrideMimeType(mime)
                }
                if (settings.contentType || (settings.contentType !== false && settings.data &&
                    settings.type
                    .toUpperCase() != 'GET'))
                    setHeader('Content-Type', settings.contentType ||
                        'application/x-www-form-urlencoded')

                if (settings.headers)
                    for (name in settings.headers) setHeader(name, settings.headers[name])
                xhr.setRequestHeader = setHeader

                xhr.onreadystatechange = function() {
                    if (xhr.readyState == 4) {
                        xhr.onreadystatechange = empty
                        clearTimeout(abortTimeout)
                        var result, error = false
                        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (
                            xhr.status ==
                            0 && protocol == 'file:')) {
                            dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader(
                                'content-type'))

                            if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob')
                                result = xhr.response
                            else {
                                result = xhr.responseText

                                try {
                                    // http://perfectionkills.com/global-eval-what-are-the-options/
                                    if (dataType == 'script')(1, eval)(result)
                                    else if (dataType == 'xml') result = xhr.responseXML
                                    else if (dataType == 'json') result = blankRE.test(result) ?
                                        null :
                                        ((typeof(JSON) == 'object' && JSON.parse) ? JSON.parse(
                                            result) : eval('(' + result + ')'));
                                } catch (e) {
                                    error = e
                                }

                                if (error) return ajaxError(error, 'parsererror', xhr, settings,
                                    deferred)
                            }

                            ajaxSuccess(result, xhr, settings, deferred)
                        } else {
                            ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort',
                                xhr,
                                settings, deferred)
                        }
                    }
                }

                /*if (ajaxBeforeSend(xhr, settings) === false) {
        xhr.abort()
        ajaxError(null, 'abort', xhr, settings, deferred)
        return xhr
    }*/

                if (settings.xhrFields)
                    for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

                var async = 'async' in settings ? settings.async : true
                xhr.open(settings.type, settings.url, async, settings.username, settings.password)

                for (name in headers) nativeSetHeader.apply(xhr, headers[name])

                if (settings.timeout > 0) abortTimeout = setTimeout(function() {
                    xhr.onreadystatechange = empty
                    xhr.abort()
                    ajaxError(null, 'timeout', xhr, settings, deferred)
                }, settings.timeout)

                // avoid sending empty string (#319)
                xhr.send(settings.data ? settings.data : null)
                return xhr
            }

            $.param = function(obj, traditional) {
                var params = []
                params.add = function(key, value) {
                    if ($.isFunction(value)) value = value()
                    if (value == null) value = ""
                    this.push(escape(key) + '=' + escape(value))
                }
                serialize(params, obj, traditional)
                return params.join('&').replace(/%20/g, '+')
            }

            $.when = function(sub) {
                var resolveValues = slice.call(arguments),
                    len = resolveValues.length,
                    i = 0,
                    remain = len !== 1 || (sub && $.isFunction(sub.promise)) ? len : 0,
                    deferred = remain === 1 ? sub : Deferred(),
                    progressValues, progressContexts, resolveContexts,
                    updateFn = function(i, ctx, val) {
                        return function(value) {
                            ctx[i] = this
                            val[i] = arguments.length > 1 ? slice.call(arguments) : value
                            if (val === progressValues) {
                                deferred.notifyWith(ctx, val)
                            } else if (!(--remain)) {
                                deferred.resolveWith(ctx, val)
                            }
                        }
                    }

                if (len > 1) {
                    progressValues = new Array(len)
                    progressContexts = new Array(len)
                    resolveContexts = new Array(len)
                    for (; i < len; ++i) {
                        if (resolveValues[i] && $.isFunction(resolveValues[i].promise)) {
                            resolveValues[i].promise()
                                .done(updateFn(i, resolveContexts, resolveValues))
                                .fail(deferred.reject)
                                .progress(updateFn(i, progressContexts, progressValues))
                        } else {
                            --remain
                        }
                    }
                }
                if (!remain) deferred.resolveWith(resolveContexts, resolveValues)
                return deferred.promise()
            }

            $.Callbacks = function(options) {
                options = $.extend({}, options)

                var memory, // Last fire value (for non-forgettable lists)
                    fired, // Flag to know if list was already fired
                    firing, // Flag to know if list is currently firing
                    firingStart, // First callback to fire (used internally by add and fireWith)
                    firingLength, // End of the loop when firing
                    firingIndex, // Index of currently firing callback (modified by remove if needed)
                    list = [], // Actual callback list
                    stack = !options.once && [], // Stack of fire calls for repeatable lists
                    fire = function(data) {
                        memory = options.memory && data
                        fired = true
                        firingIndex = firingStart || 0
                        firingStart = 0
                        firingLength = list.length
                        firing = true
                        for (; list && firingIndex < firingLength; ++firingIndex) {
                            if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
                                memory = false
                                break
                            }
                        }
                        firing = false
                        if (list) {
                            if (stack) stack.length && fire(stack.shift())
                            else if (memory) list.length = 0
                            else Callbacks.disable()
                        }
                    },

                    Callbacks = {
                        add: function() {
                            if (list) {
                                var start = list.length,
                                    add = function(args) {
                                        $.each(args, function(_, arg) {
                                            if (typeof arg === "function") {
                                                if (!options.unique || !Callbacks.has(arg))
                                                    list
                                                    .push(arg)
                                            } else if (arg && arg.length && typeof arg !==
                                                'string') add(arg)
                                        })
                                    }
                                add(arguments)
                                if (firing) firingLength = list.length
                                else if (memory) {
                                    firingStart = start
                                    fire(memory)
                                }
                            }
                            return this
                        },
                        remove: function() {
                            if (list) {
                                $.each(arguments, function(_, arg) {
                                    var index
                                    while ((index = $.inArray(arg, list, index)) > -1) {
                                        list.splice(index, 1)
                                        // Handle firing indexes
                                        if (firing) {
                                            if (index <= firingLength)--firingLength
                                            if (index <= firingIndex)--firingIndex
                                        }
                                    }
                                })
                            }
                            return this
                        },
                        has: function(fn) {
                            return !!(list && (fn ? $.inArray(fn, list) > -1 : list.length))
                        },
                        empty: function() {
                            firingLength = list.length = 0
                            return this
                        },
                        disable: function() {
                            list = stack = memory = undefined
                            return this
                        },
                        disabled: function() {
                            return !list
                        },
                        lock: function() {
                            stack = undefined;
                            if (!memory) Callbacks.disable()
                            return this
                        },
                        locked: function() {
                            return !stack
                        },
                        fireWith: function(context, args) {
                            if (list && (!fired || stack)) {
                                args = args || []
                                args = [context, args.slice ? args.slice() : args]
                                if (firing) stack.push(args)
                                else fire(args)
                            }
                            return this
                        },
                        fire: function() {
                            return Callbacks.fireWith(this, arguments)
                        },
                        fired: function() {
                            return !!fired
                        }
                    }

                return Callbacks
            }

            $.Deferred = Deferred = function(func) {
                var tuples = [
                        // action, add listener, listener list, final state
                        ["resolve", "done", $.Callbacks({
                            once: 1,
                            memory: 1
                        }), "resolved"],
                        ["reject", "fail", $.Callbacks({
                            once: 1,
                            memory: 1
                        }), "rejected"],
                        ["notify", "progress", $.Callbacks({
                            memory: 1
                        })]
                    ],
                    state = "pending",
                    promise = {
                        state: function() {
                            return state;
                        },

                        always: function() {
                            deferred.done(arguments).fail(arguments);
                            return this;
                        },

                        then: function( /* fnDone [, fnFailed [, fnProgress]] */ ) {
                            var fns = arguments;
                            return Deferred(function(defer) {
                                $.each(tuples, function(i, tuple) {
                                    var fn = $.isFunction(fns[i]) && fns[i];
                                    deferred[tuple[1]](function() {
                                        var returned = fn && fn.apply(this,
                                            arguments);
                                        if (returned && $.isFunction(returned.promise)) {
                                            returned.promise()
                                                .done(defer.resolve)
                                                .fail(defer.reject)
                                                .progress(defer.notify);
                                        } else {
                                            var context = this === promise ?
                                                defer.promise() : this,
                                                values = fn ? [returned] :
                                                arguments;
                                            defer[tuple[0] + "With"](context,
                                                values)
                                        }
                                    })
                                });
                                fns = null;
                            }).promise();
                        },

                        promise: function(obj) {
                            return obj != null ? $.extend(obj, promise) : promise;
                        }
                    },
                    deferred = {};

                $.each(tuples, function(i, tuple) {
                    var list = tuple[2],
                        stateString = tuple[3];

                    promise[tuple[1]] = list.add;

                    if (stateString) {
                        list.add(function() {
                            state = stateString;
                        }, tuples[i ^ 1][2].disable, tuples[2][2].lock);
                    }

                    deferred[tuple[0]] = function() {
                        deferred[tuple[0] + "With"](this === deferred ? promise : this,
                            arguments);
                        return this;
                    }
                    deferred[tuple[0] + "With"] = list.fireWith;
                })

                promise.promise(deferred);
                if (func) func.call(deferred, deferred);
                return deferred;
            };

            module.exports = $.ajax;
        }, {
            "./fly.jquery": 7
        }
    ],
    2: [
        function(require, module, exports) {

            /**
             * 绑定器
             * 参考Knockout/kendo/VUE
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-06-30
             */

            'use strict';

            // 依赖
            var fly = require('./fly.core'),
                utils = require('./fly.utils'),
                DataSource = require('./fly.data'),
                tmpl = require('./fly.template'),
                format = require('./fly.format'),
                Component = require('./fly.component'),
                $ = fly.$,
                ui = fly.ui,
                proxy = $.proxy,
                isArray = $.isArray,
                Class = fly.Class,
                Observable = fly.Observable,
                ObservableObject = fly.ObservableObject,
                ObservableArray = fly.ObservableArray;

            // 绑定器
            var componentBinders = {},
                binders = {
                    component: componentBinders
                };

            // 静态变量
            var FUNCTION = 'function',
                NUMBER = 'number',
                CHANGE = 'change',
                VALUE = 'value',
                SOURCE = 'source',
                EVENTS = 'events',
                CHECKED = 'checked',
                CSS = 'css',
                DISABLED = 'disabled',
                READONLY = 'readonly',
                SOURCE = 'source',
                DATASOURCE = 'dataSource',
                SETDATASOURCE = 'setDataSource';

            // 正则表达式
            var regKeyValue = /[A-Za-z0-9_\-]+:(\{([^}]*)\}|[^,}]+)/g,
                regPath = /[a-zA-Z_]{1}[a-zA-Z0-9_.]+/,
                regWhiteSpace = /\s/g,
                regTemplate = /template$/i,
                regDate = /^\/Date\((.*?)\)\/$/,
                regNewLine = /(\r+|\n+)/g,
                regQuote = /(?=['\\])/g,
                regComponent = /^f-*/i;

            var errorMsg = 'The {0} binding is not supported by the {1} {2}';

            //格式化字符串
            var toString = function(value, fmt) {
                if (value && fmt) {
                    if (value.getTime()) {
                        return fly.formatDate(value, fmt);
                    } else if (typeof value === NUMBER) {
                        return fly.formatNumber(value, fmt);
                    }
                }
                return value !== undefined ? value : '';
            };

            var toDateString = function(value, type) {
                if (type == "date") {
                    value = toString(value, "yyyy-MM-dd");
                } else if (type == "datetime") {
                    value = toString(value, "yyyy-MM-dd HH:mm:ss");
                }
                return value;
            };

            var Binding = Observable.extend({

                ctor: function(parents, path) {
                    var that = this;

                    /*if(path && typeof path == 'string') {
            path = path.match(regPath)[0] || '';
        }*/

                    that._super();
                    that.source = parents && parents[0];
                    that.parents = parents;
                    that.path = path;
                    that.dependencies = {};
                    that.dependencies[path] = true;
                    that.observable = that.source instanceof Observable;

                    that._access = function(e) {
                        that.dependencies[e.field] = true;
                    };

                    if (that.observable) {
                        that._change = function(e) {
                            that.change(e);
                        };

                        that.source.bind(CHANGE, that._change);
                    }
                },

                _parents: function() {
                    var parents = this.parents;
                    var value = this.get();

                    if (value && typeof value.parent == FUNCTION) {
                        var parent = value.parent();

                        if ($.inArray(parent, parents) < 0) {
                            parents = [parent].concat(parents);
                        }
                    }

                    return parents;
                },

                change: function(e) {
                    var dependency,
                        ch,
                        field = e.field,
                        that = this;

                    if (that.path === 'this') {
                        that.trigger(CHANGE, e);
                    } else {
                        for (dependency in that.dependencies) {
                            if (dependency.indexOf(field) === 0) {
                                ch = dependency.charAt(field.length);

                                if (!ch || ch === '.' || ch === '[') {
                                    that.trigger(CHANGE, e);
                                    break;
                                }
                            }
                        }
                    }
                },

                start: function(source) {
                    source.bind('get', this._access);
                },

                stop: function(source) {
                    source.unbind('get', this._access);
                },

                get: function() {

                    var that = this,
                        source = that.source,
                        index = 0,
                        path = that.path,
                        result = source;

                    if (!that.observable) {
                        return result;
                    }

                    that.start(that.source);

                    result = source.get(path);

                    // Traverse the observable hierarchy if the binding is not resolved at the current level.
                    while (result === undefined && source) {

                        source = that.parents[++index];

                        if (source instanceof ObservableObject) {
                            result = source.get(path);
                        }
                    }

                    // second pass try to get the parent from the object hierarchy
                    if (result === undefined) {
                        source = that.source; //get the initial source

                        while (result === undefined && source) {
                            source = source.parent();

                            if (source instanceof ObservableObject) {
                                result = source.get(path);
                            }
                        }
                    }

                    // If the result is a function - invoke it
                    if (typeof result === FUNCTION) {
                        index = path.lastIndexOf('.');

                        // If the function is a member of a nested observable object make that nested observable the context (this) of the function
                        if (index > 0) {
                            source = source.get(path.substring(0, index));
                        }

                        // Invoke the function
                        that.start(source);

                        if (source !== that.source) {
                            result = result.call(source, that.source);
                        } else {
                            result = result.call(source);
                        }

                        that.stop(source);
                    }

                    // If the binding is resolved by a parent object
                    if (source && source !== that.source) {

                        that.currentSource = source; // save parent object

                        // Listen for changes in the parent object
                        source.unbind(CHANGE, that._change)
                            .bind(CHANGE, that._change);
                    }

                    that.stop(that.source);

                    return result;
                },

                set: function(value) {
                    var source = this.currentSource || this.source;

                    var field = fly.getter(this.path)(source);

                    if (typeof field === FUNCTION) {
                        if (source !== this.source) {
                            field.call(source, this.source, value);
                        } else {
                            field.call(source, value);
                        }
                    } else {
                        source.set(this.path, value);
                    }
                },

                destroy: function() {
                    if (this.observable) {
                        this.source.unbind(CHANGE, this._change);
                        if (this.currentSource) {
                            this.currentSource.unbind(CHANGE, this._change);
                        }
                    }

                    this.unbind();
                }
            });

            var EventBinding = Binding.extend({
                get: function() {
                    var source = this.source,
                        path = this.path,
                        index = 0,
                        handler;

                    handler = source.get(path);

                    while (!handler && source) {
                        source = this.parents[++index];

                        if (source instanceof ObservableObject) {
                            handler = source.get(path);
                        }
                    }

                    return proxy(handler, source);
                }
            });

            var TemplateBinding = Binding.extend({

                ctor: function(source, path, template) {
                    this._super(source, path);
                    this.template = template;
                },

                render: function(value) {
                    var html;

                    this.start(this.source);

                    html = tmpl(this.template, value.toJSON && value.toJSON(true) ||
                        value);

                    this.stop(this.source);

                    return html;
                }
            });

            var BindingTarget = Class.extend({

                ctor: function(target, options) {
                    this.target = target;
                    this.options = options;
                    this.toDestroy = [];
                },

                bind: function(bindings) {
                    var key,
                        hasValue,
                        hasSource,
                        hasEvents,
                        hasChecked,
                        hasCss,
                        componentBinding = this instanceof ComponentBindingTarget,
                        specificBinders = this.binders();

                    for (key in bindings) {
                        if (key == VALUE) {
                            hasValue = true;
                        } else if (key == SOURCE) {
                            hasSource = true;
                        } else if (key == EVENTS) {
                            hasEvents = true;
                        } else if (key == CHECKED) {
                            hasChecked = true;
                        } else if (key == CSS && !componentBinding) {
                            hasCss = true;
                        } else {
                            this.applyBinding(key, bindings, specificBinders);
                        }
                    }
                    if (hasSource) {
                        this.applyBinding(SOURCE, bindings, specificBinders);
                    }

                    if (hasValue) {
                        this.applyBinding(VALUE, bindings, specificBinders);
                    }

                    if (hasChecked) {
                        this.applyBinding(CHECKED, bindings, specificBinders);
                    }

                    if (hasEvents) {
                        this.applyBinding(EVENTS, bindings, specificBinders);
                    }

                    if (hasCss && !componentBinding) {
                        this.applyBinding(CSS, bindings, specificBinders);
                    }
                },

                binders: function() {
                    return binders[this.target.nodeName.toLowerCase()] || {};
                },

                applyBinding: function(name, bindings, specificBinders) {
                    var binder = specificBinders[name] || binders[name],
                        toDestroy = this.toDestroy,
                        attribute,
                        binding = bindings[name];

                    if (binder) {
                        binder = new binder(this.target, bindings, this.options);

                        toDestroy.push(binder);

                        if (binding instanceof Binding) {
                            binder.bind(binding);
                            toDestroy.push(binding);
                        } else {
                            for (attribute in binding) {
                                binder.bind(binding, attribute);
                                toDestroy.push(binding[attribute]);
                            }
                        }
                    } else if (name !== 'template') {
                        throw new Error(format(errorMsg, name, this.target.nodeName.toLowerCase(),
                            'element'));
                    }
                },

                destroy: function() {
                    var idx,
                        length,
                        toDestroy = this.toDestroy;

                    for (idx = 0, length = toDestroy.length; idx < length; idx++) {
                        toDestroy[idx].destroy();
                    }
                }
            });

            var ComponentBindingTarget = BindingTarget.extend({

                binders: function() {
                    // 屏蔽特殊绑定器
                    return {};
                },

                applyBinding: function(name, bindings, specificBinders) {
                    var binder = specificBinders[name] || componentBinders[name],
                        toDestroy = this.toDestroy,
                        attribute,
                        binding = bindings[name];

                    if (binder) {
                        binder = new binder(this.target, bindings, this.target.options);

                        toDestroy.push(binder);

                        if (binding instanceof Binding) {
                            binder.bind(binding);
                            toDestroy.push(binding);
                        } else {
                            for (attribute in binding) {
                                binder.bind(binding, attribute);
                                toDestroy.push(binding[attribute]);
                            }
                        }
                    } else {
                        throw new Error(format(errorMsg, name, this.target.name,
                            'component'));
                    }
                }
            });

            var Binder = Class.extend({

                ctor: function(element, bindings, options) {
                    this.element = element;
                    this.bindings = bindings;
                    this.options = options;
                },

                bind: function(binding, attribute) {
                    var that = this;

                    binding = attribute ? binding[attribute] : binding;

                    binding.bind(CHANGE, function(e) {
                        that.refresh(attribute || e);
                    });

                    that.refresh(attribute);
                },

                destroy: function() {}
            });

            var TypedBinder = Binder.extend({

                dataType: function() {
                    var dataType = this.element.getAttribute('data-type') ||
                        this.element.type || 'text';
                    return dataType.toLowerCase();
                },

                parsedValue: function() {
                    return this._parseValue(this.element.value, this.dataType());
                },

                _parseValue: function(value, dataType) {
                    if (dataType == 'date') {
                        value = toString(value, 'yyyy-MM-dd');
                    } else if (dataType == 'datetime') {
                        value = toString(value, 'yyyy-MM-dd HH:mm:ss');
                    } else if (dataType == 'number') {
                        value = parseFloat(value);
                    } else if (dataType == 'boolean') {
                        value = value.toLowerCase();
                        if (parseFloat(value) !== NaN) {
                            value = Boolean(parseFloat(value));
                        } else {
                            value = (value === 'true');
                        }
                    }
                    return value;
                }
            });

            binders.attr = Binder.extend({
                refresh: function(key) {
                    this.element.setAttribute(key, this.bindings.attr[key].get());
                }
            });

            binders.css = Binder.extend({
                ctor: function(element, bindings, options) {
                    this._super(element, bindings, options);
                    this.classes = {};
                },
                refresh: function(className) {
                    var element = this.element,
                        binding = this.bindings.css[className],
                        hasClass = this.classes[className] = binding.get();
                    if (hasClass) {
                        fly.addClass(element, className);
                    } else {
                        fly.removeClass(element, className);
                    }
                }
            });

            binders.style = Binder.extend({
                refresh: function(key) {
                    this.element.style[key] = this.bindings.style[key].get() || '';
                }
            });

            binders.enabled = Binder.extend({
                refresh: function() {
                    if (this.bindings.enabled.get()) {
                        this.element.removeAttribute(DISABLED);
                    } else {
                        this.element.setAttribute(DISABLED, DISABLED);
                    }
                }
            });

            binders.readonly = Binder.extend({
                refresh: function() {
                    if (this.bindings.readonly.get()) {
                        this.element.setAttribute(READONLY, READONLY);
                    } else {
                        this.element.removeAttribute(READONLY);
                    }
                }
            });

            binders.disabled = Binder.extend({
                refresh: function() {
                    if (this.bindings.disabled.get()) {
                        this.element.setAttribute(DISABLED, DISABLED);
                    } else {
                        this.element.removeAttribute(DISABLED);
                    }
                }
            });

            binders.events = Binder.extend({
                ctor: function(element, bindings, options) {
                    this._super(element, bindings, options);
                    this.handlers = {};
                },

                refresh: function(key) {
                    var element = this.element,
                        binding = this.bindings.events[key],
                        handler = this.handlers[key];

                    if (handler) {
                        fly.off(element, key, handler);
                    }

                    handler = this.handlers[key] = function(e) {
                        e.handleObj = e.handleObj || {};
                        e.handleObj.data = binding.source;
                        binding.get()(e);
                    };

                    fly.on(element, key, handler);
                },

                destroy: function() {
                    var element = this.element,
                        handler;

                    for (handler in this.handlers) {
                        fly.off(element, handler, this.handlers[handler]);
                    }
                }
            });

            binders.text = Binder.extend({
                refresh: function() {
                    var element = this.element,
                        dataFormat = element.getAttribute("data-format") || '',
                        text = this.bindings.text.get();

                    if (text == null) {
                        text = '';
                    }

                    element.innerText = toString(text, dataFormat);
                }
            });

            binders.visible = Binder.extend({
                refresh: function() {
                    if (this.bindings.visible.get()) {
                        this.element.style.display = '';
                    } else {
                        this.element.style.display = "none";
                    }
                }
            });

            binders.invisible = Binder.extend({
                refresh: function() {
                    if (!this.bindings.invisible.get()) {
                        this.element.style.display = '';
                    } else {
                        this.element.style.display = "none";
                    }
                }
            });

            binders.html = Binder.extend({
                refresh: function() {
                    this.element.innerHTML = this.bindings.html.get();
                }
            });

            binders.value = TypedBinder.extend({

                ctor: function(element, bindings, options) {
                    this._super(element, bindings, options);
                    this._change = proxy(this.change, this);
                    this.eventName = options.valueUpdate || CHANGE;

                    fly.on(this.element, this.eventName, this._change);

                    this._initChange = false;
                },

                change: function() {
                    this._initChange = this.eventName != CHANGE;

                    this.bindings[VALUE].set(this.parsedValue());

                    this._initChange = false;
                },

                refresh: function() {
                    if (!this._initChange) {
                        var value = this.bindings[VALUE].get();

                        if (value == null) {
                            value = '';
                        }

                        value = toDateString(value, this.dataType());
                        this.element.value = value;
                    }

                    this._initChange = false;
                },

                destroy: function() {
                    fly.off(this.element, this.eventName, this._change);
                }
            });

            binders.source = Binder.extend({

                ctor: function(element, bindings, options) {
                    if (!element) return;
                    this._super(element, bindings, options);

                    var source = this.bindings.source.get();
                    if (source instanceof DataSource && options.autoBind !== false) {
                        source.fetch();
                    }
                },

                refresh: function(e) {
                    var that = this,
                        source = that.bindings.source.get();

                    if (source instanceof ObservableArray) {
                        e = e || {};

                        if (e.action == undefined) {
                            that.render();
                        } else if (e.action === 'add') {
                            that.add(e.index, e.items);
                        } else if (e.action === 'remove') {
                            that.remove(e.index, e.items);
                        } else if (e.action === 'itemchange') {
                            that.renderItems(e.items);
                        }
                    } else {
                        that.render();
                    }
                },

                container: function() {
                    var element = this.element;

                    if (element.nodeName.toLowerCase() == "table") {
                        if (!element.tBodies[0]) {
                            element.appendChild(document.createElement("tbody"));
                        }
                        element = element.tBodies[0];
                    }

                    return element;
                },

                template: function() {
                    var options = this.options,
                        container = this.container(),
                        template = options.template,
                        textField = options.textField,
                        valueField = options.valueField;

                    if (!template) {
                        var html = container.innerHTML;
                        var nodeName = container.nodeName.toLowerCase();
                        var fieldName = valueField || textField;
                        html = fly.$.trim(html.replace(/^\s*<!--|-->\s*$/gi, ''));

                        if (html.indexOf('<') === 0) {
                            template = html;
                        } else if (nodeName == "select") {
                            if (fieldName) {
                                template = '<option value="{{' + fieldName + '}}">' +
                                    fieldName + '</option>';
                            } else {
                                template = "<option>{{data}}</option>";
                            }
                        } else if (nodeName == "tbody") {
                            template = "<tr><td>{{data}}</td></tr>";
                        } else if (nodeName == "ul" || nodeName == "ol") {
                            template = "<li>{{data}}</li>";
                        } else {
                            template = "{{data}}";
                        }

                        template = '{{each $data}}' + template + '{{/each}}'
                        template = tmpl.compile(template);
                        this.options.template = template;
                    } else if (typeof template === 'string') {
                        template = tmpl.renderFile(template);
                    }

                    return template;
                },

                renderItems: function(items) {
                    var that = this,
                        element = that.container(),
                        source = that.bindings.source.get(),
                        index;
                    for (var idx = 0, length = items.length; idx < length; idx++) {

                    }
                },

                add: function(index, items) {
                    var element = this.container(),
                        parents,
                        idx,
                        length,
                        child,
                        clone = element.cloneNode(false),
                        reference = element.children[index];

                    clone.innerHTML = this.template()(items);

                    if (clone.children.length) {
                        parents = this.bindings.source._parents();

                        for (idx = 0, length = items.length; idx < length; idx++) {
                            child = clone.children[0];
                            element.insertBefore(child, reference || null);
                            bindElement(child, items[idx], [
                                items[idx]
                            ].concat(parents));
                        }
                    }
                },

                remove: function(index, items) {
                    var idx, element = this.container();

                    for (idx = 0; idx < items.length; idx++) {
                        var child = element.children[index];
                        unbindElementTree(child);
                        element.removeChild(child);
                    }
                },



                render: function() {
                    var source = this.bindings.source.get(),
                        element = this.container(),
                        template = this.template(),
                        parents,
                        idx,
                        length;

                    if (source instanceof DataSource) {
                        source = source.view();
                    }

                    if (!(source instanceof ObservableArray) && !isArray(source)) {
                        source = [source];
                    }

                    while (element.hasChildNodes()) {
                        element.removeChild(element.firstChild);
                    }

                    if (this.bindings.template) {
                        unbindElementChildren(element);

                        $.each($(this.bindings.template.render(source)), function(i, item) {
                            element.appendChild(item);
                        });
                    } else {
                        element.innerHTML = template(source.toJSON && source.toJSON() ||
                            source);
                    }

                    if (element.children.length) {
                        parents = this.bindings.source._parents();
                        for (idx = 0, length = source.length; idx < length; idx++) {
                            bindElement(
                                element.children[idx],
                                source[idx], [source[idx]].concat(parents));
                        }
                    }
                }
            });

            binders.input = {
                checked: TypedBinder.extend({
                    ctor: function(element, bindings, options) {
                        this._super(element, bindings, options);
                        this._change = proxy(this.change, this);
                        fly.on(this.element, CHANGE, this._change);
                    },

                    change: function() {
                        var element = this.element;
                        var value = this.value();

                        if (element.type == "radio") {
                            value = this.parsedValue();
                            this.bindings[CHECKED].set(value);
                        } else if (element.type == "checkbox") {
                            var source = this.bindings[CHECKED].get();
                            var index;

                            if (source instanceof ObservableArray) {
                                value = this.parsedValue();
                                if (value instanceof Date) {
                                    for (var i = 0; i < source.length; i++) {
                                        if (source[i] instanceof Date && +source[i] === +
                                            value) {
                                            index = i;
                                            break;
                                        }
                                    }
                                } else {
                                    index = source.indexOf(value);
                                }
                                if (index > -1) {
                                    source.splice(index, 1);
                                } else {
                                    source.push(value);
                                }
                            } else {
                                this.bindings[CHECKED].set(value);
                            }
                        }
                    },

                    refresh: function() {
                        var value = this.bindings[CHECKED].get(),
                            source = value,
                            type = this.dataType(),
                            element = this.element;

                        if (element.type == "checkbox") {
                            if (source instanceof ObservableArray) {
                                var index = -1;
                                value = this.parsedValue();
                                if (value instanceof Date) {
                                    for (var i = 0; i < source.length; i++) {
                                        if (source[i] instanceof Date && +source[i] === +
                                            value) {
                                            index = i;
                                            break;
                                        }
                                    }
                                } else {
                                    index = source.indexOf(value);
                                }
                                element.checked = (index >= 0);
                            } else {
                                element.checked = source;
                            }
                        } else if (element.type == "radio" && value != null) {
                            value = toDateString(value, type);
                            if (element.value === value.toString()) {
                                element.checked = true;
                            }
                        }
                    },

                    value: function() {
                        var element = this.element,
                            value = element.value;

                        if (element.type == "checkbox") {
                            value = element.checked;
                        }

                        return value;
                    },
                    destroy: function() {
                        fly.off(this.element, CHANGE, this._change);
                    }
                })
            };

            binders.select = {

                source: binders.source.extend({
                    refresh: function(e) {
                        var that = this,
                            source = that.bindings.source.get();

                        if (source instanceof ObservableArray || source instanceof DataSource) {
                            e = e || {};

                            if (e.action == "add") {
                                that.add(e.index, e.items);
                            } else if (e.action == "remove") {
                                that.remove(e.index, e.items);
                            } else if (e.action == "itemchange" || e.action === undefined) {
                                that.render();
                                if (that.bindings.value) {
                                    that.bindings.value.source.trigger(CHANGE, {
                                        field: that.bindings.value.path
                                    });
                                }
                            }
                        } else {
                            that.render();
                        }
                    }
                }),

                value: TypedBinder.extend({

                    ctor: function(target, bindings, options) {
                        this._super(target, bindings, options);
                        this._change = proxy(this.change, this);
                        fly.on(this.element, CHANGE, this._change);
                    },

                    parsedValue: function() {
                        var dataType = this.dataType();
                        var values = [];
                        var element = this.element;
                        var value, option, idx, length;
                        for (idx = 0, length = element.options.length; idx < length; idx++) {
                            option = element.options[idx];

                            if (option.selected) {
                                value = option.attributes.value;

                                if (value && value.specified) {
                                    value = option.value;
                                } else {
                                    value = option.text;
                                }

                                values.push(this._parseValue(value, dataType));
                            }
                        }
                        return values;
                    },

                    change: function() {
                        var values = [],
                            element = this.element,
                            options = this.options,
                            field = options.valueField || options.textField,
                            valuePrimitive = options.valuePrimitive,
                            source,
                            option,
                            valueIndex,
                            value,
                            idx,
                            length;

                        values = this.parsedValue();

                        if (field) {
                            source = this.bindings.source.get();
                            if (source instanceof DataSource) {
                                source = source.view();
                            }

                            for (valueIndex = 0; valueIndex < values.length; valueIndex++) {
                                for (idx = 0, length = source.length; idx < length; idx++) {
                                    var match = valuePrimitive ? (this._parseValue(values[
                                        valueIndex], this.dataType()) === source[
                                        idx].get(
                                        field)) : (this._parseValue(source[idx].get(
                                            field),
                                        this.dataType()).toString() === values[
                                        valueIndex]);
                                    if (match) {
                                        values[valueIndex] = source[idx];
                                        break;
                                    }
                                }
                            }
                        }

                        value = this.bindings[VALUE].get();
                        if (value instanceof ObservableArray) {
                            value.splice.apply(value, [0, value.length].concat(values));
                        } else if (!valuePrimitive && (value instanceof ObservableObject ||
                            value === null || value === undefined || !field)) {
                            this.bindings[VALUE].set(values[0]);
                        } else {
                            this.bindings[VALUE].set(values[0].get(field));
                        }
                    },

                    refresh: function() {
                        var optionIndex,
                            element = this.element,
                            options = element.options,
                            valuePrimitive = this.options.valuePrimitive,
                            value = this.bindings[VALUE].get(),
                            values = value,
                            field = this.options.valueField || this.options.textField,
                            found = false,
                            type = this.dataType(),
                            optionValue;

                        if (!(values instanceof ObservableArray)) {
                            values = new ObservableArray([value]);
                        }

                        element.selectedIndex = -1;

                        for (var valueIndex = 0; valueIndex < values.length; valueIndex++) {
                            value = values[valueIndex];


                            if (field && value instanceof ObservableObject) {
                                value = value.get(field);
                            }

                            value = toDateString(values[valueIndex], type);

                            for (optionIndex = 0; optionIndex < options.length; optionIndex++) {
                                optionValue = options[optionIndex].value;

                                if (optionValue === '' && value !== '') {
                                    optionValue = options[optionIndex].text;
                                }

                                if (value != null && optionValue == value.toString()) {
                                    options[optionIndex].selected = true;
                                    found = true;
                                }
                            }
                        }
                    },

                    destroy: function() {
                        $(this.element).off(CHANGE, this._change);
                    }
                })
            };

            componentBinders.events = Binder.extend({

                ctor: function(component, bindings, options) {
                    this._super(component.element, bindings, options);
                    this.component = component;
                    this.handlers = {};
                },

                refresh: function(key) {
                    var binding = this.bindings.events[key],
                        handler = this.handlers[key];

                    if (handler) {
                        this.component.unbind(key, handler);
                    }

                    handler = binding.get();

                    this.handlers[key] = function(e) {
                        e.data = binding.source;

                        handler(e);

                        if (e.data === binding.source) {
                            delete e.data;
                        }
                    };

                    this.component.bind(key, this.handlers[key]);
                },

                destroy: function() {
                    var handler;

                    for (handler in this.handlers) {
                        this.component.unbind(handler, this.handlers[handler]);
                    }
                }
            });

            componentBinders.checked = Binder.extend({

                ctor: function(component, bindings, options) {
                    this._super(component.element, bindings, options);
                    this.component = component;
                    this._change = proxy(this.change, this);
                    this.component.bind(CHANGE, this._change);
                },

                change: function() {
                    this.bindings[CHECKED].set(this.value());
                },

                refresh: function() {
                    this.component.check(this.bindings[CHECKED].get() === true);
                },

                value: function() {
                    var element = this.element,
                        value = element.value;

                    if (value == "on" || value == "off") {
                        value = element.checked;
                    }

                    return value;
                },

                destroy: function() {
                    this.component.unbind(CHANGE, this._change);
                }
            });

            componentBinders.visible = Binder.extend({

                ctor: function(component, bindings, options) {
                    this._super(component.element, bindings, options);
                    this.component = component;
                },

                refresh: function() {
                    var visible = this.bindings.visible.get();
                    this.component.wrapper[0].style.display = visible ? '' : "none";
                }
            });

            componentBinders.invisible = Binder.extend({

                ctor: function(component, bindings, options) {
                    this._super(component.element, bindings, options);
                    this.component = component;
                },

                refresh: function() {
                    var invisible = this.bindings.invisible.get();
                    this.component.wrapper[0].style.display = invisible ? "none" : '';
                }
            });

            componentBinders.enabled = Binder.extend({

                ctor: function(component, bindings, options) {
                    this._super(component.element, bindings, options);
                    this.component = component;
                },

                refresh: function() {
                    if (this.component.enable) {
                        this.component.enable(this.bindings.enabled.get());
                    }
                }
            });

            componentBinders.disabled = Binder.extend({

                ctor: function(component, bindings, options) {
                    this._super(component.element, bindings, options);
                    this.component = component;
                },

                refresh: function() {
                    if (this.component.enable) {
                        this.component.enable(!this.bindings.disabled.get());
                    }
                }
            });

            componentBinders.source = Binder.extend({

                ctor: function(component, bindings, options) {
                    var that = this;
                    that._super(component.element, bindings, options);

                    that.component = component;
                    that._dataBinding = proxy(that.dataBinding, that);
                    that._dataBound = proxy(that.dataBound, that);
                    that._itemChange = proxy(that.itemChange, that);
                },

                itemChange: function(e) {
                    bindElement(e.item[0], e.data, [e.data].concat(this.bindings[SOURCE]._parents()));
                },

                dataBinding: function(e) {
                    var idx,
                        length,
                        component = this.component,
                        items = e.removedItems || component.items();

                    for (idx = 0, length = items.length; idx < length; idx++) {
                        unbindElementTree(items[idx]);
                    }
                },

                dataBound: function(e) {
                    var idx,
                        length,
                        component = this.component,
                        items = e.addedItems || component.items(),
                        dataSource = component[DATASOURCE],
                        view,
                        parents;

                    if (items.length) {
                        view = e.addedDataItems || dataSource.view();
                        parents = this.bindings[SOURCE]._parents();

                        for (idx = 0, length = view.length; idx < length; idx++) {
                            bindElement(items[idx], view[idx], [view[idx]].concat(
                                parents));
                        }
                    }
                },

                refresh: function(e) {
                    var that = this,
                        source,
                        component = that.component;

                    e = e || {};

                    if (!e.action) {
                        that.destroy();

                        component.bind("dataBinding", that._dataBinding);
                        component.bind("dataBound", that._dataBound);
                        component.bind("itemChange", that._itemChange);

                        source = that.bindings[SOURCE].get();

                        if (component[DATASOURCE] instanceof DataSource && component[
                                DATASOURCE] !=
                            source) {
                            if (source instanceof DataSource) {
                                component[SETDATASOURCE](source);
                            } else if (source && source._dataSource) {
                                component[SETDATASOURCE](source._dataSource);
                            } else {
                                component[DATASOURCE].data(source);
                                // component instanceof ui.MultiSelect
                                if (that.bindings.value && ui.Select && (component instanceof ui
                                    .Select)) {
                                    component.value(retrievePrimitiveValues(that.bindings.value
                                        .get(),
                                        component.options.valueField));
                                }
                            }
                        }
                    }
                },

                destroy: function() {
                    var component = this.component;
                    component.unbind("dataBinding", this._dataBinding);
                    component.unbind("dataBound", this._dataBound);
                    component.unbind("itemChange", this._itemChange);
                }
            });

            componentBinders.value = Binder.extend({

                ctor: function(component, bindings, options) {
                    this._super(component.element, bindings, options);
                    this.component = component;
                    this._change = proxy(this.change, this);
                    this.component.first(CHANGE, this._change);

                    var value = this.bindings.value.get();

                    //value == null
                    this._valueIsObservableObject = !options.valuePrimitive && value instanceof ObservableObject;
                    this._valueIsObservableArray = value instanceof ObservableArray;
                    this._initChange = false;
                },

                change: function() {
                    var value = this.component.value(),
                        options = this.options,
                        field = options.valueField || options.textField,
                        isArray = $.isArray(value),
                        isObservableObject = this._valueIsObservableObject,
                        valueIndex, valueLength, values = [],
                        sourceItem, sourceValue,
                        idx, length, source;

                    this._initChange = true;

                    if (field) {

                        if (this.bindings.source) {
                            source = this.bindings.source.get();
                        }

                        if (value === '' && (isObservableObject || options.valuePrimitive)) {
                            value = null;
                        } else {
                            if (!source || source instanceof DataSource) {
                                source = this.component.dataSource.view();
                            }

                            if (isArray) {
                                valueLength = value.length;
                                values = value.slice(0);
                            }

                            for (idx = 0, length = source.length; idx < length; idx++) {
                                sourceItem = source[idx];
                                sourceValue = sourceItem.get(field);

                                if (isArray) {
                                    for (valueIndex = 0; valueIndex < valueLength; valueIndex++) {
                                        if (sourceValue == values[valueIndex]) {
                                            values[valueIndex] = sourceItem;
                                            break;
                                        }
                                    }
                                } else if (sourceValue == value) {
                                    value = isObservableObject ? sourceItem : sourceValue;
                                    break;
                                }
                            }

                            if (values[0]) {
                                if (this._valueIsObservableArray) {
                                    value = values;
                                } else if (isObservableObject || !field) {
                                    value = values[0];
                                } else {
                                    value = values[0].get(field);
                                }
                            }
                        }
                    }

                    this.bindings.value.set(value);
                    this._initChange = false;
                },

                refresh: function() {
                    if (!this._initChange) {
                        var component = this.component,
                            options = this.options,
                            textField = options.textField,
                            valueField = options.valueField || textField,
                            value = this.bindings.value.get(),
                            text = options.text || '',
                            idx = 0,
                            values = [],
                            length;

                        if (value === undefined) {
                            value = null;
                        }

                        if (valueField) {
                            if (value instanceof ObservableArray) {
                                for (length = value.length; idx < length; idx++) {
                                    values[idx] = value[idx].get(valueField);
                                }
                                value = values;
                            } else if (value instanceof ObservableObject) {
                                text = value.get(textField);
                                value = value.get(valueField);
                            }
                        }

                        if (component.options.autoBind === false && component.listView && !
                            component
                            .listView.isBound()) {
                            if (textField === valueField && !text) {
                                text = value;
                            }

                            component._preselect(value, text);
                        } else {
                            component.value(value);
                        }
                    }

                    this._initChange = false;
                },

                destroy: function() {
                    this.component.unbind(CHANGE, this._change);
                }
            });

            function parseBindings(bind) {
                var result = {},
                    idx,
                    length,
                    token,
                    colonIndex,
                    key,
                    value,
                    tokens;

                tokens = bind.match(regKeyValue);

                for (idx = 0, length = tokens.length; idx < length; idx++) {
                    token = tokens[idx];
                    colonIndex = token.indexOf(":");

                    key = token.substring(0, colonIndex);
                    value = token.substring(colonIndex + 1);

                    if (value.charAt(0) == "{") {
                        value = parseBindings(value);
                    }

                    result[key] = value;
                }

                return result;
            }

            function createBindings(bindings, source, type) {
                var binding,
                    result = {};

                for (binding in bindings) {
                    result[binding] = new type(source, bindings[binding]);
                }

                return result;
            }

            function bindElement(element, source, parents, deepBefore) {
                var role = element.getAttribute("data-role"),
                    bind = element.getAttribute("data-bind"),
                    node = element.nodeName.toLowerCase(),
                    children = element.children,
                    childrenCopy = [],
                    deep = true,
                    bindings,
                    options = {},
                    idx,
                    target;

                if (deepBefore === undefined) deepBefore = true;
                parents = parents || [source];

                if (node.indexOf('fly:') === 0) {
                    node = node.substring(4);
                }

                if (!role && fly.ui[node]) {
                    role = node;
                }

                if (role || bind) {
                    unbindElement(element);
                }

                if (deepBefore && deep && children.length) {
                    for (idx = 0; idx < children.length; idx++) {
                        childrenCopy[idx] = children[idx];
                    }

                    for (idx = 0; idx < childrenCopy.length; idx++) {
                        bindElement(childrenCopy[idx], source, parents);
                    }
                }

                if (role) {
                    target = bindingTargetForRole(element, role);
                    element = target.target.element;
                    children = element.children;
                }

                if (bind) {
                    bind = parseBindings(bind.replace(regWhiteSpace, ''));

                    if (!target) {
                        options = fly.parseOptions(element, {
                            textField: '',
                            valueField: '',
                            template: '',
                            valueUpdate: CHANGE,
                            valuePrimitive: false,
                            itemChange: true,
                            autoBind: true
                        });
                        target = new BindingTarget(element, options);
                    }

                    target.source = source;

                    bindings = createBindings(bind, parents, Binding);

                    if (options.template) {
                        bindings.template = new TemplateBinding(parents, '', options.template);
                    }

                    if (bindings.click) {
                        bind.events = bind.events || {};
                        bind.events.click = bind.click;
                        bindings.click.destroy();
                        delete bindings.click;
                    }

                    if (bindings.source) {
                        deep = false;
                    }

                    if (bind.attr) {
                        bindings.attr = createBindings(bind.attr, parents, Binding);
                    }

                    if (bind.style) {
                        bindings.style = createBindings(bind.style, parents, Binding);
                    }

                    if (bind.events) {
                        bindings.events = createBindings(bind.events, parents,
                            EventBinding);
                    }

                    if (bind.css) {
                        bindings.css = createBindings(bind.css, parents, Binding);
                    }

                    target.bind(bindings);
                }

                if (target) {
                    element.flyBindingTarget = target;
                }

                // 遍历子节点深度绑定
                if (!deepBefore && deep && children) {
                    for (idx = 0; idx < children.length; idx++) {
                        childrenCopy[idx] = children[idx];
                    }

                    for (idx = 0; idx < childrenCopy.length; idx++) {
                        bindElement(childrenCopy[idx], source, parents);
                    }
                }
            }

            function unbindElement(element) {
                var bindingTarget = element.flyBindingTarget,
                    handler = element.handler;

                if (bindingTarget) {
                    bindingTarget.destroy();
                    fly.deleteExpando(element, 'flyBindingTarget');
                }

                if (handler) {
                    handler.destroy();
                }
            }

            function unbindElementTree(element) {
                unbindElement(element);
                unbindElementChildren(element);
            }

            function unbindElementChildren(element) {
                var children = element.children;

                if (children) {
                    for (var idx = 0, length = children.length; idx < length; idx++) {
                        unbindElementTree(children[idx]);
                    }
                }
            }

            function unbind(dom) {
                var idx, length;

                if (!dom) return;
                if (fly.isDOM(dom)) {
                    dom = [dom];
                }

                for (idx = 0, length = dom.length; idx < length; idx++) {
                    unbindElementTree(dom[idx]);
                }
            }

            function bind(dom, object, deepBefore) {
                var idx,
                    length,
                    node

                if (!dom) return;

                if (fly.isDOM(dom)) {
                    dom = [dom];
                }

                for (idx = 0, length = dom.length; idx < length; idx++) {
                    node = dom[idx];
                    if (node.nodeType === 1) {
                        bindElement(node, object, deepBefore);
                    }
                }
            }

            function notify(component) {
                var element = component.element,
                    bindingTarget = element.flyBindingTarget;

                if (bindingTarget) {
                    bind(element, bindingTarget.source);
                }
            }

            function retrievePrimitiveValues(value, valueField) {
                var values = [];
                var idx = 0;
                var length;
                var item;

                if (!valueField) {
                    return value;
                }

                if (value instanceof ObservableArray) {
                    for (length = value.length; idx < length; idx++) {
                        item = value[idx];
                        values[idx] = item.get ? item.get(valueField) : item[valueField];
                    }
                    value = values;
                } else if (value instanceof ObservableObject) {
                    value = value.get(valueField);
                }

                return value;
            }

            function bindingTargetForRole(element, role) {
                var component = ui.component(element, {}, role);

                if (component) {
                    return new ComponentBindingTarget(component);
                }
            }

            fly.bind = bind;
            fly.unbind = unbind;
            fly.notify = notify;
            fly.binders = binders;
            fly.Binder = Binder;

            module.exports = bind;

        }, {
            "./fly.component": 3,
            "./fly.core": 4,
            "./fly.data": 5,
            "./fly.format": 6,
            "./fly.template": 15,
            "./fly.utils": 16
        }
    ],
    3: [
        function(require, module, exports) {
            /**
             * 组件
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-06-01 15:20
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                Observable = require('./fly.observable'),
                utils = require('./fly.utils'),
                DataSource = require('./fly.data'),
                $ = fly.$,
                NS = fly.NS,
                ui = fly.ui,
                proxy = $.proxy,
                slice = [].slice;

            var STRING = 'string',
                ROLE = 'role',
                HANDLER = 'handler',
                PROGRESS = 'progress',
                ERROR = 'error',
                CHANGE = 'change';

            var validateAttr = {
                required: true,
                min: true,
                max: true,
                step: true,
                type: true,
                pattern: true,
                key: true,
                title: true,
                name: true
            };

            /**
             * 通用组件
             * 将指定标签解析为组件
             */
            var Component = fly.ObservableObject.extend({

                /**
                 * 组件构造函数
                 * @param  {Object} element
                 * @param  {Object} options 选项
                 * @param  {[type]} cache   是否缓存组件实例
                 * @return {[type]}
                 */
                ctor: function(element, options, cache) {
                    var that = this,
                        dataSource;

                    if (!element) {
                        return;
                    };
                    if (!element.nodeType && element.length) {
                        element = element[0];
                    }

                    that._events = {};
                    options = options || {};
                    dataSource = options.dataSource || null;
                    that.element = element;

                    // 扩展 options
                    // 因为 dataSource 比较特殊，不参与 extend
                    dataSource && delete options.dataSource;
                    options = that.options = $.extend(true, {}, fly.dataset(element),
                        that.options, options);
                    if (dataSource) {
                        options.dataSource = dataSource;
                    }

                    that._super();
                    that._render();
                    that._dataSource();

                    // 将组件实例绑定到element
                    that.template && fly.bind(that.element, that);

                    // 存在 jQuery 的话，就愉快的玩耍
                    if (typeof(jQuery) !== 'undefined') {
                        that.$element = jQuery(that.element);
                    }

                    // 将组件实例缓存
                    if (cache !== false) {
                        // that.element[ROLE] = name.toLowerCase();
                        // that.element[NS + name] = that;
                        that.element[HANDLER] = that;
                    }

                    // 绑定事件
                    // 触发 options 中对应的事件
                    that.bind(that.events, options);
                },

                events: [],

                options: {},

                // template: fly.template('<div></div>'),

                /**
                 * 检测是否存在绑定目标
                 * @return {boolean} 存在结果
                 */
                _hasBindingTarget: function() {
                    return !!this.element.flyBindingTarget;
                },

                /**
                 * 将元素的 tabindex 转移到组件上
                 * @param  {Object} target 目标元素
                 */
                _tabindex: function(target) {

                },

                setDataSource: function(dataSource) {
                    this.options.dataSource = dataSource;
                    this._dataSource();
                    if (this.options.autoBind !== false) {
                        dataSource.fetch();
                    }
                },

                _unbindDataSource: function() {
                    this.dataSource.unbind(CHANGE, this._refreshHandler)
                        .unbind(PROGRESS, this._progressHandler)
                        .unbind(ERROR, this._errorHandler);
                },

                _dataSource: function() {
                    var that = this,
                        dataSource;

                    if (that.dataSource && that._refreshHandler) {
                        that._unbindDataSource();
                    } else {
                        that._refreshHandler = proxy(that.refresh || $.noop, that);
                        that._progressHandler = proxy(that.progress || $.noop, that);
                        that._errorHandler = proxy(that.error || $.noop, that);
                    }

                    dataSource = DataSource.create(that.options.dataSource)
                        .bind(CHANGE, that._refreshHandler)
                        .bind(PROGRESS, that._progressHandler)
                        .bind(ERROR, that._errorHandler);

                    that.set('dataSource', dataSource);
                },

                /**
                 * 设置组件选项
                 * @param  {Object} options 新选项
                 */
                setOptions: function(options) {
                    this._setEvents(options);
                    $.extend(this.options, options);
                },

                /**
                 * 设置组件事件
                 * @param  {Object} options 新选项
                 */
                _setEvents: function(options) {
                    var that = this,
                        idx = 0,
                        length = that.events.length,
                        e;

                    for (; idx < length; idx++) {
                        e = that.events[idx];
                        if (that.options[e] && options[e]) {
                            that.unbind(e, that.options[e]);
                        }
                    }

                    that.bind(that.events, options);
                },

                /**
                 * 重置组件大小
                 * @param  {boolean} force 是否强制
                 */
                resize: function(force) {
                    var size = this.getSize(),
                        currentSize = this._size;

                    if (force || (size.width > 0 || size.height > 0) && (!currentSize ||
                        size.width !==
                        currentSize.width || size.height !== currentSize.height)) {
                        this._size = size;
                        this._resize(size, force);
                        this.trigger('resize', size);
                    }
                },

                /**
                 * 获取组件大小
                 * @return {Object} 组件大小
                 */
                getSize: function() {
                    var element = this.element;
                    return {
                        width: element.offsetWidth,
                        height: element.offsetHeight
                    };
                },

                size: function(size) {
                    if (!size) {
                        return this.getSize();
                    } else {
                        this.setSize(size);
                    }
                },

                setSize: $.noop,

                _resize: $.noop,

                dataItems: function() {
                    return this.dataSource && this.dataSource.view();
                },

                _render: function() {
                    var that = this,
                        element = that.element,
                        options = that.options,
                        oFragment,
                        newElement,
                        newContent;

                    if (that.template) {
                        that._getAttribute();
                        options = $.extend(true, options, that.__validate);
                        oFragment = document.createDocumentFragment();
                        newElement = $(that.template(options))[0];
                        element.parentNode.insertBefore(newElement, element);
                        newContent = newElement.getElementsByTagName('content')[0];
                        while (element.childNodes.length) {
                            oFragment.appendChild(element.firstChild);
                        }
                        if (newContent) {
                            newContent.parentNode.insertBefore(oFragment, newContent);
                            newContent.parentNode.removeChild(newContent);
                        } else {
                            newElement.appendChild(oFragment);
                        }

                        that.element = newElement;

                        element.parentNode.removeChild(element);

                        that._setAttribute();
                    }
                },

                _getAttribute: function() {
                    var element = this.element,
                        attrs = {},
                        validate = {};
                    $.each(element.attributes, function(i, item) {
                        if (item.name !== 'data-bind' && item.name !== 'data-role') {
                            attrs[item.name] = item.value;
                        }
                        if (validateAttr[item.name]) {
                            validate[item.name] = item.value;
                        }
                    });
                    this.__attrs = attrs;
                    this.__validate = validate;
                },

                _setAttribute: function() {
                    var element = this.element;
                    $.each(this.__attrs, function(key, value) {
                        if (key == 'class') {
                            fly.addClass(element, value);
                        } else {
                            element.setAttribute(key, value);
                        }
                    });
                },

                bindViewModel: function(element, vm) {
                    if (!vm) {
                        vm = element;
                        element = this.element;
                    }
                    fly.bind(element, vm);
                },

                /**
                 * 销毁该组件
                 */
                destroy: function(component) {
                    var component = component || this,
                        element = component.element,
                        name = NS + component.name;
                    if (!element) return;
                    fly.deleteExpando(element, name);
                    fly.deleteExpando(element, HANDLER);
                    fly.deleteExpando(element, ROLE);
                    fly.unbind(element);
                }

            });


            /**
             * 组件实例化方法
             * @param  {[type]} element [description]
             * @param  {[type]} options [description]
             * @param  {[type]} roles   [description]
             * @return {[type]}         [description]
             */
            ui.component = function(element, options, role) {
                var result,
                    component,
                    value,
                    dataSource;

                component = ui[role];

                if (!component) return;

                var name = component.fn.name || role.replace(role.charAt(0), role.charAt(0).toUpperCase());
                var keyName = 'fly' + name;
                var keyRegExp = new RegExp('^' + keyName + '$', 'i');

                for (var key in element) {
                    if (key.match(keyRegExp)) {
                        if (key === keyName) {
                            result = element[key];
                        } else {
                            return element[key];
                        }
                        break;
                    }
                }

                dataSource = fly.parseOption(element, 'dataSource');

                options = $.extend({}, fly.parseOptions(element, component.fn.options), options);

                if (dataSource) {
                    if (typeof dataSource === STRING) {
                        options.dataSource = fly.getter(dataSource)(window);
                    } else {
                        options.dataSource = dataSource;
                    }
                }

                for (var idx = 0, events = component.fn.events, length = events.length, option; idx <
                    length; idx++) {
                    option = events[idx];
                    value = fly.parseOption(element, option);
                    if (value !== undefined) {
                        options[option] = fly.getter(value)(window);
                    }
                }

                if (!result) {
                    result = new component(element, options);
                } else if (!$.isEmptyObject(options)) {
                    result.setOptions(options);
                }

                return result;
            };


            /**
             * 注册组件
             * @param {Object} newComponent
             */
            fly.component = function(MyComponent, name) {
                fly.ui[(name || MyComponent.fn.name).toLowerCase()] = MyComponent;
            };

            fly.Component = Component;
            module.exports = Component;
        }, {
            "./fly.core": 4,
            "./fly.data": 5,
            "./fly.observable": 11,
            "./fly.utils": 16
        }
    ],
    4: [
        function(require, module, exports) {
            /**
             * 基础代码
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-06-01 15:20
             */

            // 'use strict';
            // 因为callee，这里不能使用严格模式

            // 基础jQuery工具方法
            var $ = require('./fly.jquery');

            // 特性检测
            var support = require('./fly.support');

            var win = window,
                FUNCTION = 'function',
                CTOR = 'ctor',
                roperator = /(!|\+|-|\*|\/)+/g,
                rexpression = /^[a-zA-Z_]{1}[a-zA-Z0-9_.]{1,}$/,
                getterCache = {},
                setterCache = {};

            // class-shim
            var Class = function() {};

            // 命名空间
            // 这里有潜在风险
            var fly = function(vm) {
                return fly.observable(vm);
            };

            // 常用键值
            fly.keys = {
                DELETE: 46,
                BACKSPACE: 8,
                TAB: 9,
                ENTER: 13,
                ESC: 27,
                LEFT: 37,
                UP: 38,
                RIGHT: 39,
                DOWN: 40,
                END: 35,
                HOME: 36,
                SPACEBAR: 32,
                PAGEUP: 33,
                PAGEDOWN: 34
            };

            var fnTest = /xyz/.test(function() {
                xyz;
            }) ? /\b_super\b/ : /.*/;

            /**
             * class基类
             * John Resig Class.js
             */
            Class.extend = function(prop) {

                var _super = this.prototype;

                // 父类的实例赋给变量prototype
                var prototype = new this();

                // 把要扩展的属性复制到prototype变量上
                for (var name in prop) {
                    // this._super访问父类的实例
                    // name == CTOR
                    prototype[name] = typeof prop[name] == FUNCTION &&
                        typeof _super[name] == FUNCTION && fnTest.test(prop[name]) ?
                        (function(name, fn) {
                        return function() {
                            // 备份this._super
                            var tmp = this._super;
                            // 替换成父类的同名ctor方法
                            this._super = _super[name];
                            // 此时fn中的this里面的this._super已经换成了_super[name],即父类的同名方法
                            var ret = fn.apply(this, arguments);
                            // 把备份的还原回去
                            this._super = tmp;
                            return ret;
                        };
                    })(name, prop[name]) :
                        prop[name];
                }

                // 假的构造函数
                function Class() {
                    // 执行真正的构造函数
                    this[CTOR].apply(this, arguments);
                }

                // 继承父类的静态属性
                for (var key in this) {
                    if (this.hasOwnProperty(key) && key != 'extend')
                        Class[key] = this[key];
                }

                // 子类的原型指向父类的实例
                Class.prototype = prototype;

                // 父类的实例
                // 这样做不太好，还是去掉
                // Class.prototype._super = new this();

                // 覆盖父类的静态属性
                if (prop.statics) {
                    for (var name in prop.statics) {
                        if (prop.statics.hasOwnProperty(name)) {
                            Class[name] = prop.statics[name];
                            if (name == CTOR) {
                                Class[name]();
                            }
                        }
                    }
                }

                Class.prototype.constructor = Class;

                // 原型可扩展
                Class.extendPrototype = function(prop) {
                    for (var name in prop) {
                        prototype[name] = prop[name];
                    }
                };

                Class.fn = Class.prototype;
                // 任何Class.extend的返回对象都将具备extend方法
                Class.extend = arguments.callee;

                return Class;
            };


            /**
             * 生成标准GUID
             * @return {String} 32位GUID字符串
             */
            fly.guid = function() {
                var originStr = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
                return originStr.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0,
                        v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                }).toUpperCase();
            };

            /**
             * 恒等
             * 待扩展
             * @param   {Any} o 任何输入
             * @returns {Any} 输出
             */
            fly.identity = function(o) {
                return o;
            }

            /**
             * 构建表达式
             * @param   {String}  [expression=''] 原始表达式
             * @param   {Boolean} safe            是否安全构建
             * @param   {String}  paramName       参数名
             * @returns {String}  解析后的表达式
             */
            fly.expr = function(expression, safe, paramName) {
                expression = expression || '';

                if (typeof safe == 'string') {
                    paramName = safe;
                    safe = false;
                }

                paramName = paramName || 'd';

                if (expression && expression.charAt(0) !== '[') {
                    expression = '.' + expression;
                }

                if (safe) {
                    expression = expression.replace(/"([^.]*)\.([^"]*)"/g,
                        '"$1_$DOT$_$2"');
                    expression = expression.replace(/'([^.]*)\.([^']*)'/g,
                        "'$1_$DOT$_$2'");
                    expression = wrapExpression(expression.split('.'), paramName);
                    expression = expression.replace(/_\$DOT\$_/g, '.');
                } else {
                    expression = paramName + expression;
                }

                return expression;
            }

            /**
             * 取值
             * @param   {String}   expression 表达式
             * @param   {String}   safe       key
             * @returns {Function} 解析表达式的函数
             */
            fly.getter = function(expression, safe) {
                var key = expression + safe;
                return getterCache[key] = getterCache[key] ||
                    new Function('d', 'return ' + fly.expr(expression, safe));
            }

            /**
             * 赋值
             * @param   {String}   expression 表达式
             * @returns {Function} 解析表达式的函数
             */
            fly.setter = function(expression) {
                return setterCache[expression] = setterCache[expression] ||
                    new Function('d, value', fly.expr(expression) + '=value');
            }


            /**
             * 构建读取属性值的表达式
             * @param   {Array}  members   成员 ['a', 'b'] ==> ((d.a || {}).b)
             * @param   {String} paramName 参数名
             * @returns {String} 拼装好的表达式
             */
            function wrapExpression(members, paramName) {
                var result = paramName || 'd',
                    index,
                    idx,
                    length,
                    member,
                    count = 1;

                for (idx = 0, length = members.length; idx < length; idx++) {
                    member = members[idx];
                    if (member !== '') {
                        index = member.indexOf('[');

                        if (index !== 0) {
                            if (index == -1) {
                                member = '.' + member;
                            } else {
                                count++;
                                member = '.' + member.substring(0, index) + ' || {})' +
                                    member.substring(index);
                            }
                        }

                        count++;
                        result += member + ((idx < length - 1) ? ' || {})' : ')');
                    }
                }
                return new Array(count).join('(') + result;
            };

            // 命名空间
            fly.NS = 'fly';
            fly.$ = win.jQuery || $;
            fly.win = win;
            fly.Class = Class;
            fly.support = support;
            fly.ui = {
                roles: {},
                defaults: {}
            };

            module.exports = fly;
        }, {
            "./fly.jquery": 7,
            "./fly.support": 14
        }
    ],
    5: [
        function(require, module, exports) {
            /**
             * 数据对象
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-06
             */

            'use strict';

            var fly = require('./fly.core'),
                ajax = require('./fly.ajax'),
                ob = require('./fly.observable'),
                Model = require('./fly.model'),
                format = require('./fly.format');

            var Class = fly.Class,
                Observable = fly.Observable,
                ObservableObject = fly.ObservableObject,
                ObservableArray = fly.ObservableArray,
                LazyObservableArray = fly.LazyObservableArray,
                identity = fly.identity,
                getter = fly.getter,
                $ = fly.$,
                each = $.each,
                map = $.map,
                proxy = $.proxy,
                extend = $.extend,
                isEmptyObject = $.isEmptyObject,
                isPlainObject = $.isPlainObject,
                isFunction = $.isFunction,
                isNumber = $.isNumeric,
                isArray = $.isArray,
                grep = $.grep,
                noop = $.noop,
                Deferred = $.Deferred,
                slice = [].slice,
                math = Math;

            // 静态变量
            var FUNCTION = 'function',
                STRING = 'string',
                CHANGE = 'change',
                CREATE = 'create',
                READ = 'read',
                UPDATE = 'update',
                DESTROY = 'destroy',
                ERROR = 'error',
                REQUESTSTART = 'requestStart',
                PROGRESS = 'progress',
                REQUESTEND = 'requestEnd',
                EMPTY = 'empty',
                PUSH = 'push',
                CRUD = [CREATE, READ, UPDATE, DESTROY],
                ARR = '[object Array]';

            // 操作符转换
            var operatorMap = {
                '==': 'eq',
                '!=': 'neq',
                '<': 'lt',
                '<=': 'lte',
                '>': 'gt',
                '>=': 'gte',
                notsubstringof: 'doesnotcontain'
            };

            // 正则
            var dateRegExp = /^\/Date\((.*?)\)\/$/,
                newLineRegExp = /(\r+|\n+)/g,
                quoteRegExp = /(?=['\\])/g;


            var DataSource = Observable.extend({

                ctor: function(options) {
                    if (!options) return;

                    if (isArray(options)) {
                        options = {
                            data: options
                        };
                    }

                    var that = this,
                        options = options || {},
                        data = options.data,
                        read = options.read,
                        model;

                    // 兼容老版本的写法
                    if (data && data.url) {
                        read = data;
                    } else if (typeof data == STRING) {
                        read = {
                            url: data
                        };
                    } else if (isArray(data)) {
                        options.server = false;
                        options.pageMode = 0;
                    }

                    // 继承options
                    options = that.options = extend({}, that.options, options);

                    that._map = {};
                    that._prefetch = {}; // 预拉取
                    that._data = []; // 初始数据
                    that._pristineData = []; // 关键数据
                    that._ranges = [];
                    that._view = [];
                    that._pristineTotal = 0;
                    that._destroyed = []; // 已销毁
                    that._pageSize = options.pageSize;
                    that._page = options.page || (options.pageSize ? 1 : undefined); // 当前页码
                    that._sort = normalizeSort(options.sort);
                    that._filter = normalizeFilter(options.filter);
                    that._total = options.total;

                    that._shouldDetachObservableParents = true;

                    that._super();

                    that.transport = Transport.create(options, that);

                    // if (isFunction(that.transport.push)) {
                    //     that.transport.push({
                    //         pushCreate: proxy(that._pushCreate, that),
                    //         pushUpdate: proxy(that._pushUpdate, that),
                    //         pushDestroy: proxy(that._pushDestroy, that)
                    //     });
                    // }

                    that.reader = new DataReader(options.model, options.modelBase, read ||
                        options.childrenField);

                    model = that.reader.model || {};

                    that._detachObservableParents();

                    that._data = that._observe(that._data);

                    // 是否支持离线缓存
                    that._online = true;

                    that.bind([ERROR, CHANGE, REQUESTSTART, REQUESTEND, PROGRESS],
                        options);
                },

                options: {
                    data: null,
                    interface: {},
                    server: {
                        page: true,
                        sort: false,
                        filter: true
                    },
                    pageMode: {
                        page: 'currentPageNo',
                        size: 'pageSize'
                    }
                },

                parent: noop,

                /**
                 * 获取item
                 * @param   {String} id          值
                 * @param   {String} [key='id',] 字段名
                 * @returns {Object} 符合条件的data
                 */
                get: function(id, key) {
                    var data = this._data,
                        key = key || 'uid',
                        idx,
                        length;

                    for (idx = 0, length = data.length; idx < length; idx++) {
                        if (data[idx][key] == id) {
                            return data[idx];
                        }
                    }
                },

                indexOf: function(model) {
                    return indexOfModel(this._data, model);
                },

                at: function(index) {
                    return this._data.at(index);
                },

                data: function(value) {
                    var that = this;
                    if (value !== undefined) {
                        that._detachObservableParents();
                        that._data = this._observe(value);

                        that._pristineData = value.slice(0);

                        that._storeData();

                        that._ranges = [];
                        that.trigger('reset');
                        that._addRange(that._data);

                        that._total = that._data.length;
                        that._pristineTotal = that._total;

                        that._process(that._data);
                    } else {
                        if (that._data) {
                            for (var idx = 0; idx < that._data.length; idx++) {
                                that._data.at(idx);
                            }
                        }

                        return that._data;
                    }
                },

                _index: function(data) {
                    var skip = this.skip() || 0;
                    each(data, function(i, item) {
                        if (item != undefined && item != null) {
                            item['_index'] = skip + i + 1;
                        }
                    });
                    return data;
                },

                view: function(value) {
                    if (value === undefined) {
                        return this._view;
                    } else {
                        this._view = this._observeView(value);
                    }
                },

                _observeView: function(data) {
                    var that = this;
                    replaceWithObservable(data, that._data, that._ranges, that.reader.model ||
                        ObservableObject, false);

                    var view = new LazyObservableArray(data, that.reader.model);
                    view.parent = function() {
                        return that.parent();
                    };
                    return view;
                },

                _createNewModel: function(model) {
                    if (this.reader.model) {
                        return new this.reader.model(model);
                    }

                    if (model instanceof ObservableObject) {
                        return model;
                    }

                    return new ObservableObject(model);
                },

                insert: function(index, model) {
                    if (!model) {
                        model = index;
                        index = 0;
                    }

                    if (!(model instanceof Model)) {
                        model = this._createNewModel(model);
                    }

                    this._data.splice(index, 0, model);

                    return model;
                },

                add: function(model) {
                    return this.insert(this._data.length, model);
                },

                remove: function(model) {
                    var result,
                        that = this;

                    this._eachItem(that._data, function(items) {
                        removeModel(items, model);
                    });

                    // this._removeModelFromRanges(model);

                    // this._updateRangesLength();

                    return model;
                },

                /**
                 * 返回已销毁的数据
                 * @returns {Array} 已销毁的数据
                 */
                destroyed: function() {
                    return this._destroyed;
                },


                _readData: function(data) {
                    var read = this.reader.data;
                    return read.call(this.reader, data);
                },

                _eachItem: function(data, callback) {
                    if (data && data.length) {
                        callback(data);
                    }
                },

                read: function(data) {
                    var that = this,
                        params = that._params(data);
                    var deferred = Deferred();

                    that._queueRequest(params, function() {
                        var isPrevented = that.trigger(REQUESTSTART, {
                            type: READ
                        });
                        if (!isPrevented) {
                            that.trigger(PROGRESS);

                            that._ranges = [];
                            that.trigger("reset");
                            if (that._online) {
                                that.transport.read({
                                    data: params,
                                    cache: false,
                                    success: function(data) {
                                        that.success(data);
                                        deferred.resolve();
                                    },
                                    error: function() {
                                        var args = slice.call(arguments);
                                        that.error.apply(that, args);
                                        deferred.reject.apply(deferred, args);
                                    }
                                });
                            }
                        } else {
                            that._dequeueRequest();

                            deferred.resolve(isPrevented);
                        }
                    });

                    return deferred.promise();
                },

                success: function(data) {
                    var that = this,
                        options = that.options;

                    that.trigger(REQUESTEND, {
                        response: data,
                        type: READ
                    });

                    if (that._online) {
                        data = that.reader.parse(data);

                        if (that._handleCustomErrors(data)) {
                            that._dequeueRequest();
                            return;
                        }

                        that._total = that.reader.total(data);

                        data = that._readData(data);
                    } else {
                        data = that._readData(data);

                        var items = [];

                        for (var idx = 0; idx < data.length; idx++) {
                            var item = data[idx];
                            var state = item.__state__;

                            if (state == "destroy") {
                                this._destroyed.push(this._createNewModel(item));
                            } else {
                                items.push(item);
                            }
                        }

                        data = items;

                        that._total = data.length;
                    }

                    that._pristineTotal = that._total;

                    that._pristineData = data.slice(0);

                    that._detachObservableParents();

                    that._data = that._observe(data);

                    that._storeData();

                    that._addRange(that._data);

                    that._process(that._data);

                    that._dequeueRequest();
                },

                _detachObservableParents: function() {
                    if (this._data && this._shouldDetachObservableParents) {
                        for (var idx = 0; idx < this._data.length; idx++) {
                            if (this._data[idx].parent) {
                                this._data[idx].parent = noop;
                            }
                        }
                    }
                },

                _storeData: function(updatePristine) {
                    var server = this.options.server;
                    var model = this.reader.model;

                    function items(data) {
                        var state = [];

                        for (var idx = 0; idx < data.length; idx++) {
                            var dataItem = data.at(idx);
                            var item = dataItem.toJSON();

                            if (server && dataItem.items) {
                                item.items = items(dataItem.items);
                            } else {
                                item.uid = dataItem.uid;

                                if (model) {
                                    if (dataItem.isNew()) {
                                        item.__state__ = "create";
                                    } else if (dataItem.dirty) {
                                        item.__state__ = "update";
                                    }
                                }
                            }
                            state.push(item);
                        }

                        return state;
                    }
                },

                _addRange: function(data) {
                    var that = this,
                        start = that._skip || 0,
                        end = start + data.length;

                    that._ranges.push({
                        start: start,
                        end: end,
                        data: data
                    });
                    that._ranges.sort(function(x, y) {
                        return x.start - y.start;
                    });
                },

                error: function(xhr, status, errorThrown) {
                    this._dequeueRequest();
                    this.trigger(REQUESTEND, {});
                    this.trigger(ERROR, {
                        xhr: xhr,
                        status: status,
                        errorThrown: errorThrown
                    });
                },

                _pageParam: function() {
                    var options = this.options,
                        pageMode = options.pageMode;
                    if (pageMode) {
                        var opt = {};
                        opt[pageMode.page] = this.page();
                        return opt;
                    } else {
                        return {
                            take: this.take(),
                            skip: this.skip(),
                            page: this.page()
                        }
                    }
                },

                _params: function(data) {
                    var that = this,
                        pageParam = that._pageParam(),
                        thatOptions = that.options,
                        options = extend(pageParam, {
                            pageSize: that.pageSize(),
                            sort: that._sort
                        }, data);

                    if (!thatOptions.server) {
                        if (!thatOptions.pageSize) {
                            delete options.take;
                            delete options.skip;
                        }
                        delete options.page;
                        delete options.pageSize;
                        // delete options.currentPageNo;
                    }

                    return options;
                },

                _queueRequest: function(options, callback) {
                    var that = this;
                    if (!that._requestInProgress) {
                        that._requestInProgress = true;
                        that._pending = undefined;
                        callback();
                    } else {
                        that._pending = {
                            callback: proxy(callback, that),
                            options: options
                        };
                    }
                },

                _dequeueRequest: function() {
                    var that = this;
                    that._requestInProgress = false;
                    if (that._pending) {
                        that._queueRequest(that._pending.options, that._pending.callback);
                    }
                },

                _handleCustomErrors: function(response) {
                    var errors = this.reader.errors(response);
                    if (!errors) {
                        return false;
                    } else if (errors === EMPTY) {
                        this.trigger(EMPTY);
                        return false;
                    } else {
                        this.trigger(ERROR, {
                            // xhr: null,
                            status: "customerror",
                            errorThrown: "custom error",
                            errors: errors
                        });
                        return true;
                    }
                },

                _observe: function(data) {
                    var that = this,
                        model = that.reader.model,
                        wrap = false;

                    that._shouldDetachObservableParents = true;

                    if (model && data.length) {
                        wrap = !(data[0] instanceof model);
                    }

                    if (data instanceof ObservableArray) {
                        that._shouldDetachObservableParents = false;
                        if (wrap) {
                            data.type = that.reader.model;
                            data.wrapAll(data, data);
                        }
                    } else {
                        var arrayType = that.pageSize() && !that.options.server ?
                            LazyObservableArray : ObservableArray;
                        data = new arrayType(data, that.reader.model);
                        data.parent = function() {
                            return that.parent();
                        };
                    }

                    if (that._changeHandler && that._data && that._data instanceof ObservableArray) {
                        that._data.unbind(CHANGE, that._changeHandler);
                    } else {
                        that._changeHandler = proxy(that._change, that);
                    }

                    return data.bind(CHANGE, that._changeHandler);
                },

                _change: function(e) {
                    var that = this,
                        idx, length, action = e ? e.action : "";

                    if (action === "remove") {
                        for (idx = 0, length = e.items.length; idx < length; idx++) {
                            if (!e.items[idx].isNew || !e.items[idx].isNew()) {
                                that._destroyed.push(e.items[idx]);
                            }
                        }
                    }

                    var total = parseInt(that._total, 10);
                    if (!isNumber(that._total)) {
                        total = parseInt(that._pristineTotal, 10);
                    }
                    if (action === "add") {
                        total += e.items.length;
                    } else if (action === "remove") {
                        total -= e.items.length;
                    } else if (action !== "itemchange" && action !== "sync" && !that.options
                        .server) {
                        total = that._pristineTotal;
                    } else if (action === "sync") {
                        total = that._pristineTotal = parseInt(that._total, 10);
                    }

                    that._total = total;

                    that._process(that._data, e);
                },

                _process: function(data, e) {
                    var that = this,
                        options = {},
                        result;

                    if (that.options.server === false) {
                        options.skip = that._skip;
                        options.take = that._take || that._pageSize;

                        if (options.skip === undefined && that._page !== undefined &&
                            that._pageSize !==
                            undefined) {
                            options.skip = (that._page - 1) * that._pageSize;
                        }
                    }

                    if (that.options.server === false) {
                        options.sort = that._sort;
                        options.filter = that._filter;
                    }

                    result = that._queryProcess(data, options);

                    that.view(that._index(result.data));

                    if (result.total !== undefined && !that.options.server) {
                        that._total = result.total;
                    }

                    e = e || {};

                    e.items = e.items || that._view;

                    that.trigger(CHANGE, e);
                },

                _queryProcess: function(data, options) {
                    return Query.process(data, options);
                },

                _mergeState: function(options) {
                    var that = this,
                        pageMode = that.options.pageMode;

                    if (options !== undefined) {
                        that._pageSize = options.pageSize;
                        that._page = options.page;
                        that._sort = options.sort;
                        that._filter = options.filter;
                        that._skip = options.skip;
                        that._take = options.take;

                        if (that._skip === undefined) {
                            that._skip = that.skip();
                            options.skip = that.skip();
                        }

                        if (!pageMode && that._take === undefined && that._pageSize !==
                            undefined) {
                            that._take = that._pageSize;
                            options.take = that._take;
                        }

                        if (options.sort) {
                            that._sort = options.sort = normalizeSort(options.sort);
                        }

                        if (options.filter) {
                            if (!that.options.server) {
                                that._filter = options.filter = normalizeFilter(options
                                    .filter);
                            } else {
                                that._filter = normalizeFilter(options.filter);
                                delete options.filter;

                                if (that._filter) {
                                    each(that._filter.filters, function(i, item) {
                                        options[item.field] = item.value;
                                    });
                                }
                            }
                        }

                        if (pageMode) {
                            delete options.pageSize;
                            options[pageMode.page] = that._page;
                            options[pageMode.size] = that._pageSize;
                            delete options.page;
                            delete options.take;
                            delete options.skip;
                        }

                    }
                    return options;
                },

                query: function(options) {
                    var result;
                    var remote = this.options.server;

                    if (remote || ((this._data === undefined || this._data.length === 0) &&
                        !this._destroyed
                        .length)) {
                        return this.read(this._mergeState(options));
                    }

                    var isPrevented = this.trigger(REQUESTSTART, {
                        type: READ
                    });
                    if (!isPrevented) {
                        this.trigger(PROGRESS);

                        result = this._queryProcess(this._data, this._mergeState(
                            options));

                        if (!remote) {
                            if (result.total !== undefined) {
                                this._total = result.total;
                            } else {
                                this._total = this._data.length;
                            }
                        }

                        this.view(this._index(result.data));
                        this.trigger(REQUESTEND, {
                            type: READ
                        });
                        this.trigger(CHANGE, {
                            items: result.data
                        });
                    }

                    return Deferred().resolve(isPrevented).promise();
                },

                fetch: function(callback) {
                    var that = this;
                    var fn = function(isPrevented) {
                        if (isPrevented !== true && isFunction(callback)) {
                            callback.call(that);
                        }
                    };

                    return this._query().then(fn);
                },

                _query: function(options) {
                    var that = this;

                    return that.query(extend({}, {
                        page: that.page(),
                        pageSize: that.pageSize(),
                        sort: that.sort(),
                        filter: that.filter()
                    }, options));
                },

                next: function(options) {
                    var that = this,
                        page = that.page(),
                        total = that.total();

                    options = options || {};

                    if (!page || (total && page + 1 > that.totalPages())) {
                        return;
                    }

                    that._skip = page * that.take();

                    page += 1;
                    options.page = page;

                    that._query(options);

                    return page;
                },

                prev: function(options) {
                    var that = this,
                        page = that.page();

                    options = options || {};

                    if (!page || page === 1) {
                        return;
                    }

                    that._skip = that._skip - that.take();

                    page -= 1;
                    options.page = page;

                    that._query(options);

                    return page;
                },

                page: function(val) {
                    var that = this,
                        skip;

                    if (val !== undefined) {
                        if (this.options.total === false) {
                            val = math.max(val, 1);
                        } else {
                            val = math.max(math.min(math.max(val, 1), that.totalPages()),
                                1);
                        }
                        that._query({
                            page: val
                        });
                        return;
                    }
                    skip = that.skip();

                    return skip !== undefined ? math.round((skip || 0) / (that.take() ||
                            1)) + 1 :
                        undefined;
                },

                pageSize: function(val) {
                    var that = this;

                    if (val !== undefined) {
                        that._query({
                            pageSize: val,
                            page: 1
                        });
                        return;
                    }

                    return that.take();
                },

                sort: function(val) {
                    var that = this;

                    if (val !== undefined) {
                        that._query({
                            sort: val
                        });
                        return;
                    }

                    return that._sort;
                },

                filter: function(val) {
                    var that = this;

                    if (val === undefined) {
                        return that._filter;
                    }

                    // if (!isEmptyObject(val) && isPlainObject(val) && val.field === undefined && !val.logic) {
                    //     val = $.map(val, function (value, field) {
                    //         return {
                    //             field: field,
                    //             value: value
                    //         };
                    //     });
                    // }

                    that._query({
                        filter: val,
                        page: 1
                    });
                    that.trigger("reset");
                },

                total: function() {
                    return parseInt(this._total || 0, 10);
                },

                totalPages: function() {
                    var that = this,
                        pageSize = that.pageSize() || that.total();

                    return math.ceil((that.total() || 0) / pageSize);
                },

                skip: function() {
                    var that = this;

                    if (that._skip === undefined) {
                        return (that._page !== undefined ? (that._page - 1) * (that.take() ||
                                1) :
                            undefined);
                    }
                    return that._skip;
                },

                take: function() {
                    return this._take || this._pageSize;
                }
            });


            DataSource.create = function(options) {

                if (isArray(options) || options instanceof ObservableArray) {
                    options = {
                        data: options
                    };
                }

                var dataSource = options || {},
                    data = dataSource.data || [],
                    fields = dataSource.fields,
                    select = dataSource.select,
                    idx,
                    length,
                    model = {},
                    field;

                if (!data && fields && !dataSource.transport && select) {
                    data = inferSelect(select, fields);
                }

                // 自动创建Model
                if (Model && fields && !dataSource.model) {
                    for (idx = 0, length = fields.length; idx < length; idx++) {
                        field = fields[idx];
                        if (field.type) {
                            model[field.field] = field;
                        }
                    }

                    if (!isEmptyObject(model)) {
                        dataSource.model = extend(true, model, {
                            fields: model
                        });
                    }
                }

                dataSource.data = data;

                return dataSource instanceof DataSource ? dataSource : new DataSource(
                    dataSource);
            };


            var Cache = Class.extend({
                ctor: function() {
                    this._store = {};
                },
                add: function(key, data) {
                    if (key !== undefined) {
                        this._store[stringify(key)] = data;
                    }
                },
                find: function(key) {
                    return this._store[stringify(key)];
                },
                clear: function() {
                    this._store = {};
                },
                remove: function(key) {
                    delete this._store[stringify(key)];
                }
            });

            Cache.create = function(options) {
                var store = {
                    "inmemory": function() {
                        return new Cache();
                    }
                };

                if (isPlainObject(options) && isFunction(options.find)) {
                    return options;
                }

                if (options === true) {
                    return new Cache();
                }

                return store[options]();
            };


            var DataReader = Class.extend({

                ctor: function(model, modelBase, data) {
                    var that = this,
                        serializeFunction = proxy(that.serialize, that),
                        dataFunction = proxy(typeof data === STRING ? getter(data) :
                            that.data, that),
                        originalFieldNames = {},
                        getters = {},
                        serializeGetters = {},
                        fieldNames = {},
                        shouldSerialize = false,
                        dataModel,
                        fieldName;

                    that._dataAccessFunction = dataFunction;

                    if (typeof data === STRING) {
                        that[data] = getter(data);
                    }

                    if (isPlainObject(model)) {
                        dataModel = modelBase ? modelBase.define(model) : Model.define(
                            model);
                    }

                    if (!dataModel) {
                        return;
                    }

                    that.model = model = dataModel;

                    if (model.fields) {
                        each(model.fields, function(field, value) {
                            var fromName;

                            fieldName = field;

                            if (isPlainObject(value) && value.field) {
                                fieldName = value.field;
                            } else if (typeof value === STRING) {
                                fieldName = value;
                            }

                            if (isPlainObject(value) && value.from) {
                                fromName = value.from;
                            }

                            shouldSerialize = shouldSerialize || (fromName &&
                                fromName !==
                                field) || fieldName !== field;

                            getters[field] = getter(fromName || fieldName);
                            serializeGetters[field] = getter(field);
                            originalFieldNames[fromName || fieldName] = field;
                            fieldNames[field] = fromName || fieldName;
                        });

                        if (shouldSerialize) {
                            that.serialize = wrapDataAccess(serializeFunction,
                                dataModel,
                                serializeRecords, serializeGetters, originalFieldNames,
                                fieldNames);
                        }
                    }

                    that.data = wrapDataAccess(dataFunction, dataModel, convertRecords,
                        getters, originalFieldNames, fieldNames);
                },

                errors: function(data) {
                    return data ? data.errors : null;
                },

                parse: function(data) {
                    // 是否对无数据的情况进行过滤，这是一个大坑
                    if (data && data.rows && data.rows.length == 0) {
                        data.errors = EMPTY;
                    }
                    return data;
                },

                data: function(data) {
                    if (data && data.rows != undefined) {
                        return data.rows;
                    }
                    return data;
                },

                total: function(data) {
                    if (data && data.total != undefined) {
                        return data.total;
                    }
                    return data.length;
                },

                serialize: function(data) {
                    return data;
                }
            });


            var Query = Class.extend({

                ctor: function(data) {
                    this.data = data || [];
                },

                statics: {
                    normalizeFilter: normalizeFilter,

                    filterExpr: function(expression) {
                        var expressions = [],
                            fieldFunctions = [],
                            operatorFunctions = [],
                            logic = {
                                and: ' && ',
                                or: ' || '
                            },
                            idx,
                            length,
                            filter,
                            expr,
                            field,
                            operator,
                            filters = expression.filters;

                        for (idx = 0, length = filters.length; idx < length; idx++) {
                            filter = filters[idx];
                            field = filter.field;
                            operator = filter.operator;

                            if (filter.filters) {
                                expr = Query.filterExpr(filter);
                                // __o[0] -> __o[1]
                                filter = expr.expression
                                    .replace(/__o\[(\d+)\]/g, function(match, index) {
                                        index = +index;
                                        return '__o[' + (operatorFunctions.length +
                                            index) + ']';
                                    })
                                    .replace(/__f\[(\d+)\]/g, function(match, index) {
                                        index = +index;
                                        return '__f[' + (fieldFunctions.length +
                                            index) + ']';
                                    });

                                operatorFunctions.push.apply(operatorFunctions, expr.operators);
                                fieldFunctions.push.apply(fieldFunctions, expr.fields);
                            } else {
                                if (typeof field === FUNCTION) {
                                    expr = '__f[' + fieldFunctions.length + '](d)';
                                    fieldFunctions.push(field);
                                } else {
                                    expr = fly.expr(field);
                                }

                                if (typeof operator === FUNCTION) {
                                    filter = '__o[' + operatorFunctions.length + '](' +
                                        expr + ', ' + operators.quote(
                                            filter.value) + ')';
                                    operatorFunctions.push(operator);
                                } else {
                                    filter = operators[(operator || 'eq').toLowerCase()]
                                    (expr, filter.value, filter
                                        .ignoreCase !== undefined ? filter.ignoreCase :
                                        true);
                                }
                            }

                            expressions.push(filter);
                        }

                        return {
                            expression: '(' + expressions.join(logic[expression.logic]) +
                                ')',
                            fields: fieldFunctions,
                            operators: operatorFunctions
                        };
                    },

                    process: function(data, options) {
                        options = options || {};

                        var query = new Query(data),
                            sort = normalizeSort(options.sort || []),
                            total,
                            filterCallback = options.filterCallback,
                            filter = options.filter,
                            skip = options.skip,
                            take = options.take;

                        if (filter) {
                            query = query.filter(filter);

                            if (filterCallback) {
                                query = filterCallback(query);
                            }

                            total = query.toArray().length;
                        }

                        if (sort) {
                            query = query.sort(sort);
                        }

                        if (skip !== undefined && take !== undefined) {
                            query = query.range(skip, take);
                        }

                        return {
                            total: total,
                            data: query.toArray()
                        };
                    }
                },

                toArray: function() {
                    return this.data;
                },

                range: function(index, count) {
                    return new Query(this.data.slice(index, index + count));
                },

                skip: function(count) {
                    return new Query(this.data.slice(count));
                },

                take: function(count) {
                    return new Query(this.data.slice(0, count));
                },

                select: function(selector) {
                    return new Query(map(this.data, selector));
                },

                order: function(selector, dir) {
                    var sort = {
                        dir: dir
                    };

                    if (selector) {
                        if (selector.compare) {
                            sort.compare = selector.compare;
                        } else {
                            sort.field = selector;
                        }
                    }

                    return new Query(this.data.slice(0).sort(Comparer.create(sort)));
                },

                orderBy: function(selector) {
                    return this.order(selector, 'asc');
                },

                orderByDescending: function(selector) {
                    return this.order(selector, 'desc');
                },

                sort: function(field, dir, comparer) {
                    var descriptors = normalizeSort(field, dir),
                        comparers = [],
                        length = descriptors.length,
                        idx = 0;

                    comparer = comparer || Comparer;

                    if (length) {
                        for (; idx < length; idx++) {
                            comparers.push(comparer.create(descriptors[idx]));
                        }

                        return this.orderBy({
                            compare: comparer.combine(comparers)
                        });
                    }

                    return this;
                },

                filter: function(expressions) {
                    var idx,
                        current,
                        length,
                        compiled,
                        predicate,
                        data = this.data,
                        fields,
                        operators,
                        result = [],
                        filter;

                    expressions = normalizeFilter(expressions);

                    if (!expressions || expressions.filters.length === 0) {
                        return this;
                    }

                    compiled = Query.filterExpr(expressions);
                    fields = compiled.fields;
                    operators = compiled.operators;

                    predicate = filter = new Function('d, __f, __o', 'return ' +
                        compiled.expression);

                    if (fields.length || operators.length) {
                        filter = function(d) {
                            return predicate(d, fields, operators);
                        };
                    }


                    for (idx = 0, length = data.length; idx < length; idx++) {
                        current = data[idx];

                        if (filter(current)) {
                            result.push(current);
                        }
                    }

                    return new Query(result);
                }

            });

            var Transport = {
                create: function(options, dataSource) {
                    var transport,
                        currentTransport = options.transport,
                        read = options.read;

                    if (read) {
                        transport = isFunction(currentTransport) ? currentTransport : new RemoteTransport({
                            read: read,
                            dataSource: dataSource
                        });
                    } else {
                        transport = new LocalTransport({
                            data: options.data || []
                        });
                    }

                    return transport;
                }
            };


            var LocalTransport = Class.extend({
                ctor: function(options) {
                    this.data = options.data;
                },
                read: function(options) {
                    var data = [];
                    if (options.take && options.skip) {
                        for (var i = 0; i < options.take; i++) {
                            data.push(this.data[options.skip + i]);
                        }
                    } else {
                        data = this.data;
                    }
                    options.success(data);
                },
                update: function(options) {
                    options.success(options.data);
                },
                create: function(options) {
                    options.success(options.data);
                },
                destroy: function(options) {
                    options.success(options.data);
                }
            });

            var RemoteTransport = Class.extend({

                ctor: function(options) {
                    var that = this,
                        parameterMap;

                    options = that.options = extend({}, that.options, options);

                    each(CRUD, function(index, type) {
                        if (typeof options[type] === STRING) {
                            options[type] = {
                                url: options[type]
                            };
                        }
                    });

                    that.cache = options.cache ? Cache.create(options.cache) : {
                        find: noop,
                        add: noop
                    };

                    parameterMap = options.parameterMap;

                    if (isFunction(options.push)) {
                        that.push = options.push;
                    }

                    if (!that.push) {
                        that.push = identity;
                    }

                    that.parameterMap = isFunction(parameterMap) ? parameterMap :
                        function(options) {
                            var result = {};

                            each(options, function(option, value) {
                                if (option in parameterMap) {
                                    option = parameterMap[option];
                                    if (isPlainObject(option)) {
                                        value = option.value(value);
                                        option = option.key;
                                    }
                                }

                                result[option] = value;
                            });

                            return result;
                    };
                },

                options: {
                    parameterMap: identity
                },

                create: function(options) {
                    return ajax(this.setup(options, CREATE));
                },

                read: function(options) {
                    var that = this,
                        success,
                        error,
                        result,
                        cache = that.cache;

                    options = that.setup(options, READ);
                    success = options.success || noop;
                    error = options.error || noop;
                    result = cache.find(options.data);

                    if (result !== undefined) {
                        success(result);
                    } else {
                        options.success = function(result) {
                            cache.add(options.data, result);
                            success(result);
                        };

                        ajax(options);
                    }
                },

                update: function(options) {
                    return ajax(this.setup(options, UPDATE));
                },

                destroy: function(options) {
                    return ajax(this.setup(options, DESTROY));
                },

                setup: function(options, type) {
                    options = options || {};

                    var that = this,
                        parameters,
                        operation = that.options[type],
                        data = isFunction(operation.data) ? operation.data(options.data) :
                        operation.data;

                    options = extend(true, {}, operation, options);
                    parameters = extend(true, {}, data, options.data);

                    options.data = that.parameterMap(parameters, type);

                    if (isFunction(options.url)) {
                        options.url = options.url(parameters);
                    }

                    return options;
                }
            });


            /**
             * 将数据转化为带有index的JSON Object
             * @param   {Array}  array 需要格式化的数组
             * @returns {Object} JSON
             */
            function toJSON(array) {
                var idx, length = array.length,
                    result = new Array(length);

                for (idx = 0; idx < length; idx++) {
                    result[idx] = format.toJSON(array[idx]);
                }

                return result;
            }

            function normalizeSort(field, dir) {
                if (field) {
                    var descriptor = typeof field === STRING ? {
                            field: field,
                            dir: dir
                        } : field,
                        descriptors = isArray(descriptor) ?
                        descriptor :
                        (descriptor !== undefined ? [descriptor] : []);

                    return grep(descriptors, function(d) {                        
                        return !!d.dir;
                    });
                }
            }

            function normalizeOperator(expression) {
                var idx,
                    length,
                    filter,
                    operator,
                    filters = expression.filters;

                if (filters) {
                    for (idx = 0, length = filters.length; idx < length; idx++) {
                        filter = filters[idx];
                        operator = filter.operator;

                        if (operator && typeof operator === STRING) {
                            filter.operator = operatorMap[operator.toLowerCase()] || operator;
                        }

                        normalizeOperator(filter);
                    }
                }
            }

            function normalizeFilter(expression) {
                if (expression && !isEmptyObject(expression)) {
                    if (isArray(expression) || !expression.filters) {
                        expression = {
                            logic: 'and',
                            filters: isArray(expression) ? expression : [expression]
                        };
                    }

                    normalizeOperator(expression);

                    return expression;
                }
            }

            var operators = (function() {

                function quote(value) {
                    return value.replace(quoteRegExp, '\\').replace(newLineRegExp, '');
                }

                function operator(op, a, b, ignore) {
                    var date;

                    if (b != null) {
                        if (typeof b === STRING) {
                            b = quote(b);
                            date = dateRegExp.exec(b);
                            if (date) {
                                b = new Date(+date[1]);
                            } else if (ignore) {
                                b = "'" + b.toLowerCase() + "'";
                                a = '(' + a + ' || "").toLowerCase()';
                            } else {
                                b = "'" + b + "'";
                            }
                        }

                        if (b.getTime) {
                            a = '(' + a + '?' + a + '.getTime():' + a + ')';
                            b = b.getTime();
                        }
                    }

                    return a + ' ' + op + ' ' + b;
                }

                return {
                    quote: function(value) {
                        if (value && value.getTime) {
                            return "new Date(" + value.getTime() + ")";
                        }

                        if (typeof value == "string") {
                            return "'" + quote(value) + "'";
                        }

                        return "" + value;
                    },
                    eq: function(a, b, ignore) {
                        return operator("==", a, b, ignore);
                    },
                    neq: function(a, b, ignore) {
                        return operator("!=", a, b, ignore);
                    },
                    gt: function(a, b, ignore) {
                        return operator(">", a, b, ignore);
                    },
                    gte: function(a, b, ignore) {
                        return operator(">=", a, b, ignore);
                    },
                    lt: function(a, b, ignore) {
                        return operator("<", a, b, ignore);
                    },
                    lte: function(a, b, ignore) {
                        return operator("<=", a, b, ignore);
                    },
                    startswith: function(a, b, ignore) {
                        if (ignore) {
                            a = "(" + a + " || '').toLowerCase()";
                            if (b) {
                                b = b.toLowerCase();
                            }
                        }

                        if (b) {
                            b = quote(b);
                        }

                        return a + ".lastIndexOf('" + b + "', 0) == 0";
                    },
                    endswith: function(a, b, ignore) {
                        if (ignore) {
                            a = "(" + a + " || '').toLowerCase()";
                            if (b) {
                                b = b.toLowerCase();
                            }
                        }

                        if (b) {
                            b = quote(b);
                        }

                        return a + ".indexOf('" + b + "', " + a + ".length - " + (b ||
                                "").length +
                            ") >= 0";
                    },
                    contains: function(a, b, ignore) {
                        if (ignore) {
                            a = "(" + a + " || '').toLowerCase()";
                            if (b) {
                                b = b.toLowerCase();
                            }
                        }

                        if (b) {
                            b = quote(b);
                        }

                        return a + ".indexOf('" + b + "') >= 0";
                    },
                    doesnotcontain: function(a, b, ignore) {
                        if (ignore) {
                            a = "(" + a + " || '').toLowerCase()";
                            if (b) {
                                b = b.toLowerCase();
                            }
                        }

                        if (b) {
                            b = quote(b);
                        }

                        return a + ".indexOf('" + b + "') == -1";
                    }
                };
            })();


            function serializeRecords(data, getters, modelInstance, originalFieldNames,
                fieldNames) {
                var record,
                    getter,
                    originalName,
                    idx,
                    length;

                for (idx = 0, length = data.length; idx < length; idx++) {
                    record = data[idx];
                    for (getter in getters) {
                        originalName = fieldNames[getter];

                        if (originalName && originalName !== getter) {
                            record[originalName] = getters[getter](record);
                            delete record[getter];
                        }
                    }
                }
            }

            function convertRecords(data, getters, modelInstance, originalFieldNames,
                fieldNames) {
                var record,
                    getter,
                    originalName,
                    idx,
                    length;

                for (idx = 0, length = data.length; idx < length; idx++) {
                    record = data[idx];
                    for (getter in getters) {
                        record[getter] = modelInstance._parse(getter, getters[getter](record));

                        originalName = fieldNames[getter];
                        if (originalName && originalName !== getter) {
                            delete record[originalName];
                        }
                    }
                }
            }

            function wrapDataAccess(originalFunction, model, converter, getters,
                originalFieldNames, fieldNames) {
                return function(data) {
                    data = originalFunction(data);

                    if (data && !isEmptyObject(getters)) {
                        if (toString.call(data) !== ARR && !(data instanceof ObservableArray)) {
                            data = [data];
                        }

                        converter(data, getters, new model(), originalFieldNames,
                            fieldNames);
                    }

                    return data || [];
                };
            }


            function replaceInRanges(ranges, data, item, observable) {
                for (var idx = 0; idx < ranges.length; idx++) {
                    if (ranges[idx].data === data) {
                        break;
                    }
                    if (replaceInRange(ranges[idx].data, item, observable)) {
                        break;
                    }
                }
            }

            function replaceInRange(items, item, observable) {
                for (var idx = 0, length = items.length; idx < length; idx++) {
                    if (items[idx] === item || items[idx] === observable) {
                        items[idx] = observable;
                        return true;
                    }
                }
            }

            function replaceWithObservable(view, data, ranges, type) {
                for (var viewIndex = 0, length = view.length; viewIndex < length; viewIndex++) {
                    var item = view[viewIndex];

                    if (!item || item instanceof type) {
                        continue;
                    }

                    for (var idx = 0; idx < data.length; idx++) {
                        if (data[idx] === item) {
                            view[viewIndex] = data.at(idx);
                            replaceInRanges(ranges, data, item, view[viewIndex]);
                            break;
                        }
                    }
                }
            }

            function removeModel(data, model) {
                var idx, length;

                for (idx = 0, length = data.length; idx < length; idx++) {
                    var dataItem = data.at(idx);
                    if (dataItem.uid == model.uid) {
                        data.splice(idx, 1);
                        return dataItem;
                    }
                }
            }


            function indexOfPristineModel(data, model) {
                if (model) {
                    return indexOf(data, function(item) {
                        if (item.uid) {
                            return item.uid == model.uid;
                        }

                        return item[model.idField] === model.id;
                    });
                }
                return -1;
            }

            function indexOfModel(data, model) {
                if (model) {
                    return indexOf(data, function(item) {
                        return item.uid == model.uid;
                    });
                }
                return -1;
            }

            function indexOf(data, comparer) {
                var idx, length;

                for (idx = 0, length = data.length; idx < length; idx++) {
                    if (comparer(data[idx])) {
                        return idx;
                    }
                }

                return -1;
            }

            function inferSelect(select, fields) {
                var options = $(select)[0].children,
                    idx,
                    length,
                    data = [],
                    record,
                    firstField = fields[0],
                    secondField = fields[1],
                    value,
                    option;

                for (idx = 0, length = options.length; idx < length; idx++) {
                    record = {};
                    option = options[idx];

                    if (option.disabled) {
                        continue;
                    }

                    record[firstField.field] = option.text;

                    value = option.attributes.value;

                    if (value && value.specified) {
                        value = option.value;
                    } else {
                        value = option.text;
                    }

                    record[secondField.field] = value;

                    data.push(record);
                }

                return data;
            }

            var Comparer = {

                selector: function(field) {
                    return isFunction(field) ? field : getter(field);
                },

                compare: function(field) {

                    var selector = this.selector(field);
                    return function(a, b) {

                        a = selector(a);
                        b = selector(b);

                        if (a == null && b == null) {
                            return 0;
                        }

                        if (a == null) {
                            return -1;
                        }

                        if (b == null) {
                            return 1;
                        }

                        if (a.localeCompare) {
                            return a.localeCompare(b);
                        }

                        return a > b ? 1 : (a < b ? -1 : 0);
                    };
                },

                create: function(sort) {
                    var compare = sort.compare || this.compare(sort.field);

                    if (sort.dir == "desc") {
                        return function(a, b) {
                            return compare(b, a, true);
                        };
                    }

                    return compare;
                },

                combine: function(comparers) {
                    return function(a, b) {
                        var result = comparers[0](a, b),
                            idx,
                            length;

                        for (idx = 1, length = comparers.length; idx < length; idx++) {
                            result = result || comparers[idx](a, b);
                        }

                        return result;
                    };
                }
            };

            fly.data = fly.dataSource = function(object) {
                if (!(object instanceof DataSource)) {
                    object = new DataSource(object);
                }
                return object;
            };


            fly.DataSource = DataSource;
            module.exports = DataSource;
        }, {
            "./fly.ajax": 1,
            "./fly.core": 4,
            "./fly.format": 6,
            "./fly.model": 9,
            "./fly.observable": 11
        }
    ],
    6: [
        function(require, module, exports) {
            /**
             * 格式转换
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-06-06
             */

            'use strict';

            // 依赖core
            var fly = require('./fly.core');

            var $ = fly.$;

            // 类型检测
            var objectToString = {}.toString;

            // 纯数字
            var numberRegExp = /^\d*$/;

            // 特殊字符
            var escapeableRegExp = /["\\\x00-\x1f\x7f-\x9f]/g;

            var _meta = {
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"': '\\"',
                '\\': '\\\\'
            };

            /**
             * 时间格式化
             * @param   {Object} date   Date
             * @param   {String} format 格式化参数
             * @returns {String} 格式化Date
             */
            var formatDate = function(date, format) {
                var regExps = {
                    'M+': date.getMonth() + 1,
                    'd+': date.getDate(),
                    'H+': date.getHours(),
                    'm+': date.getMinutes(),
                    's+': date.getSeconds(),
                    'q+': Math.floor((date.getMonth() + 3) / 3),
                    'S': date.getMilliseconds()
                };

                if (/(y+)/.test(format)) {
                    format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 -
                        RegExp.$1.length));
                }

                for (var reg in regExps) {
                    var regExp = new RegExp('(' + reg + ')'),
                        temp = regExps[reg] + '',
                        real;
                    if (regExp.test(format)) {
                        real = RegExp.$1.length == 1 ? temp : ('00' + temp).substr(temp.length);
                        format = format.replace(RegExp.$1, real);
                    }
                }

                return format;
            };

            /**
             * 将字符串转为日期
             * @param   {String} value   需要格式化的时间字符串 或者 Date
             * @param   {String} formats 格式
             * @returns {String} 格式化后的时间
             */
            fly.formatDate = function(value, format) {

                // 标准转换格式
                var stand = 'yyyy/MM/dd HH:mm:ss',
                    now = new Date(),
                    idx = 0,
                    date,
                    length,
                    reg;

                // 匹配格式库
                var formats = [
                    'yyyyMMddHHmmss',
                    'yyyyMMddHHmm',
                    'yyyyMMdd',
                    'yyyy-MM-dd HH:mm:ss',
                    'yyyy-MM-dd HH:mm',
                    'yyyy-MM-dd',
                    'HHmmss',
                    'HH:mm:ss'
                ];

                var regExps = {
                    'y+': now.getFullYear(),
                    'M+': now.getMonth() + 1,
                    'd+': now.getDate(),
                    'H+': 0,
                    'm+': 0,
                    's+': 0
                };

                // 如果是日期，则直接返回
                if (objectToString.call(value) === '[object Date]') {
                    date = value;
                } else if (value) {
                    for (length = formats.length; idx < length; idx++) {
                        var newData = stand,
                            newFormat = formats[idx];

                        if (newFormat.length != value.length) {
                            continue;
                        }

                        for (reg in regExps) {
                            var regExp = new RegExp('(' + reg + ')'),
                                index = newFormat.search(regExp),
                                temp = '';
                            if (index >= 0) {
                                temp = value.substr(index, RegExp.$1.length);
                                if (!numberRegExp.test(temp)) {
                                    break;
                                }
                            } else {
                                temp = regExps[reg] + '';
                            }
                            temp = temp.length == 1 ? '0' + temp : temp;
                            newData = newData.replace(regExp, temp);
                        }

                        try {
                            date = new Date(newData);
                            if (!date.getTime()) {
                                continue;
                            }
                            break;
                        } catch (e) {
                            continue;
                        }
                    }
                }

                // 如果存在格式化
                value = !(date && date.getTime && date.getTime()) ? value : date;
                if (format) {
                    return formatDate(value, format);
                } else {
                    return value;
                }
            };

            /**
             * 将目标转为JSON
             * @param   {Object} o 需要转换的目标
             * @returns {String} JSON
             */
            fly.toJSON = function(o) {
                if (typeof(JSON) == 'object' && JSON.stringify) {
                    var json = JSON.stringify(o);
                    return json;
                }
                var type = typeof(o);

                if (o === null)
                    return 'null';

                if (type == 'undefined')
                    return undefined;

                if (type == 'number' || type == 'boolean')
                    return o + '';

                if (type == 'string')
                    return fly.quoteString(o);

                if (type == 'object') {
                    if (typeof o.toJSON == 'function')
                        return fly.toJSON(o.toJSON());

                    if (o.constructor === Date) {
                        return formatDate(o, 'yyyy-MM-ddTHH:mm:ss.SZ');
                    }

                    if (o.constructor === Array) {
                        var ret = [];
                        for (var i = 0; i < o.length; i++)
                            ret.push(fly.toJSON(o[i]) || '');

                        return '[' + ret.join(',') + ']';
                    }

                    var pairs = [];
                    for (var k in o) {
                        var name;
                        var type = typeof k;

                        if (type == 'number')
                            name = '"' + k + '"';
                        else if (type == 'string')
                            name = fly.quoteString(k);
                        else
                            continue; //skip non-string or number keys

                        if (typeof o[k] == 'function')
                            continue; //skip pairs where the value is a function.

                        var val = fly.toJSON(o[k]);

                        pairs.push(name + ':' + val);
                    }

                    return '{' + pairs.join(', ') + '}';
                }
            };

            /**
             * 将JSON还原
             * @param   {String} src JSON字符串
             * @returns {Object}   [[Description]]
             */
            fly.evalJSON = function(src) {
                if (!src) {
                    return {};
                }
                if (typeof(src) !== 'string') {
                    return src;
                }
                if (typeof(JSON) === 'object' && JSON.parse && !fly.support.browser.ie) {
                    return JSON.parse(src);
                }
                return eval('(' + src + ')');
            };

            /**
             * 安全还原JSON
             * @param   {String} src JSON字符串
             * @returns {[[Type]]} [[Description]]
             */
            fly.secureEvalJSON = function(src) {
                if (typeof(JSON) == 'object' && JSON.parse) {
                    return JSON.parse(src);
                }

                var filtered = src;
                filtered = filtered.replace(/\\["\\\/bfnrtu]/g, '@');
                filtered = filtered.replace(
                    /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
                filtered = filtered.replace(/(?:^|:|,)(?:\s*\[)+/g, '');

                if (/^[\],:{}\s]*$/.test(filtered))
                    return eval('(' + src + ')');
                else
                    throw new SyntaxError('Error parsing JSON, source is not valid.');
            };

            /**
             * 处理字符串中的引号
             * @param   {String} string [[Description]]
             * @returns {String} [[Description]]
             */
            fly.quoteString = function(string) {
                if (string.match(escapeableRegExp)) {
                    return '"' + string.replace(escapeableRegExp, function(a) {
                        var c = _meta[a];
                        if (typeof c === 'string') return c;
                        c = a.charCodeAt();
                        return '\\u00' + Math.floor(c / 16).toString(
                            16) + (c % 16).toString(16);
                    }) + '"';
                }
                return '"' + string + '"';
            };

            /**
             * 字符格式化
             * @param   {String}   source 源字符串
             * @param   {Array}    params 格式化数据
             * @returns {String} 格式化后的字符串
             */
            var format = fly.format = function(source, params) {
                if (arguments.length == 1)
                    return function() {
                        var args = $.makeArray(arguments);
                        args.unshift(source);
                        return format.format.apply(this, args);
                    };
                if (arguments.length > 2 && params.constructor != Array) {
                    params = $.makeArray(arguments).slice(1);
                }
                if (params.constructor != Array) {
                    params = [params];
                }
                $.each(params, function(i, n) {
                    source = source.replace(new RegExp('\\{' + i + '\\}', 'g'), n);
                });
                return source;
            };

            module.exports = format;
        }, {
            "./fly.core": 4
        }
    ],
    7: [
        function(require, module, exports) {
            /**
             * 简化jQuery
             * from jQuery.js
             * @update: 2016-02-01 15:20
             */

            'use strict';

            var jQuery = null,
                arr = [],
                class2type = {},
                rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
                indexOf = arr.indexOf,
                slice = arr.slice,
                push = arr.push,
                concat = arr.concat,
                toString = {}.toString,
                hasOwn = {}.hasOwnProperty;

            jQuery = function(context) {
                return new jQuery.fn.init(context);
            }

            if (!indexOf) {
                indexOf = function(searchElement, fromIndex) {
                    var index = -1;
                    fromIndex = fromIndex * 1 || 0;
                    for (var k = 0, length = this.length; k < length; k++) {
                        if (k >= fromIndex && this[k] === searchElement) {
                            index = k;
                            break;
                        }
                    }
                    return index;
                };
            }

            jQuery.fn = jQuery.prototype = {

                constructor: jQuery,

                length: 0,

                pushStack: function(elems) {
                    var ret = jQuery.merge(this.constructor(), elems);
                    ret.prevObject = this;
                    return ret;
                },

                each: function(callback) {
                    return jQuery.each(this, callback);
                },

                map: function(callback) {
                    return this.pushStack(jQuery.map(this, function(elem, i) {
                        return callback.call(elem, i, elem);
                    }));
                },

                slice: function() {
                    return this.pushStack(slice.apply(this, arguments));
                },

                eq: function(i) {
                    var len = this.length,
                        j = +i + (i < 0 ? len : 0);
                    return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
                },

                end: function() {
                    return this.prevObject || this.constructor();
                },

                push: arr.push,
                sort: arr.sort,
                splice: arr.splice
            };

            jQuery.fn.init = function(context) {
                return jQuery.parseHTML(context, document);
            };

            jQuery.extend = function() {
                var options, name, src, copy, copyIsArray, clone,
                    target = arguments[0] || {},
                    i = 1,
                    length = arguments.length,
                    deep = false;

                if (typeof target === "boolean") {
                    deep = target;
                    target = arguments[i] || {};
                    i++;
                }

                if (typeof target !== "object" && !jQuery.isFunction(target)) {
                    target = {};
                }

                if (i === length) {
                    target = this;
                    i--;
                }

                for (; i < length; i++) {
                    if ((options = arguments[i]) != null) {
                        for (name in options) {
                            src = target[name];
                            copy = options[name];
                            if (target === copy) {
                                continue;
                            }

                            if (deep && copy && (jQuery.isPlainObject(copy) ||
                                (copyIsArray = jQuery.isArray(copy)))) {

                                if (copyIsArray) {
                                    copyIsArray = false;
                                    clone = src && jQuery.isArray(src) ? src : [];
                                } else {
                                    clone = src && jQuery.isPlainObject(src) ? src : {};
                                }

                                target[name] = jQuery.extend(deep, clone, copy);

                            } else if (copy !== undefined) {
                                target[name] = copy;
                            }
                        }
                    }
                }

                return target;
            };

            jQuery.extend({

                noop: function() {},

                isFunction: function(obj) {
                    return jQuery.type(obj) === "function";
                },

                isArray: Array.isArray || function(obj) {
                    return jQuery.type(obj) === "array";
                },

                isWindow: function(obj) {
                    return obj != null && obj === obj.window;
                },

                isNumeric: function(obj) {
                    var type = jQuery.type(obj);
                    return (type === "number" || type === "string") &&
                        !isNaN(obj - parseFloat(obj));
                },

                isPlainObject: function(obj) {
                    if (jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow(
                        obj)) {
                        return false;
                    }

                    if (obj.constructor &&
                        !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                        return false;
                    }

                    return true;
                },

                isEmptyObject: function(obj) {
                    var name;
                    for (name in obj) {
                        return false;
                    }
                    return true;
                },

                type: function(obj) {
                    if (obj == null) {
                        return obj + "";
                    }

                    return typeof obj === "object" || typeof obj === "function" ?
                        class2type[toString.call(obj)] || "object" :
                        typeof obj;
                },

                nodeName: function(elem, name) {
                    return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
                },

                each: function(obj, callback) {
                    var length, i = 0;

                    if (isArrayLike(obj)) {
                        length = obj.length;
                        for (; i < length; i++) {
                            if (callback.call(obj[i], i, obj[i]) === false) {
                                break;
                            }
                        }
                    } else {
                        for (i in obj) {
                            if (callback.call(obj[i], i, obj[i]) === false) {
                                break;
                            }
                        }
                    }

                    return obj;
                },

                trim: function(text) {
                    return text == null ?
                        "" :
                        (text + "").replace(rtrim, "");
                },

                makeArray: function(arr, results) {
                    var ret = results || [];

                    if (arr != null) {
                        if (isArrayLike(Object(arr))) {
                            jQuery.merge(ret,
                                typeof arr === "string" ? [arr] : arr
                            );
                        } else {
                            push.call(ret, arr);
                        }
                    }

                    return ret;
                },

                inArray: function(elem, arr, i) {
                    return arr == null ? -1 : indexOf.call(arr, elem, i);
                },

                merge: function(first, second) {
                    var len = +second.length,
                        j = 0,
                        i = first.length;

                    for (; j < len; j++) {
                        first[i++] = second[j];
                    }

                    first.length = i;

                    return first;
                },

                grep: function(elems, callback, invert) {
                    var callbackInverse,
                        matches = [],
                        i = 0,
                        length = elems.length,
                        callbackExpect = !invert;

                    for (; i < length; i++) {
                        callbackInverse = !callback(elems[i], i);
                        if (callbackInverse !== callbackExpect) {
                            matches.push(elems[i]);
                        }
                    }

                    return matches;
                },

                map: function(elems, callback, arg) {
                    var length, value,
                        i = 0,
                        ret = [];

                    if (isArrayLike(elems)) {
                        length = elems.length;
                        for (; i < length; i++) {
                            value = callback(elems[i], i, arg);

                            if (value != null) {
                                ret.push(value);
                            }
                        }

                    } else {
                        for (i in elems) {
                            value = callback(elems[i], i, arg);

                            if (value != null) {
                                ret.push(value);
                            }
                        }
                    }

                    return concat.apply([], ret);
                },

                guid: 1,

                proxy: function(fn, context) {
                    var tmp, args, proxy;

                    if (typeof context === "string") {
                        tmp = fn[context];
                        context = fn;
                        fn = tmp;
                    }

                    if (!jQuery.isFunction(fn)) {
                        return undefined;
                    }

                    args = slice.call(arguments, 2);
                    proxy = function() {
                        return fn.apply(context || this, args.concat(slice.call(arguments)));
                    };

                    proxy.guid = fn.guid = fn.guid || jQuery.guid++;

                    return proxy;
                },

                htmlPrefilter: function(html) {
                    return html.replace(rxhtmlTag, "<$1></$2>");
                },

                trigger: function(element, eventType, eventData) {
                    element.dispatchEvent(new CustomEvent(eventType, {
                        detail: eventData,
                        bubbles: true,
                        cancelable: true
                    }));
                    return this;
                },

                support: {}
            });

            var rxhtmlTag =
                /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,
                rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;

            var createHTMLDocument = (function() {
                var body;

                if (!document.implementation.createHTMLDocument) return false;

                body = document.implementation.createHTMLDocument("").body;
                body.innerHTML = "<form></form><form></form>";
                return body.childNodes.length === 2;
            })();

            jQuery.parseHTML = function(data) {

                // Stop scripts or inline event handlers from being executed immediately
                // by using document.implementation
                var context = createHTMLDocument ?
                    document.implementation.createHTMLDocument("") :
                    document;

                var parsed = rsingleTag.exec(data);

                // Single tag
                if (parsed) {
                    return [context.createElement(parsed[1])];
                }

                parsed = buildFragment([data], context);

                return jQuery.merge([], parsed.childNodes);
            };

            jQuery.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(
                    " "),
                function(i, name) {
                    class2type["[object " + name + "]"] = name.toLowerCase();
                });

            function isArrayLike(obj) {
                var length = !!obj && "length" in obj && obj.length,
                    type = jQuery.type(obj);

                if (type === "function") {
                    return false;
                }

                return type === "array" || length === 0 ||
                    typeof length === "number" && length > 0 && (length - 1) in obj;
            }

            var rhtml = /<|&#?\w+;/,
                rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]+)/i,
                rscriptType = /^$|\/(?:java|ecma)script/i;

            var wrapMap = {

                // Support: IE9
                option: [1, "<select multiple='multiple'>", "</select>"],

                // XHTML parsers do not magically insert elements in the
                // same way that tag soup parsers do. So we cannot shorten
                // this by omitting <tbody> or other required elements.
                thead: [1, "<table>", "</table>"],
                col: [2, "<table><colgroup>", "</colgroup></table>"],
                tr: [2, "<table><tbody>", "</tbody></table>"],
                td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],

                _default: [0, "", ""]
            };

            // Support: IE9
            wrapMap.optgroup = wrapMap.option;

            wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
            wrapMap.th = wrapMap.td;

            function buildFragment(elems, context) {
                var elem, tmp, tag, wrap, contains, j,
                    fragment = context.createDocumentFragment(),
                    nodes = [],
                    i = 0,
                    l = elems.length;

                for (; i < l; i++) {
                    elem = elems[i];

                    if (elem || elem === 0) {

                        // Add nodes directly
                        if (jQuery.type(elem) === "object") {

                            // Support: Android<4.1, PhantomJS<2
                            // push.apply(_, arraylike) throws on ancient WebKit
                            jQuery.merge(nodes, elem.nodeType ? [elem] : elem);

                            // Convert non-html into a text node
                        } else if (!rhtml.test(elem)) {
                            nodes.push(context.createTextNode(elem));

                            // Convert html into DOM nodes
                        } else {
                            tmp = tmp || fragment.appendChild(context.createElement("div"));

                            // Deserialize a standard representation
                            tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
                            wrap = wrapMap[tag] || wrapMap._default;
                            tmp.innerHTML = wrap[1] + jQuery.htmlPrefilter(elem) + wrap[2];

                            // Descend through wrappers to the right content
                            j = wrap[0];
                            while (j--) {
                                tmp = tmp.lastChild;
                            }

                            // Support: Android<4.1, PhantomJS<2
                            // push.apply(_, arraylike) throws on ancient WebKit
                            jQuery.merge(nodes, tmp.childNodes);

                            // Remember the top-level container
                            tmp = fragment.firstChild;

                            // Ensure the created nodes are orphaned (#12392)
                            tmp.textContent = "";
                        }
                    }
                }

                // Remove wrapper from fragment
                // fragment.textContent = "";
                fragment = context.createDocumentFragment();

                i = 0;
                while ((elem = nodes[i++])) {

                    // Append to fragment
                    fragment.appendChild(elem);

                }

                return fragment;
            }

            module.exports = jQuery;
        }, {}
    ],
    8: [
        function(require, module, exports) {
            var fly = require('./fly.core');
            require('./fly.ajax');
            require('./fly.binder');
            require('./fly.component');
            require('./fly.data');
            require('./fly.format');
            require('./fly.jquery');
            require('./fly.model');
            require('./fly.ndata');
            require('./fly.observable');
            require('./fly.require');
            require('./fly.router');
            require('./fly.support');
            require('./fly.template');
            require('./fly.utils');
            fly.version = '1.2.2';
            window.fly = fly;
            module.exports = fly;
        }, {
            "./fly.ajax": 1,
            "./fly.binder": 2,
            "./fly.component": 3,
            "./fly.core": 4,
            "./fly.data": 5,
            "./fly.format": 6,
            "./fly.jquery": 7,
            "./fly.model": 9,
            "./fly.ndata": 10,
            "./fly.observable": 11,
            "./fly.require": 12,
            "./fly.router": 13,
            "./fly.support": 14,
            "./fly.template": 15,
            "./fly.utils": 16
        }
    ],
    9: [
        function(require, module, exports) {
            /**
             * 数据模型
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-06
             */

            'use strict';

            // 依赖
            var fly = require('./fly.core'),
                ob = require('./fly.observable'),
                format = require('./fly.format'),
                ObservableObject = fly.ObservableObject,
                $ = fly.$,
                extend = $.extend,
                isArray = $.isArray,
                isEmptyObject = $.isEmptyObject,
                isPlainObject = $.isPlainObject;

            // 静态变量
            var STRING = 'string';

            function getFieldByName(obj, name) {
                var field,
                    fieldName;

                for (fieldName in obj) {
                    field = obj[fieldName];
                    if (isPlainObject(field) && field.field && field.field === name) {
                        return field;
                    } else if (field === name) {
                        return field;
                    }
                }
                return null;
            }

            function equal(x, y) {
                if (x === y) {
                    return true;
                }

                var xtype = $.type(x),
                    ytype = $.type(y),
                    field;

                if (xtype !== ytype) {
                    return false;
                }

                if (xtype === "date") {
                    return x.getTime() === y.getTime();
                }

                if (xtype !== "object" && xtype !== "array") {
                    return false;
                }

                for (field in x) {
                    if (!equal(x[field], y[field])) {
                        return false;
                    }
                }

                return true;
            }

            var parsers = {

                "number": function(value) {
                    return parseFloat(value);
                },

                "date": function(value) {
                    return format.parseDate(value);
                },

                "boolean": function(value) {
                    if (typeof value === STRING) {
                        return value.toLowerCase() === "true";
                    }
                    return value != null ? !!value : value;
                },

                "string": function(value) {
                    return value != null ? (value + "") : value;
                },

                "default": function(value) {
                    return value;
                }
            };

            var defaultValues = {
                "string": "",
                "number": 0,
                "date": new Date(),
                "boolean": false,
                "default": ""
            };

            var Model = ObservableObject.extend({

                ctor: function(data) {
                    var that = this,
                        initializers = that._initializers;

                    if (!data || isEmptyObject(data)) {
                        data = extend({}, that.defaults, data);

                        if (initializers) {
                            for (var idx = 0; idx < initializers.length; idx++) {
                                var name = initializers[idx];
                                data[name] = that.defaults[name]();
                            }
                        }
                    }

                    that._super(data);

                    that.dirty = false;

                    if (that.idField) {
                        that.id = that.get(that.idField);

                        if (that.id === undefined) {
                            that.id = that._defaultId;
                        }
                    }
                },

                shouldSerialize: function(field) {
                    return this._super(field) &&
                        field !== "uid" &&
                        !(this.idField !== "id" && field === "id") &&
                        field !== "dirty" &&
                        field !== "_accessors";
                },

                _parse: function(field, value) {
                    var that = this,
                        fieldName = field,
                        fields = (that.fields || {}),
                        parse;

                    field = fields[field];
                    if (!field) {
                        field = getFieldByName(fields, fieldName);
                    }
                    if (field) {
                        parse = field.parse;
                        if (!parse && field.type) {
                            parse = parsers[field.type.toLowerCase()];
                        }
                    }

                    return parse ? parse(value) : value;
                },

                _notifyChange: function(e) {
                    var action = e.action;

                    if (action == 'add' || action == 'remove') {
                        this.dirty = true;
                    }
                },

                editable: function(field) {
                    field = (this.fields || {})[field];
                    return field ? field.editable !== false : true;
                },

                set: function(field, value, initiator) {
                    var that = this;

                    if (that.editable(field)) {
                        value = that._parse(field, value);

                        if (!equal(value, that.get(field))) {
                            that.dirty = true;
                            ObservableObject.fn.set.call(this, field, value, initiator);
                        }
                    }
                },

                accept: function(data) {
                    var that = this,
                        parent = function() {
                            return that;
                        },
                        field;

                    for (field in data) {
                        var value = data[field];

                        if (field.charAt(0) != "_") {
                            value = that.wrap(data[field], field, parent);
                        }

                        that._set(field, value);
                    }

                    if (that.idField) {
                        that.id = that.get(that.idField);
                    }

                    that.dirty = false;
                },

                isNew: function() {
                    return this.id === this._defaultId;
                }
            });

            Model.define = function(base, options) {

                if (options === undefined) {
                    options = base;
                    base = Model;
                }

                var model,
                    proto = extend({
                        defaults: {}
                    }, options),
                    name,
                    field,
                    type,
                    value,
                    idx,
                    length,
                    fields = {},
                    originalName,
                    id = proto.id,
                    functionFields = [];

                if (id) {
                    proto.idField = id;
                }

                if (proto.id) {
                    delete proto.id;
                }

                if (id) {
                    proto.defaults[id] = proto._defaultId = "";
                }

                if (isArray(proto.fields)) {
                    for (idx = 0, length = proto.fields.length; idx < length; idx++) {
                        field = proto.fields[idx];
                        if (typeof field === STRING) {
                            fields[field] = {};
                        } else if (field.field) {
                            fields[field.field] = field;
                        }
                    }
                    proto.fields = fields;
                }

                for (name in proto.fields) {
                    field = proto.fields[name];
                    type = field.type || "default";
                    value = null;
                    originalName = name;

                    name = typeof(field.field) === STRING ? field.field : name;

                    if (!field.nullable) {
                        value = proto.defaults[originalName !== name ? originalName : name] =
                            field.defaultValue !==
                            undefined ? field.defaultValue : defaultValues[type.toLowerCase()];

                        if (typeof value === "function") {
                            functionFields.push(name);
                        }
                    }

                    if (options.id === name) {
                        proto._defaultId = value;
                    }

                    proto.defaults[originalName !== name ? originalName : name] = value;

                    field.parse = field.parse || parsers[type];
                }

                if (functionFields.length > 0) {
                    proto._initializers = functionFields;
                }

                model = base.extend(proto);
                model.define = function(options) {
                    return Model.define(model, options);
                };

                if (proto.fields) {
                    model.fields = proto.fields;
                    model.idField = proto.idField;
                }

                return model;
            };

            fly.Model = Model;
            module.exports = Model;

        }, {
            "./fly.core": 4,
            "./fly.format": 6,
            "./fly.observable": 11
        }
    ],
    10: [
        function(require, module, exports) {
            'use strict';

            var fly = require('./fly.core'),
                Model = require('./fly.model'),
                DataSource = require('./fly.data'),
                $ = fly.$,
                Deferred = $.Deferred,
                extend = $.extend,
                proxy = $.proxy,
                slice = [].slice;

            var STRING = 'string',
                CHANGE = 'change',
                ERROR = 'error';

            var NodeDataSource = DataSource.extend({

                ctor: function(options) {
                    if (!options) return;

                    var node = Node.define({
                        children: options
                    });

                    this._super(extend(true, {}, {
                        modelBase: node,
                        model: node
                    }, options));

                    this._attachBubbleHandlers();
                },

                _attachBubbleHandlers: function() {
                    var that = this;

                    that._data.bind(ERROR, function(e) {
                        that.trigger(ERROR, e);
                    });
                },

                remove: function(node) {
                    var parentNode = node.parentNode(),
                        dataSource = this,
                        result;

                    if (parentNode && parentNode._initChildren) {
                        dataSource = parentNode.children;
                    }

                    result = dataSource._super.remove(node);

                    if (parentNode && !dataSource.data().length) {
                        parentNode.hasChildren = false;
                    }

                    return result;
                },

                success: dataMethod("success"),

                data: dataMethod("data"),

                insert: function(index, model) {
                    var parentNode = this.parent();

                    if (parentNode && parentNode._initChildren) {
                        parentNode.hasChildren = true;
                        parentNode._initChildren();
                    }

                    return this._super(index, model);
                },

                get: function(value, field) {
                    var idx, length, node, data, children;

                    node = this._super(value, field);

                    if (node) {
                        return node;
                    }

                    data = this._data;

                    if (!data) {
                        return;
                    }

                    for (idx = 0, length = data.length; idx < length; idx++) {
                        children = data[idx].children;

                        if (!(children instanceof NodeDataSource)) {
                            continue;
                        }

                        node = children['get'](value, field);

                        if (node) {
                            return node;
                        }
                    }
                }
            });


            var Node = Model.define({
                idField: "id",

                ctor: function(value) {
                    if (!value) return;

                    var that = this,
                        hasChildren = that.hasChildren || value && value.hasChildren,
                        childrenField = "items",
                        childrenOptions = {};

                    if (value.children instanceof Array) {
                        value.items = value.children;
                        delete value.children;
                    }

                    that._super(value);

                    if (typeof that.children === STRING && that.children != 'children') {
                        childrenField = that.children;
                    }

                    childrenOptions = {
                        childrenField: childrenField,
                        model: {
                            hasChildren: hasChildren,
                            id: that.idField,
                            fields: that.fields
                        }
                    };

                    if (typeof that.children !== STRING) {
                        extend(childrenOptions, that.children);
                    }

                    childrenOptions.data = value;

                    if (!hasChildren) {
                        hasChildren = childrenOptions.childrenField;
                    }

                    if (typeof hasChildren === STRING) {
                        hasChildren = fly.getter(hasChildren);
                    }

                    if ($.isFunction(hasChildren)) {
                        that.hasChildren = !!hasChildren.call(that, that);
                    }

                    that._childrenOptions = childrenOptions;

                    if (that.hasChildren) {
                        that._initChildren();
                    }

                    that._loaded = !!(value && (value[childrenField] || value._loaded));
                },

                _initChildren: function() {
                    var that = this;
                    var children, transport, parameterMap;

                    if (!(that.children instanceof NodeDataSource)) {
                        children = that.children = new NodeDataSource(that._childrenOptions);

                        transport = children.transport;
                        parameterMap = transport.parameterMap;

                        transport.parameterMap = function(data, type) {
                            data[that.idField || "id"] = that.id;

                            if (parameterMap) {
                                data = parameterMap(data, type);
                            }

                            return data;
                        };

                        children.parent = function() {
                            return that;
                        };

                        children.bind(CHANGE, function(e) {
                            e.node = e.node || that;
                            that.trigger(CHANGE, e);
                        });

                        children.bind(ERROR, function(e) {
                            var collection = that.parent();

                            if (collection) {
                                e.node = e.node || that;
                                collection.trigger(ERROR, e);
                            }
                        });

                        that._updateChildrenField();
                    }
                },

                append: function(model) {
                    this._initChildren();
                    this.loaded(true);
                    this.children.add(model);
                },

                hasChildren: false,

                level: function() {
                    var parentNode = this.parentNode(),
                        level = 0;

                    while (parentNode && parentNode.parentNode) {
                        level++;
                        parentNode = parentNode.parentNode ? parentNode.parentNode() :
                            null;
                    }

                    return level;
                },

                _updateChildrenField: function() {
                    var fieldName = this._childrenOptions.childrenField;

                    this[fieldName || "items"] = this.children.data();
                },

                _childrenLoaded: function() {
                    this._loaded = true;

                    this._updateChildrenField();
                },

                load: function() {
                    var options = {};
                    var method = "_query";
                    var children, promise;

                    if (this.hasChildren) {
                        this._initChildren();

                        children = this.children;

                        options[this.idField || "id"] = this.id;

                        if (!this._loaded) {
                            children._data = undefined;
                            method = "read";
                        }

                        children.one(CHANGE, proxy(this._childrenLoaded, this));

                        promise = children[method](options);
                    } else {
                        this.loaded(true);
                    }

                    return promise || Deferred().resolve().promise();
                },

                parentNode: function() {
                    var array = this.parent();

                    return array.parent();
                },

                loaded: function(value) {
                    if (value !== undefined) {
                        this._loaded = value;
                    } else {
                        return this._loaded;
                    }
                },

                shouldSerialize: function(field) {
                    return this._super(field) &&
                        field !== "children" &&
                        field !== "_loaded" &&
                        field !== "hasChildren" &&
                        field !== "_childrenOptions";
                }
            });

            function dataMethod(name) {
                return function() {
                    var data = this._data,
                        result = DataSource.fn[name].apply(this, slice.call(arguments));

                    if (this._data != data) {
                        this._attachBubbleHandlers();
                    }

                    return result;
                };
            }

            fly.ndata = fly.nodeDataSource = function(object) {
                if (!(object instanceof NodeDataSource)) {
                    object = new NodeDataSource(object);
                }
                return object;
            };

            fly.NodeDataSource = NodeDataSource;
            module.exports = NodeDataSource;
        }, {
            "./fly.core": 4,
            "./fly.data": 5,
            "./fly.model": 9
        }
    ],
    11: [
        function(require, module, exports) {
            /**
             * 观察者对象
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-06
             */

            'use strict';

            // 依赖
            var fly = require('./fly.core'),
                Class = fly.Class,
                $ = fly.$,
                proxy = $.proxy,
                noop = $.noop;

            // 数据对象
            var data = {};
            var slice = [].slice;
            var objectToString = {}.toString;

            // 静态变量
            var FUNCTION = 'function',
                STRING = 'string',
                CHANGE = 'change',
                REMOVE = 'remove',
                ADD = 'add',
                GET = 'get',
                OBJ = '[object Object]',
                ARR = '[object Array]';

            // 观察者
            // 事件驱动模型
            var Observable = Class.extend({

                ctor: function() {
                    this._events = {};
                },

                /**
                 * 注册监听事件
                 * @param  {String}   eventName 事件名称，可以是字符串或数组
                 * @param  {Function} handlers  事件，可以是函数或函数map
                 * @param  {Boolean}  one       是否只执行一次
                 * @return {Object}   观察者对象
                 */
                bind: function(eventName, handlers, one) {
                    var that = this,
                        idx = 0,
                        idt,
                        events,
                        original,
                        handler,
                        handlersIsFunction = typeof handlers === FUNCTION,
                        eventNames = typeof eventName === STRING ? [
                            eventName
                        ] :
                        eventName,
                        length = eventNames.length;

                    if (handlers === undefined) {
                        for (idt in eventName) {
                            that.bind(idt, eventName[idt]);
                        }
                        return that;
                    }

                    for (; idx < length; idx++) {
                        eventName = eventNames[idx];

                        handler = handlersIsFunction ? handlers : handlers[
                            eventName];

                        if (handler) {
                            if (one) {
                                original = handler;
                                handler = function() {
                                    that.unbind(eventName, handler);
                                    original.apply(that, arguments);
                                };
                                handler.original = original;
                            }
                            events = that._events[eventName] = that._events[
                                eventName] || [];
                            events.push(handler);
                        }
                    }

                    return that;
                },

                /**
                 * 只执行一次的事件
                 * @param  {String}   eventName 事件名称，可以是字符串或数组
                 * @param  {Function} handlers  事件，可以是函数或函数map
                 * @return {Object}   观察者对象
                 */
                one: function(eventNames, handlers) {
                    return this.bind(eventNames, handlers, true);
                },

                /**
                 * 将事件注册到最前
                 * @param  {String}   eventName 事件名称，可以是字符串或数组
                 * @param  {Function} handlers  事件，可以是函数或函数map
                 * @return {Object}   观察者对象
                 */
                first: function(eventName, handlers) {
                    var that = this,
                        idx = 0,
                        events,
                        handler,
                        handlersIsFunction = typeof handlers === FUNCTION,
                        eventNames = typeof eventName === STRING ? [
                            eventName
                        ] :
                        eventName,
                        length = eventNames.length;

                    for (; idx < length; idx++) {
                        eventName = eventNames[idx];

                        handler = handlersIsFunction ? handlers : handlers[
                            eventName];

                        if (handler) {
                            events = that._events[eventName] = that._events[
                                eventName] || [];
                            events.unshift(handler);
                        }
                    }

                    return that;
                },

                /**
                 * 触发事件
                 * @param  {String}  eventName 事件名称
                 * @param  {Event}   e         Event对象
                 * @return {Boolean}
                 */
                trigger: function(eventName, e) {
                    var that = this,
                        events = that._events[eventName],
                        idx,
                        length;

                    if (events) {
                        e = e || {};
                        e.sender = that;
                        e._defaultPrevented = false;
                        e.preventDefault = function() {
                            this._defaultPrevented = true;
                        };
                        e.isDefaultPrevented = function() {
                            return this._defaultPrevented === true;
                        };
                        events = events.slice();

                        for (idx = 0, length = events.length; idx < length; idx++) {
                            events[idx].call(that, e);
                        }

                        return e._defaultPrevented === true;
                    }

                    return false;
                },

                /**
                 * 注销事件
                 * @param  {String}   eventName 事件名称
                 * @param  {Function} handler   事件 同一个事件名称可能有好几个事件，
                 *                              这里可以只注销其中一个
                 * @return {Object}   观察者对象
                 */
                unbind: function(eventName, handler) {
                    var that = this,
                        events = that._events[eventName],
                        idx;

                    if (eventName === undefined) {
                        that._events = {};
                    } else if (events) {
                        if (handler) {
                            for (idx = events.length - 1; idx >= 0; idx--) {
                                if (events[idx] === handler || events[idx].original ===
                                    handler) {
                                    events.splice(idx, 1);
                                }
                            }
                        } else {
                            that._events[eventName] = [];
                        }
                    }

                    return that;
                }
            });

            /** 对象监听模型 */
            var ObservableObject = Observable.extend({

                ctor: function(value) {
                    var that = this,
                        member,
                        field,
                        parent = function() {
                            return that;
                        };

                    if (value === undefined) return;

                    that._super();

                    for (field in value) {
                        member = value[field];

                        if (typeof member === "object" && member && !member.getTime &&
                            field.charAt(0) != "_") {
                            member = that.wrap(member, field, parent);
                        }

                        that[field] = member;
                    }

                    that.uid = fly.guid();
                },

                /**
                 * 是否需要序列化
                 * @param   {String}  field 字段名
                 * @returns {Boolean}
                 */
                shouldSerialize: function(field) {
                    return this.hasOwnProperty(field) && field !== "_events" &&
                        field !== "_super" && typeof this[field] !== FUNCTION &&
                        field !== "uid";
                },

                /**
                 * 遍历
                 * @param {Function} f [[Description]]
                 */
                forEach: function(f) {
                    for (var i in this) {
                        if (this.shouldSerialize(i)) {
                            f(this[i], i);
                        }
                    }
                },

                /**
                 * JSON格式化
                 * @returns {object} 返回干净的对象
                 */
                toJSON: function(keepUid) {
                    var result = {},
                        value, field;

                    for (field in this) {
                        if (this.shouldSerialize(field, keepUid)) {
                            value = this[field];

                            if (value instanceof ObservableObject || value instanceof ObservableArray) {
                                value = value.toJSON(keepUid);
                            }

                            result[field] = value;
                        }
                    }

                    return result;
                },

                get: function(field) {
                    var that = this,
                        result;

                    that.trigger(GET, {
                        field: field
                    });

                    if (field === 'this') {
                        result = that;
                    } else {
                        result = fly.getter(field, true)(that);
                    }

                    return result;
                },

                _set: function(field, value) {
                    var that = this;
                    var composite = field.indexOf(".") >= 0;

                    if (composite) {
                        var paths = field.split("."),
                            path = "";

                        while (paths.length > 1) {
                            path += paths.shift();
                            var obj = fly.getter(path, true)(that);
                            if (obj instanceof ObservableObject) {
                                obj.set(paths.join("."), value);
                                return composite;
                            }
                            path += ".";
                        }
                    }

                    fly.setter(field)(that, value);

                    return composite;
                },

                set: function(field, value) {
                    var that = this,
                        composite = field.indexOf(".") >= 0,
                        current = fly.getter(field, true)(that);

                    if (current !== value) {

                        if (!that.trigger("set", {
                            field: field,
                            value: value
                        })) {
                            if (!composite) {
                                value = that.wrap(value, field, function() {
                                    return that;
                                });
                            }
                            if (!that._set(field, value) || field.indexOf("(") >=
                                0 || field.indexOf("[") >= 0) {
                                that.trigger(CHANGE, {
                                    field: field
                                });
                            }
                        }
                    }
                },

                parent: noop,

                wrap: function(object, field, parent) {
                    var that = this,
                        type = objectToString.call(object);

                    if (object != null && (type === OBJ || type === ARR)) {
                        var isObservableArray = object instanceof ObservableArray;
                        var isDataSource = object instanceof fly.DataSource;

                        if (type === OBJ && !isDataSource && !
                            isObservableArray) {

                            if (!(object instanceof ObservableObject)) {
                                object = new ObservableObject(object);
                            }

                            if (object.parent() != parent()) {
                                object.bind(GET, eventHandler(that, GET, field,
                                    true));
                                object.bind(CHANGE, eventHandler(that, CHANGE,
                                    field, true));
                            }
                        } else if (type === ARR || isObservableArray ||
                            isDataSource) {
                            if (!isObservableArray && !isDataSource) {
                                object = new ObservableArray(object);
                            }

                            if (object.parent() != parent()) {
                                object.bind(CHANGE, eventHandler(that, CHANGE,
                                    field, false));
                            }
                        }

                        object.parent = parent;
                    }

                    return object;
                }
            });

            var ObservableArray = Observable.extend({

                ctor: function(array, type) {
                    var that = this;
                    if (!array) return;
                    that.type = type || ObservableObject;
                    that._super();
                    that.length = array.length;
                    that.wrapAll(array, that);
                },

                at: function(index) {
                    return this[index];
                },

                toJSON: function(keepUid) {
                    var idx, length = this.length,
                        value, json = new Array(length);

                    for (idx = 0; idx < length; idx++) {
                        value = this[idx];

                        if (value instanceof ObservableObject) {
                            value = value.toJSON(keepUid);
                        }

                        json[idx] = value;
                    }

                    return json;
                },

                parent: noop,

                wrapAll: function(source, target) {
                    var that = this,
                        idx,
                        length,
                        parent = function() {
                            return that;
                        };

                    target = target || [];

                    for (idx = 0, length = source.length; idx < length; idx++) {
                        target[idx] = that.wrap(source[idx], parent);
                    }

                    return target;
                },

                wrap: function(object, parent) {
                    var that = this,
                        observable;

                    if (object !== null && objectToString.call(object) === OBJ) {
                        observable = object instanceof that.type || object instanceof fly
                            .Model;

                        if (!observable) {
                            object = object instanceof ObservableObject ?
                                object.toJSON() : object;
                            object = new that.type(object);
                        }

                        object.parent = parent;

                        object.bind(CHANGE, function(e) {
                            that.trigger(CHANGE, {
                                field: e.field,
                                node: e.node,
                                index: e.index,
                                items: e.items || [this],
                                action: e.node ? (e.action ||
                                    "itemloaded") : "itemchange"
                            });
                        });
                    }

                    return object;
                },

                push: function() {
                    var index = this.length,
                        items = this.wrapAll(arguments),
                        result;

                    result = [].push.apply(this, items);

                    this.trigger(CHANGE, {
                        action: ADD,
                        index: index,
                        items: items
                    });

                    return result;
                },

                concat: function(arr) {
                    var index = this.length,
                        items = this.wrapAll(arr),
                        result;

                    result = [].push.apply(this, items);

                    this.trigger(CHANGE, {
                        action: ADD,
                        index: index,
                        items: items
                    });

                    return result;
                },

                slice: slice,

                sort: [].sort,

                join: [].join,

                pop: function() {
                    var length = this.length,
                        result = [].pop.apply(this);

                    if (length) {
                        this.trigger(CHANGE, {
                            action: REMOVE,
                            index: length - 1,
                            items: [result]
                        });
                    }

                    return result;
                },

                splice: function(index, howMany, item) {
                    var items = this.wrapAll(slice.call(arguments, 2)),
                        result, i, len;

                    result = [].splice.apply(this, [index, howMany].concat(
                        items));

                    if (result.length) {
                        this.trigger(CHANGE, {
                            action: REMOVE,
                            index: index,
                            items: result
                        });

                        for (i = 0, len = result.length; i < len; i++) {
                            if (result[i] && result[i].children) {
                                result[i].unbind(CHANGE);
                            }
                        }
                    }

                    if (item) {
                        this.trigger(CHANGE, {
                            action: ADD,
                            index: index,
                            items: items
                        });
                    }
                    return result;
                },

                shift: function() {
                    var length = this.length,
                        result = [].shift.apply(this);

                    if (length) {
                        this.trigger(CHANGE, {
                            action: REMOVE,
                            index: 0,
                            items: [result]
                        });
                    }

                    return result;
                },

                unshift: function() {
                    var items = this.wrapAll(arguments),
                        result;

                    result = [].unshift.apply(this, items);

                    this.trigger(CHANGE, {
                        action: ADD,
                        index: 0,
                        items: items
                    });

                    return result;
                },

                indexOf: function(item) {
                    var that = this,
                        idx,
                        length;

                    for (idx = 0, length = that.length; idx < length; idx++) {
                        if (that[idx] === item) {
                            return idx;
                        }
                    }
                    return -1;
                },

                forEach: function(callback) {
                    var idx = 0,
                        length = this.length;

                    for (; idx < length; idx++) {
                        callback(this[idx], idx, this);
                    }
                },

                map: function(callback) {
                    var idx = 0,
                        result = [],
                        length = this.length;

                    for (; idx < length; idx++) {
                        result[idx] = callback(this[idx], idx, this);
                    }

                    return result;
                },

                filter: function(callback) {
                    var idx = 0,
                        result = [],
                        item,
                        length = this.length;

                    for (; idx < length; idx++) {
                        item = this[idx];
                        if (callback(item, idx, this)) {
                            result[result.length] = item;
                        }
                    }

                    return result;
                },

                find: function(callback) {
                    var idx = 0,
                        item,
                        length = this.length;

                    for (; idx < length; idx++) {
                        item = this[idx];
                        if (callback(item, idx, this)) {
                            return item;
                        }
                    }
                },

                every: function(callback) {
                    var idx = 0,
                        item,
                        length = this.length;

                    for (; idx < length; idx++) {
                        item = this[idx];
                        if (!callback(item, idx, this)) {
                            return false;
                        }
                    }

                    return true;
                },

                some: function(callback) {
                    var idx = 0,
                        item,
                        length = this.length;

                    for (; idx < length; idx++) {
                        item = this[idx];
                        if (callback(item, idx, this)) {
                            return true;
                        }
                    }

                    return false;
                },

                /**
                 * 删除
                 * @param {Any} item 需要删除的项
                 */
                remove: function(item) {
                    var idx = this.indexOf(item);

                    if (idx !== -1) {
                        this.splice(idx, 1);
                    }
                },

                /**
                 * 置空
                 */
                empty: function() {
                    this.splice(0, this.length);
                }

            });

            var LazyObservableArray = ObservableArray.extend({

                ctor: function(data, type) {

                    this.type = type || ObservableObject;

                    for (var idx = 0; idx < data.length; idx++) {
                        this[idx] = data[idx];
                    }

                    this.length = idx;
                    this._parent = proxy(function() {
                        return this;
                    }, this);
                },

                at: function(index) {
                    var item = this[index];

                    if (!(item instanceof this.type)) {
                        item = this[index] = this.wrap(item, this._parent);
                    } else {
                        item.parent = this._parent;
                    }

                    return item;
                }
            });


            /**
             * 事件处理器
             * @param   {Object}   context 事件上下文
             * @param   {String}   type    事件名称
             * @param   {String}   field   字段名
             * @param   {Boolean}  prefix  是否需要预处理
             * @returns {Function} [[Description]]
             */
            function eventHandler(context, type, field, prefix) {
                return function(e) {
                    var event = {},
                        key;

                    for (key in e) {
                        event[key] = e[key];
                    }

                    if (prefix) {
                        event.field = field + '.' + e.field;
                    } else {
                        event.field = field;
                    }

                    if (type == CHANGE && context._notifyChange) {
                        context._notifyChange(event);
                    }

                    context.trigger(type, event);
                };
            }

            fly.Observable = Observable;
            fly.ObservableObject = ObservableObject;
            fly.ObservableArray = ObservableArray;
            fly.LazyObservableArray = LazyObservableArray;


            /**
             * 隐式实例化
             * @param   {Object} object
             * @returns {Object} viewmodel
             */
            fly.observable = function(object) {
                if (!(object instanceof ObservableObject)) {
                    object = new ObservableObject(object);
                }
                return object;
            };

            module.exports = Observable;
        }, {
            "./fly.core": 4
        }
    ],
    12: [
        function(require, module, exports) {
            'use strict';

            var fly = require('./fly.core');

            var win = fly.win,
                slice = Array.prototype.slice,
                localStorage = win.localStorage,
                head = document.head || document.getElementsByTagName('head')[0],
                proto = {},
                scrat = create(proto);

            var TYPE_RE = /\.(js|css)(?=[?&,]|$)/i;

            scrat.options = {
                prefix: '__FLY__',
                cache: false,
                hash: '',
                timeout: 15, // seconds
                alias: {}, // key - name, value - id
                deps: {}, // key - id, value - name/id
                urlPattern: null, // '/path/to/resources/%s'
                comboPattern: null, // '/path/to/combo-service/%s' or function (ids) { return url; }
                combo: false,
                maxUrlLength: 2000 // approximate value of combo url's max length (recommend 2000)
            };
            scrat.cache = {}; // key - id
            scrat.traceback = null;

            /**
             * Mix obj to scrat.options
             * @param {object} obj
             */
            proto.config = function(obj) {
                var options = scrat.options;

                // debug('scrat.config', obj);
                each(obj, function(value, key) {
                    var data = options[key],
                        t = type(data);
                    if (t === 'object') {
                        each(value, function(v, k) {
                            data[k] = v;
                        });
                    } else {
                        if (t === 'array') value = data.concat(value);
                        options[key] = value;
                    }
                });

                // detect localStorage support and activate cache ability
                try {
                    if (options.hash !== localStorage.getItem('__SCRAT_HASH__')) {
                        scrat.clean();
                        localStorage.setItem('__SCRAT_HASH__', options.hash);
                    }
                    options.cache = options.cache && !!options.hash;
                } catch (e) {
                    options.cache = false;
                }

                // detect scrat=nocombo,nocache in location.search
                if (/\bscrat=([\w,]+)\b/.test(location.search)) {
                    each(RegExp.$1.split(','), function(o) {
                        switch (o) {
                            case 'nocache':
                                scrat.clean();
                                options.cache = false;
                                break;
                            case 'nocombo':
                                options.combo = false;
                                break;
                        }
                    });
                }
                return options;
            };

            /**
             * Require modules asynchronously with a callback
             * @param {string|Array} names
             * @param {function} onload
             */
            proto.async = function(names, onload) {
                if (type(names) === 'string') names = [names];
                // debug('scrat.async', '_require [' + names.join(', ') + ']');

                var reactor = new scrat.Reactor(names, function() {
                    var args = [];
                    each(names, function(id) {
                        args.push(_require(id));
                    });
                    if (onload) onload.apply(scrat, args);
                    // debug('scrat.async', '[' + names.join(', ') + '] callback called');
                });
                reactor.run();
            };

            /**
             * Define a JS module with a factory funciton
             * @param {string} id
             * @param {function} factory
             */
            proto.define = function(id, factory) {
                // debug('scrat.define', '[' + id + ']');
                var options = scrat.options,
                    res = scrat.cache[id];
                if (res) {
                    res.factory = factory;
                } else {
                    scrat.cache[id] = {
                        id: id,
                        loaded: true,
                        factory: factory
                    };
                }
                if (options.cache) {
                    localStorage.setItem(options.prefix + id, factory.toString());
                }
            };

            /**
             * Define a CSS module
             * @param {string} id
             * @param {string} css
             * @param {boolean} [parsing=true]
             */
            proto.defineCSS = function(id, css, parsing) {
                // debug('scrat.defineCSS', '[' + id + ']');
                var options = scrat.options;
                scrat.cache[id] = {
                    id: id,
                    loaded: true,
                    rawCSS: css
                };
                if (parsing !== false) _requireCSS(id);
                if (options.cache) localStorage.setItem(options.prefix + id, css);
            };

            /**
             * Get a defined module
             * @param {string} id
             * @returns {object} module
             */
            proto.get = function(id) {
                /* jshint evil:true */
                // debug('scrat.get', '[' + id + ']');
                var options = scrat.options,
                    type = fileType(id),
                    res = scrat.cache[id],
                    raw;
                if (res) {
                    return res;
                } else if (options.cache) {
                    raw = localStorage.getItem(options.prefix + id);
                    if (raw) {
                        if (type === 'js') {
                            window['eval'].call(window, 'define("' + id + '",' + raw + ')');
                        } else if (type === 'css') {
                            scrat.defineCSS(id, raw, false);
                        }
                        scrat.cache[id].loaded = false;
                        return scrat.cache[id];
                    }
                }
                return null;
            };

            /**
             * Clean module cache in localStorage
             */
            proto.clean = function() {
                // debug('scrat.clean');
                try {
                    each(localStorage, function(_, key) {
                        if (~key.indexOf(scrat.options.prefix)) {
                            localStorage.removeItem(key);
                        }
                    });
                    localStorage.removeItem('__SCRAT_HASH__');
                } catch (e) {}
            };

            /**
             * Get alias from specified name recursively
             * @param {string} name
             * @param {string|function} [alias] - set alias
             * @returns {string} name
             */
            proto.alias = function(name, alias) {
                var aliasMap = scrat.options.alias;

                if (arguments.length > 1) {
                    aliasMap[name] = alias;
                    return scrat.alias(name);
                }

                while (aliasMap[name] && name !== aliasMap[name]) {
                    switch (type(aliasMap[name])) {
                        case 'function':
                            name = aliasMap[name](name);
                            break;
                        case 'string':
                            name = aliasMap[name];
                            break;
                    }
                }
                return name;
            };

            /**
             * Load any types of resources from specified url
             * @param {string} url
             * @param {function|object} options
             */
            proto.load = function(url, options) {
                if (type(options) === 'function') options = {
                    onload: options
                };

                var t = options.type || fileType(url),
                    isScript = t === 'js',
                    isCss = t === 'css',
                    isOldWebKit = +navigator.userAgent
                    .replace(/.*AppleWebKit\/(\d+)\..*/, '$1') < 536,
                    node = document.createElement(isScript ? 'script' : 'link'),
                    supportOnload = 'onload' in node,
                    tid,
                    intId,
                    intTimer;

                node.onerror = function onerror() {
                    clearTimeout(tid);
                    clearInterval(intId);
                    throw new Error('Error loading url: ' + url);
                };

                tid = setTimeout(node.onerror, (options.timeout || 15) * 1000);

                if (isScript) {
                    node.type = 'text/javascript';
                    node.async = 'async';
                    node.src = url;
                } else {
                    if (isCss) {
                        node.type = 'text/css';
                        node.rel = 'stylesheet';
                    }
                    node.href = url;
                }

                node.onload = node.onreadystatechange = function() {
                    if (node && (!node.readyState ||
                        /loaded|complete/.test(node.readyState))) {
                        clearTimeout(tid);
                        node.onload = node.onreadystatechange = null;
                        if (isScript && head && node.parentNode) head.removeChild(node);
                        if (options.onload) options.onload.call(scrat);
                        node = null;
                    }
                };

                // debug('scrat.load', '[' + url + ']');
                head.appendChild(node);

                // trigger onload immediately after nonscript node insertion
                if (isCss) {
                    if (isOldWebKit || !supportOnload) {
                        // debug('scrat.load', 'check css\'s loading status for compatible');
                        intTimer = 0;
                        intId = setInterval(function() {
                            if ((intTimer += 20) > options.timeout || !node) {
                                clearTimeout(tid);
                                clearInterval(intId);
                                return;
                            }
                            if (node.sheet) {
                                clearTimeout(tid);
                                clearInterval(intId);
                                if (options.onload) options.onload.call(scrat);
                                node = null;
                            }
                        }, 20);
                    }
                } else if (!isScript) {
                    if (options.onload) options.onload.call(scrat);
                }
            };

            proto.Reactor = function(names, callback) {
                this.length = 0;
                this.depends = {};
                this.depended = {};
                this.push.apply(this, names);
                this.callback = callback;
            };

            var rproto = scrat.Reactor.prototype;

            rproto.push = function() {
                var that = this,
                    args = slice.call(arguments);

                function onload() {
                    if (--that.length === 0) that.callback();
                }

                each(args, function(arg) {
                    var id = scrat.alias(arg),
                        type = fileType(id),
                        res = scrat.get(id);

                    if (!res) {
                        res = scrat.cache[id] = {
                            id: id,
                            loaded: false,
                            onload: []
                        };
                    } else if (that.depended[id] || res.loaded) return;

                    that.depended[id] = 1;
                    if (scrat.options.deps[id])
                        that.push.apply(that, scrat.options.deps[id]);
                    else
                        that.push.apply(that);

                    if ((type === 'css' && !res.rawCSS && !res.parsed) ||
                        (type === 'js' && !res.factory && !res.exports)) {
                        (that.depends[type] || (that.depends[type] = [])).push(res);
                        ++that.length;
                        res.onload.push(onload);
                    } else if (res.rawCSS) {
                        _requireCSS(id);
                    }
                });
            };

            function makeOnload(deps) {
                deps = deps.slice();
                return function() {
                    each(deps, function(res) {
                        res.loaded = true;
                        while (res.onload.length) {
                            var onload = res.onload.shift();
                            onload.call(res);
                        }
                    });
                };
            }

            rproto.run = function() {
                var that = this,
                    options = scrat.options,
                    combo = options.combo,
                    depends = this.depends;

                if (this.length === 0) return this.callback();
                // debug('reactor.run', depends);

                each(depends.unknown, function(res) {
                    scrat.load(that.genUrl(res.id), function() {
                        res.loaded = true;
                    });
                });

                // debug('reactor.run', 'combo: ' + combo);
                if (combo) {
                    each(['css', 'js'], function(type) {
                        var urlLength = 0,
                            ids = [],
                            deps = [];

                        each(depends[type], function(res, i) {
                            if (urlLength + res.id.length < options.maxUrlLength) {
                                urlLength += res.id.length;
                                ids.push(res.id);
                                deps.push(res);
                            } else {
                                scrat.load(that.genUrl(ids), makeOnload(deps));
                                urlLength = res.id.length;
                                ids = [res.id];
                                deps = [res];
                            }
                            if (i === depends[type].length - 1) {
                                scrat.load(that.genUrl(ids), makeOnload(deps));
                            }
                        });
                    });
                } else {
                    each((depends.css || []).concat(depends.js || []), function(res) {
                        scrat.load(that.genUrl(res.id), function() {
                            res.loaded = true;
                            while (res.onload.length) {
                                var onload = res.onload.shift();
                                onload.call(res);
                            }
                        });
                    });
                }
            };

            rproto.genUrl = function(ids) {
                if (type(ids) === 'string') ids = [ids];

                var options = scrat.options,
                    url = options.combo && options.comboPattern || options.urlPattern;

                if (options.cache && fileType(ids[0]) === 'css') {
                    each(ids, function(id, i) {
                        ids[i] = id + '.js';
                    });
                }

                switch (type(url)) {
                    case 'string':
                        url = url.replace('%s', ids.join(','));
                        break;
                    case 'function':
                        url = url(ids);
                        break;
                    default:
                        url = ids.join(',');
                }

                return url + (~url.indexOf('?') ? '&' : '?') + options.hash;
            };

            /**
             * Require another module in factory
             * @param {string} name
             * @returns {*} module.exports
             */
            function _require(name) {
                var id = scrat.alias(name),
                    module = scrat.get(id);

                if (fileType(id) !== 'js') return;
                if (!module) throw new Error('failed to _require "' + name + '"');
                if (!module.exports) {
                    if (type(module.factory) !== 'function') {
                        throw new Error('failed to _require "' + name + '"');
                    }
                    try {
                        module.factory.call(scrat, _require, module.exports = {}, module);
                    } catch (e) {
                        e.id = id;
                        throw (scrat.traceback = e);
                    }
                    delete module.factory;
                    // debug('_require', '[' + id + '] factory called');
                }
                return module.exports;
            }

            // Mix scrat's prototype to _require
            each(proto, function(m, k) {
                _require[k] = m;
            });

            /**
             * Parse CSS module
             * @param {string} name
             */
            function _requireCSS(name) {
                var id = scrat.alias(name),
                    module = scrat.get(id);

                if (fileType(id) !== 'css') return;
                if (!module) throw new Error('failed to _require "' + name + '"');
                if (!module.parsed) {
                    if (type(module.rawCSS) !== 'string') {
                        throw new Error('failed to _require "' + name + '"');
                    }
                    var styleEl = document.createElement('style');
                    head.appendChild(styleEl);
                    styleEl.appendChild(document.createTextNode(module.rawCSS));
                    delete module.rawCSS;
                    module.parsed = true;
                }
            }

            function type(obj) {
                var t;
                if (obj == null) {
                    t = String(obj);
                } else {
                    t = Object.prototype.toString.call(obj).toLowerCase();
                    t = t.substring(8, t.length - 1);
                }
                return t;
            }

            function each(obj, iterator, context) {
                if (typeof obj !== 'object') return;

                var i, l, t = type(obj);
                context = context || obj;
                if (t === 'array' || t === 'arguments' || t === 'nodelist') {
                    for (i = 0, l = obj.length; i < l; i++) {
                        if (iterator.call(context, obj[i], i, obj) === false) return;
                    }
                } else {
                    for (i in obj) {
                        if (obj.hasOwnProperty(i)) {
                            if (iterator.call(context, obj[i], i, obj) === false) return;
                        }
                    }
                }
            }

            function create(proto) {
                function Dummy() {}
                Dummy.prototype = proto;
                return new Dummy();
            }

            function fileType(str) {
                var ext = 'js';
                str.replace(TYPE_RE, function(m, $1) {
                    ext = $1;
                });
                if (ext !== 'js' && ext !== 'css') ext = 'unknown';
                return ext;
            }

            fly.require = scrat;
            fly.define = scrat.define;
            fly.defineCSS = scrat.defineCSS;

            if (!win.require) {
                win.require = scrat;
                win.define = scrat.define;
                win.defineCSS = scrat.defineCSS;
            }

            module.exports = scrat;
        }, {
            "./fly.core": 4
        }
    ],
    13: [
        function(require, module, exports) {
            /**
             * 路由 暂未实现
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update:
             */

            var fly = require('./fly.core'),
                Observable = require('./fly.observable'),
                utils = require('./fly.utils');

            var CHANGE = "change",
                BACK = "back",
                SAME = "same",
                INIT = "init",
                ROUTE_MISSING = "routeMissing",
                $ = fly.$,
                Class = fly.Class,
                support = fly.support,
                window = fly.win,
                location = window.location,
                history = window.history,
                CHECK_URL_INTERVAL = 50,
                BROKEN_BACK_NAV = support.browser.ie,
                hashStrip = /^#*/,
                optionalParam = /\((.*?)\)/g,
                namedParam = /(\(\?)?:\w+/g,
                splatParam = /\*\w+/g,
                escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g,
                document = window.document,
                parseQueryStringParams = fly.parseQueryStringParams;

            function hashDelimiter(bang) {
                return bang ? "#!" : "#";
            }

            function locationHash(hashDelimiter) {
                var href = location.href;

                if (hashDelimiter === "#!" && href.indexOf("#") > -1 && href.indexOf("#!") < 0) {
                    return null;
                }

                return href.split(hashDelimiter)[1] || "";
            }

            function stripRoot(root, url) {
                if (url.indexOf(root) === 0) {
                    return (url.substr(root.length)).replace(/\/\//g, '/');
                } else {
                    return url;
                }
            }

            var HistoryAdapter = Class.extend({

                ctor: function() {},

                back: function() {
                    if (BROKEN_BACK_NAV) {
                        setTimeout(function() {
                            history.back();
                        });
                    } else {
                        history.back();
                    }
                },

                forward: function() {
                    if (BROKEN_BACK_NAV) {
                        setTimeout(function() {
                            history.forward();
                        });
                    } else {
                        history.forward();
                    }
                },

                length: function() {
                    return history.length;
                },

                replaceLocation: function(url) {
                    location.replace(url);
                }
            });

            var PushStateAdapter = HistoryAdapter.extend({

                ctor: function(root) {
                    this.root = root;
                },

                navigate: function(to) {
                    history.pushState({}, document.title, absoluteURL(to, this.root));
                },

                replace: function(to) {
                    history.replaceState({}, document.title, absoluteURL(to, this.root));
                },

                normalize: function(url) {
                    return stripRoot(this.root, url);
                },

                current: function() {
                    var current = location.pathname;

                    if (location.search) {
                        current += location.search;
                    }

                    return stripRoot(this.root, current);
                },

                change: function(callback) {
                    // $(window).bind("popstate.fly", callback);
                },

                stop: function() {
                    // $(window).unbind("popstate.fly");
                },

                normalizeCurrent: function(options) {
                    var fixedUrl,
                        root = options.root,
                        pathname = location.pathname,
                        hash = locationHash(hashDelimiter(options.hashBang));

                    if (root === pathname + "/") {
                        fixedUrl = root;
                    }

                    if (root === pathname && hash) {
                        fixedUrl = absoluteURL(hash.replace(hashStrip, ''), root);
                    }

                    if (fixedUrl) {
                        history.pushState({}, document.title, fixedUrl);
                    }
                }
            });

            function fixHash(url) {
                return url.replace(/^(#)?/, "#");
            }

            function fixBang(url) {
                return url.replace(/^(#(!)?)?/, "#!");
            }

            var HashAdapter = HistoryAdapter.extend({

                ctor: function(bang) {
                    this._id = fly.guid();
                    this.prefix = hashDelimiter(bang);
                    this.fix = bang ? fixBang : fixHash;
                },

                navigate: function(to) {
                    location.hash = this.fix(to);
                },

                replace: function(to) {
                    this.replaceLocation(this.fix(to));
                },

                normalize: function(url) {
                    if (url.indexOf(this.prefix) < 0) {
                        return url;
                    } else {
                        return url.split(this.prefix)[1];
                    }
                },

                change: function(callback) {
                    if (support.hashChange) {
                        fly.on(window, 'hashchange.' + this._id, callback);
                    } else {
                        this._interval = setInterval(callback, CHECK_URL_INTERVAL);
                    }
                },

                stop: function() {
                    fly.off(window, 'hashchange.' + this._id, callback);
                    clearInterval(this._interval);
                },

                current: function() {
                    return locationHash(this.prefix);
                },

                normalizeCurrent: function(options) {
                    var pathname = location.pathname,
                        root = options.root;

                    if (options.pushState && root !== pathname) {
                        this.replaceLocation(root + this.prefix + stripRoot(root,
                            pathname));
                        return true; // browser will reload at this point.
                    }

                    return false;
                }
            });

            var History = Observable.extend({
                start: function(options) {
                    options = options || {};

                    this.bind([CHANGE, BACK, SAME], options);

                    if (this._started) {
                        return;
                    }

                    this._started = true;

                    options.root = options.root || "/";

                    var adapter = this.createAdapter(options),
                        current;

                    // adapter may reload the document
                    if (adapter.normalizeCurrent(options)) {
                        return;
                    }

                    current = adapter.current();

                    $.extend(this, {
                        adapter: adapter,
                        root: options.root,
                        historyLength: adapter.length(),
                        current: current,
                        locations: [current]
                    });

                    adapter.change($.proxy(this, "_checkUrl"));
                },

                createAdapter: function(options) {
                    return support.pushState && options.pushState ? new PushStateAdapter(
                        options.root) : new HashAdapter(options.hashBang);
                },

                stop: function() {
                    if (!this._started) {
                        return;
                    }
                    this.adapter.stop();
                    this.unbind(CHANGE);
                    this._started = false;
                },

                change: function(callback) {
                    this.bind(CHANGE, callback);
                },

                replace: function(to, silent) {

                    this._navigate(to, silent, function(adapter) {
                        adapter.replace(to);
                        this.locations[this.locations.length - 1] = this.current;
                    });
                },

                navigate: function(to, silent) {
                    if (to === "#:back") {
                        this.backCalled = true;
                        this.adapter.back();
                        return;
                    }

                    this._navigate(to, silent, function(adapter) {
                        adapter.navigate(to);
                        this.locations.push(this.current);
                    });
                },

                _navigate: function(to, silent, callback) {
                    var adapter = this.adapter;

                    to = adapter.normalize(to);

                    if (this.current === to || this.current === decodeURIComponent(to)) {
                        this.trigger(SAME);
                        return;
                    }

                    if (!silent) {
                        if (this.trigger(CHANGE, {
                            url: to
                        })) {
                            return;
                        }
                    }

                    this.current = to;

                    callback.call(this, adapter);

                    this.historyLength = adapter.length();
                },

                _checkUrl: function() {
                    var adapter = this.adapter,
                        current = adapter.current(),
                        newLength = adapter.length(),
                        navigatingInExisting = this.historyLength === newLength,
                        back = current === this.locations[this.locations.length - 2] &&
                        navigatingInExisting,
                        backCalled = this.backCalled,
                        prev = this.current;

                    if (current === null || this.current === current || this.current ===
                        decodeURIComponent(current)) {
                        return true;
                    }

                    this.historyLength = newLength;
                    this.backCalled = false;

                    this.current = current;

                    if (back && this.trigger("back", {
                        url: prev,
                        to: current
                    })) {
                        adapter.forward();
                        this.current = prev;
                        return;
                    }

                    if (this.trigger(CHANGE, {
                        url: current,
                        backButtonPressed: !backCalled
                    })) {
                        if (back) {
                            adapter.forward();
                        } else {
                            adapter.back();
                            this.historyLength--;
                        }
                        this.current = prev;
                        return;
                    }

                    if (back) {
                        this.locations.pop();
                    } else {
                        this.locations.push(current);
                    }
                }
            });

            function namedParamReplace(match, optional) {
                return optional ? match : '([^\/]+)';
            }

            function routeToRegExp(route, ignoreCase) {
                return new RegExp('^' + route
                    .replace(escapeRegExp, '\\$&')
                    .replace(optionalParam, '(?:$1)?')
                    .replace(namedParam, namedParamReplace)
                    .replace(splatParam, '(.*?)') + '$', ignoreCase ? "i" : "");
            }

            function stripUrl(url) {
                return url.replace(/(\?.*)|(#.*)/g, "");
            }

            var Route = Class.extend({

                ctor: function(route, callback, ignoreCase) {
                    if (!(route instanceof RegExp)) {
                        route = routeToRegExp(route, ignoreCase);
                    }

                    this.route = route;
                    this._callback = callback;
                },

                callback: function(url) {
                    var params,
                        idx = 0,
                        length,
                        queryStringParams = parseQueryStringParams(url);

                    url = stripUrl(url);
                    params = this.route.exec(url).slice(1);
                    length = params.length;

                    for (; idx < length; idx++) {
                        if (typeof params[idx] !== 'undefined') {
                            params[idx] = decodeURIComponent(params[idx]);
                        }
                    }

                    params.push(queryStringParams);

                    this._callback.apply(null, params);
                },

                worksWith: function(url) {
                    if (this.route.test(stripUrl(url))) {
                        this.callback(url);
                        return true;
                    } else {
                        return false;
                    }
                }
            });

            var Router = Observable.extend({
                ctor: function(options) {
                    if (!options) {
                        options = {};
                    }

                    this._super();

                    this.routes = [];
                    this.pushState = options.pushState;
                    this.hashBang = options.hashBang;
                    this.root = options.root;
                    this.ignoreCase = options.ignoreCase !== false;

                    this.bind([INIT, ROUTE_MISSING, CHANGE, SAME], options);
                },

                destroy: function() {
                    history.unbind(CHANGE, this._urlChangedProxy);
                    history.unbind(SAME, this._sameProxy);
                    history.unbind(BACK, this._backProxy);
                    this.unbind();
                },

                start: function() {
                    var that = this,
                        sameProxy = function() {
                            that._same();
                        },
                        backProxy = function(e) {
                            that._back(e);
                        },
                        urlChangedProxy = function(e) {
                            that._urlChanged(e);
                        };

                    history.start({
                        same: sameProxy,
                        change: urlChangedProxy,
                        back: backProxy,
                        pushState: that.pushState,
                        hashBang: that.hashBang,
                        root: that.root
                    });

                    var initEventObject = {
                        url: history.current || "/",
                        preventDefault: $.noop
                    };

                    if (!that.trigger(INIT, initEventObject)) {
                        that._urlChanged(initEventObject);
                    }

                    this._urlChangedProxy = urlChangedProxy;
                    this._backProxy = backProxy;
                },

                route: function(route, callback) {
                    this.routes.push(new Route(route, callback, this.ignoreCase));
                },

                navigate: function(url, silent) {
                    fly.history.navigate(url, silent);
                },

                replace: function(url, silent) {
                    fly.history.replace(url, silent);
                },

                _back: function(e) {
                    if (this.trigger(BACK, {
                        url: e.url,
                        to: e.to
                    })) {
                        e.preventDefault();
                    }
                },

                _same: function(e) {
                    this.trigger(SAME);
                },

                _urlChanged: function(e) {
                    var url = e.url;

                    if (!url) {
                        url = "/";
                    }

                    if (this.trigger(CHANGE, {
                        url: e.url,
                        params: parseQueryStringParams(e.url),
                        backButtonPressed: e.backButtonPressed
                    })) {
                        e.preventDefault();
                        return;
                    }

                    var idx = 0,
                        routes = this.routes,
                        route,
                        length = routes.length;

                    for (; idx < length; idx++) {
                        route = routes[idx];

                        if (route.worksWith(url)) {
                            return;
                        }
                    }

                    if (this.trigger(ROUTE_MISSING, {
                        url: url,
                        params: parseQueryStringParams(url),
                        backButtonPressed: e.backButtonPressed
                    })) {
                        e.preventDefault();
                    }
                }
            });

            History.HistoryAdapter = HistoryAdapter;
            History.HashAdapter = HashAdapter;
            History.PushStateAdapter = PushStateAdapter;
            fly.History = History;
            fly.Router = Router;
            var history = fly.history = new History();

            module.exports = Router;
        }, {
            "./fly.core": 4,
            "./fly.observable": 11,
            "./fly.utils": 16
        }
    ],
    14: [
        function(require, module, exports) {
            (function(global) {
                /**
                 * 特性检测
                 * @author: huanzhang
                 * @email: huanzhang@iflytek.com
                 * @update: 2016-02-01 15:20
                 */

                'use strict';

                var support = {},
                    STRING = 'string',

                    // 滚动条宽度
                    __scrollbar;

                var fragment = document.createDocumentFragment(),
                    div = fragment.appendChild(document.createElement("div")),
                    input = document.createElement("input");

                var transitions = support.transitions = false,
                    transforms = support.transforms = false;

                // Support: Android 4.0-4.3
                // Check state lost if the name is set (#11217)
                // Support: Windows Web Apps (WWA)
                // `name` and `type` must use .setAttribute for WWA (#14901)
                input.setAttribute("type", "radio");
                input.setAttribute("checked", "checked");
                input.setAttribute("name", "t");

                div.appendChild(input);

                // 监视DOM改变
                support.mutationobserver = window.MutationObserver ||
                    window.WebKitMutationObserver || null;

                // 是否支持html5
                support.html5 = (function() {
                    var i = document.createElement('input'),
                        result;
                    i.setAttribute('type', 'range');
                    result = i.type != 'text';
                    i = null;
                    return result;
                })();



                // 是否支持触屏
                support.touch = (
                    ('ontouchstart' in document) ||
                    (global.DocumentTouch && document instanceof global.DocumentTouch) || //非IE
                    (global.navigator.msPointerEnabled && global.navigator.msMaxTouchPoints >
                        0) || //IE 10
                    (global.navigator.pointerEnabled && global.navigator.maxTouchPoints > 0) || //IE >=11
                    false
                );

                // 识别浏览器
                support.browser = (function() {
                    var browser = {},
                        userAgent = navigator.userAgent;
                    if (userAgent.indexOf("Opera") > -1) {
                        browser.opera = 1;
                    } else if (userAgent.indexOf("Firefox") > -1) {
                        browser.firefox = 1;
                    } else if (userAgent.indexOf("Chrome") > -1) {
                        browser.chrome = 1;
                    } else if (userAgent.indexOf("Safari") > -1) {
                        browser.safari = 1;
                    } else if (!!window.ActiveXObject || "ActiveXObject" in window) {
                        new RegExp("MSIE (\\d+\\.\\d+);").test(userAgent);
                        // IE应该只到11了
                        browser.ie = parseInt(RegExp.$1 || 11);
                    }
                    return browser;
                })();

                // 识别操作系统
                support.os = (function() {
                    var os = {},
                        ua = navigator.userAgent;
                    var funcs = [

                        function() { //wechat
                            var wechat = ua.match(/(MicroMessenger)\/([\d\.]+)/i);
                            if (wechat) { //wechat
                                os.wechat = {
                                    version: wechat[2].replace(/_/g, '.')
                                };
                            }
                            return false;
                        },
                        function() { //android
                            var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
                            if (android) {
                                os.android = true;
                                os.version = android[2];
                                os.isBadAndroid = !(/Chrome\/\d/.test(window.navigator
                                    .appVersion));
                            }
                            return os.android === true;
                        },
                        function() { //ios
                            var iphone = ua.match(/(iPhone\sOS)\s([\d_]+)/);
                            if (iphone) { //iphone
                                os.ios = os.iphone = true;
                                os.version = iphone[2].replace(/_/g, '.');
                            } else {
                                var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
                                if (ipad) { //ipad
                                    os.ios = os.ipad = true;
                                    os.version = ipad[2].replace(/_/g, '.');
                                }
                            }
                            return os.ios === true;
                        }
                    ];
                    [].every.call(funcs, function(func) {
                        return !func.call();
                    });
                    return os;
                })();

                // 获取滚动条宽度
                support.scrollbar = function(refresh) {
                    var div, result;

                    if (!isNaN(__scrollbar) && !refresh) {
                        return __scrollbar;
                    }

                    div = document.createElement('div');
                    div.style.cssText =
                        'overflow:scroll;overflow-x:hidden;zoom:1;clear:both;display:block';
                    div.innerHTML = '&nbsp;';
                    document.body.appendChild(div);

                    result = div.offsetWidth - div.scrollWidth;
                    document.body.removeChild(div);
                    div = null;
                    return result;
                };

                // Support: Android<4.2
                // Older WebKit doesn't clone checked state correctly in fragments
                support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;

                // Support: IE<=11+
                // Make sure textarea (and checkbox) defaultValue is properly cloned
                div.innerHTML = "<textarea>x</textarea>";
                support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
                support.dataset = !!div.dataset;

                // 是否可以直接删除扩展
                support.deleteExpando = (function() {
                    var a = document.createElement('a');
                    try {
                        delete a.test;
                    } catch (e) {
                        a = null;
                        return false;
                    }
                    a = null;
                    return true;
                })();

                for (var i = 0, pres = ["Moz", "webkit", "O", "ms"]; i < pres.length; i++) {
                    var prefix = pres[i].toString(),
                        hasTransitions = typeof div.style[prefix + "Transition"] === STRING;

                    if (hasTransitions || typeof div.style[prefix + "Transform"] === STRING) {
                        var lowPrefix = prefix.toLowerCase();

                        transforms = {
                            css: (lowPrefix != "ms") ? "-" + lowPrefix + "-" : "",
                            prefix: prefix,
                            event: (lowPrefix === "o" || lowPrefix === "webkit") ?
                                lowPrefix : ""
                        };

                        if (hasTransitions) {
                            transitions = transforms;
                            transitions.event = transitions.event ? transitions.event +
                                "TransitionEnd" : "transitionend";
                        }

                        break;
                    }
                }

                div = null;

                support.transforms = transforms;
                support.transitions = transitions;

                module.exports = support;
            }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ?
                self : typeof window !== "undefined" ? window : {})
        }, {}
    ],
    15: [
        function(require, module, exports) {
            /**
             * 模板引擎
             * 来自artTemplate3.0.0
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-07-01
             */

            'use strict';

            // core
            var fly = require('./fly.core');

            var escapeMap = {
                '<': '&#60;',
                '>': '&#62;',
                '"': '&#34;',
                "'": '&#39;',
                '&': '&#38;'
            };

            // 静态分析模板变量
            var KEYWORDS =
                // 关键字
                'break,case,catch,continue,debugger,default,delete,do,else,false' +
                ',finally,for,function,if,in,instanceof,new,null,return,switch,this' +
                ',throw,true,try,typeof,var,void,while,with'

            // 保留字
            +',abstract,boolean,byte,char,class,const,double,enum,export,extends' +
                ',final,float,goto,implements,import,int,interface,long,native' +
                ',package,private,protected,public,short,static,super,synchronized' +
                ',throws,transient,volatile'

            // ECMA 5 - use strict
            + ',arguments,let,yield'

            + ',undefined';

            var REMOVE_RE =
                /\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|\s*\.\s*[$\w\.]+/g;
            var SPLIT_RE = /[^\w$]+/g;
            var KEYWORDS_RE = new RegExp(["\\b" + KEYWORDS.replace(/,/g, '\\b|\\b') + "\\b"]
                .join('|'), 'g');
            var NUMBER_RE = /^\d[^,]*|,\d[^,]*/g;
            var BOUNDARY_RE = /^,+|,+$/g;
            var SPLIT2_RE = /^$|,+/;

            var toString = function(value, scope) {

                if (typeof value !== 'string') {
                    var type = typeof value;
                    if (type === 'number') {
                        value += '';
                    } else if (type === 'function') {
                        value = toString(value.call(scope || value));
                    } else {
                        value = '';
                    }
                }

                return value;

            };

            var escapeFn = function(s) {
                return escapeMap[s];
            };

            var escapeHTML = function(content, scope) {
                return toString(content, scope)
                    .replace(/&(?![\w#]+;)|[<>"']/g, escapeFn);
            };

            var isArray = Array.isArray || function(obj) {
                return ({}).toString.call(obj) === '[object Array]';
            };

            var each = function(data, callback) {
                var i, len;
                if (isArray(data)) {
                    for (i = 0, len = data.length; i < len; i++) {
                        callback.call(data, data[i], i, data);
                    }
                } else {
                    for (i in data) {
                        callback.call(data, data[i], i);
                    }
                }
            };


            /**
             * 模板
             * @param   {String} filename 模板名
             * @param   {Object, String} content  数据 如果为字符串则编译并缓存编译结果
             * @returns {String, Function} 渲染好的HTML字符串或者渲染方法
             */
            var template = function(filename, content) {
                return filename.indexOf('<') != -1 ? compile(filename) : (typeof content ===
                    'string' ?
                    compile(content, {
                        filename: filename
                    }) : renderFile(filename, content));
            };

            /**
             * 设置全局配置
             * @param {String} name  名称
             * @param {Any}    value 值
             */
            template.config = function(name, value) {
                defaults[name] = value;
            };

            // 默认设置
            var defaults = template.defaults = {
                openTag: '<%', // 逻辑语法开始标签
                closeTag: '%>', // 逻辑语法结束标签
                escape: true, // 是否编码输出变量的 HTML 字符
                cache: true, // 是否开启缓存（依赖 options 的 filename 字段）
                compress: false, // 是否压缩输出
                parser: null // 自定义语法格式器 @see: template-syntax.js
            };

            // 缓存
            var cacheStore = template.cache = {};

            /**
             * 渲染模板
             * @name    template.render
             * @param   {String}    模板
             * @param   {Object}    数据
             * @return  {String}    渲染好的字符串
             */
            template.render = function(source, options) {
                return compile(source, options);
            };

            /**
             * 渲染模板(根据模板名)
             * @name    template.render
             * @param   {String}    模板名
             * @param   {Object}    数据
             * @return  {String}    渲染好的字符串
             */
            var renderFile = template.renderFile = function(filename, data) {
                var fn = template.get(filename) || showDebugInfo({
                    filename: filename,
                    name: 'Render Error',
                    message: 'Template not found'
                });
                return data ? fn(data) : fn;
            };

            /**
             * 获取编译缓存（可由外部重写此方法）
             * @param   {String}    模板名
             * @param   {Function}  编译好的函数
             */
            template.get = function(filename) {

                var cache;

                if (cacheStore[filename]) {
                    // 使用内存缓存
                    cache = cacheStore[filename];
                } else if (typeof document === 'object') {
                    // 加载模板并编译
                    var elem = document.getElementById(filename);

                    if (elem) {
                        var source = (elem.value || elem.innerHTML)
                            .replace(/^\s*|\s*$/g, '');
                        cache = compile(source, {
                            filename: filename
                        });
                    }
                }

                return cache;
            };

            var utils = template.utils = {

                $helpers: {},

                $include: renderFile,

                $string: toString,

                $escape: escapeHTML,

                $each: each

            };

            /**
             * 添加模板辅助方法
             * @name    template.helper
             * @param   {String}    名称
             * @param   {Function}  方法
             */
            template.helper = function(name, helper) {
                helpers[name] = helper;
            };

            var helpers = template.helpers = utils.$helpers;

            /**
             * 模板错误事件（可由外部重写此方法）
             * @name    template.onerror
             * @event
             */
            template.onerror = function(e) {
                var message = 'Template Error\n\n';
                for (var name in e) {
                    message += '<' + name + '>\n' + e[name] + '\n\n';
                }

                if (typeof console === 'object') {
                    console.error(message);
                }
            };


            /**
             * 模板调试器
             * @param   {Object} e event
             * @returns {String}   调试函数
             */
            var showDebugInfo = function(e) {

                template.onerror(e);

                return function() {
                    return '{Template Error}';
                };
            };

            /**
             * 编译模板
             * @param   {String}    模板字符串
             * @param   {Object}    编译选项
             *
             *      - openTag       {String}
             *      - closeTag      {String}
             *      - filename      {String}
             *      - escape        {Boolean}
             *      - compress      {Boolean}
             *      - debug         {Boolean}
             *      - cache         {Boolean}
             *      - parser        {Function}
             *
             * @return  {Function}  渲染方法
             */
            var compile = template.compile = function(source, options) {

                // 合并默认配置
                options = options || {};
                for (var name in defaults) {
                    if (options[name] === undefined) {
                        options[name] = defaults[name];
                    }
                }

                var filename = options.filename;

                try {
                    var Render = compiler(source, options);
                } catch (e) {
                    e.filename = filename || 'anonymous';
                    e.name = 'Syntax Error';
                    return showDebugInfo(e);
                }

                // 对编译结果进行一次包装
                function render(data) {
                    try {
                        return new Render(data, filename) + '';
                    } catch (e) {
                        // 运行时出错后自动开启调试模式重新编译
                        if (!options.debug) {
                            options.debug = true;
                            return compile(source, options)(data);
                        }
                        return showDebugInfo(e)();
                    }
                }

                render.prototype = Render.prototype;
                render.toString = function() {
                    return Render.toString();
                };

                if (filename && options.cache) {
                    cacheStore[filename] = render;
                }

                return render;
            };

            // 数组迭代
            var forEach = utils.$each;

            // 获取变量
            function getVariable(code) {
                return code
                    .replace(REMOVE_RE, '')
                    .replace(SPLIT_RE, ',')
                    .replace(KEYWORDS_RE, '')
                    .replace(NUMBER_RE, '')
                    .replace(BOUNDARY_RE, '')
                    .split(SPLIT2_RE);
            };


            // 字符串转义
            function stringify(code) {
                return "'" + code
                    // 单引号与反斜杠转义
                    .replace(/('|\\)/g, '\\$1')
                    // 换行符转义(windows + linux)
                    .replace(/\r/g, '\\r')
                    .replace(/\n/g, '\\n') + "'";
            }


            function compiler(source, options) {

                var debug = options.debug;
                var openTag = options.openTag;
                var closeTag = options.closeTag;
                var parser = options.parser;
                var compress = options.compress;
                var escape = options.escape;

                var line = 1;
                var uniq = {
                    $data: 1,
                    $filename: 1,
                    $utils: 1,
                    $helpers: 1,
                    $out: 1,
                    $line: 1
                };

                var isNewEngine = ''.trim; // '__proto__' in {}
                var replaces = isNewEngine ? ["$out='';", "$out+=", ";", "$out"] : [
                    "$out=[];", "$out.push(", ");", "$out.join('')"
                ];

                var concat = isNewEngine ? "$out+=text;return $out;" :
                    "$out.push(text);";

                var print = "function(){" + "var text=''.concat.apply('',arguments);" +
                    concat + "}";

                var include = "function(filename,data){" + "data=data||$data;" +
                    "var text=$utils.$include(filename,data,$filename);" + concat + "}";

                var headerCode = "'use strict';" +
                    "var $utils=this,$helpers=$utils.$helpers," + (debug ? "$line=0," :
                        "");

                var mainCode = replaces[0];

                var footerCode = "return new String(" + replaces[3] + ");"

                // html与逻辑语法分离
                forEach(source.split(openTag), function(code) {
                    code = code.split(closeTag);

                    var $0 = code[0];
                    var $1 = code[1];

                    // code: [html]
                    if (code.length === 1) {
                        mainCode += html($0);

                        // code: [logic, html]
                    } else {
                        mainCode += logic($0);
                        if ($1) {
                            mainCode += html($1);
                        }
                    }
                });

                var code = headerCode + mainCode + footerCode;

                // 调试语句
                if (debug) {
                    code = "try{" + code + "}catch(e){" + "throw {" +
                        "filename:$filename," + "name:'Render Error'," +
                        "message:e.message," + "line:$line," + "source:" + stringify(
                            source) + ".split(/\\n/)[$line-1].replace(/^\\s+/,'')" +
                        "};" + "}";
                }

                try {
                    var Render = new Function("$data", "$filename", code);
                    Render.prototype = utils;
                    return Render;
                } catch (e) {
                    e.temp = "function anonymous($data,$filename) {" + code + "}";
                    throw e;
                }

                // 处理 HTML 语句
                function html(code) {

                    // 记录行号
                    line += code.split(/\n/).length - 1;

                    // 压缩多余空白与注释
                    if (compress) {
                        code = code
                            .replace(/\s+/g, ' ')
                            .replace(/<!--[\w\W]*?-->/g, '');
                    }

                    if (code) {
                        code = replaces[1] + stringify(code) + replaces[2] + "\n";
                    }

                    return code;
                }


                // 处理逻辑语句
                function logic(code) {
                    var thisLine = line;
                    if (parser) {
                        // 语法转换插件钩子
                        code = parser(code, options);
                    } else if (debug) {
                        // 记录行号
                        code = code.replace(/\n/g, function() {
                            line++;
                            return "$line=" + line + ";";
                        });
                    }

                    // 输出语句. 编码: <%=value%> 不编码:<%=#value%>
                    // <%=#value%> 等同 v2.0.3 之前的 <%==value%>
                    if (code.indexOf('=') === 0) {
                        var escapeSyntax = escape && !/^=[=#]/.test(code);
                        code = code.replace(/^=[=#]?|[\s;]*$/g, '');
                        // 对内容编码
                        if (escapeSyntax) {
                            var name = code.replace(/\s*\([^\)]+\)/, '');
                            // 排除 utils.* | include | print
                            if (!utils[name] && !/^(include|print)$/.test(name)) {
                                code = "$escape(" + code + (code && ", $data") + ")";
                            }

                            // 不编码
                        } else {
                            code = "$string(" + code + ")";
                        }

                        code = replaces[1] + code + replaces[2];
                    }

                    if (debug) {
                        code = "$line=" + thisLine + ";" + code;
                    }

                    // 提取模板中的变量名
                    forEach(getVariable(code), function(name) {

                        // name 值可能为空，在安卓低版本浏览器下
                        if (!name || uniq[name]) {
                            return;
                        }

                        var value;

                        // 声明模板变量
                        // 赋值优先级:
                        // [include, print] > utils > helpers > data
                        if (name === 'print') {
                            value = print;
                        } else if (name === 'include') {
                            value = include;
                        } else if (utils[name]) {
                            value = "$utils." + name;
                        } else if (helpers[name]) {
                            value = "$helpers." + name;
                        } else {
                            value = "$data." + name;
                        }

                        headerCode += name + "=" + value + ",";
                        uniq[name] = true;
                    });

                    return code + "\n";
                }
            };

            // 定义模板引擎的语法
            defaults.openTag = '{{';
            defaults.closeTag = '}}';


            var filtered = function(js, filter) {
                var parts = filter.split(':');
                var name = parts.shift();
                var args = parts.join(':') || '';

                if (args) {
                    args = ', ' + args;
                }

                return '$helpers.' + name + '(' + js + args + ')';
            }

            defaults.parser = function(code, options) {

                // var match = code.match(/([\w\$]*)(\b.*)/);
                // var key = match[1];
                // var args = match[2];
                // var split = args.split(' ');
                // split.shift();

                code = code.replace(/^\s/, '');

                var split = code.split(' ');
                var key = split.shift();
                var args = split.join(' ');

                switch (key) {

                    case 'if':
                        code = 'if(' + args + '){';
                        break;
                    case 'else':
                        if (split.shift() === 'if') {
                            split = ' if(' + split.join(' ') + ')';
                        } else {
                            split = '';
                        }
                        code = '}else' + split + '{';
                        break;
                    case '/if':
                        code = '}';
                        break;
                    case 'each':
                        var object = split[0] || '$data';
                        var as = split[1] || 'as';
                        var value = split[2] || '$value';
                        var index = split[3] || '$index';
                        var param = value + ',' + index;

                        if (as !== 'as') {
                            object = '[]';
                        }

                        code = '$each(' + object + ',function(' + param + '){';
                        break;
                    case '/each':
                        code = '});';
                        break;
                    case 'echo':
                        code = 'print(' + args + ');';
                        break;
                    case 'print':
                    case 'include':
                        code = key + '(' + split.join(',') + ');';
                        break;
                    default:
                        // 过滤器（辅助方法）
                        // {{value | filterA:'abcd' | filterB}}
                        // >>> $helpers.filterB($helpers.filterA(value, 'abcd'))
                        // TODO: {{ddd||aaa}} 不包含空格
                        if (/^\s*\|\s*[\w\$]/.test(args)) {
                            var escape = true;

                            // {{#value | link}}
                            if (code.indexOf('#') === 0) {
                                code = code.substr(1);
                                escape = false;
                            }

                            var i = 0;
                            var array = code.split('|');
                            var len = array.length;
                            var val = array[i++];

                            for (; i < len; i++) {
                                val = filtered(val, array[i]);
                            }

                            code = (escape ? '=' : '=#') + val;

                            // 即将弃用 {{helperName value}}
                        } else if (template.helpers[key]) {

                            code = '=#' + key + '(' + split.join(',') + ');';

                            // 内容直接输出 {{value}}
                        } else {

                            code = '=' + code;
                        }
                        break;
                }

                return code;
            };

            fly.template = template;

            module.exports = template;

        }, {
            "./fly.core": 4
        }
    ],
    16: [
        function(require, module, exports) {
            /**
             * 常用工具集合
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-06-01 15:20
             */

            'use strict';

            // 依赖core
            var fly = require("./fly.core");

            var $ = fly.$,
                support = fly.support,
                window = fly.win,
                slice = [].slice,
                location = window.location,
                _modCache;

            // 正则表达式
            var rclass = /[\t\r\n\f]/g,
                dashRegExp = /([A-Z])/g,
                jsonRegExp = /^\s*(?:\{(?:.|\r\n|\n)*\}|\[(?:.|\r\n|\n)*\])\s*$/,
                jsonFormatRegExp = /^\{(\d+)(:[^\}]+)?\}|^\[[A-Za-z_]*\]$/,
                numberRegExp = /^(\+|-?)\d+(\.?)\d*$/,
                rnotwhite = /\S+/g,
                translateRE = /translate(?:3d)?\((.+?)\)/,
                translateMatrixRE = /matrix(3d)?\((.+?)\)/;

            // 一些常量
            var CHARACTER = 'character',
                PLACEHOLDER = 'placeholder',
                STRING = 'string';

            function type(obj) {
                var t;
                if (obj == null) {
                    t = String(obj);
                } else {
                    t = Object.prototype.toString.call(obj).toLowerCase();
                    t = t.substring(8, t.length - 1);
                }
                return t;
            }

            /**
             * 获取URL中的参数值
             * @param  {String} name 参数名
             * @return {String} 参数值，若没有该参数，则返回''
             */
            fly.getQueryString = function(name) {
                var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
                var r = location.search.substr(1).match(reg);
                if (r != null) {
                    return unescape(r[2]);
                }
                return '';
            };


            /**
             * 格式化url中的参数
             * @param {any} url
             * @returns
             */
            fly.parseQueryStringParams = function(url) {
                var queryString = url.split('?')[1] || "",
                    params = {},
                    paramParts = queryString.split(/&|=/),
                    length = paramParts.length,
                    idx = 0;

                for (; idx < length; idx += 2) {
                    if (paramParts[idx] !== "") {
                        params[decodeURIComponent(paramParts[idx])] = decodeURIComponent(
                            paramParts[idx + 1]);
                    }
                }

                return params;
            };

            /**
             * 获取Hash值
             * @returns {string} hash
             */
            fly.getHash = function() {
                return location.hash.slice(1);
            };

            /**
             * 获取时间戳
             */
            fly.now = Date.now || function() {
                return new Date().getTime();
            };


            fly.debug = function() {
                var flag = (window.localStorage || {}).debug,
                    args = slice.call(arguments),
                    style = 'color: #bada55',
                    mod = args.shift(),
                    re = new RegExp(mod.replace(/[.\/\\]/g, function(m) {
                        return '\\' + m;
                    }));
                mod = '%c' + mod;
                if (flag && flag === '*' || re.test(flag)) {
                    if (_modCache !== mod) {
                        console.groupEnd(_modCache, style);
                        console.group(_modCache = mod, style);
                    }
                    if (/string|number|boolean/.test(type(args[0]))) {
                        args[0] = '%c' + args[0];
                        args.splice(1, 0, style);
                    }
                    console.log.apply(console, args);
                }
            };

            /**
             * setTimeout封装
             * @param {Object} fn
             * @param {Object} when
             * @param {Object} context
             * @param {Object} data
             */
            fly.later = function(fn, when, context, data) {
                when = when || 0;
                var m = fn;
                var d = data;
                var f;
                var r;

                if (typeof fn === 'string') {
                    m = context[fn];
                }

                f = function() {
                    m.apply(context, $.isArray(d) ? d : [d]);
                };

                r = setTimeout(f, when);

                return {
                    id: r,
                    cancel: function() {
                        clearTimeout(r);
                    }
                };
            };

            /**
             * 注意！！！
             * 即将废弃
             * 获取最高层级的window
             * @returns {Object} 引用flyui的最高层级的window对象
             */
            fly.top = function() {
                var top = window,
                    test = function(name) {
                        var doc;
                        try {
                            doc = window[name].document; // 跨域|无权限
                            doc.getElementsByTagName; // chrome 本地安全限制
                        } catch (e) {
                            return false;
                        }

                        return window[name].fly &&
                            doc.getElementsByTagName('frameset').length === 0;
                    };

                if (test('top')) {
                    top = window.top;
                } else if (test('parent')) {
                    top = window.parent;
                }

                return top;
            }();

            /**
             * 获取计算后的样式（最终使用的CSS属性值）
             * @param   {Object} element    DOM
             * @param   {Array}  properties 属性
             * @returns {Object} 样式对象
             */
            fly.getComputedStyles = function(element, properties) {
                var defaultView = document.defaultView,
                    styles = {},
                    computedStyle;

                if (defaultView && defaultView.getComputedStyle) {
                    computedStyle = defaultView.getComputedStyle(element, '');

                    if (properties) {
                        $.each(properties, function(idx, value) {
                            styles[value] = computedStyle.getPropertyValue(value);
                        });
                    }
                } else {
                    computedStyle = element.currentStyle;

                    if (properties) {
                        $.each(properties, function(idx, value) {
                            styles[value] = computedStyle[value.replace(/\-(\w)/g, function(
                                strMatch, g1) {
                                return g1.toUpperCase();
                            })];
                        });
                    }
                }

                if ($.isEmptyObject(styles)) {
                    styles = computedStyle;
                }

                return styles;
            };

            fly.focus = function(element) {
                if (support.os.ios) {
                    setTimeout(function() {
                        element.focus();
                    }, 10);
                } else {
                    element.focus();
                }
            };

            /**
             * trigger event
             * @param {type} element
             * @param {type} eventType
             * @param {type} eventData
             * @returns {_L8.$}
             */
            fly.trigger = function(element, eventType, eventData) {
                element.dispatchEvent(new CustomEvent(eventType, {
                    detail: eventData,
                    bubbles: true,
                    cancelable: true
                }));
                return this;
            };

            /**
             * getStyles
             * @param {type} element
             * @param {type} property
             * @returns {styles}
             */
            fly.getStyles = function(element, property) {
                var styles = element.ownerDocument.defaultView.getComputedStyle(element, null);
                if (property) {
                    return styles.getPropertyValue(property) || styles[property];
                }
                return styles;
            };

            /**
             * parseTranslate
             * @param {type} translateString
             * @param {type} position
             * @returns {Object}
             */
            fly.parseTranslate = function(translateString, position) {
                var result = translateString.match(translateRE || '');
                if (!result || !result[1]) {
                    result = ['', '0,0,0'];
                }
                result = result[1].split(",");
                result = {
                    x: parseFloat(result[0]),
                    y: parseFloat(result[1]),
                    z: parseFloat(result[2])
                };
                if (position && result.hasOwnProperty(position)) {
                    return result[position];
                }
                return result;
            };

            /**
             * parseTranslateMatrix
             * @param {type} translateString
             * @param {type} position
             * @returns {Object}
             */
            fly.parseTranslateMatrix = function(translateString, position) {
                var matrix = translateString.match(translateMatrixRE);
                var is3D = matrix && matrix[1];
                if (matrix) {
                    matrix = matrix[2].split(",");
                    if (is3D === "3d")
                        matrix = matrix.slice(12, 15);
                    else {
                        matrix.push(0);
                        matrix = matrix.slice(4, 7);
                    }
                } else {
                    matrix = [0, 0, 0];
                }
                var result = {
                    x: parseFloat(matrix[0]),
                    y: parseFloat(matrix[1]),
                    z: parseFloat(matrix[2])
                };
                if (position && result.hasOwnProperty(position)) {
                    return result[position];
                }
                return result;
            };

            /**
             * 是否可滚动
             * @param   {Object}  element DOM
             * @returns {Boolean} 是则支持，否则不支持
             */
            fly.isScrollable = function(element) {
                return fly.getComputedStyles(element, ['overflow']).overflow != 'visible';
            };

            /**
             * 返回当前获得焦点的元素
             * @returns {Object} DOM
             */
            fly.activeElement = function() {
                try {
                    return document.activeElement;
                } catch (e) {
                    return document.documentElement.activeElement;
                }
            };

            /**
             * 阻止默认动作
             * @param {Object} e 事件对象
             */
            fly.preventDefault = function(e) {
                e.preventDefault();
            }

            /**
             * 销毁vm绑定的组件
             * @param {Object} element
             */
            fly.destroy = function(element) {
                // TODO
            };

            /**
             * 绑定事件
             * @param {object}   element
             * @param {string}   event   事件名称
             * @param {function} handler 事件
             */
            fly.on = function(element, event, handler) {
                if (arguments.length == 2) {
                    handler = event;
                    event = element;
                    element = this;
                }
                if (element.addEventListener) {
                    element.addEventListener(event, handler, false);
                } else {
                    if (event == 'input') {
                        event = 'propertychange';
                    }
                    element.attachEvent('on' + event, handler);
                }
            };

            fly.off = function(element, event, handler) {
                if (arguments.length == 2) {
                    handler = event;
                    event = element;
                    element = this;
                }
                if (element.removeEventListener) {
                    element.removeEventListener(event, handler);
                } else {
                    if (event == 'input') {
                        event = 'propertychange';
                    }
                    element.detachEvent('on' + event, handler);
                }
            };

            fly.addClass = function(element, value) {
                var classes, cur, curValue, clazz, j, finalValue, i = 0;
                classes = value.match(rnotwhite) || [];

                curValue = getClass(element);
                cur = element.nodeType === 1 &&
                    (" " + curValue + " ").replace(rclass, " ");

                if (cur) {
                    j = 0;
                    while ((clazz = classes[j++])) {
                        if (cur.indexOf(" " + clazz + " ") < 0) {
                            cur += clazz + " ";
                        }
                    }

                    finalValue = $.trim(cur);
                    if (curValue !== finalValue) {
                        element.setAttribute("class", finalValue);
                    }
                }
            };

            fly.removeClass = function(element, value) {
                var classes, cur, curValue, clazz, j, finalValue, i = 0;
                classes = value.match(rnotwhite) || [];
                curValue = getClass(element);

                cur = element.nodeType === 1 &&
                    (" " + curValue + " ").replace(rclass, " ");

                if (cur) {
                    j = 0;
                    while ((clazz = classes[j++])) {

                        while (cur.indexOf(" " + clazz + " ") > -1) {
                            cur = cur.replace(" " + clazz + " ", " ");
                        }
                    }

                    finalValue = $.trim(cur);
                    if (curValue !== finalValue) {
                        element.setAttribute("class", finalValue);
                    }
                }
            };

            /**
             * 删除元素属性
             * @param {object} element [[Description]]
             * @param {string} key     [[Description]]
             */
            fly.deleteExpando = function(element, key) {
                if (typeof element == STRING) {
                    key = element;
                    element = this;
                }
                if (support.deleteExpando) {
                    delete element[key];
                } else if (element.removeAttribute) {
                    element.removeAttribute(key);
                } else {
                    element[key] = null;
                }
            };

            fly.dataset = function(element) {
                if (support.dataset) {
                    return element.dataset;
                } else {
                    var attrs = element.attributes,
                        expense = {},
                        i, j;
                    for (i = 0, j = attrs.length; i < j; i++) {
                        if (attrs[i].name.substring(0, 5) == 'data-') {
                            expense[attrs[i].name.substring(5)] = attrs[i].value;
                        }
                    }
                    return expense;
                }
            };

            /**
             * 获取元素className
             * @param   {object} elem 目标元素
             * @returns {string} className
             */
            function getClass(elem) {
                return elem.getAttribute && elem.getAttribute('class') || '';
            }


            /**
             * 函数节流
             * 创建并返回一个像节流阀一样的函数，当重复调用函数的时候，最多每隔 wait 毫秒调用一次该函数。
             * 对于想控制一些触发频率较高的事件有帮助。
             * 如果你想禁用第一次首先执行的话，传递 {leading: false}
             * 还有如果你想禁用最后一次执行的话，传递 {trailing: false}
             * 来自underscore
             * @param   {Function} func    要执行的函数
             * @param   {Number}   wait    频度时间
             * @param   {Object}   options 配置参数
             * @returns {Function} 已节流的函数
             */
            fly.throttle = function(func, wait, options) {
                var context, args, result;
                var timeout = null;
                var previous = 0;
                if (!options) options = {};
                var later = function() {
                    previous = options.leading === false ? 0 : fly.now();
                    timeout = null;
                    result = func.apply(context, args);
                    if (!timeout) context = args = null;
                };
                return function() {
                    var now = fly.now();
                    if (!previous && options.leading === false) previous = now;
                    var remaining = wait - (now - previous);
                    context = this;
                    args = arguments;
                    if (remaining <= 0 || remaining > wait) {
                        if (timeout) {
                            clearTimeout(timeout);
                            timeout = null;
                        }
                        previous = now;
                        result = func.apply(context, args);
                        if (!timeout) context = args = null;
                    } else if (!timeout && options.trailing !== false) {
                        timeout = setTimeout(later, remaining);
                    }
                    return result;
                };
            };

            /**
             * 函数防反跳
             * 将延迟函数的执行(真正的执行)在函数最后一次调用时刻的 wait 毫秒之后
             * 来自underscore
             * @param   {Function} func        要执行的函数
             * @param   {Number}   wait        等待的时间
             * @param   {Boolean}  [immediate] 为 true 时会在 wait 时间间隔的开始调用这个函数
             * @returns {Function} 函数的防反跳版本
             */
            fly.debounce = function(func, wait, immediate) {
                var timeout, args, context, timestamp, result;

                var later = function() {
                    var last = fly.now() - timestamp;
                    if (last < wait && last >= 0) {
                        timeout = setTimeout(later, wait - last);
                    } else {
                        timeout = null;
                        if (!immediate) {
                            result = func.apply(context, args);
                            if (!timeout) context = args = null;
                        }
                    }
                };

                return function() {
                    context = this;
                    args = arguments;
                    timestamp = fly.now();
                    var callNow = immediate && !timeout;
                    if (!timeout) timeout = setTimeout(later, wait);
                    if (callNow) {
                        result = func.apply(context, args);
                        context = args = null;
                    }

                    return result;
                };
            };

            /**
             * 处理url
             * @param   {String} url 原始url
             * @returns {String} 完整url
             */
            fly.absoluteURL = function(path, pathPrefix) {
                if (!pathPrefix) {
                    return path;
                }

                if (path + "/" === pathPrefix) {
                    path = pathPrefix;
                }

                var regEx = new RegExp("^" + pathPrefix, "i");

                if (!regEx.test(path)) {
                    path = pathPrefix + "/" + path;
                }

                return location.protocol + '//' + (location.host + "/" + path).replace(/\/\/+/g,
                    '/');
            };

            /**
             * 解析元素指定的属性值
             * @param   {Object} element 元素
             * @param   {String} option  属性
             * @returns {Any}    解析后的值
             */
            fly.parseOption = function(element, option) {
                var value;

                if (option.indexOf('data') === 0) {
                    option = option.substring(4);
                    option = option.charAt(0).toLowerCase() + option.substring(1);
                }

                option = option.replace(dashRegExp, "-$1").toLowerCase();
                value = element.getAttribute("data-" + option);

                if (value === null) {
                    value = undefined;
                } else if (value === "null") {
                    value = null
                } else if (value === "true") {
                    value = true;
                } else if (value === "false") {
                    value = false;
                } else if (numberRegExp.test(value)) {
                    value = parseFloat(value);
                } else if (jsonRegExp.test(value) && !jsonFormatRegExp.test(value)) {
                    value = new Function("return (" + value + ")")();
                }

                return value;
            };

            /**
             * 解析元素属性值
             * @param   {Object} element 元素
             * @param   {Object} options 需要解析的参数
             * @returns {Object} 解析后的值
             */
            fly.parseOptions = function(element, options) {
                var result = {},
                    placeholder = element.getAttribute(PLACEHOLDER),
                    option,
                    value;

                for (option in options) {
                    value = fly.parseOption(element, option);

                    if (value !== undefined) {
                        /*if (templateRegExp.test(option)) {
                value = fly.template($("#" + value).html());
            }*/
                        result[option] = value;
                    }
                }

                if (options[PLACEHOLDER] && placeholder && !result[PLACEHOLDER]) {
                    result[PLACEHOLDER] = placeholder;
                }

                return result;
            };

            /**
             * 计算字符串的字节长度
             * @param   {String} str 需要计算长度的字符串
             * @returns {Number} 字节长度
             */
            fly.getByteLen = function(str) {
                var len = 0,
                    str = str || '',
                    l = str.length,
                    i = 0;
                for (; i < l; i++) {
                    var code = str.charCodeAt(i);
                    if (code >= 0 && code <= 128) {
                        len += 1;
                    } else {
                        len += 2;
                    }
                }
                return len;
            };

            /**
             * 判断是否是DOM对象
             * @param   {object}  obj 需要检查的对象
             * @returns {boolean}
             */
            fly.isDOM = function(obj) {
                if (typeof HTMLElement === 'object') {
                    return obj instanceof HTMLElement;
                } else {
                    return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName ===
                        'string';
                }
            };


            /**
             * 在输入框中选取字符
             * @param   {Number} start [[Description]]
             * @param   {Number} end   [[Description]]
             * @returns {Object} document
             */
            fly.selectRange = function(element, start, end) {
                var range;
                if (arguments.length == 2) {
                    end = start;
                    start = element;
                    element = this;
                }
                element = element[0] || element;
                if (element.createTextRange) {
                    range = element.createTextRange();
                    range.collapse(true);
                    range.moveEnd(CHARACTER, end);
                    range.moveStart(CHARACTER, start);
                    range.select();
                } else {
                    element.focus();
                    element.setSelectionRange(start, end);
                }
                return element;
            };
        }, {
            "./fly.core": 4
        }
    ]
}, {}, [8]);
