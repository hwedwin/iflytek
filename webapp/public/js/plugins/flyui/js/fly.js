/*! flyui v1.0.4 | by huanzhang & ueteam | (c) 2017 iFlytek, Inc. | Licensed under  | 2017-03-14 15:03:08 GMT+0800 */
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
            return {};
        }, {}
    ],
    2: [
        function(require, module, exports) {
            /**
             * 顶部提示
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-28
             *
             * @update: 2016-04-21
             * @alter: jjjiang2
             * @email: jjjiang2@iflytek.com
             * @description: 添加必要注释
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                template = require('./fly.template'),
                register = ui.register,
                Widget = ui.Widget,
                $ = fly.$,
                extend = $.extend;

            var NAME = 'Alert', // 组件名称
                maxLength = 3; // 最多显示个数

            // 默认配置
            var defaults = ui.defaults[NAME] = {
                delay: 3000, // 延时消失
                css: 'info', // 显示样式
                content: '警告！' // 显示内容
            };

            // 提示容器
            var container;

            // 模板
            var tmpl = template.compile(
                '<div class="alert-animate">' +
                '<div class="alert alert-{{css}}" role="alert">' +
                '<a href="javascript:;" class="close icon icon-remove" title="关闭"></a>' +
                '{{# content}}</div>' +
                '</div>');

            var Alert = Widget.extend({

                name: NAME,

                options: defaults,

                ctor: function(element, options) {
                    var that = this;
                    if (!element) return;

                    that._super(element, options);
                    that.__check();
                    that.__animate();

                    that.time = setTimeout(function() {
                        that.destroy();
                    }, that.options.delay);
                },

                // 检查大于"maxLength"参数的并移除
                __check: function() {
                    container.children('.alert-animate:gt(' + (maxLength - 1) + ')').remove();
                },

                // 显示动画
                __animate: function() {
                    this.element.slideDown(300)
                        .children('.alert').animate({
                            opacity: 1,
                            top: 0
                        }, 300);
                },

                // 销毁组件
                destroy: function() {
                    var that = this;
                    that.element.remove();
                    that._super.destroy();
                }
            });

            var alert = function(options) {
                var element, alert;
                if (!container) {
                    container = $('.alert-container', fly.top.document);
                    if (container.length == 0) {
                        container = $('<div class="alert-container" />').appendTo($('body',
                            fly.top.document));
                    }
                }
                if (typeof options == 'string') {
                    options = {
                        content: options
                    };
                }
                options = extend({}, defaults, options);
                element = $(tmpl(options)).prependTo(container);
                alert = new Alert(element, options);

                fly.$win.unload(function() {
                    alert.destroy();
                });
                return alert;
            };

            fly.alert = fly.tip = alert;
            module.exports = Alert;

        }, {
            "./fly.core": 9,
            "./fly.template": 28,
            "./fly.ui": 32
        }
    ],
    3: [
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
                data = require('./fly.data'),
                tmpl = require('./fly.template'),
                ui = require('./fly.ui'),
                $ = fly.$,
                proxy = $.proxy,
                isArray = $.isArray,
                Class = fly.Class,
                DataSource = data.DataSource,
                Observable = fly.Observable,
                ObservableObject = fly.ObservableObject,
                ObservableArray = fly.ObservableArray,
                deleteExpando = fly.support.deleteExpando;

            // 绑定器
            var widgetBinders = {},
                binders = {
                    widget: widgetBinders
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
                READONLY = 'readonly';

            // 正则表达式
            var regKeyValue = /[A-Za-z0-9_\-]+:(\{([^}]*)\}|[^,}]+)/g,
                regWhiteSpace = /\s/g,
                regTemplate = /template$/i,
                regDate = /^\/Date\((.*?)\)\/$/,
                regNewLine = /(\r+|\n+)/g,
                regQuote = /(?=['\\])/g;

            //格式化字符串
            var toString = function(value, fmt, culture) {
                if (value && fmt) {
                    if (value.getTime()) {
                        return formatDate(value, fmt, culture);
                    } else if (typeof value === NUMBER) {
                        return formatNumber(value, fmt, culture);
                    }
                }

                return value !== undefined ? value : '';
            };

            var Binding = Observable.extend({

                ctor: function(parents, path) {
                    var that = this;
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

                    html = tmpl(this.template, value.toJSON && value.toJSON() || value);

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
                        widgetBinding = this instanceof WidgetBindingTarget,
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
                        } else if (key == CSS && !widgetBinding) {
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

                    if (hasCss && !widgetBinding) {
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
                        throw new Error('The ' + name +
                            ' binding is not supported by the ' + this.target
                            .nodeName.toLowerCase() + ' element');
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

            var WidgetBindingTarget = BindingTarget.extend({

                binders: function() {
                    return widgetBinders[this.target.name.toLowerCase()] || {};
                },

                applyBinding: function(name, bindings, specificBinders) {
                    var binder = specificBinders[name] || widgetBinders[name],
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
                        throw new Error('The ' + name +
                            ' binding is not supported by the ' + this.target
                            .name + ' widget');
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
                        value = fly.parseDate(value, 'yyyy-MM-dd');
                    } else if (dataType == 'datetime') {
                        value = fly.parseDate(value, 'yyyy-MM-dd HH:mm:ss');
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
                    var element = $(this.element),
                        binding = this.bindings.css[className],
                        hasClass = this.classes[className] = binding.get();
                    if (hasClass) {
                        element.addClass(className);
                    } else {
                        element.removeClass(className);
                    }
                }
            });

            binders.style = Binder.extend({
                refresh: function(key) {
                    this.element.style[key] = this.bindings.style[key].get() ||
                        "";
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
                    var element = $(this.element),
                        binding = this.bindings.events[key],
                        handler = this.handlers[key];

                    if (handler) {
                        element.off(key, handler);
                    }

                    handler = this.handlers[key] = binding.get();

                    element.on(key, binding.source, handler);
                },

                destroy: function() {
                    var element = $(this.element),
                        handler;

                    for (handler in this.handlers) {
                        element.off(handler, this.handlers[handler]);
                    }
                }
            });

            binders.text = Binder.extend({
                refresh: function() {
                    var text = this.bindings.text.get();
                    var dataFormat = this.element.getAttribute("data-format") ||
                        "";
                    if (text == null) {
                        text = "";
                    }

                    $(this.element).text(toString(text, dataFormat));
                }
            });

            binders.visible = Binder.extend({
                refresh: function() {
                    if (this.bindings.visible.get()) {
                        this.element.style.display = "";
                    } else {
                        this.element.style.display = "none";
                    }
                }
            });

            binders.invisible = Binder.extend({
                refresh: function() {
                    if (!this.bindings.invisible.get()) {
                        this.element.style.display = "";
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

                    $(this.element).on(this.eventName, this._change);

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

                        var type = this.dataType();

                        if (type == "date") {
                            value = toString(value, "yyyy-MM-dd");
                        } else if (type == "datetime-local") {
                            value = toString(value, "yyyy-MM-ddTHH:mm:ss");
                        }

                        this.element.value = value;
                    }

                    this._initChange = false;
                },

                destroy: function() {
                    $(this.element).off(this.eventName, this._change);
                }
            });

            binders.source = Binder.extend({

                ctor: function(element, bindings, options) {

                    this._super(element, bindings, options);

                    var source = this.bindings.source.get();
                    if (source instanceof DataSource && options.autoBind !== false) {
                        source.fetch();
                    }
                },

                refresh: function(e) {
                    var that = this,
                        source = that.bindings.source.get();

                    // if (source instanceof ObservableArray) {
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
                    // } else {
                    //     that.render();
                    // }
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
                        template = options.template,
                        nodeName = this.container().nodeName.toLowerCase();

                    if (!template) {
                        if (nodeName == "select") {
                            if (options.valueField || options.textField) {
                                template = '<option value="{{' + options.valueField ||
                                    options.textField + '}}">' + options.textField ||
                                    options.valueField + '</option>';
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
                        template = tmpl.compile(template);
                    } else {
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

                    $(clone).html(this.template()(items));

                    if (clone.children.length) {
                        parents = this.bindings.source._parents();

                        for (idx = 0, length = items.length; idx < length; idx++) {
                            child = clone.children[0];
                            element.insertBefore(child, reference || null);
                            bindElement(child, items[idx], this.options.roles, [
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
                        parents,
                        idx,
                        length,
                        element = this.container(),
                        template = this.template();

                    if (source instanceof DataSource) {
                        source = source.view();
                    }

                    if (!(source instanceof ObservableArray) && !isArray(source)) {
                        source = [source];
                    }

                    if (this.bindings.template) {
                        unbindElementChildren(element);

                        $(element).html(this.bindings.template.render(source));

                        if (element.children.length) {
                            parents = this.bindings.source._parents();

                            for (idx = 0, length = source.length; idx < length; idx++) {
                                bindElement(element.children[idx], source[idx],
                                    this.options.roles, [source[idx]].concat(
                                        parents));
                            }
                        }
                    } else {
                        $(element).html(template(source));
                    }
                }
            });

            binders.input = {
                checked: TypedBinder.extend({
                    ctor: function(element, bindings, options) {
                        this._super(element, bindings, options);
                        this._change = proxy(this.change, this);
                        $(this.element).on(CHANGE, this._change);
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
                        $(this.element).off(CHANGE, this._change);
                    }
                })
            };

            widgetBinders.events = Binder.extend({

                ctor: function(widget, bindings, options) {
                    this._super(widget.element[0], bindings, options);
                    this.widget = widget;
                    this.handlers = {};
                },

                refresh: function(key) {
                    var binding = this.bindings.events[key],
                        handler = this.handlers[key];

                    if (handler) {
                        this.widget.unbind(key, handler);
                    }

                    handler = binding.get();

                    this.handlers[key] = function(e) {
                        e.data = binding.source;

                        handler(e);

                        if (e.data === binding.source) {
                            delete e.data;
                        }
                    };

                    this.widget.bind(key, this.handlers[key]);
                },

                destroy: function() {
                    var handler;

                    for (handler in this.handlers) {
                        this.widget.unbind(handler, this.handlers[handler]);
                    }
                }
            });

            widgetBinders.checked = Binder.extend({

                ctor: function(widget, bindings, options) {
                    this._super(widget.element[0], bindings, options);
                    this.widget = widget;
                    this._change = proxy(this.change, this);
                    this.widget.bind(CHANGE, this._change);
                },
                change: function() {
                    this.bindings[CHECKED].set(this.value());
                },

                refresh: function() {
                    this.widget.check(this.bindings[CHECKED].get() === true);
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
                    this.widget.unbind(CHANGE, this._change);
                }
            });

            widgetBinders.visible = Binder.extend({

                ctor: function(widget, bindings, options) {
                    this._super(widget.element[0], bindings, options);
                    this.widget = widget;
                },

                refresh: function() {
                    var visible = this.bindings.visible.get();
                    this.widget.wrapper[0].style.display = visible ? "" : "none";
                }
            });

            widgetBinders.invisible = Binder.extend({

                ctor: function(widget, bindings, options) {
                    this._super(widget.element[0], bindings, options);
                    this.widget = widget;
                },

                refresh: function() {
                    var invisible = this.bindings.invisible.get();
                    this.widget.wrapper[0].style.display = invisible ? "none" : "";
                }
            });

            widgetBinders.enabled = Binder.extend({

                ctor: function(widget, bindings, options) {
                    this._super(widget.element[0], bindings, options);
                    this.widget = widget;
                },

                refresh: function() {
                    if (this.widget.enable) {
                        this.widget.enable(this.bindings.enabled.get());
                    }
                }
            });

            widgetBinders.disabled = Binder.extend({

                ctor: function(widget, bindings, options) {
                    this._super(widget.element[0], bindings, options);
                    this.widget = widget;
                },

                refresh: function() {
                    if (this.widget.enable) {
                        this.widget.enable(!this.bindings.disabled.get());
                    }
                }
            });

            widgetBinders.source = dataSourceBinding("source", "dataSource", "setDataSource");

            widgetBinders.value = Binder.extend({

                ctor: function(widget, bindings, options) {
                    this._super(widget.element[0], bindings, options);
                    this.widget = widget;
                    this._change = proxy(this.change, this);
                    this.widget.first(CHANGE, this._change);

                    var value = this.bindings.value.get();

                    //value == null
                    this._valueIsObservableObject = !options.valuePrimitive && value instanceof ObservableObject;
                    this._valueIsObservableArray = value instanceof ObservableArray;
                    this._initChange = false;
                },

                change: function() {
                    var value = this.widget.value(),
                        field = this.options.valueField || this.options.textField,
                        isArray = toString.call(value) === "[object Array]",
                        isObservableObject = this._valueIsObservableObject,
                        valueIndex, valueLength, values = [],
                        sourceItem, sourceValue,
                        idx, length, source;

                    this._initChange = true;

                    if (field) {

                        if (this.bindings.source) {
                            source = this.bindings.source.get();
                        }

                        if (value === "" && (isObservableObject || this.options.valuePrimitive)) {
                            value = null;
                        } else {
                            if (!source || source instanceof DataSource) {
                                source = this.widget.dataSource.view();
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
                        var widget = this.widget;
                        var textField = this.options.textField;
                        var valueField = this.options.valueField || textField;
                        var value = this.bindings.value.get();
                        var text = this.options.text || "";
                        var idx = 0,
                            length;
                        var values = [];

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

                        if (widget.options.autoBind === false && widget.listView && !widget
                            .listView.isBound()) {
                            if (textField === valueField && !text) {
                                text = value;
                            }

                            widget._preselect(value, text);
                        } else {
                            widget.value(value);
                        }
                    }

                    this._initChange = false;
                },

                destroy: function() {
                    this.widget.unbind(CHANGE, this._change);
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

            function rolesFromNamespaces(namespaces) {
                var roles = [],
                    idx,
                    length;

                if (!namespaces[0]) {
                    namespaces = [fly.ui];
                }

                for (idx = 0, length = namespaces.length; idx < length; idx++) {
                    roles[idx] = namespaces[idx].roles;
                }

                return $.extend.apply(null, [{}].concat(roles.reverse()));
            };

            function bindElement(element, source, roles, parents) {
                var role = element.getAttribute("data-role"),
                    bind = element.getAttribute("data-bind"),
                    children = element.children,
                    childrenCopy = [],
                    deep = true,
                    bindings,
                    options = {},
                    idx,
                    target;

                parents = parents || [source];

                if (role || bind) {
                    unbindElement(element);
                }

                if (role) {
                    target = bindingTargetForRole(element, roles);
                }

                if (bind) {
                    bind = parseBindings(bind.replace(regWhiteSpace, ""));

                    if (!target) {
                        options = utils.parseEleOptions(element, {
                            textField: "",
                            valueField: "",
                            template: "",
                            valueUpdate: "change",
                            valuePrimitive: false,
                            itemChange: true,
                            autoBind: true
                        });
                        options.roles = roles;
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

                if (deep && children) {
                    for (idx = 0; idx < children.length; idx++) {
                        childrenCopy[idx] = children[idx];
                    }

                    for (idx = 0; idx < childrenCopy.length; idx++) {
                        bindElement(childrenCopy[idx], source, roles, parents);
                    }
                }
            }

            function unbindElement(element) {
                var bindingTarget = element.flyBindingTarget;

                if (bindingTarget) {
                    bindingTarget.destroy();

                    if (deleteExpando) {
                        delete element.flyBindingTarget;
                    } else if (element.removeAttribute) {
                        element.removeAttribute("flyBindingTarget");
                    } else {
                        element.flyBindingTarget = null;
                    }
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

                dom = $(dom);

                for (idx = 0, length = dom.length; idx < length; idx++) {
                    unbindElementTree(dom[idx]);
                }
            }

            function bind(dom, object) {
                var idx,
                    length,
                    node,
                    roles = rolesFromNamespaces([].slice.call(arguments, 2));

                $(dom).each(function() {
                    node = $(this)[0];
                    if (node.nodeType === 1) {
                        bindElement(node, object, roles);
                    }
                });
            }

            function notify(widget) {
                var element = widget.element,
                    bindingTarget = element[0].flyBindingTarget;

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

            function bindingTargetForRole(element, roles) {
                var widget = fly.ui.initWidget(element, {}, roles);

                if (widget) {
                    return new WidgetBindingTarget(widget);
                }
            }

            function dataSourceBinding(bindingName, fieldName, setter) {
                return Binder.extend({

                    ctor: function(widget, bindings, options) {
                        var that = this;

                        that._super(widget.element[0], bindings, options);

                        that.widget = widget;
                        that._dataBinding = proxy(that.dataBinding, that);
                        that._dataBound = proxy(that.dataBound, that);
                        that._itemChange = proxy(that.itemChange, that);
                    },

                    itemChange: function(e) {
                        bindElement(e.item[0], e.data, this._ns(e.ns), [e.data].concat(
                            this.bindings[bindingName]._parents()));
                    },

                    dataBinding: function(e) {
                        var idx,
                            length,
                            widget = this.widget,
                            items = e.removedItems || widget.items();

                        for (idx = 0, length = items.length; idx < length; idx++) {
                            unbindElementTree(items[idx]);
                        }
                    },

                    _ns: function(ns) {
                        ns = ns || fly.ui;
                        return rolesFromNamespaces([ns]);
                    },

                    dataBound: function(e) {
                        var idx,
                            length,
                            widget = this.widget,
                            items = e.addedItems || widget.items(),
                            dataSource = widget[fieldName],
                            view,
                            parents;

                        if (items.length) {
                            view = e.addedDataItems || dataSource.view();
                            parents = this.bindings[bindingName]._parents();

                            for (idx = 0, length = view.length; idx < length; idx++) {
                                bindElement(items[idx], view[idx], this._ns(e.ns), [
                                    view[idx]
                                ].concat(parents));
                            }
                        }
                    },

                    refresh: function(e) {
                        var that = this,
                            source,
                            widget = that.widget;

                        e = e || {};

                        if (!e.action) {
                            that.destroy();

                            widget.bind("dataBinding", that._dataBinding);
                            widget.bind("dataBound", that._dataBound);
                            widget.bind("itemChange", that._itemChange);

                            source = that.bindings[bindingName].get();

                            if (widget[fieldName] instanceof DataSource && widget[
                                    fieldName] != source) {
                                if (source instanceof DataSource) {
                                    widget[setter](source);
                                } else if (source && source._dataSource) {
                                    widget[setter](source._dataSource);
                                } else {
                                    widget[fieldName].data(source);
                                    // widget instanceof ui.MultiSelect
                                    if (that.bindings.value && (widget instanceof ui.Select)) {
                                        widget.value(retrievePrimitiveValues(that.bindings
                                            .value.get(), widget.options.valueField
                                        ));
                                    }
                                }
                            }
                        }
                    },

                    destroy: function() {
                        var widget = this.widget;

                        widget.unbind("dataBinding", this._dataBinding);
                        widget.unbind("dataBound", this._dataBound);
                        widget.unbind("itemChange", this._itemChange);
                    }
                });
            }

            fly.bind = bind;
            fly.unbind = unbind;
            fly.notify = notify;

            module.exports = bind;

        }, {
            "./fly.core": 9,
            "./fly.data": 10,
            "./fly.template": 28,
            "./fly.ui": 32,
            "./fly.utils": 34
        }
    ],
    4: [
        function(require, module, exports) {
            /**
             * 按钮
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-08
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                register = ui.register,
                Widget = ui.Widget,
                $ = fly.$,
                keys = fly.keys,
                proxy = $.proxy;

            // 静态变量
            var NAME = 'Button',
                NS = '.' + fly.NS + NAME,
                CLICK = 'click',
                DISABLED = 'disabled',
                FOCUSEDSTATE = 'focus',
                SELECTEDSTATE = 'active',
                GLYPHICON = 'glyphicon';

            var defaults = ui.defaults[NAME] = {
                icon: '',
                css: 'default',
                text: '',
                enable: true
            };

            // 按钮组件
            var Button = Widget.extend({

                name: NAME,

                options: defaults,

                /**
                 * 构造函数
                 * @param {Object} element jqueryDOM对象
                 * @param {Object} options 配置参数
                 * @param {String} name    组件名
                 */
                ctor: function(element, options) {
                    var that = this;

                    // 调用父类的构造函数
                    that._super(element, options);

                    element = that.wrapper = that.element;
                    element.addClass('btn').attr('role', 'button');

                    options = that.options;
                    options.enable = options.enable && !element.attr(DISABLED);

                    that.enable(options.enable);

                    that._tabindex();

                    that._render();

                    // dom事件绑定
                    element
                        .on(CLICK + NS, proxy(that._click, that))
                        .on('focus' + NS, proxy(that._focus, that))
                        .on('blur' + NS, proxy(that._blur, that))
                        .on('keydown' + NS, proxy(that._keydown, that))
                        .on('keyup' + NS, proxy(that._keyup, that));

                    fly.notify(that);
                },

                /**
                 * 组件销毁
                 */
                destroy: function() {
                    this.wrapper.off(NS);
                    this._super.destroy();
                },

                // 组件级别的事件，可以在options中定义事件回调
                events: [
                    CLICK
                ],

                /**
                 * 判断是否原生按钮
                 * @returns {Boolean} 若是button则为true
                 */
                _isNativeButton: function() {
                    return this.element.prop('tagName').toLowerCase() == 'button';
                },

                /**
                 * 触发点击事件
                 * @param {Object} e [[Description]]
                 */
                _click: function(e) {
                    if (this.options.enable) {
                        if (this.trigger(CLICK, {
                                event: e
                            })) {
                            e.preventDefault();
                        }
                    }
                },

                _focus: function() {
                    if (this.options.enable) {
                        this.element.addClass(FOCUSEDSTATE);
                    }
                },

                _blur: function() {
                    this.element.removeClass(FOCUSEDSTATE);
                },

                /**
                 * 按下ENTER时触发
                 * @param {Object} e [[Description]]
                 */
                _keydown: function(e) {
                    var that = this;
                    if (!that._isNativeButton() && e.keyCode == keys.ENTER) {
                        that._click(e);
                    }
                },

                _keyup: function() {
                    this.element.removeClass(SELECTEDSTATE);
                },

                _render: function() {
                    var that = this,
                        element = that.element,
                        options = that.options,
                        icon = options.icon,
                        css = options.css,
                        text = options.text || element.text(),
                        span;

                    if (text) {
                        // 如果有图标，则加一个空格
                        element.html((icon ? ' ' : '') + text);
                    }

                    if (icon) {
                        span = element.children('span.' + GLYPHICON).first();
                        if (!span[0]) {
                            span = $('<span class="' + GLYPHICON + '"></span>').prependTo(
                                element);
                        }
                        span.addClass(GLYPHICON + '-' + icon);
                    }

                    if (css) {
                        element.addClass('btn-' + css);
                    }
                },

                /**
                 * 可用状态切换
                 * @param {[[Type]]} enable [[Description]]
                 */
                enable: function(enable) {
                    var that = this,
                        element = that.element;

                    if (enable === undefined) {
                        enable = true;
                    }

                    enable = !!enable;
                    that.options.enable = enable;
                    element.toggleClass(DISABLED, !enable)
                        .attr('aria-disabled', !enable)
                        .attr(DISABLED, !enable);

                    // IE中的iframe可能会报错
                    try {
                        element.blur();
                    } catch (err) {}
                }
            });

            register(Button);
            module.exports = Button;

        }, {
            "./fly.core": 9,
            "./fly.ui": 32
        }
    ],
    5: [
        function(require, module, exports) {
            /**
             * 精确计算
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-07-27
             */

            'use strict';

            // 依赖core
            var fly = require("./fly.core");

            var calculate = {},
                math = Math;

            /**
             * 获取小数位数
             * @param {Number} num 小数部分位数
             */
            var digits = function(num) {
                var length;
                try {
                    length = num.toString().split('.')[1].length;
                } catch (e) {
                    length = 0;
                }
                return length;
            };

            /**
             * 将小数化为整数
             * @param {Number} num 化整后的整数
             */
            var integer = function(num) {
                return Number(num.toString().replace('.', ''));
            }

            /**
             * 加法运算
             * @param   {Number} arg1 被加数
             * @param   {Number} arg2 加数
             * @returns {Number} 和
             */
            calculate.add = function(arg1, arg2) {
                var n = math.max(digits(arg1), digits(arg2)),
                    m = math.pow(10, n);
                return math.floor(arg1 * m + arg2 * m) / m;
            };

            /**
             * 减法运算
             * @param   {Number} arg1 被减数
             * @param   {Number} arg2 减数
             * @returns {Number} 差
             */
            calculate.sub = function(arg1, arg2) {
                var n = math.max(digits(arg1), digits(arg2)),
                    m = math.pow(10, n);
                return math.floor(arg1 * m - arg2 * m) / m;
            };

            /**
             * 乘法运算
             * @param   {Number} arg1 被乘数
             * @param   {Number} arg2 乘数
             * @returns {Number} 积
             */
            calculate.mul = function(arg1, arg2) {
                var n = digits(arg1) + digits(arg2),
                    m = math.pow(10, n);
                return integer(arg1) * integer(arg2) / m;
            };

            /**
             * 除法运算
             * @param   {Number} arg1 被除数
             * @param   {Number} arg2 除数
             * @returns {Number} 商
             */
            calculate.div = function(arg1, arg2) {
                var n = digits(arg2) - digits(arg1),
                    m = math.pow(10, n);
                return (integer(arg1) / integer(arg2)) * m;
            };

            fly.calc = calculate;
            module.exports = calculate;
        }, {
            "./fly.core": 9
        }
    ],
    6: [
        function(require, module, exports) {
            /**
             * 日历组件
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-28
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                template = require('./fly.template'),
                Widget = ui.Widget,
                register = ui.register,
                $ = fly.$,
                each = $.each,
                map = $.map,
                proxy = $.proxy,
                extend = $.extend,
                objectToString = {}.toString;

            var NAME = 'Calender',
                CLICK = 'click.' + NAME,
                ACTIVE = 'active',
                STRING = 'string',
                DISABLED = 'disabled';

            var months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月',
                    '十二月'
                ],
                days = ['一', '二', '三', '四', '五', '六', '日'],
                modes = ['days', 'years', 'months', 'hours', 'minutes', 'seconds'],
                modeTime = {
                    'days': 86400000,
                    'hours': 3600000,
                    'minutes': 60000,
                    'seconds': 1000
                },
                modeMapping = {
                    'years': '年',
                    'months': '月',
                    'hours': '时',
                    'minutes': '分',
                    'seconds': '秒'
                };

            var hourReg = /H+/;

            var defaults = ui.defaults[NAME] = {
                format: 'yyyy-MM-dd',
                minDate: -Infinity,
                maxDate: Infinity,
                weekStart: 1,
                weekEnd: 0
            };

            var isLeapYear = function(year) {
                return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
            };

            var getDaysInMonth = function(year, month) {
                return [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31,
                    30, 31
                ][month];
            };

            var toUpperCase = function(str) {
                return str.replace(/^[a-z]/, function(m) {
                    return m.toUpperCase()
                });
            };

            var headerTemplate = template.compile(
                '<div class="switch clearfix">' +
                '    {{if menu}}' +
                '    <span class="next" unselectable="on"><i class="icon icon-menu-right"></i></span>' +
                '    <span class="prev" unselectable="on"><i class="icon icon-menu-left"></i></span>' +
                '    {{/if}}' +
                '    <div class="date">' +
                '        {{if name}}' +
                '        请选择{{name}}' +
                '        {{else}}' +
                '        <span class="year">{{year}}年</span>' +
                '        <span class="month">{{month}}</span>' +
                '        {{/if}}' +
                '    </div>' +
                '</div>');

            var bodyTemplate = template.compile(
                '<table cellpadding="0" cellspacing="0">' +
                '    {{if mode == "days"}}' +
                '    <thead>' +
                '        <tr>' +
                '            {{each days as item}}' +
                '            <th class="dow">{{item}}</th>' +
                '            {{/each}}' +
                '        </tr>' +
                '        <tr><th colspan="7" class="border"></th></tr>' +
                '    </thead>' +
                '    {{/if}}' +
                '    <tbody>' +
                '    </tbody>' +
                '</table>');

            var footerTemplate = template.compile(

                '<div class="control clearfix">' +
                '    <button type="button" class="ok btn btn-primary btn-sm">确定</button>' +
                '    <button type="button" class="cancel btn btn-defalut btn-sm">清除</button>' +
                '{{if time}}' +
                '    <div class="time">' +
                '        <span class="hour">{{hour}}</span> :' +
                '        <span class="minute">{{minute}}</span> :' +
                '        <span class="second">{{second}}</span>' +
                '    </div>' +
                '{{/if}}' +
                '</div>');

            var Calender = Widget.extend({

                name: NAME,

                options: defaults,

                ctor: function(element, options) {
                    var that = this,
                        date = new Date();
                    if (!element) return;

                    that._super(element, options);
                    options = that.options;
                    if (options.value) {
                        date = fly.parseDate(options.value);
                    }
                    /*if (typeof options.minDate == STRING) {
            options.minDate = fly.parseDate(options.minDate).getTime();
        }
        if (typeof options.maxDate == STRING) {
            options.maxDate = fly.parseDate(options.maxDate).getTime();
        }*/

                    that.time = hourReg.test(this.options.format);
                    that.date = date;
                    that.viewDate = new Date(date);
                    that.selectDate = '';
                    that._wrapper();
                    that.days.show();
                    that._fillDays();
                },

                events: [
                    'ok',
                    'clear'
                ],

                _wrapper: function() {
                    var that = this,
                        itemName;

                    that.wrapper = $('<div class="calender" />').appendTo(that.element);

                    each(modes, function(i, item) {
                        itemName = item.substring(0, item.length - 1);
                        that[item] = $('<div class="calender-' + item + '" />').appendTo(
                            that.wrapper).hide();
                        that._createHeader(item).appendTo(that[item]);
                        that._createBody(item).appendTo(that[item])
                            .on(CLICK, 'td.' + itemName + ':not(.disabled)', proxy(
                                that['_select' + toUpperCase(itemName)], that));
                        that._createFooter(item).appendTo(that[item]);
                    });
                },

                _min: function() {
                    var minDate = this.options.minDate,
                        min = -Infinity;

                    if (this.__min) {
                        return this.__min;
                    }

                    if (objectToString.call(minDate) === '[object Date]') {
                        min = minDate.getTime();
                    } else if (typeof minDate == STRING) {
                        if (minDate.indexOf('||') > 0) {
                            min = this._sort(minDate.split('||'));
                        } else if (minDate.indexOf('&&') > 0) {
                            min = this._sort(minDate.split('&&'), true);
                        } else {
                            min = this._sort([minDate]);
                        }
                    }
                    this.__min = min;
                    return min;
                },

                _max: function() {
                    var maxDate = this.options.maxDate,
                        max = Infinity;

                    if (this.__max) {
                        return this.__max;
                    }

                    if (objectToString.call(maxDate) === '[object Date]') {
                        max = maxDate.getTime();
                    } else if (typeof maxDate == STRING) {
                        if (maxDate.indexOf('||') > 0) {
                            max = this._sort(maxDate.split('||'), true);
                        } else if (maxDate.indexOf('&&') > 0) {
                            max = this._sort(maxDate.split('&&'));
                        } else {
                            max = this._sort([maxDate]);
                        }
                    }
                    this.__max = max;
                    return max;
                },

                _sort: function(dates, desc) {
                    var newdates = [],
                        newdate, dateWidget;
                    each(dates, function(i, item) {
                        newdate = fly.parseDate(item);
                        if (item == '$now') {
                            newdates.push(new Date().getTime());
                        } else if (newdate.getTime && newdate.getTime()) {
                            newdates.push(newdate.getTime());
                        } else if ($(item).length && $(item).data('handler')) {
                            newdate = $(item).data('handler').value();
                            newdate = fly.parseDate(newdate);
                            newdate && newdates.push(newdate.getTime());
                        }
                    });
                    newdates.sort();
                    return newdates[desc ? newdates.length - 1 : 0]
                },

                _date: function() {
                    this.date = this.date || new Date();
                    return this.date;
                },

                _createHeader: function(mode) {
                    var that = this,
                        date = that.date,
                        header;

                    header = $(headerTemplate({
                        name: modeMapping[mode],
                        menu: (mode == 'days' || mode == 'years') ? true : false,
                        year: date.getFullYear(),
                        month: months[date.getMonth()]
                    }));

                    if (mode == 'days') {
                        header.on(CLICK, '.next', proxy(that._nextMonth, that))
                            .on(CLICK, '.prev', proxy(that._prevMonth, that))
                            .on(CLICK, '.year', proxy(that._switch, that, 'years'))
                            .on(CLICK, '.month', proxy(that._switch, that, 'months'));
                    } else if (mode == 'years') {
                        header.on(CLICK, '.next', proxy(that._nextYears, that))
                            .on(CLICK, '.prev', proxy(that._prevYears, that));
                    }

                    return header;
                },

                _createBody: function(mode) {
                    return $(bodyTemplate({
                        mode: mode,
                        days: days
                    }));
                },

                _createFooter: function(mode) {
                    var that = this,
                        date = that.date;
                    return $(footerTemplate({
                            time: (mode == 'days' && that.time) ? true : false,
                            hour: that._parseTime(date.getHours()),
                            minute: that._parseTime(date.getMinutes()),
                            second: that._parseTime(date.getSeconds())
                        })).on(CLICK, '.ok', proxy(that._ok, that))
                        .on(CLICK, '.cancel', proxy(that._clear, that))
                        .on(CLICK, '.hour', proxy(that._switch, that, 'hours'))
                        .on(CLICK, '.minute', proxy(that._switch, that, 'minutes'))
                        .on(CLICK, '.second', proxy(that._switch, that, 'seconds'));
                },

                _fillDays: function() {
                    var that = this,
                        date = that.date,
                        options = that.options,
                        viewDate = that.viewDate,
                        viewYear = viewDate.getFullYear(),
                        viewMonth = viewDate.getMonth(),
                        currentDate = new Date(date.getFullYear(), date.getMonth(),
                            date.getDate()),
                        prevMonth = new Date(viewYear, viewMonth - 1, 28),
                        day = getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth()),
                        nextMonth,
                        rows = [],
                        row,
                        clsName;

                    that.__min = null;
                    that.__max = null;

                    that.days.find('.year').text(viewYear);
                    that.days.find('.month').text(months[viewMonth]);

                    prevMonth.setDate(day);
                    prevMonth.setDate(day - (prevMonth.getDay() - options.weekStart + 7) %
                        7);
                    nextMonth = new Date(prevMonth.valueOf());
                    nextMonth.setDate(nextMonth.getDate() + 42);
                    nextMonth = nextMonth.valueOf();

                    while (prevMonth.valueOf() < nextMonth) {
                        if (prevMonth.getDay() === options.weekStart) {
                            row = $('<tr>');
                            rows.push(row);
                        }
                        clsName = '';
                        if (prevMonth.getFullYear() < viewYear ||
                            (prevMonth.getFullYear() == viewYear &&
                                prevMonth.getMonth() < viewMonth)) {
                            clsName += ' old';
                        } else if (prevMonth.getFullYear() > viewYear ||
                            (prevMonth.getFullYear() == viewYear &&
                                prevMonth.getMonth() > viewMonth)) {
                            clsName += ' new';
                        }
                        if (prevMonth.valueOf() === currentDate.valueOf()) {
                            clsName += ' ' + ACTIVE;
                        }
                        if ((prevMonth.valueOf() + modeTime.days) <= that._min()) {
                            clsName += ' ' + DISABLED;
                        }
                        if (prevMonth.valueOf() > that._max()) {
                            clsName += ' ' + DISABLED;
                        }
                        row.append('<td class="day' + clsName + '">' + prevMonth.getDate() +
                            '</td>');
                        prevMonth.setDate(prevMonth.getDate() + 1);
                    }
                    that.days.find('tbody').empty().append(rows);
                },

                _fillYears: function() {
                    var date = this.date,
                        year = date.getFullYear(),
                        viewDate = this.viewDate,
                        viewYear = viewDate.getFullYear(),
                        displayNumber = 16,
                        rows = [],
                        row,
                        i = 0;

                    viewYear = parseInt(viewYear / displayNumber, 10) * displayNumber;
                    for (; i < displayNumber; i++) {
                        if (i % 4 == 0) {
                            row = $('<tr>');
                            rows.push(row);
                        }
                        row.append('<td class="year' + (year === viewYear ? (' ' +
                                ACTIVE) : '') +
                            '">' +
                            viewYear + '</td>');
                        viewYear += 1;
                    }
                    this.years.find('tbody').empty().append(rows);
                },

                _fillMonths: function() {
                    var viewMonth = this.viewDate.getMonth(),
                        rows = [],
                        row,
                        l = months.length,
                        i = 0;
                    for (; i < l; i++) {
                        if (i % 3 == 0) {
                            row = $('<tr>');
                            rows.push(row);
                        }
                        row.append('<td data-month="' + i + '" class="month' + (i ===
                                viewMonth ? (
                                    ' ' + ACTIVE) : '') + '">' +
                            months[i] + '</td>');
                    }
                    this.months.find('tbody').empty().append(rows);
                },

                _parseTime: function(t) {
                    return (t < 10 ? '0' : '') + t;
                },

                _fillTime: function() {
                    var date = this.date;
                    this.days.find('.hour').text(this._parseTime(date.getHours()))
                        .end().find('.minute').text(this._parseTime(date.getMinutes()))
                        .end().find('.second').text(this._parseTime(date.getSeconds()));
                },

                _fillTimes: function(column, total, mode) {
                    var that = this,
                        viewDate = this.viewDate,
                        item = mode.substring(0, mode.length - 1),
                        targetTime = new Date(viewDate),
                        viewTime,
                        isActive,
                        isDisabled,
                        rows = [],
                        row,
                        i = 0;

                    that.__min = null;
                    that.__max = null;
                    viewTime = viewDate['get' + toUpperCase(mode)]();

                    if (mode == 'hours') {
                        targetTime.setMinutes(0);
                        targetTime.setSeconds(0);
                    } else if (mode == 'minutes') {
                        targetTime.setSeconds(0);
                        targetTime.setMilliseconds(0);
                    }

                    for (; i < total; i++) {
                        targetTime['set' + toUpperCase(mode)](i);
                        if (i % column == 0) {
                            row = $('<tr>');
                            rows.push(row);
                        }
                        isActive = i === viewTime ? (' ' + ACTIVE) : '';
                        isDisabled = (function() {
                            if ((targetTime.valueOf() + modeTime[mode]) <= that._min()) {
                                return ' ' + DISABLED;
                            }
                            if (targetTime.valueOf() > that._max()) {
                                return ' ' + DISABLED;
                            }
                            return '';
                        })();
                        row.append('<td class="' + item + isActive + isDisabled + '">' +
                            this._parseTime(
                                i) + '</td>');
                    }

                    return rows;
                },

                _fillHours: function() {
                    this.hours.find('tbody').empty().append(this._fillTimes(6, 24,
                        'hours'));
                },

                _fillMinutes: function() {
                    this.minutes.find('tbody').empty().append(this._fillTimes(10, 60,
                        'minutes'));
                },

                _fillSeconds: function() {
                    this.seconds.find('tbody').empty().append(this._fillTimes(10, 60,
                        'seconds'));
                },

                _nextMonth: function() {
                    var month = this.viewDate.getMonth() + 1,
                        newDate = new Date(this.viewDate);
                    newDate.setMonth(month);
                    if (newDate.getMonth() != month) {
                        this.viewDate.setDate(1);
                        this.date.setDate(1);
                    }
                    this.viewDate.setMonth(month);
                    this.date.setMonth(month);
                    this._fillDays();
                },

                _prevMonth: function() {
                    var month = this.viewDate.getMonth() - 1;
                    this.viewDate.setMonth(month);
                    this.date.setMonth(month);
                    this._fillDays();
                },

                _nextYears: function() {
                    this.viewDate.setFullYear(this.viewDate.getFullYear() + 16);
                    this._fillYears();
                },

                _prevYears: function() {
                    this.viewDate.setFullYear(this.viewDate.getFullYear() - 16);
                    this._fillYears();
                },

                _switch: function(mode) {
                    var that = this;
                    each(modes, function(i, item) {
                        if (mode == item) {
                            that[item].show();
                            that['_fill' + toUpperCase(item)]();
                        } else {
                            that[item].hide();
                        }
                    });
                },

                _selectDay: function(e) {
                    var $day = $(e.target).addClass(ACTIVE),
                        day = parseInt($day.text());

                    this.days.find('.' + ACTIVE).not($day).removeClass(ACTIVE);

                    if ($day.hasClass('old')) {
                        this._prevMonth();
                    } else if ($day.hasClass('new')) {
                        this._nextMonth();
                    }

                    this.viewDate.setDate(day);
                    this.date.setDate(day);

                    if (!this.time) {
                        this._ok(e);
                    }
                },

                _selectYear: function(e) {
                    var $year = $(e.target).addClass(ACTIVE),
                        year = parseInt($year.text());
                    this.years.find('.' + ACTIVE).not($year).removeClass(ACTIVE);
                    this.viewDate.setFullYear(year);
                    this.date.setFullYear(year);
                    this._switch('months');
                },

                _selectMonth: function(e) {
                    var $month = $(e.target).addClass(ACTIVE),
                        month = $month.data('month');
                    this.months.find('.' + ACTIVE).not($month).removeClass(ACTIVE);
                    this.viewDate.setMonth(month);
                    this.date.setMonth(month);
                    this._switch('days');
                },

                _selectHour: function(e) {
                    var $hour = $(e.target).addClass(ACTIVE),
                        hour = parseInt($hour.text());
                    this.hours.find('.' + ACTIVE).not($hour).removeClass(ACTIVE);
                    this.viewDate.setHours(hour);
                    this.date.setHours(hour);
                    this._switch('days');
                    this._fillTime();
                },

                _selectMinute: function(e) {
                    var $minute = $(e.target).addClass(ACTIVE),
                        minute = parseInt($minute.text());
                    this.hours.find('.' + ACTIVE).not($minute).removeClass(ACTIVE);
                    this.viewDate.setMinutes(minute);
                    this.date.setMinutes(minute);
                    this._switch('days');
                    this._fillTime();
                },

                _selectSecond: function(e) {
                    var $second = $(e.target).addClass(ACTIVE),
                        second = parseInt($second.text());
                    this.hours.find('.' + ACTIVE).not($second).removeClass(ACTIVE);
                    this.viewDate.setSeconds(second);
                    this.date.setSeconds(second);
                    this._switch('days');
                    this._fillTime();
                },

                value: function(value) {
                    if (value === undefined) {
                        return this.selectDate;
                    }
                    this.date = value ? fly.parseDate(value) : new Date();
                    this.viewDate = value ? fly.parseDate(value) : new Date();
                    this.selectDate = value;
                    this._switch('days');
                    this._fillDays();
                    this._fillTime();
                    value && this._ok();
                },

                _ok: function(e) {
                    var options = this.options,
                        newDate = new Date(fly.parseDate(this.date, options.format.replace(
                            /-/g, '/')));

                    if (newDate.getTime() < this._min() || newDate.getTime() > this._max()) {
                        return false;
                    }

                    this.selectDate = fly.parseDate(newDate, options.format);
                    this.trigger('ok', {
                        event: e,
                        date: newDate,
                        result: this.selectDate
                    });
                },

                _clear: function(e) {
                    this.selectDate = '';
                    this.trigger('clear', {
                        event: e
                    });
                },

                destroy: function() {
                    this._super.destroy();
                }

            });


            register(Calender);
            module.exports = Calender;

        }, {
            "./fly.core": 9,
            "./fly.template": 28,
            "./fly.ui": 32
        }
    ],
    7: [
        function(require, module, exports) {
            /**
             * class基类
             * John Resig Class.js
             * 因为callee，这里不能使用严格模式
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-07-01
             */

            var fly = require('./fly.core');

            var Class = function() {};

            var CTOR = 'ctor', //构造函数名
                EXTEND = 'extend',
                FUNCTION = 'function';

            /**
             * 给基类增加一个extend方法
             * @param   {Object}   prop 扩展的属性
             * @returns {[[Type]]} [[Description]]
             */
            Class.extend = function(prop) {

                var _super = this.prototype;

                // 父类的实例赋给变量prototype
                var prototype = new this();

                // 把要扩展的属性复制到prototype变量上
                for (var name in prop) {
                    // this._super访问父类的实例
                    prototype[name] = name == CTOR && typeof prop[name] == FUNCTION &&
                        typeof _super[name] == FUNCTION ?
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
                    // 执行真正的ctor构造函数
                    this.ctor.apply(this, arguments);
                }

                // 继承父类的静态属性
                for (var key in this) {
                    if (this.hasOwnProperty(key) && key != EXTEND)
                        Class[key] = this[key];
                }

                // 子类的原型指向父类的实例
                Class.prototype = prototype;

                // 父类的实例
                Class.prototype._super = new this();

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

            fly.Class = Class;
            module.exports = Class;
        }, {
            "./fly.core": 9
        }
    ],
    8: [
        function(require, module, exports) {
            /**
             * 组合下拉框
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-08
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                List = require('./fly.list'),
                template = require('./fly.template'),
                Select = fly.ui.Select,
                register = ui.register,
                Widget = ui.Widget,
                $ = fly.$,
                keys = fly.keys,
                proxy = $.proxy,
                caret = fly.caret,
                activeElement = fly.activeElement;

            // 静态变量
            var NAME = 'ComboBox',
                NS = '.' + fly.NS + NAME,
                CLICK = 'click' + NS,
                MOUSEDOWN = 'mousedown' + NS,
                DISABLED = 'disabled',
                READONLY = 'readonly',
                CHANGE = 'change',
                DEFAULT = 'state-default',
                FOCUSED = 'state-focused',
                STATEDISABLED = 'state-disabled',
                STATE_SELECTED = 'state-selected',
                STATE_FILTER = 'filter',
                STATE_ACCEPT = 'accept',
                STATE_REBIND = 'rebind',
                HOVEREVENTS = 'mouseenter' + NS + ' mouseleave' + NS,
                UNSELECTABLE = 'unselectable="on"',
                NULL = null;

            // 默认的配置属性 
            var defaults = ui.defaults[NAME] = {
                enabled: true, // 默认启用
                index: -1, // 默认不选择
                text: null,
                value: null,
                autoBind: true,
                delay: 200,
                textField: 'text', // text字段名
                valueField: 'value', // value字段名
                minLength: 0, // 执行搜索时所需要的最小长度
                height: 200, // popup高度
                highlightFirst: true,
                cascadeFrom: '',
                cascadeFromField: '',
                filter: 'none',
                placeholder: '',
                suggest: false,
                selectable: true,
                ignoreCase: true, //忽略大小写
                valuePrimitive: true,
                animation: {},
                template: null
            };

            // 解析dom成制定结构样式 
            var wrapperTemplate = template.compile(
                '<span tabindex="-1" ' + UNSELECTABLE +
                ' class="dropdown-wrap state-default">' +
                '    <input {{# name}} class="input" type="text" autocomplete="off"/>' +
                '    <span tabindex="-1" ' + UNSELECTABLE + ' class="select">' +
                '        <i class="icon icon-triangle-down"></i>' +
                '    </span>' +
                '</span>');

            // 按钮组件
            var ComboBox = Select.extend({

                name: NAME,

                /**
                 * [构造函数-识别解析DOM]
                 * @param  {[Object]} element [DOM]
                 * @param  {[Object]} options [DOM的配置参数对象]
                 */
                ctor: function(element, options) {
                    var that = this,
                        text;

                    that.ns = NS;

                    options = $.isArray(options) ? {
                        dataSource: options
                    } : options;
                    options.placeholder = options.placeholder || element.getAttribute(
                        'placeholder');

                    that._super(element, options);

                    options = that.options;
                    element = that.element.on('focus' + NS, proxy(that._focusHandler,
                        that));

                    that._reset();

                    that._wrapper();

                    that._input();

                    that._tabindex(that.input);

                    that._popup();

                    that._dataSource();

                    that._ignoreCase();

                    that._enable();

                    that._oldIndex = that.selectedIndex = -1;

                    that._initialIndex = options.index;

                    that._initList();

                    that._cascade();

                    if (options.autoBind) {
                        that._filterSource();
                    } else {
                        text = options.text;

                        if (!text && that._isSelect) {
                            text = element.children(':selected').text();
                        }

                        if (text) {
                            that.input.val(text);
                            that._prev = text;
                        }
                    }

                    if (!text) {
                        that._placeholder();
                    }

                    fly.notify(that);
                },

                options: defaults,

                // 绑定实现的一些事件    
                events: [
                    'open',
                    'close',
                    CHANGE,
                    'select',
                    'focus',
                    'blur',
                    'filtering',
                    'dataBinding',
                    'dataBound',
                    'cascade'
                ],

                /**
                 * [对外暴露自定义参数对象方法]
                 * @param {[Object]} options [自定义comBoBox的属性参数]
                 */
                setOptions: function(options) {
                    this._super.setOptions(options);
                    this.listView.setOptions(options);
                    this._accessors();
                },

                /**
                 * [comBoBox对象的销毁方法]
                 */
                destroy: function() {
                    var that = this,
                        ns = that.ns;
                    that.input.off(ns);
                    that.element.off(ns);
                    that._inputWrapper.off(ns);
                    that._super.destroy();
                },

                _focusHandler: function() {
                    this.input.focus();
                },

                // 下拉箭头事件 
                _arrowClick: function() {
                    this._toggle();
                },

                // 文本输入框的聚焦事件 
                _inputFocus: function(e) {
                    this._inputWrapper.addClass(FOCUSED);
                    this._placeholder(false);
                    this.trigger('focus', e);
                },

                // 文本输入框的失焦事件 
                _inputFocusout: function(e) {
                    var that = this;

                    that._inputWrapper.removeClass(FOCUSED);
                    clearTimeout(that._typing);
                    that._typing = null;

                    if (that.options.text !== that.input.val()) {
                        that.text(that.text());
                    }

                    that._placeholder();
                    that._blur();

                    that.element.blur();
                    this.trigger('blur', e);
                },

                /**
                 * [可编辑状态处理]
                 * @param  {[Object]} options [文本框定义参数对象]
                 */
                _editable: function(options) {
                    var that = this,
                        disable = options.disable,
                        readonly = options.readonly,
                        wrapper = that._inputWrapper.off(NS),
                        input = that.element.add(that.input.off(NS)),
                        arrow = that._arrow.parent().off(CLICK + ' ' + MOUSEDOWN);

                    if (!readonly && !disable) {

                        // 给DOM添加样式和绑定鼠标移入和移出事件 
                        wrapper
                            .addClass(DEFAULT)
                            .removeClass(STATEDISABLED)
                            .on(HOVEREVENTS, that._toggleHover);

                        input.removeAttr(DISABLED)
                            .removeAttr(READONLY);

                        arrow.on(CLICK, proxy(that._arrowClick, that))
                            .on(MOUSEDOWN, function(e) {
                                e.preventDefault();
                            });

                        // 移出disable和readonly属性，绑定聚焦和失焦及改变事件 
                        that.input
                            .on('keydown' + NS, proxy(that._keydown, that))
                            .on('focus' + NS, proxy(that._inputFocus, that))
                            .on('focusout' + NS, proxy(that._inputFocusout, that));

                    } else {

                        // 设置只读状态 
                        wrapper
                            .addClass(disable ? STATEDISABLED : DEFAULT)
                            .removeClass(disable ? DEFAULT : STATEDISABLED);

                        input.attr(DISABLED, disable)
                            .attr(READONLY, readonly);
                    }
                },

                /**
                 * 打开下拉框
                 */
                open: function() {
                    var that = this;
                    var state = that._state;
                    var focusedItem;
                    var index;

                    if (that.popup.visible()) {
                        return;
                    }

                    if ((!that.listView.isBound() && state !== STATE_FILTER) || state ===
                        STATE_ACCEPT) {
                        that._open = true;
                        that._state = STATE_REBIND;
                        that.listView.filter(false);
                        that._filterSource();
                    } else {
                        that.popup.open();
                        that._focusItem();
                    }
                },

                /**
                 * 绑定列表数据
                 */
                _listBound: function() {
                    var that = this;
                    var options = that.options;
                    var initialIndex = that._initialIndex;
                    var filtered = that._state === STATE_FILTER;
                    var isActive = that.input[0] === activeElement();

                    var listView = that.listView;
                    var focusedItem = listView.focus();
                    var data = this.dataSource.view();
                    var page = this.dataSource.page();
                    var length = data.length;
                    var dataItem;
                    var value;

                    that._presetValue = false;

                    if (that.popup.visible()) {
                        that.popup._position();
                    }

                    if (that._isSelect) {
                        var hasChild = that.element[0].children[0];

                        if (that._state === STATE_REBIND) {
                            that._state = '';
                        }

                        var keepState = true;
                        var custom = that._customOption;

                        that._customOption = undefined;
                        that._options(data, '', that.value());

                        if (custom && custom[0].selected) {
                            that._custom(custom.val(), keepState);
                        } else if (!hasChild) {
                            that._custom('', keepState);
                        }
                    }

                    that._makeUnselectable();

                    if (!filtered && !that._fetch) {
                        if (!listView.value().length) {
                            if (initialIndex !== null && initialIndex > -1) {
                                that.select(initialIndex);
                                focusedItem = listView.focus();
                            } else if (that._accessor()) {
                                listView.value(that._accessor());
                            }
                        }

                        that._initialIndex = null;

                        dataItem = that.listView.selectedDataItems()[0];
                        if (dataItem && that.text() && that.text() !== that._text(
                                dataItem)) {
                            that._selectValue(dataItem);
                        }
                    } else if (filtered && focusedItem) {
                        focusedItem.removeClass('state-selected');
                    }

                    if (length && (page === undefined || page === 1)) {
                        if (options.highlightFirst) {
                            if (!focusedItem) {
                                listView.focus(0);
                            }
                        } else {
                            listView.focus(-1);
                        }

                        if (options.suggest && isActive && that.input.val()) {
                            that.suggest(data[0]);
                        }
                    }

                    if (that._open) {
                        that._open = false;

                        if (that._typing && !isActive) {
                            that.popup.close();
                        } else {
                            that.toggle(!!length);
                        }

                        that._typing = null;
                    }

                    if (that._touchScroller) {
                        that._touchScroller.reset();
                    }

                    that._hideBusy();
                    that.trigger('dataBound');
                },

                // 选中的值改变 
                _listChange: function() {
                    this._selectValue(this.listView.selectedDataItems()[0]);

                    if (this._presetValue) {
                        this._oldIndex = this.selectedIndex;
                    }
                },

                _get: function(candidate) {
                    var data, found, idx;

                    if (typeof candidate === 'function') {
                        data = this.dataSource.view();

                        for (idx = 0; idx < data.length; idx++) {
                            if (candidate(data[idx])) {
                                candidate = idx;
                                found = true;
                                break;
                            }
                        }

                        if (!found) {
                            candidate = -1;
                        }
                    }

                    return candidate;
                },

                _select: function(candidate, keepState) {
                    candidate = this._get(candidate);

                    if (candidate === -1) {
                        this.input[0].value = '';
                        this._accessor('');
                    }

                    this.listView.select(candidate);

                    if (!keepState && this._state === STATE_FILTER) {
                        this.listView.filter(false);
                        this._state = STATE_ACCEPT;
                    }
                },

                /**
                 * [comBoBox下拉框的选中改变值]
                 * @param  {[String]} dataItem [选中选项的值]
                 */
                _selectValue: function(dataItem) {
                    var idx = this.listView.select();
                    var value = '';
                    var text = '';

                    idx = idx[idx.length - 1];
                    if (idx === undefined) {
                        idx = -1;
                    }

                    this.selectedIndex = idx;

                    if (idx === -1) {
                        value = text = this.input[0].value;
                        this.listView.focus(-1);
                    } else {
                        if (dataItem) {
                            value = this._dataValue(dataItem);
                            text = this._text(dataItem);
                        }

                        if (value === null) {
                            value = '';
                        }
                    }

                    this._prev = this.input[0].value = text;
                    this._accessor(value !== undefined ? value : text, idx);

                    this._placeholder();
                    this._triggerCascade();
                },

                // 刷新 
                refresh: function() {
                    this.listView.refresh();
                },

                suggest: function(word) {
                    var that = this;
                    var element = that.input[0];
                    var value = that.text();
                    var caretIdx = caret(element)[0];
                    var key = that._last;
                    var idx;

                    if (key == keys.BACKSPACE || key == keys.DELETE) {
                        that._last = undefined;
                        return;
                    }

                    word = word || '';

                    if (typeof word !== 'string') {
                        if (word[0]) {
                            word = that.dataSource.view()[List.inArray(word[0], that.ul[
                                0])];
                        }

                        word = word ? that._text(word) : '';
                    }

                    if (caretIdx <= 0) {
                        caretIdx = value.toLowerCase().indexOf(word.toLowerCase()) + 1;
                    }

                    if (word) {
                        idx = word.toLowerCase().indexOf(value.toLowerCase());
                        if (idx > -1) {
                            value += word.substring(idx + value.length);
                        }
                    } else {
                        value = value.substring(0, caretIdx);
                    }

                    if (value.length !== caretIdx || !word) {
                        element.value = value;
                        if (element === activeElement()) {
                            caret(element, caretIdx, value.length);
                        }
                    }
                },

                text: function(text) {
                    text = text === null ? '' : text;

                    var that = this;
                    var input = that.input[0];
                    var ignoreCase = that.options.ignoreCase;
                    var loweredText = text;
                    var dataItem;
                    var value;

                    if (text === undefined) {
                        return input.value;
                    }

                    dataItem = that.dataItem();

                    if (that.options.autoBind === false && !that.listView.isBound()) {
                        return;
                    }

                    if (dataItem && that._text(dataItem) === text) {
                        value = that._value(dataItem);
                        if (value === null) {
                            value = '';
                        } else {
                            value += '';
                        }

                        if (value === that._old) {
                            that._triggerCascade();
                            return;
                        }
                    }

                    if (ignoreCase) {
                        loweredText = loweredText.toLowerCase();
                    }

                    that._select(function(data) {
                        data = that._text(data);

                        if (ignoreCase) {
                            data = (data + '').toLowerCase();
                        }

                        return data === loweredText;
                    });

                    if (that.selectedIndex < 0) {
                        that._accessor(text);
                        input.value = text;

                        that._triggerCascade();
                    }

                    that._prev = input.value;
                },

                toggle: function(toggle) {
                    this._toggle(toggle, true);
                },

                value: function(value) {
                    var that = this;
                    var options = that.options;

                    if (value === undefined) {
                        value = that._accessor() || that.listView.value()[0];
                        return value === undefined || value === null ? '' : value;
                    }

                    if (value === null) {
                        value = '';
                    }

                    value = value.toString();

                    if (value === options.value && that.input.val() === options.text) {
                        return;
                    }

                    that._accessor(value);

                    that.listView
                        .value(value)
                        .done(function() {
                            that._triggerCascade();

                            that._selectValue(that.listView.selectedDataItems()[0]);

                            if (that.selectedIndex === -1) {
                                that._accessor(value);
                                that.input.val(value);
                                that._placeholder(true);
                            }

                            that._old = that._accessor();
                            that._oldIndex = that.selectedIndex;

                            that._prev = that.input.val();

                            if (that._state === STATE_FILTER) {
                                that._state = STATE_ACCEPT;
                            }
                        });

                    that._fetchData();
                },

                _click: function(e) {
                    var item = e.item;

                    if (this.trigger('select', {
                            item: item
                        })) {
                        this.close();
                        return;
                    }

                    this._userTriggered = true;

                    this._select(item);
                    this._blur();
                },

                _filter: function(word) {
                    var that = this;
                    var options = that.options;
                    var dataSource = that.dataSource;
                    var ignoreCase = options.ignoreCase;
                    var predicate = function(dataItem) {
                        var text = that._text(dataItem);
                        if (text !== undefined) {
                            text = text + '';
                            if (text !== '' && word === '') {
                                return false;
                            }

                            if (ignoreCase) {
                                text = text.toLowerCase();
                            }

                            return text.indexOf(word) === 0;
                        }
                    };

                    if (ignoreCase) {
                        word = word.toLowerCase();
                    }

                    if (!that.ul[0].firstChild) {
                        dataSource.one(CHANGE, function() {
                            if (dataSource.view()[0]) {
                                that.search(word);
                            }
                        }).fetch();
                        return;
                    }

                    this.listView.focus(this._get(predicate));

                    var current = this.listView.focus();

                    if (current) {
                        if (options.suggest) {
                            this.suggest(current);
                        }

                        this.open();
                    }

                    if (this.options.highlightFirst && !word) {
                        this.listView.first();
                    }
                },

                // 给input解析，添加生成制定的DOM结构样式 
                _input: function() {
                    var that = this,
                        element = that.element.removeClass('input')[0],
                        accessKey = element.accessKey,
                        wrapper = that.wrapper,
                        SELECTOR = 'input.input',
                        name = element.name || '',
                        input;

                    if (name) {
                        name = 'name="' + name + '_text" ';
                    }

                    input = wrapper.find(SELECTOR);

                    if (!input[0]) {
                        wrapper.append(wrapperTemplate({
                            name: name
                        })).append(that.element);

                        input = wrapper.find(SELECTOR);
                    }

                    input[0].style.cssText = element.style.cssText;
                    input[0].title = element.title;

                    if (element.maxLength > -1) {
                        input[0].maxLength = element.maxLength;
                    }

                    // DOM赋值和属性添加 
                    input.addClass(element.className)
                        .val(this.options.text || element.value)
                        .css({
                            width: '100%',
                            height: element.style.height
                        })
                        .attr({
                            'role': 'combobox'
                        })
                        .show();

                    if (fly.support.html5) {
                        input.attr('placeholder', that.options.placeholder);
                    }

                    if (accessKey) {
                        element.accessKey = '';
                        input[0].accessKey = accessKey;
                    }

                    // 验证目标元素
                    $(element).data('target', input);

                    that._focused = that.input = input;
                    that._inputWrapper = $(wrapper[0].firstChild);
                    that._arrow = wrapper.find('.icon')
                        .attr({
                            'role': 'button',
                            'tabIndex': -1
                        });
                },

                // 键盘按键按下事件 
                _keydown: function(e) {
                    var that = this,
                        key = e.keyCode;

                    that._last = key;

                    clearTimeout(that._typing);
                    that._typing = null;

                    // 回车键执行搜索事件 
                    if (key != keys.TAB && !that._move(e)) {
                        that._search();
                    }
                },

                /**
                 * [设置placeholder是否显示]
                 * @param  {[Boolean]} show [是否显示，false表示不显示，然后根据value去判断是否显示]
                 */
                _placeholder: function(show) {
                    if (fly.support.html5) {
                        return;
                    }

                    var that = this,
                        input = that.input,
                        placeholder = that.options.placeholder,
                        value;

                    if (placeholder) {
                        value = that.value();

                        if (show === undefined) {
                            show = !value;
                        }

                        input.toggleClass('readonly', show);

                        if (!show) {
                            if (!value) {
                                placeholder = '';
                            } else {
                                return;
                            }
                        }

                        input.val(placeholder);

                        if (!placeholder && input[0] === activeElement()) {
                            caret(input[0], 0, 0);
                        }
                    }
                },

                // combobox的搜索方法，文本框去匹配 
                _search: function() {
                    var that = this;

                    that._typing = setTimeout(function() {
                        var value = that.text();

                        if (that._prev !== value) {
                            that._prev = value;
                            that.search(value);
                        }

                        that._typing = null;
                    }, that.options.delay);
                },

                // dom处理，解析页面dom成制定制定结构样式 
                _wrapper: function() {
                    var that = this,
                        element = that.element,
                        wrapper = element.parent();

                    if (!wrapper.is('span.widget')) {
                        wrapper = element.hide().wrap('<span />').parent();
                        wrapper[0].style.cssText = element[0].style.cssText;
                    }

                    that.wrapper = wrapper.addClass('widget combobox')
                        .addClass(element[0].className)
                        .css('display', '');
                },

                /**
                 * [执行选中显示处理]
                 * @param  {[String]} value [选项的值]
                 * @param  {[String]} text  [选项的文本内容]
                 */
                _preselect: function(value, text) {

                    this.input.val(text);
                    this._accessor(value);

                    this._old = this._accessor();
                    this._oldIndex = this.selectedIndex;

                    this.listView.setValue(value);

                    this._initialIndex = null;
                    this._presetValue = true;
                },

                _clearSelection: function(parent, isFiltered) {
                    var that = this;
                    var hasValue = parent.value();
                    var custom = hasValue && parent.selectedIndex === -1;

                    if (isFiltered || !hasValue || custom) {
                        that.options.value = '';
                        that.value('');
                    }
                }
            });

            register(ComboBox);
            module.exports = ComboBox;

        }, {
            "./fly.core": 9,
            "./fly.list": 21,
            "./fly.template": 28,
            "./fly.ui": 32
        }
    ],
    9: [
        function(require, module, exports) {
            /**
             * 基础代码
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-06-01 15:20
             */

            'use strict';

            // 依赖jQuery
            //var $ = require("jquery");

            // 命名空间
            var fly = window.fly = window.fly || {};

            // 路径
            var URLFLAG = 'js/flyui';

            // 缓存jquery
            fly.$ = $;

            // 缓存window对象
            fly.$win = $(window);

            // 缓存document对象
            fly.$doc = $(document);

            // 缓存html
            fly.$html = $('html');

            // 常用键值
            fly.keys = {
                INSERT: 45,
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
                PAGEDOWN: 34,
                F10: 121,
                F12: 123,
                NUMPAD_PLUS: 107,
                NUMPAD_MINUS: 109,
                NUMPAD_DOT: 110
            };

            // 命名空间
            fly.NS = 'fly';

            var extend = $.extend,
                _scrollbar, // 滚动条宽度
                effects = {}, // 效果库
                support = {}, // 特性支持
                OLDDISPLAY = 'olddisplay';

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
            /*support.touch = (
    ('ontouchstart' in document) ||
    (global.DocumentTouch && document instanceof global.DocumentTouch) || //非IE
    (global.navigator.msPointerEnabled && global.navigator.msMaxTouchPoints > 0) || //IE 10
    (global.navigator.pointerEnabled && global.navigator.maxTouchPoints > 0) || //IE >=11
    false
);*/

            // 获取滚动条宽度
            support.scrollbar = function(refresh) {
                var div, result;

                if (!isNaN(_scrollbar) && !refresh) {
                    return _scrollbar;
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

            // 是否可以直接删除扩展
            support.deleteExpando = (function() {
                var a = document.createElement('a');
                try {
                    delete a.test;
                } catch (e) {
                    return false;
                }
                return true;
            })();

            // 识别浏览器
            fly.browser = (function() {
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
                    browser.ie = parseInt(RegExp.$1 || 11);
                }
                return browser;
            })();

            // 获取当前路径
            // 不论是以何种方式加载，都不能改变flyui的名称
            /*fly.path = (function(script, key, i, me, thisScript) {
    for (i in script) {
        if (script[i].src && script[i].src.indexOf(key) !== -1) {
            me = script[i];
        }
    };
    thisScript = me || script[script.length - 1];
    me = thisScript.src.replace(/\\/g, '/');
    return me.lastIndexOf('/') < 0 ? '.' :
        me.substring(0, me.lastIndexOf(key));
}(document.getElementsByTagName('script'), URLFLAG));*/

            /**
             * 生成标准GUID
             * @return {String} 32位GUID字符串
             */
            fly.guid = function() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(
                    c) {
                    var r = Math.random() * 16 | 0,
                        v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                }).toUpperCase();
            };

            /**
             * 恒等
             * 在某些没有默认值的时候使用
             * @param   {Any} o 任何输入
             * @returns {Any} 输出
             */
            fly.identity = function(o) {
                return o;
            }

            /**
             * 处理动画需要的参数
             * @param   {object}   options  效果参数
             * @param   {number}   duration 持续时间
             * @param   {boolean}  reverse  是否反转
             * @param   {function} complete 完成回调
             * @returns {object}   完整的动画参数
             */
            function prepareAnimationOptions(options, duration, reverse, complete) {
                if (typeof options === 'string') {

                    if (isFunction(duration)) {
                        complete = duration;
                        duration = 400;
                        reverse = false;
                    }

                    if (isFunction(reverse)) {
                        complete = reverse;
                        reverse = false;
                    }

                    if (typeof duration === BOOLEAN) {
                        reverse = duration;
                        duration = 400;
                    }

                    options = {
                        effects: options,
                        duration: duration,
                        reverse: reverse,
                        complete: complete
                    };
                }

                return extend({
                    effects: {},
                    duration: 400,
                    reverse: false,
                    init: $.noop,
                    teardown: $.noop,
                    hide: false
                }, options, {
                    completeCallback: options.complete,
                    complete: $.noop
                });
            }

            /**
             * 执行动画效果
             * @param   {object}   element  承载动画效果的Element
             * @param   {object}   options  效果参数
             * @param   {number}   duration 持续时间
             * @param   {boolean}  reverse  是否反转
             * @param   {function} complete 回调
             * @returns {object}   承载动画效果的Element
             */
            function animate(options, duration, reverse, complete) {
                var idx = 0,
                    element = this,
                    length = element.length,
                    instance;

                for (; idx < length; idx++) {
                    instance = $(element[idx]);
                    instance.queue(function() {
                        effects.promise(instance, prepareAnimationOptions(options, duration,
                            reverse,
                            complete));
                    });
                }

                return element;
            }

            extend(effects, {
                enabled: true,

                Element: function(element) {
                    this.element = $(element);
                },

                promise: function(element, options) {
                    if (!element.is(":visible")) {
                        element.css("display", element.data(OLDDISPLAY) || "block");
                    }

                    options.hide && element.data(OLDDISPLAY, element.css("display")).hide();
                    options.init && options.init();
                    options.completeCallback && options.completeCallback(element);

                    element.dequeue();
                },

                disable: function() {
                    this.enabled = false;
                    this.promise = this.promiseShim;
                },

                enable: function() {
                    this.enabled = true;
                    this.promise = this.animatedPromise;
                }
            });

            effects.promiseShim = effects.promise;

            extend($.fn, {
                animated: function() {
                    return animate.apply(this, arguments);
                }
            });

            extend($.expr[':'], {
                focusable: function(element) {
                    var idx = $.attr(element, "tabindex"),
                        nodeName = element.nodeName.toLowerCase(),
                        isTabIndexNotNaN = !isNaN(idx) && idx > -1;

                    if (/input|select|textarea|button|object/.test(nodeName) ?
                        !element.disabled :
                        "a" === nodeName ?
                        element.href || isTabIndexNotNaN :
                        isTabIndexNotNaN
                    ) {
                        return !$(element).parents().addBack().filter(function() {
                            return $.css(this, "visibility") === "hidden" || $.expr.filters
                                .hidden(this);
                        }).length;
                    }
                }
            });

            fly.support = support;

            module.exports = fly;

        }, {}
    ],
    10: [
        function(require, module, exports) {
            /**
             * 数据对象
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-06
             */

            'use strict';

            // 依赖
            var fly = require('./fly.core'),
                ob = require('./fly.observable'),
                Model = require('./fly.model'),
                format = require('./fly.format'),
                utils = require('./fly.utils'),
                Class = fly.Class,
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
                ajax = $.ajax,
                slice = [].slice,
                math = Math;

            // 数据对象
            var data = {};

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

                    // 如果存在read接口，则需要设置server属性为true
                    // 同时对url进行处理
                    if (read) {
                        options.read = $.extend(read, {
                            url: utils.url(read.url)
                        });
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

                    if (isFunction(that.transport.push)) {
                        that.transport.push({
                            pushCreate: proxy(that._pushCreate, that),
                            pushUpdate: proxy(that._pushUpdate, that),
                            pushDestroy: proxy(that._pushDestroy, that)
                        });
                    }

                    that.reader = new DataReader(options.model, options.modelBase, read ||
                        options.childrenField);

                    model = that.reader.model || {};

                    that._detachObservableParents();

                    that._data = that._observe(that._data);
                    that._online = true;

                    that.bind(["push", ERROR, CHANGE, REQUESTSTART, REQUESTEND,
                        PROGRESS
                    ], options);
                },

                options: {
                    data: null,
                    interface: {},
                    server: true,
                    serverPage: true,
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
                        key = key || 'id',
                        idx,
                        length;

                    for (idx = 0, length = data.length; idx < length; idx++) {
                        if (data[idx][key] == id) {
                            return data[idx];
                        }
                    }
                },

                /**
                 * 获取指定uid的item
                 * @param   {string} id UID
                 * @returns {object} 符合条件的data
                 */
                getByUid: function(id) {
                    var data = this._data,
                        idx,
                        length;

                    if (!data) {
                        return null;
                    }

                    for (idx = 0, length = data.length; idx < length; idx++) {
                        if (data[idx].uid == id) {
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

                pushCreate: function(items) {
                    if (!isArray(items)) {
                        items = [items];
                    }

                    var pushed = [];
                    var autoSync = this.options.autoSync;
                    this.options.autoSync = false;

                    try {
                        for (var idx = 0; idx < items.length; idx++) {
                            var item = items[idx],
                                result = this.add(item),
                                pristine = result.toJSON();

                            pushed.push(result);
                            this._pristineData.push(pristine);
                        }
                    } finally {
                        this.options.autoSync = autoSync;
                    }

                    if (pushed.length) {
                        this.trigger(PUSH, {
                            type: CREATE,
                            items: pushed
                        });
                    }
                },

                pushUpdate: function(items) {
                    if (!isArray(items)) {
                        items = [items];
                    }

                    var pushed = [];

                    for (var idx = 0; idx < items.length; idx++) {
                        var item = items[idx],
                            model = this._createNewModel(item),
                            target = this.get(model.id);

                        if (target) {
                            pushed.push(target);
                            target.accept(item);
                            target.trigger(CHANGE);
                            this._updatePristineForModel(target, item);
                        } else {
                            this.pushCreate(item);
                        }
                    }

                    if (pushed.length) {
                        this.trigger(PUSH, {
                            type: UPDATE,
                            items: pushed
                        });
                    }
                },

                pushDestroy: function(items) {
                    var pushed = this._removeItems(items);

                    if (pushed.length) {
                        this.trigger(PUSH, {
                            type: DESTROY,
                            items: pushed
                        });
                    }
                },

                _pushCreate: function(result) {
                    this._push(result, "pushCreate");
                },

                _pushUpdate: function(result) {
                    this._push(result, "pushUpdate");
                },

                _pushDestroy: function(result) {
                    this._push(result, "pushDestroy");
                },

                _push: function(result, operation) {
                    var data = this._readData(result);

                    if (!data) {
                        data = result;
                    }

                    this[operation](data);
                },

                _removeItems: function(items) {
                    if (!isArray(items)) {
                        items = [items];
                    }

                    var destroyed = [],
                        autoSync = this.options.autoSync;
                    this.options.autoSync = false;

                    try {
                        for (var idx = 0; idx < items.length; idx++) {
                            var item = items[idx],
                                model = this._createNewModel(item),
                                found = false;

                            this._eachItem(this._data, function(items) {
                                for (var idx = 0; idx < items.length; idx++) {
                                    var item = items.at(idx);
                                    if (item.id === model.id) {
                                        destroyed.push(item);
                                        items.splice(idx, 1);
                                        found = true;
                                        break;
                                    }
                                }
                            });

                            if (found) {
                                this._removePristineForModel(model);
                                this._destroyed.pop();
                            }
                        }
                    } finally {
                        this.options.autoSync = autoSync;
                    }

                    return destroyed;
                },

                remove: function(model) {
                    var result,
                        that = this;

                    this._eachItem(that._data, function(items) {
                        removeModel(items, model);
                    });

                    this._removeModelFromRanges(model);

                    this._updateRangesLength();

                    return model;
                },

                /**
                 * 返回已销毁的数据
                 * @returns {Array} 已销毁的数据
                 */
                destroyed: function() {
                    return this._destroyed;
                },

                created: function() {
                    var idx,
                        length,
                        result = [],
                        data = this._data;

                    for (idx = 0, length = data.length; idx < length; idx++) {
                        if (data[idx].isNew && data[idx].isNew()) {
                            result.push(data[idx]);
                        }
                    }
                    return result;
                },

                updated: function() {
                    var idx,
                        length,
                        result = [],
                        data = this._data;

                    for (idx = 0, length = data.length; idx < length; idx++) {
                        if ((data[idx].isNew && !data[idx].isNew()) && data[idx].dirty) {
                            result.push(data[idx]);
                        }
                    }
                    return result;
                },

                cancelChanges: function(model) {
                    var that = this;

                    if (model instanceof Model) {
                        that._cancelModel(model);
                    } else {
                        that._destroyed = [];
                        that._detachObservableParents();
                        that._data = that._observe(that._pristineData);
                        if (that.options.server) {
                            that._total = that._pristineTotal;
                        }

                        that._ranges = [];
                        that._addRange(that._data);

                        that._change();
                    }
                },

                hasChanges: function() {
                    var data = this._data,
                        idx,
                        length;

                    if (this._destroyed.length) {
                        return true;
                    }

                    for (idx = 0, length = data.length; idx < length; idx++) {
                        if ((data[idx].isNew && data[idx].isNew()) || data[idx].dirty) {
                            return true;
                        }
                    }

                    return false;
                },

                _updatePristineForModel: function(model, values) {
                    this._executeOnPristineForModel(model, function(index, items) {
                        extend(true, items[index], values);
                    });
                },

                _executeOnPristineForModel: function(model, callback) {
                    this._eachPristineItem(
                        function(items) {
                            var index = indexOfPristineModel(items, model);
                            if (index > -1) {
                                callback(index, items);
                                return true;
                            }
                        });
                },

                _removePristineForModel: function(model) {
                    this._executeOnPristineForModel(model, function(index, items) {
                        items.splice(index, 1);
                    });
                },

                _readData: function(data) {
                    var read = this.reader.data;
                    return read.call(this.reader, data);
                },

                _eachPristineItem: function(callback) {
                    this._eachItem(this._pristineData, callback);
                },

                _eachItem: function(data, callback) {
                    if (data && data.length) {
                        callback(data);
                    }
                },

                _pristineForModel: function(model) {
                    var pristine,
                        idx,
                        callback = function(items) {
                            idx = indexOfPristineModel(items, model);
                            if (idx > -1) {
                                pristine = items[idx];
                                return true;
                            }
                        };

                    this._eachPristineItem(callback);

                    return pristine;
                },

                _cancelModel: function(model) {
                    var pristine = this._pristineForModel(model);

                    this._eachItem(this._data, function(items) {
                        var idx = indexOfModel(items, model);
                        if (idx >= 0) {
                            if (pristine && (!model.isNew() || pristine.__state__)) {
                                items[idx].accept(pristine);
                            } else {
                                items.splice(idx, 1);
                            }
                        }
                    });
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
                    var options = this.options;
                    if (options.pageMode) {
                        var opt = {};
                        opt[options.pageMode.page] = this.page();
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
                        delete options.currentPageNo;
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
                    }

                    this.trigger(errors == EMPTY ? EMPTY : ERROR, {
                        xhr: null,
                        status: "customerror",
                        errorThrown: "custom error",
                        errors: errors
                    });
                    return true;
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

                    if (that.options.server !== true) {
                        options.skip = that._skip;
                        options.take = that._take || that._pageSize;

                        if (options.skip === undefined && that._page !== undefined &&
                            that._pageSize !==
                            undefined) {
                            options.skip = (that._page - 1) * that._pageSize;
                        }
                    }

                    if (that.options.server !== true) {
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

                    if (isPlainObject(val) && val.field === undefined && !val.logic) {
                        val = $.map(val, function(value, field) {
                            return {
                                field: field,
                                value: value
                            };
                        });
                    }

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

                /*inRange: function(skip, take) {
        var that = this,
            end = math.min(skip + take, that.total());

        if (!that.options.server && that._data.length > 0) {
            return true;
        }

        return that._findRange(skip, end).length > 0;
    },

    lastRange: function() {
        var ranges = this._ranges;
        return ranges[ranges.length - 1] || {
            start: 0,
            end: 0,
            data: []
        };
    },

    enableRequestsInProgress: function() {
        this._skipRequestsInProgress = false;
    },*/

                range: function(skip, take) {
                    skip = math.min(skip || 0, this.total());

                    var that = this,
                        total = that.total(),
                        pageSkip = math.max(math.floor(skip / take), 0) * take,
                        size = math.min(pageSkip + take, total),
                        data;

                    that._skipRequestsInProgress = false;

                    data = that._findRange(skip, math.min(skip + take, total));

                    if (data.length) {
                        that._skipRequestsInProgress = true;
                        that._pending = undefined;

                        that._skip = skip > that.skip() ? math.min(size, (that.totalPages() -
                                1) *
                            that.take()) : pageSkip;

                        that._take = take;

                        var server = that.options.server;

                        try {
                            that.options.server = true;

                            if (server) {
                                that._detachObservableParents();
                                that._data = data = that._observe(data);
                            }
                            that._process(data);
                        } finally {
                            that.options.server = server;
                        }

                        return;
                    }

                    if (take !== undefined) {
                        if (!that._rangeExists(pageSkip, size)) {
                            that.prefetch(pageSkip, take, function() {
                                if (skip > pageSkip && size < that.total() && !that
                                    ._rangeExists(
                                        size, math.min(size + take, that.total()))) {
                                    that.prefetch(size, take, function() {
                                        that.range(skip, take);
                                    });
                                } else {
                                    that.range(skip, take);
                                }
                            });
                        } else if (pageSkip < skip) {
                            that.prefetch(size, take, function() {
                                that.range(skip, take);
                            });
                        }
                    }
                },

                _findRange: function(start, end) {
                    var that = this,
                        ranges = that._ranges,
                        range,
                        data = [],
                        skipIdx,
                        takeIdx,
                        startIndex,
                        endIndex,
                        rangeData,
                        rangeEnd,
                        processed,
                        options = that.options,
                        remote = options.server,
                        flatData,
                        count,
                        length;

                    for (skipIdx = 0, length = ranges.length; skipIdx < length; skipIdx++) {
                        range = ranges[skipIdx];
                        if (start >= range.start && start <= range.end) {
                            count = 0;

                            for (takeIdx = skipIdx; takeIdx < length; takeIdx++) {
                                range = ranges[takeIdx];
                                flatData = range.data;

                                if (flatData.length && start + count >= range.start) {
                                    rangeData = range.data;
                                    rangeEnd = range.end;

                                    if (!remote) {
                                        var sort = normalizeSort(that.sort() || []);
                                        processed = that._queryProcess(range.data, {
                                            sort: sort,
                                            filter: that.filter()
                                        });
                                        flatData = rangeData = processed.data;

                                        if (processed.total !== undefined) {
                                            rangeEnd = processed.total;
                                        }
                                    }

                                    startIndex = 0;
                                    if (start + count > range.start) {
                                        startIndex = (start + count) - range.start;
                                    }
                                    endIndex = flatData.length;
                                    if (rangeEnd > end) {
                                        endIndex = endIndex - (rangeEnd - end);
                                    }
                                    count += endIndex - startIndex;
                                    data = data.concat(rangeData.slice(startIndex,
                                        endIndex))

                                    if (end <= range.end && count == end - start) {
                                        return data;
                                    }
                                }
                            }
                            break;
                        }
                    }
                    return [];
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
                },

                _prefetchSuccessHandler: function(skip, size, callback, force) {
                    var that = this;

                    return function(data) {
                        var found = false,
                            range = {
                                start: skip,
                                end: size,
                                data: []
                            },
                            idx,
                            length,
                            temp;

                        that._dequeueRequest();

                        that.trigger(REQUESTEND, {
                            response: data,
                            type: READ
                        });

                        data = that.reader.parse(data);

                        temp = that._readData(data);

                        if (temp.length) {
                            for (idx = 0, length = that._ranges.length; idx <
                                length; idx++) {
                                if (that._ranges[idx].start === skip) {
                                    found = true;
                                    range = that._ranges[idx];
                                    break;
                                }
                            }
                            if (!found) {
                                that._ranges.push(range);
                            }
                        }

                        range.data = that._observe(temp);
                        range.end = range.start + range.data.length;
                        that._ranges.sort(function(x, y) {
                            return x.start - y.start;
                        });
                        that._total = that.reader.total(data);

                        if (force || !that._skipRequestsInProgress) {
                            if (callback && temp.length) {
                                callback();
                            } else {
                                that.trigger(CHANGE, {});
                            }
                        }
                    };
                },

                prefetch: function(skip, take, callback) {
                    var that = this,
                        size = math.min(skip + take, that.total()),
                        options = extend(that._pageParam(), {
                            pageSize: take,
                            sort: that._sort,
                            filter: that._filter
                        });

                    if (!that._rangeExists(skip, size)) {
                        clearTimeout(that._timeout);

                        that._timeout = setTimeout(function() {
                            that._queueRequest(options, function() {
                                if (!that.trigger(REQUESTSTART, {
                                        type: READ
                                    })) {
                                    that.transport.read({
                                        data: that._params(options),
                                        cache: false,
                                        success: that._prefetchSuccessHandler(
                                            skip, size, callback),
                                        error: function() {
                                            var args = slice.call(
                                                arguments);
                                            that.error.apply(that, args);
                                        }
                                    });
                                } else {
                                    that._dequeueRequest();
                                }
                            });
                        }, 100);
                    } else if (callback) {
                        callback();
                    }
                },

                _rangeExists: function(start, end) {
                    var that = this,
                        ranges = that._ranges,
                        idx,
                        length;

                    for (idx = 0, length = ranges.length; idx < length; idx++) {
                        if (ranges[idx].start <= start && ranges[idx].end >= end) {
                            return true;
                        }
                    }
                    return false;
                },

                _removeModelFromRanges: function(model) {
                    var result,
                        found,
                        range;

                    for (var idx = 0, length = this._ranges.length; idx < length; idx++) {
                        range = this._ranges[idx];

                        this._eachItem(range.data, function(items) {
                            result = removeModel(items, model);
                            if (result) {
                                found = true;
                            }
                        });

                        if (found) {
                            break;
                        }
                    }
                },

                _updateRangesLength: function() {
                    var startOffset = 0,
                        range,
                        rangeLength;

                    for (var idx = 0, length = this._ranges.length; idx < length; idx++) {
                        range = this._ranges[idx];
                        range.start = range.start - startOffset;

                        rangeLength = range.data.length;
                        startOffset = range.end - rangeLength;
                        range.end = range.start + rangeLength;
                    }
                }
            });


            DataSource.create = function(options) {

                if (isArray(options) || options instanceof ObservableArray) {
                    options = {
                        data: options
                    };
                }

                var dataSource = options || {},
                    data = dataSource.data,
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

                    return this._super.insert.call(this, index, model);
                },

                _find: function(method, value, key) {
                    var idx, length, node, data, children;

                    node = this._super[method].call(this, value, key);

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

                        node = children[method](value);

                        if (node) {
                            return node;
                        }
                    }
                },

                get: function(id, key) {
                    return this._find("get", id, key);
                },

                getByUid: function(uid) {
                    return this._find("getByUid", uid);
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

                    if (isFunction(hasChildren)) {
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
                    return this._super.shouldSerialize.call(this, field) &&
                        field !== "children" &&
                        field !== "_loaded" &&
                        field !== "hasChildren" &&
                        field !== "_childrenOptions";
                }
            });


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

                    /*if (isArray(data) || !data) {
            transport = new LocalTransport({
                data: data || []
            });
        } else {
            options.read = typeof data === STRING ? {
                url: data
            } : data;
            options.read.url = utils.url(options.read.url);

            if (dataSource) {
                options.dataSource = dataSource;
            }

            transport = new RemoteTransport({
                read: typeof data === STRING ? {
                        url: data
                    } : data,
                dataSource: dataSource
            });
        }*/

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

            /*function map(array, callback) {
    var idx, length = array.length,
        result = new Array(length);

    for (idx = 0; idx < length; idx++) {
        result[idx] = callback(array[idx], idx, array);
    }

    return result;
};*/

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

            function fieldNameFromModel(fields, name) {
                if (fields && !isEmptyObject(fields)) {
                    var descriptor = fields[name];
                    var fieldName;
                    if (isPlainObject(descriptor)) {
                        fieldName = descriptor.from || descriptor.field || name;
                    } else {
                        fieldName = fields[name] || name;
                    }

                    if (isFunction(fieldName)) {
                        return name;
                    }

                    return fieldName;
                }
                return name;
            }

            function convertFilterDescriptorsField(descriptor, model) {
                var idx,
                    length,
                    target = {};

                for (var field in descriptor) {
                    if (field !== "filters") {
                        target[field] = descriptor[field];
                    }
                }

                if (descriptor.filters) {
                    target.filters = [];
                    for (idx = 0, length = descriptor.filters.length; idx < length; idx++) {
                        target.filters[idx] = convertFilterDescriptorsField(descriptor.filters[
                            idx], model);
                    }
                } else {
                    target.field = fieldNameFromModel(model.fields, target.field);
                }
                return target;
            }

            function convertDescriptorsField(descriptors, model) {
                var idx,
                    length,
                    result = [],
                    target,
                    descriptor;

                for (idx = 0, length = descriptors.length; idx < length; idx++) {
                    target = {};

                    descriptor = descriptors[idx];

                    for (var field in descriptor) {
                        target[field] = descriptor[field];
                    }

                    target.field = fieldNameFromModel(model.fields, target.field);

                    result.push(target);
                }
                return result;
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


            /** 数据对象 */
            extend(data, {
                Query: Query,
                DataSource: DataSource,
                NodeDataSource: NodeDataSource,
                LocalTransport: LocalTransport,
                RemoteTransport: RemoteTransport,
                Cache: Cache,
                DataReader: DataReader,
                Model: Model
            });


            fly.dataSource = function(object) {
                if (!(object instanceof DataSource)) {
                    object = new DataSource(object);
                }
                return object;
            };

            fly.nodeDataSource = function(object) {
                if (!(object instanceof NodeDataSource)) {
                    object = new NodeDataSource(object);
                }
                return object;
            };

            fly.data = data;
            module.exports = data;

        }, {
            "./fly.core": 9,
            "./fly.format": 17,
            "./fly.model": 22,
            "./fly.observable": 23,
            "./fly.utils": 34
        }
    ],
    11: [
        function(require, module, exports) {
            /**
             * 日期选择框
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2016-04-13 by leitao3
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                Popup = require('./fly.popup'),
                Calender = require('./fly.calender'),
                Widget = ui.Widget,
                register = ui.register,
                $ = fly.$,
                extend = $.extend,
                proxy = $.proxy,
                activeElement = fly.activeElement;

            // 日历组件
            var NAME = 'DatePicker',
                NS = '.' + fly.NS + NAME,
                UNSELECTED = 'unselectable="on"',
                DISABLED = "disabled",
                READONLY = "readonly",
                FOCUSED = "state-focused",
                DEFAULT = "state-default",
                STATEDISABLED = "state-disabled",
                SELECTED = "state-selected",
                STATEHOVER = "state-hover",
                TABINDEX = "tabindex",
                OPEN = 'open',
                CLOSE = 'close',
                CHANGE = 'change',
                HOVEREVENTS = "mouseenter" + NS + " mouseleave" + NS;

            // 定义默认的时间控件属性
            var defaults = ui.defaults[NAME] = {
                enabled: true, // 控件是否只读
                format: 'yyyy-MM-dd', // 日历格式
                minDate: -Infinity, // 日历组件的设定的最小日期
                maxDate: Infinity, // 日历设定的最大日期
                placeholder: '请选择', // 日历输入框的提示
                animation: {}, //日历的显示动画
                popup: {} // 弹出框的展现形式
            };

            var DatePicker = Widget.extend({

                name: NAME,

                options: defaults,

                ctor: function(element, options) {
                    var that = this;

                    that._super(element, options);
                    that.options.placeholder = that.options.placeholder || that.element
                        .attr('placeholder');

                    that._wrapper(); // 封装INPUTk框，并加上日历的按钮
                    that._calender(); //添加日历的部分
                    that._popup(); //将日历包裹起来并定位到INPUT框
                    that._enable(); //激活
                },

                events: [
                    CHANGE,
                    'focus',
                    'blur'
                ],

                // 渲染日历组件DOM
                _wrapper: function() {
                    var that = this,
                        element = that.element,
                        DOMelement = element[0],
                        SELECTOR = "span.input", //元素选择器
                        wrapper,
                        span;

                    wrapper = element.parent();

                    if (!wrapper.is("span.widget")) {
                        wrapper = element.wrap("<span />").parent();
                        wrapper[0].style.cssText = DOMelement.style.cssText;
                        wrapper[0].title = DOMelement.title;
                    }

                    element.hide();

                    that._focused = that.wrapper = wrapper
                        .addClass("widget datepicker")
                        .addClass(DOMelement.className)
                        .css("display", '')
                        .attr({
                            unselectable: 'on'
                        });

                    span = wrapper.find(SELECTOR);

                    if (!span[0]) {
                        wrapper.append(
                                '<span ' + UNSELECTED + ' class="datepicker-wrap ' +
                                DEFAULT + '">' +
                                '<span ' + UNSELECTED + ' class="input">' + that.options.placeholder +
                                '</span>' +
                                '<span ' + UNSELECTED + ' class="select">' +
                                '<i class="icon icon-calendar"></i>' +
                                '</span></span>'
                            )
                            .append(that.element);

                        span = wrapper.find(SELECTOR);
                    }

                    // 验证目标元素
                    that.element.data('target', span);

                    that.span = span;
                    that._inputWrapper = $(wrapper[0].firstChild);
                },

                // 创建日历对象
                _calender: function() {
                    var that = this;
                    that.calenderWrapper = $('<div />').appendTo('body').addClass(
                        'calendar-container');
                    that.calender = new Calender(that.calenderWrapper, extend({}, this.options, {
                        ok: proxy(that._okHandler, that),
                        clear: proxy(that._cancelHandler, that)
                    }));
                },

                // 创建popup来包裹日历
                _popup: function() {
                    var that = this;
                    that.popup = new Popup(that.calenderWrapper, extend({}, that.options
                        .popup, {
                            anchor: that.wrapper,
                            animation: that.options.animation
                        }));
                },

                _focusHandler: function() {
                    this.wrapper.focus();
                },

                _focusinHandler: function(e) {
                    this._inputWrapper.addClass(FOCUSED);
                    this._prevent = false;
                    this.trigger('focus', e);
                },

                _focusoutHandler: function(e) {
                    var that = this;
                    var isIFrame = window.self !== window.top;

                    if (!that._prevent) {
                        if (isIFrame) {
                            that._change();
                        } else {
                            that._blur();
                        }

                        that._inputWrapper.removeClass(FOCUSED);
                        that._prevent = true;
                        this.trigger('blur', e);
                    }
                },

                _wrapperMousedown: function() {
                    this._prevent = false;
                },

                _wrapperClick: function(e) {
                    e.preventDefault();
                    this.popup.unbind("activate", this._focusInputHandler);
                    this._focused = this.wrapper;
                    this._toggle();
                },

                _toggle: function(open, preventFocus) {
                    var that = this;

                    open = open !== undefined ? open : !that.popup.visible();

                    if (!preventFocus && that._focused[0] !== activeElement()) {
                        that._focused.focus();
                    }

                    that[open ? OPEN : CLOSE]();
                },

                _toggleHover: function(e) {
                    $(e.currentTarget).toggleClass(STATEHOVER, e.type === "mouseenter");
                },

                // 将组件改变成可编辑的
                _editable: function(options) {
                    var that = this;
                    var element = that.element;
                    var disable = options.disable;
                    var readonly = options.readonly;
                    var wrapper = that.wrapper.off(NS);
                    var inputWrapper = that._inputWrapper.off(HOVEREVENTS);

                    if (!readonly && !disable) {
                        element.removeAttr(DISABLED).removeAttr(READONLY);

                        inputWrapper
                            .addClass(DEFAULT)
                            .removeClass(STATEDISABLED)
                            .on(HOVEREVENTS, that._toggleHover);

                        wrapper
                            .attr(TABINDEX, wrapper.data(TABINDEX))
                            .on("mousedown" + NS, proxy(that._wrapperMousedown, that))
                            .on("click" + NS, proxy(that._wrapperClick, that))
                            /*.on("focusin" + NS, proxy(that._focusinHandler, that))
                .on("focusout" + NS, proxy(that._focusoutHandler, that))*/
                        ;

                    } else if (disable) {
                        wrapper.removeAttr(TABINDEX);
                        inputWrapper
                            .addClass(STATEDISABLED)
                            .removeClass(DEFAULT);
                    } else {
                        inputWrapper
                            .addClass(DEFAULT)
                            .removeClass(STATEDISABLED);
                    }

                    element.attr(DISABLED, disable)
                        .attr(READONLY, readonly);
                },

                // ok按钮事件
                _okHandler: function(data) {
                    this.span.text(data.result);
                    this.element.val(data.result);
                    this._focusoutHandler();
                    this.close();
                },

                // 取消按钮被点击事件
                _cancelHandler: function() {
                    this.span.text(this.options.placeholder);
                    this.element.val('');
                    this._focusoutHandler();
                    this.close();
                },

                // 失焦事件
                _blur: function() {
                    this._change();
                    this.close();
                },

                // 值改变事件
                _change: function() {
                    var that = this,
                        value = that.value();

                    if (value !== that._old) {
                        that._old = value;
                        that.element.trigger(CHANGE);
                        that.trigger(CHANGE);
                    }
                },

                _enable: function() {
                    var that = this,
                        options = that.options,
                        disabled = that.element.is("[disabled]");

                    if (options.enable !== undefined) {
                        options.enabled = options.enable;
                    }

                    if (!options.enabled || disabled) {
                        that.enable(false);
                    } else {
                        that.readonly(that.element.is("[readonly]"));
                    }
                },

                // 可编辑的
                enable: function(enable) {
                    this._editable({
                        readonly: false,
                        disable: !(enable = enable === undefined ? true : enable)
                    });
                },

                // 只读的
                readonly: function(readonly) {
                    this._editable({
                        readonly: readonly === undefined ? true : readonly,
                        disable: false
                    });
                },

                // 获取日历组件的值
                value: function(value) {
                    if (value === undefined) {
                        return this.calender.value();
                    }
                    this.calender.value(value);
                    if (!value) this._cancelHandler();
                },

                // 打开日历组件
                open: function() {
                    var that = this;

                    if (that.popup.visible()) {
                        return;
                    }

                    that.popup.open();
                    that.calender._fillDays();
                },

                // 关闭日历组件
                close: function() {
                    this.popup.close();
                },

                // 销毁日历组件
                destroy: function() {
                    this._super.destroy();
                }

            });


            register(DatePicker);
            module.exports = DatePicker;

        }, {
            "./fly.calender": 6,
            "./fly.core": 9,
            "./fly.popup": 25,
            "./fly.ui": 32
        }
    ],
    12: [
        function(require, module, exports) {
            /**
             * 对话框
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-28
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                drag = require('./fly.drag'),
                Widget = ui.Widget,
                $ = fly.$,
                $win = fly.$win,
                $doc = fly.$doc,
                proxy = $.proxy,
                extend = $.extend;

            var NAME = 'Dialog';

            // 判断是否移动设备
            var _isMobile = 'createTouch' in document && !('onmousemove' in document) ||
                /(iPhone|iPad|iPod)/i.test(
                    navigator.userAgent);

            // 针对IE6和可触控的设备不启用fixed
            var _isFixed = fly.browser.ie !== 6 && !fly.support.touch;

            // 类名变量
            var className = 'popup';

            // 当前的dialog
            var current = null;

            // 层级高度
            var zIndex = 1024;

            // 背景遮罩样式
            var backdropDefaultCss = {
                position: 'fixed',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                userSelect: 'none'
            };

            // 模板（使用 table 解决 IE7 宽度自适应的 BUG）
            // js 使用 i="***" 属性识别结构，其余的均可自定义
            var innerHTML =
                '<div i="dialog" class="dialog">' +
                '<div class="dialog-arrow-a"></div>' +
                '<div class="dialog-arrow-b"></div>' +
                '<table class="dialog-grid">' +
                '<tr>' +
                '<td i="header" class="dialog-header">' +
                '<button i="close" class="dialog-close">&#215;</button>' +
                '<div i="title" class="dialog-title"></div>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td i="body" class="dialog-body">' +
                '<div i="content" class="dialog-content"></div>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td i="footer" class="dialog-footer">' +
                '<div i="statusbar" class="dialog-statusbar"></div>' +
                '<div i="button" class="dialog-button"></div>' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</div>';

            // 弹出框
            var popupElement = function() {
                return $('<div />').css({
                    display: 'none',
                    position: 'absolute',
                    outline: 0
                }).attr('tabindex', '-1').html(innerHTML).appendTo('body');
            };

            // 背景遮罩
            var mask = function() {
                return $('<div />').css({
                    opacity: .5,
                    background: '#000'
                });
            };

            // 默认设置
            var defaults = ui.defaults[NAME] = {

                /** 是否自动聚焦 */
                autofocus: true,

                // 对齐方式
                align: 'bottom left',

                // 是否固定定位
                fixed: false,

                // 设置遮罩背景颜色
                backdropBackground: '#000',

                // 设置遮罩透明度
                backdropOpacity: 0.5,

                // 消息内容
                content: '<span class="dialog-loading">Loading..</span>',

                // 标题
                title: '',

                // 对话框状态栏区域 HTML 代码
                statusbar: '',

                // 自定义按钮
                button: null,

                // 确定按钮回调函数
                ok: null,

                // 取消按钮回调函数
                cancel: null,

                // 确定按钮文本
                okValue: 'ok',

                // 取消按钮文本
                cancelValue: 'cancel',

                cancelDisplay: true,

                // 内容宽度
                width: '',

                // 内容高度
                height: '',

                // 内容与边界填充距离
                padding: '',

                // 皮肤-自定义class
                skin: '',

                // 是否支持快捷关闭（点击遮罩层自动关闭）
                quickClose: false
            };

            var Dialog = Widget.extend({

                name: 'Dialog',

                options: defaults,

                ctor: function(element, options) {
                    this._super(element, options);

                    this.__popup = this.element;
                    this.__backdrop = this.__mask = mask();
                    this._popup = this.__popup;

                    this.options.id = this.options.id || fly.guid();

                    // 浮层 DOM 节点
                    this.node = this.__popup[0];

                    // 遮罩 DOM 节点
                    this.backdrop = this.__backdrop[0];

                    // 判断对话框是否删除
                    this.destroyed = false;

                    // 判断对话框是否显示
                    this.open = false;

                    // close 返回值
                    this.returnValue = '';

                    this.create();
                },

                events: ['close'],

                create: function() {
                    var that = this;
                    var options = this.options;
                    var originalOptions = options.original;
                    var $popup = this.element;
                    var $backdrop = $(this.backdrop);

                    $.each(options, function(name, value) {
                        if (typeof that[name] === 'function') {
                            that[name](value);
                        } else {
                            //that[name] = value;
                        }
                    });


                    // 更新 zIndex 全局配置
                    if (options.zIndex && options.zIndex > zIndex) {
                        zIndex = options.zIndex;
                    }


                    // 设置 ARIA 信息
                    $popup.attr({
                        'aria-labelledby': this._$('title')
                            .attr('id', 'title:' + options.id).attr('id'),
                        'aria-describedby': this._$('content')
                            .attr('id', 'content:' + options.id).attr('id')
                    });


                    // 关闭按钮
                    this._$('close')
                        .css('display', options.cancel === false ? 'none' : '')
                        // .attr('title', options.cancelValue)
                        // nnliu3 原因： 项目需求，title 由cancel改成中文关闭 
                        .attr('title', '关闭')
                        .on('click', function(event) {
                            that._trigger('cancel');
                            event.preventDefault();
                        });


                    // 添加视觉参数
                    this._$('dialog').addClass(options.skin);
                    this._$('body').css('padding', options.padding);


                    // 点击任意空白处关闭对话框
                    if (options.quickClose) {
                        $backdrop
                            .on(
                                'onmousedown' in document ? 'mousedown' : 'click',
                                function() {
                                    that._trigger('cancel');
                                    return false; // 阻止抢夺焦点
                                });
                    }


                    // 遮罩设置
                    this.bind('show', function() {
                        $backdrop.css({
                            opacity: 0,
                            background: options.backdropBackground
                        }).animate({
                            opacity: options.backdropOpacity
                        }, 150);
                    });


                    // ESC 快捷键关闭对话框
                    this._esc = function(event) {
                        var target = event.target;
                        var nodeName = target.nodeName;
                        var rinput = /^input|textarea$/i;
                        var isTop = current === that;
                        var keyCode = event.keyCode;

                        // 避免输入状态中 ESC 误操作关闭
                        if (!isTop || rinput.test(nodeName) && target.type !== 'button') {
                            return;
                        }

                        if (keyCode === fly.keys.ESC) {
                            that._trigger('cancel');
                        }
                    };

                    $doc.on('keydown', this._esc);
                    this.bind('remove', function() {
                        $doc.off('keydown', this._esc);
                        delete dialog.list[options.id];
                    });

                    this.oncreate();

                    return this;
                },

                oncreate: function() {
                    var that = this;
                    var options = that.options;
                    var originalOptions = options.original;

                    // 页面地址
                    var url = options.url;
                    // 页面加载完毕的事件
                    var oniframeload = options.oniframeload;

                    var $iframe;


                    if (url) {
                        options.padding = 0;

                        $iframe = $('<iframe />');

                        $iframe.attr({
                                src: url,
                                name: options.id,
                                width: '100%',
                                height: '100%',
                                allowtransparency: 'yes',
                                frameborder: 'no',
                                scrolling: 'yes'
                            })
                            .on('load', function() {
                                var test;

                                try {
                                    // 跨域测试
                                    test = $iframe[0].contentWindow.frameElement;
                                } catch (e) {}

                                if (test) {

                                    if (!options.width) {
                                        that.width($iframe.contents().width());
                                    }

                                    if (!options.height) {
                                        that.height($iframe.contents().height());
                                    }

                                    // 屏蔽回退键
                                    $iframe.contents().on('keydown', that._backspace);
                                }

                                oniframeload && oniframeload.call(that);
                            });

                        that.bind('beforeremove', function() {

                            // 重要！需要重置iframe地址，否则下次出现的对话框在IE6、7无法聚焦input
                            // IE删除iframe后，iframe仍然会留在内存中出现上述问题，置换src是最容易解决的方法
                            $iframe.attr('src', 'about:blank').remove();


                        }, false);

                        that.content($iframe[0]);

                        that.iframeNode = $iframe[0];

                    }


                    // 对于子页面呼出的对话框特殊处理
                    // 如果对话框配置来自 iframe
                    if (!(originalOptions instanceof Object)) {

                        var un = function() {
                            that.close().remove();
                        };

                        // 找到那个 iframe
                        for (var i = 0; i < frames.length; i++) {
                            try {
                                if (originalOptions instanceof frames[i].Object) {
                                    // 让 iframe 刷新的时候也关闭对话框，
                                    // 防止要执行的对象被强制收回导致 IE 报错：“不能执行已释放 Script 的代码”
                                    $(frames[i]).one('unload', un);
                                    break;
                                }
                            } catch (e) {}
                        }
                    }


                    // 拖拽支持
                    $(that.node).on(drag.types.start, '[i=title]', function(event) {
                        // 排除气泡类型的对话框
                        if (!that.follow) {
                            that.focus();
                            drag.create(that.node, event);
                        }
                    });

                },

                /**
                 * 显示浮层
                 * @param   {HTMLElement, Event}  指定位置（可选）
                 */
                show: function(anchor) {

                    if (this.destroyed) {
                        return this;
                    }

                    var that = this,
                        popup = this.__popup,
                        backdrop = this.__backdrop,
                        options = this.options;

                    this.__activeElement = this.__getActive();
                    this.open = true;
                    this.follow = anchor || this.follow;


                    // 初始化 show 方法
                    if (!this.__ready) {

                        // .addClass(className)
                        popup
                            .attr('role', options.modal ? 'alertdialog' : 'dialog')
                            .css('position', options.fixed ? 'fixed' : 'absolute');

                        if (fly.browser.ie != 6) {
                            $win.on('resize', proxy(this.reset, this));
                        }

                        // 模态浮层的遮罩
                        if (options.modal) {
                            var backdropCss = extend(backdropDefaultCss, {
                                zIndex: zIndex
                            });

                            popup.addClass(className + '-modal');

                            if (!_isFixed) {
                                extend(backdropCss, {
                                    position: 'absolute',
                                    width: $win.width() + 'px',
                                    height: $doc.height() + 'px'
                                });
                            }

                            backdrop
                                .css(backdropCss)
                                .attr({
                                    tabindex: '0'
                                })
                                .on('focus', proxy(this.focus, this));

                            // 锁定 tab 的焦点操作
                            this.__mask = backdrop
                                .clone(true)
                                .attr('style', '')
                                .insertAfter(popup);

                            backdrop
                                .addClass(className + '-backdrop')
                                .insertBefore(popup);

                            this.__ready = true;
                        }

                        if (!popup.html()) {
                            popup.html(this.innerHTML);
                        }
                    }


                    popup
                        .addClass(className + '-show')
                        .show();

                    backdrop.show();

                    this.reset().focus();
                    this.trigger('show');
                    fly.$doc.on('keydown', this._backspace);

                    return this;
                },

                _backspace: function(e) {
                    var e = e || event,
                        currKey = e.keyCode || e.which || e.charCode;
                    if (currKey == fly.keys.BACKSPACE) {
                        var elem = e.srcElement || e.currentTarget,
                            name = elem.nodeName;
                        if ((name == 'INPUT' || name == 'TEXTAREA') && !elem.getAttribute(
                                'readonly')) {
                            return true;
                        } else {
                            if (e.returnValue) {
                                e.returnValue = false;
                            }
                            e.preventDefault && e.preventDefault();
                            return false;
                        }
                    }
                },

                /** 显示模态浮层。参数参见 show() */
                showModal: function() {
                    this.options.modal = true;
                    return this.show.apply(this, arguments);
                },


                /** 关闭浮层 */
                close: function(result) {

                    if (!this.destroyed && this.open) {

                        if (result !== undefined) {
                            this.returnValue = result;
                        }

                        this.trigger('close');

                        this.__popup.hide().removeClass(className + '-show');
                        this.__backdrop.hide();
                        this.open = false;

                        // 恢复焦点
                        if (this.options.backfocus !== false) {
                            this.blur();
                        }
                    }

                    fly.$doc.off('keydown', this._backspace);
                    return this;
                },


                /** 销毁浮层 */
                destroy: function() {

                    if (this.destroyed) {
                        return this;
                    }

                    this.trigger('beforeremove');

                    if (current === this) {
                        current = null;
                    }

                    // 从 DOM 中移除节点
                    this.__popup.remove();
                    this.__backdrop.remove();
                    this.__mask.remove();

                    if (this.iframeNode) {
                        this.iframeNode.parentNode.removeChild(this.iframeNode);
                    }

                    // 这里dom都删除了，无需再调用destroy
                    //this._super.destroy();

                    if (fly.browser.ie != 6) {
                        $win.off('resize', this.reset);
                    }

                    this.trigger('remove');

                    for (var i in this) {
                        delete this[i];
                    }

                    return this;
                },


                /** 重置位置 */
                reset: function() {

                    var elem = this.follow;

                    if (elem) {
                        this.__follow(elem);
                    } else {
                        this.__center();
                    }

                    this.trigger('reset');

                    return this;
                },


                /** 让浮层获取焦点 */
                focus: function() {

                    var node = this.node;
                    var popup = this.__popup;
                    var index = zIndex++;

                    if (current && current !== this) {
                        current.blur(false);
                    }

                    // 检查焦点是否在浮层里面
                    if (!$.contains(node, this.__getActive())) {
                        var autofocus = popup.find('[autofocus]')[0];

                        if (!this._autofocus && autofocus) {
                            this._autofocus = true;
                        } else {
                            autofocus = node;
                        }

                        this.__focus(autofocus);
                    }

                    // 设置叠加高度
                    popup.css('zIndex', index);

                    current = this;
                    popup.addClass(className + '-focus');

                    this.trigger('focus');

                    return this;
                },


                /** 让浮层失去焦点。将焦点退还给之前的元素，照顾视力障碍用户 */
                blur: function() {

                    var activeElement = this.__activeElement;
                    var isBlur = arguments[0];


                    if (isBlur !== false) {
                        this.__focus(activeElement);
                    }

                    this._autofocus = false;
                    this.__popup.removeClass(className + '-focus');
                    this.trigger('blur');

                    return this;
                },


                // 对元素安全聚焦
                __focus: function(elem) {
                    // 防止 iframe 跨域无权限报错
                    // 防止 IE 不可见元素报错
                    try {
                        // ie11 bug: iframe 页面点击会跳到顶部
                        if (this.options.autofocus && !/^iframe$/i.test(elem.nodeName)) {
                            elem.focus();
                        }
                    } catch (e) {}
                },


                // 获取当前焦点的元素
                __getActive: function() {
                    try { // try: ie8~9, iframe #26
                        var activeElement = document.activeElement;
                        var contentDocument = activeElement.contentDocument;
                        var elem = contentDocument && contentDocument.activeElement ||
                            activeElement;
                        return elem;
                    } catch (e) {}
                },


                // 居中浮层
                __center: function() {

                    var popup = this.__popup;
                    var fixed = this.options.fixed;
                    var dl = fixed ? 0 : $doc.scrollLeft();
                    var dt = fixed ? 0 : $doc.scrollTop();
                    var ww = $win.width();
                    var wh = $win.height();
                    var ow = popup.width();
                    var oh = popup.height();
                    var left = (ww - ow) / 2 + dl;
                    var top = (wh - oh) * 382 / 1000 + dt; // 黄金比例
                    var style = popup[0].style;
                    var style = popup[0].style;

                    style.left = Math.max(parseInt(left), dl) + 'px';
                    style.top = Math.max(parseInt(top), dt) + 'px';
                },


                // 指定位置 @param    {HTMLElement, Event}  anchor
                __follow: function(anchor) {

                    var $elem = anchor.parentNode && $(anchor);
                    var popup = this.__popup;


                    if (this.__followSkin) {
                        popup.removeClass(this.__followSkin);
                    }


                    // 隐藏元素不可用
                    if ($elem) {
                        var o = $elem.offset();
                        if (o.left * o.top < 0) {
                            return this.__center();
                        }
                    }

                    var that = this;
                    var fixed = this.options.fixed;

                    var winWidth = $win.width();
                    var winHeight = $win.height();
                    var docLeft = $doc.scrollLeft();
                    var docTop = $doc.scrollTop();


                    var popupWidth = popup.width();
                    var popupHeight = popup.height();
                    var width = $elem ? $elem.outerWidth() : 0;
                    var height = $elem ? $elem.outerHeight() : 0;
                    var offset = this.__offset(anchor);
                    var x = offset.left;
                    var y = offset.top;
                    var left = fixed ? x - docLeft : x;
                    var top = fixed ? y - docTop : y;


                    var minLeft = fixed ? 0 : docLeft;
                    var minTop = fixed ? 0 : docTop;
                    var maxLeft = minLeft + winWidth - popupWidth;
                    var maxTop = minTop + winHeight - popupHeight;


                    var css = {};
                    var align = this.options.align.split(' ');
                    var newClassName = className + '-';
                    var reverse = {
                        top: 'bottom',
                        bottom: 'top',
                        left: 'right',
                        right: 'left'
                    };
                    var name = {
                        top: 'top',
                        bottom: 'top',
                        left: 'left',
                        right: 'left'
                    };


                    var temp = [{
                        top: top - popupHeight,
                        bottom: top + height,
                        left: left - popupWidth,
                        right: left + width
                    }, {
                        top: top,
                        bottom: top - popupHeight + height,
                        left: left,
                        right: left - popupWidth + width
                    }];


                    var center = {
                        left: left + width / 2 - popupWidth / 2,
                        top: top + height / 2 - popupHeight / 2
                    };


                    var range = {
                        left: [minLeft, maxLeft],
                        top: [minTop, maxTop]
                    };


                    // 超出可视区域重新适应位置
                    $.each(align, function(i, val) {

                        // 超出右或下边界：使用左或者上边对齐
                        if (temp[i][val] > range[name[val]][1]) {
                            val = align[i] = reverse[val];
                        }

                        // 超出左或右边界：使用右或者下边对齐
                        if (temp[i][val] < range[name[val]][0]) {
                            align[i] = reverse[val];
                        }

                    });


                    // 一个参数的情况
                    if (!align[1]) {
                        name[align[1]] = name[align[0]] === 'left' ? 'top' : 'left';
                        temp[1][align[1]] = center[name[align[1]]];
                    }


                    //添加follow的css, 为了给css使用
                    newClassName += align.join('-') + ' ' + className + '-follow';

                    that.__followSkin = newClassName;


                    if ($elem) {
                        popup.addClass(newClassName);
                    }


                    css[name[align[0]]] = parseInt(temp[0][align[0]]);
                    css[name[align[1]]] = parseInt(temp[1][align[1]]);
                    popup.css(css);

                },


                // 获取元素相对于页面的位置（包括iframe内的元素）
                // 暂时不支持两层以上的 iframe 套嵌
                __offset: function(anchor) {

                    var isNode = anchor.parentNode;
                    var offset = isNode ? $(anchor).offset() : {
                        left: anchor.pageX,
                        top: anchor.pageY
                    };


                    anchor = isNode ? anchor : anchor.target;
                    var ownerDocument = anchor.ownerDocument;
                    var defaultView = ownerDocument.defaultView || ownerDocument.parentWindow;

                    if (defaultView == window) { // IE <= 8 只能使用两个等于号
                        return offset;
                    }

                    // {Element: Ifarme}
                    var frameElement = defaultView.frameElement;
                    var $ownerDocument = $(ownerDocument);
                    var docLeft = $ownerDocument.scrollLeft();
                    var docTop = $ownerDocument.scrollTop();
                    var frameOffset = $(frameElement).offset();
                    var frameLeft = frameOffset.left;
                    var frameTop = frameOffset.top;

                    return {
                        left: offset.left + frameLeft - docLeft,
                        top: offset.top + frameTop - docTop
                    };
                },

                /**
                 * 设置内容
                 * @param    {String, HTMLElement}   内容
                 */
                content: function(html) {

                    var $content = this._$('content');

                    // HTMLElement
                    if (typeof html === 'object') {
                        html = $(html);
                        $content.empty('').append(html.show());
                        this.bind('beforeremove', function() {
                            $('body').append(html.hide());
                        });
                        // String
                    } else {
                        $content.html(html);
                    }

                    return this.reset();
                },


                /**
                 * 设置标题
                 * @param    {String}   标题内容
                 */
                title: function(text) {
                    this._$('title').text(text);
                    this._$('header')[text ? 'show' : 'hide']();
                    return this;
                },


                /** 设置宽度 */
                width: function(value) {
                    this._$('content').css('width', value);
                    return this.reset();
                },


                /** 设置高度 */
                height: function(value) {
                    this._$('content').css('height', value);
                    return this.reset();
                },


                /**
                 * 设置按钮组
                 * @param   {Array, String}
                 * Options: value, callback, autofocus, disabled
                 */
                button: function(args) {
                    args = args || [];
                    var that = this;
                    var html = '';
                    var number = 0;
                    this.callbacks = {};


                    if (typeof args === 'string') {
                        html = args;
                        number++;
                    } else {
                        $.each(args, function(i, val) {

                            var id = val.id = val.id || val.value;
                            var style = '';
                            that.callbacks[id] = val.callback;


                            if (val.display === false) {
                                style = ' style="display:none"';
                            } else {
                                number++;
                            }

                            html +=
                                '<button' + ' type="button"' + ' i-id="' + id + '"' +
                                style +
                                (val.disabled ? ' disabled' : '') + (val.autofocus ?
                                    ' autofocus class="dialog-autofocus"' : '') +
                                '>' + val
                                .value + '</button>';

                            that._$('button')
                                .on('click', '[i-id=' + id + ']', function(event) {
                                    var $this = $(this);
                                    if (!$this.attr('disabled')) { // IE BUG
                                        that._trigger(id);
                                    }

                                    event.preventDefault();
                                });

                        });
                    }

                    this._$('button').html(html);
                    this._$('footer')[number ? 'show' : 'hide']();

                    return this;
                },


                statusbar: function(html) {
                    this._$('statusbar')
                        .html(html)[html ? 'show' : 'hide']();

                    return this;
                },


                _$: function(i) {
                    return this._popup.find('[i=' + i + ']');
                },


                // 触发按钮回调函数
                _trigger: function(id) {
                    var fn = this.callbacks[id];

                    return typeof fn !== 'function' || fn.call(this) !== false ?
                        this.close().destroy() : this;
                }

            });

            Dialog.popup = popupElement;

            var dialog = function(options, ok, cancel) {

                var originalOptions = options = options || {};


                if (typeof options === 'string' || options.nodeType === 1) {

                    options = {
                        content: options,
                        fixed: !_isFixed
                    };
                }


                options = $.extend(true, {}, defaults, options);
                options.original = originalOptions;

                var id = options.id = options.id || fly.guid();
                var api = dialog.get(id);


                // 如果存在同名的对话框对象，则直接返回
                if (api) {
                    return api.focus();
                }


                // 目前主流移动设备对fixed支持不好，禁用此特性
                if (!_isFixed) {
                    options.fixed = false;
                }


                // 快捷关闭支持：点击对话框外快速关闭对话框
                if (options.quickClose) {
                    options.modal = true;
                    options.backdropOpacity = 0;
                }


                // 按钮组
                if (!$.isArray(options.button)) {
                    options.button = [];
                }

                // 确定按钮
                if (ok !== undefined) {
                    options.ok = ok;
                }

                if (options.ok) {
                    options.button.push({
                        id: 'ok',
                        value: options.okValue,
                        callback: options.ok,
                        autofocus: true
                    });
                }


                // 取消按钮
                if (cancel !== undefined) {
                    options.cancel = cancel;
                }

                if (options.cancel) {
                    options.button.push({
                        id: 'cancel',
                        value: options.cancelValue,
                        callback: options.cancel,
                        display: options.cancelDisplay
                    });
                }

                return dialog.list[id] = new Dialog(popupElement(), options).showModal();
            };

            dialog.getCurrent = function() {
                return current;
            };

            dialog.list = {};

            dialog.get = function(id) {

                // 从 iframe 传入 window 对象
                if (id && id.frameElement) {
                    var iframe = id.frameElement;
                    var list = dialog.list;
                    var api;
                    for (var i in list) {
                        api = list[i];
                        if (api.node.getElementsByTagName('iframe')[0] === iframe) {
                            return api;
                        }
                    }
                    // 直接传入 id 的情况
                } else if (id) {
                    return dialog.list[id];
                }

            };

            fly.dialog = dialog;
            module.exports = Dialog;

        }, {
            "./fly.core": 9,
            "./fly.drag": 13,
            "./fly.ui": 32
        }
    ],
    13: [
        function(require, module, exports) {
            /**
             * 拖拽
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-22
             */

            'use strict';

            // 依赖core
            var fly = require("./fly.core"),
                $ = fly.$,
                $win = fly.$win,
                $doc = fly.$doc,
                proxy = $.proxy,
                isTouch = fly.support.touch;

            var html = document.documentElement;

            var isLosecapture = fly.browser.ie != 6 && 'onlosecapture' in html;

            var isSetCapture = 'setCapture' in html;

            var types = {
                start: isTouch ? 'touchstart' : 'mousedown',
                over: isTouch ? 'touchmove' : 'mousemove',
                end: isTouch ? 'touchend' : 'mouseup'
            };


            var getEvent = isTouch ? function(event) {
                if (!event.touches) {
                    event = event.originalEvent.touches.item(0);
                }
                return event;
            } : function(event) {
                return event;
            };


            var DragEvent = function() {
                this.start = proxy(this.start, this);
                this.over = proxy(this.over, this);
                this.end = proxy(this.end, this);
                this.onstart = this.onover = this.onend = $.noop;
            };

            DragEvent.types = types;

            DragEvent.prototype = {

                start: function(event) {
                    event = this.startFix(event);

                    $doc.on(types.over, this.over).on(types.end, this.end);

                    this.onstart(event);
                    return false;
                },

                over: function(event) {
                    event = this.overFix(event);
                    this.onover(event);
                    return false;
                },

                end: function(event) {
                    event = this.endFix(event);

                    $doc.off(types.over, this.over).off(types.end, this.end);

                    this.onend(event);
                    return false;
                },

                startFix: function(event) {
                    event = getEvent(event);

                    this.target = $(event.target);
                    this.selectstart = function() {
                        return false;
                    };

                    $doc.on('selectstart', this.selectstart).on('dblclick', this.end);

                    if (isLosecapture) {
                        this.target.on('losecapture', this.end);
                    } else {
                        $win.on('blur', this.end);
                    }

                    if (isSetCapture) {
                        this.target[0].setCapture();
                    }

                    return event;
                },

                overFix: function(event) {
                    event = getEvent(event);
                    return event;
                },

                endFix: function(event) {
                    event = getEvent(event);

                    $doc.off('selectstart', this.selectstart).off('dblclick', this.end);

                    if (isLosecapture) {
                        this.target.off('losecapture', this.end);
                    } else {
                        $win.off('blur', this.end);
                    }

                    if (isSetCapture) {
                        this.target[0].releaseCapture();
                    }

                    return event;
                }

            };


            /**
             * 启动拖拽
             * @param   {HTMLElement}   被拖拽的元素
             * @param   {Event} 触发拖拽的事件对象。可选，若无则监听 elem 的按下事件启动
             */
            DragEvent.create = function(elem, event) {
                var $elem = $(elem);
                var dragEvent = new DragEvent();
                var startType = DragEvent.types.start;
                var noop = function() {};
                var className = elem.className
                    .replace(/^\s|\s.*/g, '') + '-drag-start';

                var minX;
                var minY;
                var maxX;
                var maxY;

                var api = {
                    onstart: noop,
                    onover: noop,
                    onend: noop,
                    off: function() {
                        $elem.off(startType, dragEvent.start);
                    }
                };


                dragEvent.onstart = function(event) {
                    var isFixed = $elem.css('position') === 'fixed';
                    var dl = $doc.scrollLeft();
                    var dt = $doc.scrollTop();
                    var w = $elem.width();
                    var h = $elem.height();

                    minX = 0;
                    minY = 0;
                    maxX = isFixed ? $win.width() - w + minX : $doc.width() - w;
                    maxY = isFixed ? $win.height() - h + minY : $doc.height() - h;

                    var offset = $elem.offset();
                    var left = this.startLeft = isFixed ? offset.left - dl : offset.left;
                    var top = this.startTop = isFixed ? offset.top - dt : offset.top;

                    this.clientX = event.clientX;
                    this.clientY = event.clientY;

                    $elem.addClass(className);
                    api.onstart.call(elem, event, left, top);
                };


                dragEvent.onover = function(event) {
                    var left = event.clientX - this.clientX + this.startLeft;
                    var top = event.clientY - this.clientY + this.startTop;
                    var style = $elem[0].style;

                    left = Math.max(minX, Math.min(maxX, left));
                    top = Math.max(minY, Math.min(maxY, top));

                    style.left = left + 'px';
                    style.top = top + 'px';

                    api.onover.call(elem, event, left, top);
                };


                dragEvent.onend = function(event) {
                    var position = $elem.position();
                    var left = position.left;
                    var top = position.top;
                    $elem.removeClass(className);
                    api.onend.call(elem, event, left, top);
                };


                dragEvent.off = function() {
                    $elem.off(startType, dragEvent.start);
                };


                if (event) {
                    dragEvent.start(event);
                } else {
                    $elem.on(startType, dragEvent.start);
                }

                return api;
            };

            fly.DragEvent = DragEvent;
            module.exports = DragEvent;

        }, {
            "./fly.core": 9
        }
    ],
    14: [
        function(require, module, exports) {
            /**
             * 下拉框
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-08
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                List = require('./fly.list'),
                Select = fly.ui.Select,
                register = ui.register,
                Widget = ui.Widget,
                $ = fly.$,
                keys = fly.keys,
                proxy = $.proxy,
                ObservableObject = fly.ObservableObject,
                ObservableArray = fly.ObservableArray,
                isPlainObject = $.isPlainObject,
                activeElement = fly.activeElement;

            // 静态变量
            var NAME = 'DropDownList',
                NS = '.' + fly.NS + NAME,
                DISABLED = "disabled",
                STRING = 'string',
                READONLY = "readonly",
                CHANGE = "change",
                FOCUSED = "state-focused",
                DEFAULT = "state-default",
                STATEDISABLED = "state-disabled",
                SELECTED = "state-selected",
                HOVEREVENTS = "mouseenter" + NS + " mouseleave" + NS,
                TABINDEX = "tabindex",
                UNSELECTABLE = 'unselectable="on"',
                STATE_ACCEPT = "accept";

            var defaults = ui.defaults[NAME] = {
                enabled: true,
                autoBind: true,
                index: -1,
                text: null,
                value: null,
                delay: 500,
                height: 200,
                textField: "text",
                valueField: "value",
                textSplit: ',',
                valueSplit: ',',
                optionLabel: '', // 提示选项，可接受文字和object
                cascadeFrom: '',
                cascadeFromField: '',
                ignoreCase: true,
                selectable: true,
                animation: {},
                template: null,
                valuePrimitive: true,
                valueTemplate: null, // 显示text的模板
                optionLabelTemplate: null // 选项模板
            };

            var wrapperTemplate =
                '<span ' + UNSELECTABLE + ' class="dropdown-wrap ' + DEFAULT + '">' +
                '    <span ' + UNSELECTABLE + ' class="input">&nbsp;</span>' +
                '    <span ' + UNSELECTABLE + ' class="select">' +
                '        <i class="icon icon-triangle-down"></i>' +
                '    </span>' +
                '</span>';

            var DropDownList = Select.extend({

                name: NAME,

                ctor: function(element, options) {
                    var that = this;
                    var index = options && options.index;
                    var optionLabel, text;

                    that.ns = NS;
                    options = $.isArray(options) ? {
                        dataSource: options
                    } : options;

                    that._super(element, options);

                    options = that.options;
                    element = that.element.on("focus" + NS, proxy(that._focusHandler,
                        that));

                    that._inputTemplate();
                    that._reset();

                    that._prev = "";
                    that._word = "";
                    that.optionLabel = $();

                    that._wrapper();
                    that._tabindex();
                    that.wrapper.data(TABINDEX, that.wrapper.attr(TABINDEX));

                    that._span();
                    that._popup();
                    that._dataSource();
                    that._ignoreCase();
                    that._enable();

                    that._oldIndex = that.selectedIndex = -1;

                    if (index !== undefined) {
                        options.index = index;
                    }

                    that._initialIndex = options.index;
                    that._optionLabel();
                    that._initList();

                    that._cascade();

                    if (options.autoBind) {
                        that.dataSource && that.dataSource.fetch();
                    } else if (that.selectedIndex === -1) {
                        text = options.text || "";
                        if (!text) {
                            optionLabel = options.optionLabel;

                            if (optionLabel && options.index === 0) {
                                text = optionLabel;
                            } else if (that._isSelect) {
                                text = element.children(":selected").text();
                            }
                        }

                        that._textAccessor(text);
                    }

                    fly.notify(that);
                },

                options: defaults,

                events: [
                    "open",
                    "close",
                    CHANGE,
                    "select",
                    'focus',
                    'blur',
                    "dataBinding",
                    "dataBound",
                    "cascade"
                ],

                setOptions: function(options) {
                    this._super.setOptions(options);

                    this.listView.setOptions(this._listOptions(options));

                    this._optionLabel();
                    this._inputTemplate();
                    this._accessors();
                    this._enable();

                    if (!this.value() && this.optionLabel[0]) {
                        this.select(0);
                    }
                },

                destroy: function() {
                    var that = this;

                    that.wrapper.off(NS);
                    that.element.off(NS);
                    that._inputWrapper.off(NS);

                    that._arrow.off();
                    that._arrow = null;

                    that.optionLabel.off();

                    that._super.destroy();
                },

                open: function() {
                    var that = this;

                    if (that.popup.visible()) {
                        return;
                    }

                    if (!that.listView.isBound() || that._state === STATE_ACCEPT) {
                        that._open = true;
                        that._state = "rebind";
                    } else if (that._allowOpening()) {
                        that.popup.open();
                        that._focusItem();
                    }
                },

                toggle: function(toggle) {
                    this._toggle(toggle, true);
                },

                _allowOpening: function(length) {
                    return this.optionLabel[0] || this.dataSource.view().length;
                },

                current: function(candidate) {
                    var current;

                    if (candidate === undefined) {
                        current = this.listView.focus();

                        if (!current && this.selectedIndex === 0 && this.optionLabel[0]) {
                            return this.optionLabel;
                        }

                        return current;
                    }

                    this._focus(candidate);
                },

                dataItem: function(index) {
                    var that = this;
                    var dataItem = null;
                    var hasOptionLabel = !!that.optionLabel[0];
                    var optionLabel = that.options.optionLabel;

                    if (index === undefined) {
                        dataItem = that.listView.selectedDataItems()[0];
                    } else {
                        if (typeof index !== "number") {
                            if (index.hasClass("list-optionlabel")) {
                                index = -1;
                            } else {
                                index = $(that.items()).index(index);
                            }
                        } else if (hasOptionLabel) {
                            index -= 1;
                        }

                        dataItem = that.dataSource.view()[index];
                    }

                    if (!dataItem && hasOptionLabel) {
                        dataItem = isPlainObject(optionLabel) ? new ObservableObject(
                                optionLabel) :
                            that._assignInstance(that._optionLabelText(), "");
                    }

                    return dataItem;
                },

                refresh: function() {
                    this.listView.refresh();
                },

                text: function(text) {
                    var that = this;
                    var dataItem, loweredText;
                    var ignoreCase = that.options.ignoreCase;

                    text = text === null ? "" : text;

                    if (text !== undefined) {
                        if (typeof text === STRING) {
                            loweredText = ignoreCase ? text.toLowerCase() : text;

                            that._select(function(data) {
                                data = that._text(data);

                                if (ignoreCase) {
                                    data = (data + "").toLowerCase();
                                }

                                return data === loweredText;
                            });

                            dataItem = that.dataItem();

                            if (dataItem) {
                                text = dataItem;
                            }
                        }

                        that._textAccessor(text);
                    } else {
                        return that._textAccessor();
                    }
                },

                value: function(value) {
                    var that = this;

                    if (value === undefined) {
                        value = that._accessor() || that.listView.value()[0];
                        return value === undefined || value === null ? "" : value;
                    }

                    if (value === null) {
                        value = "";
                    }

                    if (value) {
                        that._initialIndex = null;
                    }

                    that.listView.value(value.toString().split(that.options.valueSplit))
                        .done(function() {
                            if (that.selectedIndex === -1 && that.text()) {
                                that.text("");
                            }

                            that._old = that._accessor();
                            that._oldIndex = that.selectedIndex;
                        });

                    that._fetchData();
                },

                _optionLabel: function() {
                    var that = this;
                    var options = that.options;
                    var optionLabel = options.optionLabel;
                    var template = options.optionLabelTemplate;

                    if (!optionLabel) {
                        that.optionLabel.off().remove();
                        that.optionLabel = $();
                        return;
                    }

                    if (!template) {
                        template = "{{";

                        if (typeof optionLabel === STRING) {
                            template += "$data";
                        } else {
                            template += fly.expr(options.textField, "$data");
                        }

                        template += "}}";
                    }

                    if (typeof template !== "function") {
                        template = fly.template.compile(template);
                    }

                    that.optionLabelTemplate = template;

                    if (!that.optionLabel[0]) {
                        that.optionLabel = $('<div class="list-optionlabel"></div>').prependTo(
                            that.list);
                    }

                    that.optionLabel.html(template(optionLabel))
                        .off()
                        .click(proxy(that._click, that))
                        .on(HOVEREVENTS, that._toggleHover);

                },

                _optionLabelText: function() {
                    var optionLabel = this.options.optionLabel;
                    return (typeof optionLabel === STRING) ? optionLabel : this._text(
                        optionLabel);
                },

                _listBound: function() {
                    var that = this;
                    var initialIndex = that._initialIndex;
                    var optionLabel = that.options.optionLabel;
                    var element = that.element[0];

                    var data = that.dataSource.view();
                    var length = data.length;
                    var dataItem;

                    var height;
                    var value;

                    that._presetValue = false;

                    if (that.popup.visible()) {
                        that.popup._position();
                    }

                    if (that._isSelect) {
                        value = that.value();

                        if (length) {
                            if (optionLabel) {
                                optionLabel = that._option("", that._optionLabelText());
                            }
                        } else if (value) {
                            optionLabel = that._option(value, that.text());
                        }

                        that._options(data, optionLabel, value);
                        if (element.selectedIndex === -1) {
                            element.selectedIndex = 0;
                        }
                    }

                    that._makeUnselectable();

                    if (that._open) {
                        that.toggle(that._allowOpening());
                    }

                    that._open = false;

                    if (!that._fetch) {
                        if (length) {
                            if (!that.listView.value().length && initialIndex > -1 &&
                                initialIndex !== null) {
                                that.select(initialIndex);
                            }

                            that._initialIndex = null;

                            dataItem = that.listView.selectedDataItems();

                            if (dataItem.length == 1 && that.text() !== that._text(
                                    dataItem)) {
                                that._selectValue(dataItem[0]);
                            }
                        } else if (that._textAccessor() !== that._optionLabelText()) {
                            that.listView.value("");
                            that._selectValue(null);
                        }
                    }

                    that._hideBusy();
                    that.trigger("dataBound");
                },

                _listChange: function(e) {
                    //debugger;
                    var that = this,
                        listView = that.listView,
                        selectable = that.options.selectable,
                        selectItems = listView.selectedDataItems();
                    if (selectable == 'multiple' && selectItems.length) {
                        that._selectValues(selectItems);
                    } else {
                        that._selectValue(selectItems[0]);
                        if (this._presetValue || (this._old && this._oldIndex === -1)) {
                            this._oldIndex = this.selectedIndex;
                        }
                    }
                },

                _focusHandler: function() {
                    this.wrapper.focus();
                },

                _focusinHandler: function(e) {
                    this._inputWrapper.addClass(FOCUSED);
                    this.trigger('focus', e);
                    this._prevent = false;
                },

                _focusoutHandler: function(e) {
                    var that = this;
                    var isIFrame = window.self !== window.top;
                    var focusedItem = that._focus();

                    if (!that._prevent) {

                        if (isIFrame) {
                            that._change();
                        } else {
                            that._blur();
                        }

                        that._inputWrapper.removeClass(FOCUSED);
                        that._prevent = true;
                        that._open = false;
                        that.element.blur();
                        this.trigger('blur', e);
                    }
                },

                _wrapperMousedown: function() {
                    this._prevent = false;
                },

                _wrapperClick: function(e) {
                    e.preventDefault();
                    this._focused = this.wrapper;
                    this._toggle();
                },

                _editable: function(options) {
                    var that = this;
                    var element = that.element;
                    var disable = options.disable;
                    var readonly = options.readonly;
                    var wrapper = that.wrapper.off(NS);
                    var dropDownWrapper = that._inputWrapper.off(HOVEREVENTS);

                    if (!readonly && !disable) {
                        element.removeAttr(DISABLED).removeAttr(READONLY);

                        dropDownWrapper
                            .addClass(DEFAULT)
                            .removeClass(STATEDISABLED)
                            .on(HOVEREVENTS, that._toggleHover);

                        wrapper
                            .attr(TABINDEX, wrapper.data(TABINDEX))
                            .on("keydown" + NS, proxy(that._keydown, that))
                            /*.on("focusin" + NS, proxy(that._focusinHandler, that))
                .on("focusout" + NS, proxy(that._focusoutHandler, that))*/
                            .on("mousedown" + NS, proxy(that._wrapperMousedown, that))
                            .on("click" + NS, proxy(that._wrapperClick, that));

                    } else if (disable) {
                        wrapper.removeAttr(TABINDEX);
                        dropDownWrapper
                            .addClass(STATEDISABLED)
                            .removeClass(DEFAULT);
                    } else {
                        dropDownWrapper
                            .addClass(DEFAULT)
                            .removeClass(STATEDISABLED);

                        /*wrapper
                .on("focusin" + NS, proxy(that._focusinHandler, that))
                .on("focusout" + NS, proxy(that._focusoutHandler, that));*/
                    }

                    element.attr(DISABLED, disable)
                        .attr(READONLY, readonly);
                },

                _option: function(value, text) {
                    return '<option value="' + value + '">' + text + "</option>";
                },

                _keydown: function(e) {
                    var key = e.keyCode;
                    e.keyCode = key;
                    this._move(e);
                },

                _click: function(e) {
                    var item = e.item || $(e.currentTarget);

                    if (this.trigger("select", {
                            item: item
                        })) {
                        this.close();
                        return;
                    }

                    this._userTriggered = true;

                    this._select(item);
                    this._blur();
                },

                _get: function(candidate) {
                    var data, found, idx;
                    var jQueryCandidate = $(candidate);

                    if (this.optionLabel[0]) {
                        if (typeof candidate === "number") {
                            if (candidate > -1) {
                                candidate -= 1;
                            }
                        } else if (jQueryCandidate.hasClass("list-optionlabel")) {
                            candidate = -1;
                        }
                    }

                    if (typeof candidate === "function") {
                        data = this.dataSource.view();

                        for (idx = 0; idx < data.length; idx++) {
                            if (candidate(data[idx])) {
                                candidate = idx;
                                found = true;
                                break;
                            }
                        }

                        if (!found) {
                            candidate = -1;
                        }
                    }

                    return candidate;
                },

                _focusItem: function() {
                    var listView = this.listView;
                    var focusedItem = listView.focus();
                    var index = listView.select();

                    index = index[index.length - 1];

                    if (index === undefined && this.options.highlightFirst && !
                        focusedItem) {
                        index = 0;
                    }

                    if (index !== undefined) {
                        listView.focus(index);
                    } else {
                        if (this.options.optionLabel) {
                            this._focus(this.optionLabel);
                            this._select(this.optionLabel);
                        } else {
                            listView.scrollToIndex(0);
                        }
                    }
                },

                _focus: function(candidate) {
                    var listView = this.listView;
                    var optionLabel = this.optionLabel;

                    if (candidate === undefined) {
                        candidate = listView.focus();

                        if (!candidate && optionLabel.hasClass(FOCUSED)) {
                            candidate = optionLabel;
                        }

                        return candidate;
                    }

                    optionLabel.removeClass(FOCUSED);

                    candidate = this._get(candidate);

                    listView.focus(candidate);

                    if (candidate === -1) {
                        optionLabel.addClass(FOCUSED);
                    }
                },

                _select: function(candidate, keepState) {
                    var that = this;
                    var optionLabel = that.optionLabel;

                    candidate = that._get(candidate);
                    that.listView.select(candidate);

                    if (candidate === -1) {
                        that._selectValue(null);
                    }
                },

                _selectValue: function(dataItem) {
                    var that = this;
                    var optionLabel = that.options.optionLabel;
                    var labelElement = that.optionLabel;
                    var idx = that.listView.select();

                    var value = "";
                    var text = "";

                    idx = idx[idx.length - 1];
                    if (idx === undefined) {
                        idx = -1;
                    }

                    labelElement.removeClass(FOCUSED + ' ' + SELECTED);

                    if (dataItem) {
                        text = dataItem;
                        value = that._dataValue(dataItem);
                        if (optionLabel) {
                            idx += 1;
                        }
                    } else if (optionLabel) {
                        that._focus(labelElement.addClass(SELECTED));
                        text = that._optionLabelText();
                        if (typeof optionLabel === STRING) {
                            value = "";
                        } else {
                            value = that._value(optionLabel);
                        }

                        idx = 0;
                    }

                    that.selectedIndex = idx;

                    if (value === null) {
                        value = "";
                    }

                    that._textAccessor(text);
                    that._accessor(value, idx);

                    that._triggerCascade();
                },

                _selectValues: function(dataItems) {
                    var that = this,
                        idx = that.listView.select(),
                        labelElement = that.optionLabel,
                        value = [],
                        text = '',
                        i = 0,
                        l = dataItems.length;
                    labelElement.removeClass(FOCUSED + ' ' + SELECTED);
                    for (; i < l; i++) {
                        value.push(that._dataValue(dataItems[i]));
                    }

                    value = value.join(that.options.valueSplit);

                    that._textAccessor(dataItems);
                    that._accessor(value, idx);
                },

                _span: function() {
                    var that = this,
                        wrapper = that.wrapper,
                        SELECTOR = "span.input",
                        span;

                    span = wrapper.find(SELECTOR);

                    if (!span[0]) {
                        wrapper.append(wrapperTemplate).append(that.element);
                        span = wrapper.find(SELECTOR);
                    }

                    // 验证目标元素
                    that.element.data('target', span);

                    that.span = span;
                    that._inputWrapper = $(wrapper[0].firstChild);
                    that._arrow = wrapper.find(".icon");
                },

                _wrapper: function() {
                    var that = this,
                        element = that.element,
                        DOMelement = element[0],
                        wrapper;

                    wrapper = element.parent();

                    if (!wrapper.is("span.widget")) {
                        wrapper = element.wrap("<span />").parent();
                        wrapper[0].style.cssText = DOMelement.style.cssText;
                        wrapper[0].title = DOMelement.title;
                    }

                    element.hide();

                    that._focused = that.wrapper = wrapper
                        .addClass("widget dropdown")
                        .addClass(DOMelement.className)
                        .css("display", "")
                        .attr({
                            unselectable: "on",
                            role: "listbox"
                        });
                },

                _clearSelection: function(parent) {
                    this.select(parent.value() ? 0 : -1);
                },

                _inputTemplate: function() {
                    var that = this,
                        template = that.options.valueTemplate;

                    if (!template) {
                        template = that._text;
                    } else {
                        template = fly.template.compile(template);
                    }

                    that.valueTemplate = template;
                },

                _textAccessor: function(text) {
                    var template = this.valueTemplate,
                        options = this.options,
                        optionLabel = options.optionLabel,
                        span = this.span,
                        texts = [];

                    if (text !== undefined) {
                        if (isPlainObject(text) || text instanceof ObservableObject) {
                            span.html(template(text));
                        } else if ($.isArray(text) || text instanceof ObservableArray) {
                            span.html($.map(text, function(item, i) {
                                return template(item);
                            }).join(options.textSplit));
                        } else if (optionLabel && this._optionLabelText() === text) {
                            span.html(this.optionLabelTemplate(optionLabel))
                        }
                    } else {
                        return span.text();
                    }
                },

                _preselect: function(value, text) {
                    if (!value && !text) {
                        text = this._optionLabelText();
                    }

                    this._accessor(value);
                    this._textAccessor(text);

                    this._old = this._accessor();
                    this._oldIndex = this.selectedIndex;

                    this.listView.setValue(value);

                    this._initialIndex = null;
                    this._presetValue = true;
                },

                _assignInstance: function(text, value) {
                    var textField = this.options.textField,
                        valueField = this.options.valueField,
                        dataItem = {};

                    if (textField) {
                        assign(dataItem, textField.split("."), text);
                        assign(dataItem, valueField.split("."), value);
                        dataItem = new ObservableObject(dataItem);
                    } else {
                        dataItem = text;
                    }

                    return dataItem;
                }
            });

            function assign(instance, fields, value) {
                var idx = 0,
                    lastIndex = fields.length - 1,
                    field;

                for (; idx < lastIndex; ++idx) {
                    field = fields[idx];

                    if (!(field in instance)) {
                        instance[field] = {};
                    }

                    instance = instance[field];
                }

                instance[fields[lastIndex]] = value;
            }

            register(DropDownList);
            module.exports = DropDownList;

        }, {
            "./fly.core": 9,
            "./fly.list": 21,
            "./fly.ui": 32
        }
    ],
    15: [
        function(require, module, exports) {
            /**
             * 下拉树
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2016-01-10
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                data = require('./fly.data'),
                Popup = require('./fly.popup'),
                Tree = require('./fly.tree'),
                Widget = ui.Widget,
                register = ui.register,
                $ = fly.$,
                extend = $.extend,
                proxy = $.proxy,
                activeElement = fly.activeElement;

            // 静态变量
            var NAME = 'DropDownTree',
                NS = '.' + fly.NS + NAME,
                UNSELECTED = 'unselectable="on"',
                DISABLED = "disabled",
                READONLY = "readonly",
                FOCUSED = "state-focused",
                DEFAULT = "state-default",
                STATEDISABLED = "state-disabled",
                SELECTED = "state-selected",
                STATEHOVER = "state-hover",
                TABINDEX = "tabindex",
                OPEN = 'open',
                CLOSE = 'close',
                CHANGE = 'change',
                WIDTH = 'width',
                HOVEREVENTS = "mouseenter" + NS + " mouseleave" + NS;

            var defaults = ui.defaults[NAME] = {
                placeholder: '请选择',
                animation: {},
                popup: {},
                dragAndDrop: false, //拖拽
                checkboxes: {
                    checkChildren: true
                },
                autoBind: true,
                loadOnDemand: true,
                template: '',
                textField: 'name',
                valueField: 'code',
                urlField: 'url',
                imageCssField: 'iconCss',
                imageUrlField: 'iconUrl'
            };

            var DropDownTree = Widget.extend({

                name: NAME,

                options: defaults,

                ctor: function(element, options) {
                    var that = this;

                    that._super(element, options);
                    options = that.options;
                    that.options.placeholder = options.placeholder || that.element.attr(
                        'placeholder');

                    that._wrapper();
                    that._tree();
                    that.setDataSource(options.dataSource || {});
                    that._popup();
                    that._enable();
                },

                events: [
                    CHANGE
                ],
                //下拉树组件的封装
                _wrapper: function() {
                    var that = this,
                        element = that.element,
                        DOMelement = element[0],
                        SELECTOR = "span.input",
                        wrapper,
                        span;

                    wrapper = element.parent();

                    if (!wrapper.is("span.widget")) { //包裹span
                        wrapper = element.wrap("<span />").parent();
                        wrapper[0].style.cssText = DOMelement.style.cssText;
                        wrapper[0].title = DOMelement.title;
                    }

                    element.hide();

                    that._focused = that.wrapper = wrapper
                        .addClass("widget dropdown")
                        .addClass(DOMelement.className)
                        .css("display", '')
                        .attr({
                            unselectable: 'on'
                        });

                    span = wrapper.find(SELECTOR);

                    if (!span[0]) { //渲染下拉树的输入框
                        wrapper.append(
                                '<span ' + UNSELECTED + ' class="dropdown-wrap ' + DEFAULT +
                                '">' +
                                // 添加  placeholder 的处理 by pang.ziqin
                                '<span ' + UNSELECTED + ' class="input">' + (that.options.placeholder || '请选择') + '</span>' +
                                '<span ' + UNSELECTED + ' class="select">' +
                                '<i class="icon icon-node"></i>' +
                                '</span></span>'
                            )
                            .append(that.element);

                        span = wrapper.find(SELECTOR);
                    }

                    // 验证目标元素
                    that.element.data('target', span);

                    that.span = span;
                    that._inputWrapper = $(wrapper[0].firstChild);
                },

                _tree: function() { //渲染下拉树
                    var that = this,
                        options = that.options;
                    that.treeContainer = $('<div class="treeview-container" />').appendTo(
                        'body');
                    that.treeWrapper = $('<div />').appendTo(that.treeContainer);
                    that.tree = new Tree(that.treeWrapper, options);

                    if (options.checkboxes) {
                        that.tree.bind('check', proxy(that._checkHandler, that));
                    } else {
                        that.tree.bind(CHANGE, proxy(that._okHandler, that));
                    }
                },
                //设置数据源
                setDataSource: function(dataSource) {
                    dataSource = $.isArray(dataSource) ? {
                        data: dataSource
                    } : dataSource;
                    dataSource = data.DataSource.create(dataSource);
                    this.dataSource = dataSource;
                    this.tree.setDataSource(dataSource);
                },

                _popup: function() {
                    var that = this;
                    that.popup = new Popup(that.treeContainer, extend({}, that.options.popup, {
                        anchor: that.wrapper,
                        animation: that.options.animation,
                        open: proxy(that._openHandler, that)
                    }));
                },

                //pop open及宽度计算
                _openHandler: function() {
                    var treeContainer = this.treeContainer,
                        width = treeContainer[0].style.width,
                        wrapper = this.wrapper,
                        computedStyle, computedWidth;

                    if (!treeContainer.data(WIDTH) && width) {
                        return;
                    }

                    computedStyle = window.getComputedStyle ? window.getComputedStyle(
                        wrapper[0], null) : 0;
                    computedWidth = computedStyle ? parseFloat(computedStyle.width) :
                        wrapper.outerWidth();

                    if (computedStyle && $.browser.msie) { //IE浏览器 宽度计算
                        computedWidth += parseFloat(computedStyle.paddingLeft) +
                            parseFloat(
                                computedStyle.paddingRight) + parseFloat(computedStyle.borderLeftWidth) +
                            parseFloat(computedStyle.borderRightWidth);
                    }

                    if (treeContainer.css("box-sizing") !== "border-box") { //无box-sizing样式
                        width = computedWidth - (treeContainer.outerWidth() -
                            treeContainer.width());
                    } else {
                        width = computedWidth;
                    }

                    treeContainer.css({
                            fontFamily: wrapper.css("font-family"),
                            width: width
                        })
                        .data(WIDTH, width);

                    return true;
                },

                _focusHandler: function() {
                    this.wrapper.focus();
                },

                _focusinHandler: function() {
                    this._inputWrapper.addClass(FOCUSED);
                    this._prevent = false;
                },

                _focusoutHandler: function() {
                    var that = this;
                    var isIFrame = window.self !== window.top;

                    if (!that._prevent) {
                        if (isIFrame) {
                            that._change();
                        } else {
                            that._blur();
                        }

                        that._inputWrapper.removeClass(FOCUSED);
                        that._prevent = true;
                    }
                },

                _wrapperMousedown: function() {
                    this._prevent = false;
                },
                //触发下拉树展开收起
                _wrapperClick: function(e) {
                    e.preventDefault();
                    this.popup.unbind("activate", this._focusInputHandler);
                    this._focused = this.wrapper;
                    this._toggle();
                },

                // 下拉树的展开和关闭
                _toggle: function(open, preventFocus) {
                    var that = this;

                    open = open !== undefined ? open : !that.popup.visible();

                    if (!preventFocus && that._focused[0] !== activeElement()) {
                        that._focused.focus();
                    }

                    that[open ? OPEN : CLOSE]();
                },

                _toggleHover: function(e) {
                    $(e.currentTarget).toggleClass(STATEHOVER, e.type === "mouseenter");
                },
                //根据 readonly和disable进行是否可编辑设置
                _editable: function(options) {
                    var that = this;
                    var element = that.element;
                    var disable = options.disable;
                    var readonly = options.readonly;
                    var wrapper = that.wrapper.off(NS);
                    var inputWrapper = that._inputWrapper.off(HOVEREVENTS);

                    if (!readonly && !disable) {
                        element.removeAttr(DISABLED).removeAttr(READONLY);

                        inputWrapper
                            .addClass(DEFAULT)
                            .removeClass(STATEDISABLED)
                            .on(HOVEREVENTS, that._toggleHover);

                        wrapper
                            .attr(TABINDEX, wrapper.data(TABINDEX))
                            .on("mousedown" + NS, proxy(that._wrapperMousedown, that))
                            .on("click" + NS, proxy(that._wrapperClick, that));

                        //.on("focusin" + NS, proxy(that._focusinHandler, that))
                        //.on("focusout" + NS, proxy(that._focusoutHandler, that))
                    } else if (disable) {
                        wrapper.removeAttr(TABINDEX);
                        inputWrapper
                            .addClass(STATEDISABLED)
                            .removeClass(DEFAULT);
                    } else {
                        inputWrapper
                            .addClass(DEFAULT)
                            .removeClass(STATEDISABLED);

                        wrapper
                        //.on("focusin" + NS, proxy(that._focusinHandler, that))
                        //.on("focusout" + NS, proxy(that._focusoutHandler, that));
                    }

                    element.attr(DISABLED, disable)
                        .attr(READONLY, readonly);
                },

                _okHandler: function() {
                    var nodeItem = this.tree.dataItem(this.tree.select()),
                        options = this.options;
                    this.span.text(nodeItem[options.textField]);
                    this.element.val(nodeItem[options.valueField]);
                    this._focusoutHandler();
                    this.close();
                },

                // 选择的下拉树展示在span text中，以逗号分隔
                _checkHandler: function() {
                    var nodes = this.tree.getCheckedNodes(),
                        options = this.options,
                        texts = [],
                        values = [],
                        length = nodes.length,
                        i = 0;

                    for (; i < length; i++) {
                        texts.push(nodes[i][options.textField]);
                        values.push(nodes[i][options.valueField]);
                    }

                    this.span.text(texts.join(', '));
                    this.element.val(values.join(','));

                    this._change();
                },

                _blur: function() {
                    this._change();
                    this.close();
                },

                _change: function() {
                    var that = this;
                    that.element.trigger(CHANGE);
                    that.trigger(CHANGE); //触发CHANGE事件：
                },

                _enable: function(enable) {
                    this._editable({
                        readonly: false,
                        disable: !(enable = enable === undefined ? true : enable)
                    });
                },

                readonly: function(readonly) {
                    this._editable({
                        readonly: readonly === undefined ? true : readonly,
                        disable: false
                    });
                },

                value: function(value) {
                    var tree = this.tree,
                        options = this.options,
                        nodeItem,
                        item;

                    if (options.checkboxes) {
                        if (value === undefined) {
                            return this.element.val();
                        }

                    } else {
                        nodeItem = tree.dataItem(tree.select());
                        if (value === undefined) {
                            return nodeItem && nodeItem[options.valueField];
                        }
                        item = tree.dataSource.get(value, options.valueField);
                        if (item) {
                            item.set("selected", true);
                            this._okHandler();
                        }
                    }
                },

                open: function() {
                    var that = this;

                    if (that.popup.visible()) {
                        return;
                    }

                    that.popup.open();
                },

                close: function() {
                    this.popup.close();
                },

                destroy: function() {
                    this._super.destroy();
                }

            });


            register(DropDownTree);
            module.exports = DropDownTree;

        }, {
            "./fly.core": 9,
            "./fly.data": 10,
            "./fly.popup": 25,
            "./fly.tree": 31,
            "./fly.ui": 32
        }
    ],
    16: [
        function(require, module, exports) {
            /**
             * 表单
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-08
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                register = ui.register,
                Widget = ui.Widget,
                $ = fly.$,
                map = $.map,
                keys = fly.keys,
                proxy = $.proxy;

            // 静态变量
            var NAME = 'Form',
                NS = '.' + fly.NS + NAME,
                STRING = 'string';

            var defaults = ui.defaults[NAME] = {
                target: null,
                valid: {}
            };

            // 按钮组件
            var Form = Widget.extend({

                name: NAME,

                options: defaults,

                ctor: function(element, options) {
                    var that = this;
                    that._super(element, options);

                    that.element
                        .on('submit' + NS, proxy(that.submit, that))
                        .on('reset' + NS, proxy(that.reset, that))
                        .on('validate' + NS, proxy(that.validate, that));

                    fly.notify(that);
                },

                destroy: function() {
                    this.element.off(NS);
                    this._super.destroy();
                },

                events: [

                ],

                serialization: function(isValidate) {
                    var $form = this.element,
                        valid = this.options.valid,
                        $items = $form.find(
                            'input:not(:disabled)[name], textarea:not(:disabled)[name], select[name]'
                        ),
                        names = $items.map(function() {
                            return $(this).attr('name');
                        }).get(),
                        data = {},
                        cache = {},
                        i = 0,
                        l;

                    for (l = names.length; i < l; i++) {
                        var name = names[i],
                            $item = $items.filter('[name="' + name + '"]'),
                            widget = $item.data('handler'),
                            value = '';

                        if (cache[name]) {
                            continue;
                        } else {
                            cache[name] = name;
                        }

                        if (isValidate && !fly.validate($item, valid[name])) {
                            return null;
                        }

                        if (widget) {
                            value = widget.value();
                        } else {
                            value = $.trim($item.val());
                            if ($item.is(':checkbox') || $item.is(':radio')) {
                                data[name] = $item.filter(':checked').map(function() {
                                    return $(this).val();
                                }).get().join(',');
                                continue;
                            }
                        }

                        data[name] = value;
                    }

                    return data;
                },

                _set: function(data) {
                    var $form = this.element;
                    map(data, function(value, name) {
                        var $item = $form.find('[name="' + name + '"]'),
                            widget = $item.data('handler');
                        if (widget) {
                            if (($item.data('flyComboBox') || $item.data(
                                    'flyDropDownList')) &&
                                widget.options.tips && value == '') {
                                widget.select(0);
                            } else {
                                widget.value(value);
                            }
                        } else if ($item.is(':radio')) {
                            $item.filter('[value="' + value + '"]').attr('checked',
                                true);
                        } else if ($item.is(':checkbox')) {
                            value = $.isArray(value) ? value : value.split(',');
                            $item.each(function() {
                                if ($.inArray($(this).val(), value)) {
                                    $(this).attr('checked', true);
                                }
                            });
                        } else {
                            $item.val(value);
                        }
                    });
                },

                data: function(data) {
                    if (data == undefined) {
                        return this.serialization(true);
                    } else if (data === false) {
                        return this.serialization(false);
                    } else {
                        this._set(data);
                    }
                },

                filter: function(isValid) {
                    var data = this.serialization(isValid !== false ? true : false),
                        filters = map(data, function(value, key) {
                            if (value) {
                                return {
                                    field: key,
                                    value: value
                                };
                            }
                        });
                    if (!data) {
                        return null;
                    } else if (filters.length == 0) {
                        return false;
                    } else {
                        return filters;
                    }
                },

                submit: function() {

                },

                reset: function() {

                },

                validate: function(name, options) {
                    var valid = this.options.valid || {};
                    if (typeof name == STRING) {
                        valid[name] = options;
                    } else if ($.isPlainObject(name)) {
                        valid = name;
                    }
                    this.options.valid = valid;
                },

                enable: function() {

                },

                readonly: function() {

                }
            });

            register(Form);
            module.exports = Form;

        }, {
            "./fly.core": 9,
            "./fly.ui": 32
        }
    ],
    17: [
        function(require, module, exports) {
            /**
             * 格式转换
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-06-06
             */

            'use strict';

            // 依赖core
            var fly = require("./fly.core");

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

            var format = {};

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
            format.parseDate = function(value, format) {

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
                    'yyyy-MM-dd HH:mm:ss.t',
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
            format.toJSON = function(o) {
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
            format.evalJSON = function(src) {
                if (!src) {
                    return {};
                }
                if (typeof(JSON) == 'object' && JSON.parse) {
                    return JSON.parse(src);
                }
                return eval('(' + src + ')');
            };

            /**
             * 安全还原JSON
             * @param   {String} src JSON字符串
             * @returns {[[Type]]} [[Description]]
             */
            format.secureEvalJSON = function(src) {
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
            format.quoteString = function(string) {
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
            format.format = function(source, params) {
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

            $.extend(fly, format);
            module.exports = format;

        }, {
            "./fly.core": 9
        }
    ],
    18: [
        function(require, module, exports) {
            /**
             *   表格组件
             *
             *   提供功能
             *
             *     1  可配置的自定义表头 和 数据绑定
             *
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                data = require('./fly.data'),
                register = ui.register,
                Widget = ui.Widget,
                $ = fly.$,
                proxy = $.proxy;

            // 静态变量
            var NAME = 'Grid',
                NS = '.' + fly.NS + NAME,
                CLICK = 'click' + NS;

            var defaults = ui.defaults[NAME] = {
                autoAdd: false
            };

            var Gird = Widget.extend({

                name: NAME,

                options: defaults,

                ctor: function(element, options) {
                    var that = this;
                    that._super(element, options);
                    that._wrapper();
                    that._dataSource();



                    that._dom = that.element;

                    that.cols = options.cols || [];

                    that._events = {};
                    that._autoAdd = options.autoAdd;

                    that.__check = options.check; //自动增加表头check
                    that.__checkRem = options.checkRem; // 表头check是否需要存储起来  这里配置识别数据的唯一key

                    that.__rowIndex = options.rowIndex;

                    that.__initCols(); //初始化分析表头

                    that.initRender();

                    that._formater = {};
                    that._bindFormater = {};

                    that.__bindFormater();

                    that.Rem = {

                        rem: [],

                        add: function(key) {
                            if (!key) return;

                            this.rem.push(key);
                        },


                        clear: function() {
                            this.rem = [];
                            var dom = this.checkAll;
                            if (dom) {
                                dom.removeAttr("checked");
                            }
                        },

                        remove: function(key) {

                            for (var i = 0; i < this.rem.length; i++) {
                                if (this.rem[i] == key) {
                                    this.rem.splice(i, 1);
                                }
                            }
                        }

                    };


                    if (that.__check) {

                        that.Rem.checkAll = $(that._dom).find(
                            'input.selectAll[type=checkbox]');

                        $(that._dom).find('thead').on('click',
                            'input.selectAll[type=checkbox]',
                            function() {
                                var flag = $(this).is(":checked");
                                $(that._dom).find("input.select[type=checkbox]").each(
                                    function() {
                                        var key = $(this).attr('key');
                                        if (flag) {
                                            $(this).attr("checked", "checked");
                                            that.Rem.add(key);
                                        } else {
                                            $(this).removeAttr("checked");
                                            that.Rem.remove(key);
                                        }
                                    })
                            });
                        $(that._dom).find('tbody').on('click',
                            'input.select[type=checkbox]',
                            function() {
                                var $dom = $(that._dom),
                                    selectAll = $(that._dom).find("input.selectAll");
                                var key = $(this).attr('key'),
                                    flag = $(this).is(":checked");
                                if (flag) {
                                    if ($dom.find("input.select").length == $dom.find(
                                            "input.select:checked").length) {
                                        selectAll.attr("checked", "checked");
                                    }

                                    that.Rem.add(key);
                                } else {
                                    that.Rem.remove(key);
                                    selectAll.removeAttr("checked");
                                }

                                that.trigger('checkboxChange', {
                                    key: key
                                });
                            })
                    }

                    if (options.autoLoad !== false) {
                        setTimeout(function() {
                            that.dataSource.read();
                        }, 0);
                    }

                },

                events: [
                    'checkboxChange'
                ],

                _wrapper: function() {
                    var that = this;
                    that.element.addClass('grid')
                        .append(
                            '<table class="grid-table" cellspacing="0"><thead></thead><tbody></tbody></table>'
                        );
                },

                _dataSource: function() {
                    var that = this,
                        element = that.element,
                        options = that.options,
                        dataSource = options.dataSource || {},
                        idx;

                    dataSource = $.isArray(dataSource) ? {
                        data: dataSource
                    } : dataSource;

                    if (that.dataSource) {
                        that._unbindDataSource();
                    } else {
                        that._changeHandler = proxy(that.loadData, that);
                        that._emptyHandler = proxy(that.empty, that)
                    }

                    that.dataSource = data.DataSource.create(dataSource)
                        .bind("empty", that._emptyHandler)
                        .bind("change", that._changeHandler);
                },

                _unbindDataSource: function() {
                    var that = this;
                    that.dataSource
                        .unbind("empty", that._emptyHandler)
                        .unbind("change", that._changeHandler);
                },

                __initCols: function() {

                    var cols = this.cols,
                        _cols = [],
                        _field = [],
                        self = this;
                    var maxLength = 1;


                    if (this.__rowIndex) {
                        cols.unshift({
                            name: "序号",
                            field: "_index",
                            w: 60
                        })
                    }
                    if (this.__check) {
                        cols.unshift({
                            name: "<input type='checkbox' class='selectAll'/>",
                            w: 40
                        })
                    }


                    function initLength(data, length) {

                        data.field = data.field || ("Auto-" + Math.round(Math.random() *
                            1000));
                        var f = data.field;
                        data._index = length;
                        data._width = 0;
                        data.style = data.style || '';

                        if (data.key) {
                            data._kv = true;
                            data._length = length;
                            data._width = 1;
                            data._type = 'key-value';
                            _cols.push(data);
                            _field.push(data);

                            self.setRowKey(data.key, data.value);
                            return;
                        }

                        if (typeof f == 'string') {
                            data._length = length;
                            maxLength = Math.max(maxLength, length + 1);
                            _cols.push(data);
                            _field.push(data);
                            data._width = 1;
                        } else {
                            for (var i = 0, len = f.length; i < len; i++) {
                                initLength(f[i], length + 1);
                                data._width += f[i]._width;
                            }
                            _cols.push(data);
                        }
                    }
                    for (var i = 0, len = cols.length; i < len; i++) {
                        initLength(cols[i], 0);
                    }

                    this._cols_maxLength = maxLength;
                    this._cols = _cols;
                    this._field = _field;
                    //this._keys = _keys;
                },

                __bindFormater: function() {

                    var cols = this.cols;

                    for (var i = 0; i < cols.length; i++) {
                        this.bindFormater(cols[i].field, cols[i].formater);
                    }
                },

                __GirdHeader: function() {
                    var html = "",
                        trTag = "<tr>{html}</tr>",
                        tdTag =
                        "<th rowspan='{row}' style='{style}' colspan='{col}' field='{field}'>{name}</th>";
                    var maxLength = this._cols_maxLength,
                        cols = this._cols;

                    for (var i = 0; i < maxLength; i++) {
                        var temp = '';
                        for (var j = 0, col; col = cols[j++];) {
                            if (col._index == i) {
                                col.row = (maxLength - col._length) || 1;
                                col.col = col._width || 1;
                                col.w = col.w;
                                if (col.w) {
                                    col.style += "width:" + col.w + "px ";
                                }

                                temp += tdTag.replace(/{\w+}/g, function(text) {
                                    text = text.substring(1, text.length - 1);
                                    return col[text];
                                })
                            }
                        }
                        html += trTag.replace('{html}', temp);
                    }
                    return html;
                },


                __DataTpl: function() {

                    var tag = "<tr>{html}</tr>",
                        html = '';
                    var k = 0;
                    var tdTag = "<td class='{class}' field='{field}'>{{field}}</td>",
                        tdKeyTag = "<td class='{class}' key='{key}'>{{key}_key}</td>";

                    if (this.__check) {
                        k = 1;
                    }


                    for (var i = k, f; f = this._field[i++];) {
                        var tempTag = (!f._kv) ? tdTag : tdKeyTag;
                        html += tempTag.replace(/{\w+}/g, function(text) {
                            text = text.substring(1, text.length - 1);
                            if (f.exp) {
                                return 'exp:' + f.exp;
                            }
                            return f[text] || '';
                        });
                    }

                    if (this.__check) {
                        html = "<td><input class='select' type='checkbox' key='{" +
                            this.__checkRem +
                            "}'></td>" + html;
                    }

                    this._dataTpl = tag.replace('{html}', html);
                    return this._dataTpl;
                },

                getRem: function() {
                    return this.Rem.rem;
                },

                initRender: function() {
                    var $table = this._dom.find('table');
                    $table.find("thead").html(this.__GirdHeader());
                },

                addFormater: function(name, hanlder) {
                    this._formater[name] = hanlder;
                },

                bindFormater: function(colName, hanlderName) {

                    if (!colName || !hanlderName) return;

                    this._bindFormater[colName] = hanlderName;
                },

                getFormater: function(colName) {
                    var handlerName = this._bindFormater[colName];
                    return handlerName ? this._formater[handlerName] : null;
                },

                autoAdd: function() {
                    if (!this._autoAdd) return;

                    var cols = (this._autoAdd).split(',');

                    for (var i = 0; i < cols.length; i++) {

                        var c = cols[i],
                            type = 'key';

                        if (c.indexOf(':') > 0) {
                            c = c.split(':')[1];
                            type = 'field';
                        }

                        var domStr = "td[" + type + "='" + c + "']";
                        var doms = this._dom.find("tbody " + domStr);

                        if (doms.length <= 0) {
                            return;
                        }

                        var temp = $(doms[0]).html(),
                            len = 1,
                            tempIndex = 0;
                        for (var i = 1; i <= doms.length; i++) {

                            var text = $(doms[i]).html();
                            if (text == temp) {
                                len++;
                                $(doms[i]).attr("removed", 'true');
                            } else {
                                $(doms[tempIndex]).attr('rowspan', len);
                                len = 1;
                                tempIndex = i;
                                temp = text;
                            }
                        }

                        doms.each(function(i, v) {

                            if ($(this).attr("removed")) {
                                $(this).remove();
                            }

                        })

                    }
                },

                // 数据为空时的提示
                empty: function() {

                    var emptyTag = '<tr><td class="empty" colspan="' + this._field.length +
                        '">没有数据</td></tr>';

                    if (this.dataSource.page() == 1) {
                        this._dom.find('table tbody').empty()
                            .append(emptyTag);
                    }
                },

                loadData: function() {
                    var self = this,
                        dataSource = this.dataSource,
                        data = dataSource.view();

                    //选择框 
                    self.Rem.clear();

                    if (!data || data.length == 0) {
                        this.empty();
                        return;
                    }
                    var html = "",
                        tpl = this.__DataTpl();

                    //var postfix = this.postfix;
                    //this.setRowIndex(data);
                    //this.sortData(data);
                    //data.sort()

                    for (var i = 0, d; d = data[i++];) {
                        html += tpl.replace(/{(\w|\d|:|\+|-|\*|_|\/|\.|\(|\))*}/g,
                            function(text) {
                                text = text.substring(1, text.length - 1);
                                var formater = self.getFormater(text);
                                var value = (d[text] || d[text] === 0) ? d[text] : '-';
                                if (text.indexOf(':') > -1) {
                                    text = text.split(':')[0];
                                    value = d[text];
                                }
                                value = ((value + '') || '').replace(/\</g, '&lt;').replace(
                                    /\>/g, '&gt;');
                                if (formater) {
                                    value = formater(text, d);
                                }
                                return value;
                            })
                    }
                    this._dom.find('table tbody').html(html);
                    this.autoAdd();
                    // this.sum(data);
                    // this.initFCol();
                }
            })

            register(Gird);
            module.exports = Gird;

        }, {
            "./fly.core": 9,
            "./fly.data": 10,
            "./fly.ui": 32
        }
    ],
    19: [
        function(require, module, exports) {
            /**
             * 兼容IE7及以下
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-06-01 15:20
             */

            'use strict';

            // 依赖core
            var fly = require("./fly.core");

            var colRegExp = /^col-[a-z]{2}-/,
                colLength = 12;

            $.fn['rowie'] = function() {
                this.each(function() {
                    var row = $(this),
                        sum = row.width(),
                        col = Math.floor(sum / colLength),
                        over = sum - col * colLength,
                        cols = $.map(new Array(colLength), function(v, i) {
                            return col + ((i + over < colLength) ? 0 : 1);
                        }),
                        colsNum = [],
                        i = 0;
                    row.children().each(function() {
                        var td = $(this),
                            cls = td.attr('class').split(' '),
                            start = td.data('start') || i,
                            end = td.data('end') || (parseInt($.map(cls, function(v, i) {
                                if (colRegExp.test(v)) return v.replace(
                                    colRegExp, '');
                            })[0]) + start),
                            width = 0;
                        for (; start < end; start++) {
                            width += cols[start];
                        }
                        td.width(width);
                        i = end;
                    });
                });
            };

            if (fly.browser.ie < 8) {
                fly.$doc.ready(function() {
                    $('.row-ie').rowie();
                });

                fly.$win.resize(fly.utils.throttle(function() {
                    $('.row-ie').rowie();
                }, 500));
            }

        }, {
            "./fly.core": 9
        }
    ],
    20: [
        function(require, module, exports) {
            module.exports = require(1)
        }, {
            "F:\\flyui\\flyui1.0\\git\\flyui-ex\\.build\\temp\\fly.accordion.js": 1
        }
    ],
    21: [
        function(require, module, exports) {
            /**
             * 数据对象
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-06
             */

            'use strict';

            // 依赖
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                Popup = require('./fly.popup'),
                data = require('./fly.data'),
                $ = fly.$,
                keys = fly.keys,
                proxy = $.proxy,
                extend = $.extend,
                isArray = $.isArray,
                ObservableArray = fly.ObservableArray,
                activeElement = fly.activeElement;

            var ID = "id",
                LI = "li",
                CHANGE = "change",
                CHARACTER = "character",
                STATEFOCUED = "state-focused",
                STATEHOVER = "state-hover",
                STATESELECTED = "state-selected",
                LOADING = "icon-loading",
                OPEN = "open",
                CLOSE = "close",
                SELECT = "select",
                SELECTED = "selected",
                MULTIPLE = "multiple",
                REQUESTSTART = "requestStart",
                REQUESTEND = "requestEnd",

                WIDTH = "width",
                CLICK = 'click',
                STATIC_LIST_NS = ".StaticList";;

            var quotRegExp = /"/g;

            var alternativeNames = {
                "ComboBox": "DropDownList",
                "DropDownList": "ComboBox"
            };

            var List = ui.DataBoundWidget.extend({

                ctor: function(element, options) {
                    var that = this,
                        ns = that.ns,
                        id;

                    that._super(element, options);

                    element = that.element;
                    options = that.options;

                    that._isSelect = element.is(SELECT);

                    if (that._isSelect && that.element[0].length) {
                        if (!options.dataSource) {
                            options.textField = options.textField || "text";
                            options.valueField = options.valueField || "value";
                        }
                    }

                    that.ul = $('<ul unselectable="on" class="list reset"/>')
                        .attr({
                            tabIndex: -1
                        });

                    that.list = $("<div class='list-container'/>")
                        .append(that.ul)
                        .on("mousedown" + ns, proxy(that._listMousedown, that));

                    id = element.attr(ID);
                    if (id) {
                        that.list.attr(ID, id + "-list");
                        that.ul.attr(ID, id + "_listbox");
                    }

                    that._accessors();
                    that._initValue();
                },

                options: {
                    valuePrimitive: true
                },

                setOptions: function(options) {
                    this._super.setOptions(options);
                    if (options && options.enable !== undefined) {
                        options.enabled = options.enable;
                    }
                },

                focus: function() {
                    this._focused.focus();
                },

                readonly: function(readonly) {
                    this._editable({
                        readonly: readonly === undefined ? true : readonly,
                        disable: false
                    });
                },

                enable: function(enable) {
                    this._editable({
                        readonly: false,
                        disable: !(enable = enable === undefined ? true : enable)
                    });
                },

                _listOptions: function(options) {
                    var currentOptions = this.options;

                    options = options || {};
                    options = {
                        height: options.height || currentOptions.height,
                        valueField: options.valueField || currentOptions.valueField,
                        textField: options.textField || currentOptions.textField,
                        template: options.template || currentOptions.template
                    };

                    if (!options.template) {
                        options.template = '{{' + fly.expr(options.textField, "$data") +
                            '}}';
                    }

                    return options;
                },

                _initList: function() {
                    var that = this;
                    var options = that.options;
                    var value = options.value;

                    var listBoundHandler = proxy(that._listBound, that);

                    var listOptions = {
                        autoBind: false,
                        value: options.value,
                        selectable: options.selectable,
                        dataSource: that.dataSource,
                        dataBinding: function() {
                            that.trigger("dataBinding");
                        },
                        dataBound: listBoundHandler,
                        listBound: listBoundHandler,
                        click: proxy(that._click, that),
                        change: proxy(that._listChange, that),
                        activate: proxy(that._activateItem, that),
                        selectedItemChange: proxy(that._listChange, that)
                    };

                    listOptions = extend(that._listOptions(), listOptions);

                    that.listView = new ui.StaticList(that.ul, listOptions);

                    if (value !== undefined) {
                        that.listView.value(value.toString().split(options.valueSplit))
                            .done(function() {
                                var text = options.text;

                                if (that.input && that.selectedIndex === -1) {
                                    if (text === undefined || text === null) {
                                        text = value;
                                    }

                                    that._accessor(value);
                                    that.input.val(text);
                                }
                            });
                    }
                },

                _listMousedown: function(e) {
                    if (!this.filterInput || this.filterInput[0] !== e.target) {
                        e.preventDefault();
                    }
                },

                _filterSource: function(filter, force) {
                    var that = this;
                    var options = that.options;
                    var dataSource = that.dataSource;
                    var expression = extend({}, dataSource.filter() || {});

                    var removed = removeFiltersForField(expression, options.textField);

                    if ((filter || removed) && that.trigger("filtering", {
                            filter: filter
                        })) {
                        return;
                    }

                    if (filter) {
                        expression = expression.filters || [];
                        expression.push(filter);
                    }

                    if (!force) {
                        dataSource.filter(expression);
                    } else {
                        dataSource.read(expression);
                    }
                },

                _initValue: function() {
                    var that = this,
                        value = that.options.value;

                    if (value !== null) {
                        that.element.val(value);
                    } else {
                        value = that._accessor();
                        that.options.value = value;
                    }

                    that._old = value;
                },

                _ignoreCase: function() {
                    var that = this,
                        model,
                        field;

                    if (that.dataSource) {
                        model = that.dataSource.reader.model;
                    }

                    if (model && model.fields) {
                        field = model.fields[that.options.textField];

                        if (field && field.type && field.type !== "string") {
                            that.options.ignoreCase = false;
                        }
                    }
                },

                _focus: function(candidate) {
                    return this.listView.focus(candidate);
                },

                current: function(candidate) {
                    return this._focus(candidate);
                },

                items: function() {
                    return this.ul[0].children;
                },

                destroy: function() {
                    var that = this;
                    var ns = that.ns;

                    that._super.destroy();

                    that._unbindDataSource();

                    that.listView.destroy();
                    that.list.off(ns);

                    that.popup.destroy();

                    if (that._form) {
                        that._form.off("reset", that._resetHandler);
                    }
                },

                dataItem: function(index) {
                    var that = this;

                    if (index === undefined) {
                        return that.listView.selectedDataItems()[0];
                    }

                    if (typeof index !== "number") {
                        index = $(that.items()).index(index);
                    }

                    return that.dataSource.view()[index];
                },

                _activateItem: function() {
                    this.listView.focus();
                },

                _accessors: function() {
                    var that = this;
                    var element = that.element;
                    var options = that.options;
                    var getter = fly.getter;
                    var textField = element.attr("data-text-field");
                    var valueField = element.attr("data-value-field");

                    if (!options.textField && textField) {
                        options.textField = textField;
                    }

                    if (!options.valueField && valueField) {
                        options.valueField = valueField;
                    }

                    that._text = getter(options.textField);
                    that._value = getter(options.valueField);
                },

                _blur: function() {
                    var that = this;

                    that._change();

                    if (that.options.selectable === true) {
                        that.close();
                    }
                },

                /**
                 * 检测值是否改变
                 * 若改变则会触发change事件
                 */
                _change: function() {
                    var that = this;
                    var index = that.selectedIndex;
                    var optionValue = that.options.value;
                    var value = that.value();
                    var trigger;

                    if (that._isSelect && !that.listView.isBound() && optionValue) {
                        value = optionValue;
                    }

                    if (value !== that._old) {
                        trigger = true;
                    } else if (index !== undefined && index !== that._oldIndex) {
                        trigger = true;
                    }

                    if (trigger) {
                        that._old = value;
                        that._oldIndex = index;
                        that.element.trigger(CHANGE);
                        that.trigger(CHANGE);
                    }
                },

                _data: function() {
                    var data = this.dataSource.view();
                },

                _enable: function() {
                    var that = this,
                        options = that.options,
                        disabled = that.element.is("[disabled]");

                    if (options.enable !== undefined) {
                        options.enabled = options.enable;
                    }

                    if (!options.enabled || disabled) {
                        that.enable(false);
                    } else {
                        that.readonly(that.element.is("[readonly]"));
                    }
                },

                _dataValue: function(dataItem) {
                    var value = this._value(dataItem);

                    if (value === undefined) {
                        value = this._text(dataItem);
                    }

                    return value;
                },

                _offsetHeight: function() {
                    var offsetHeight = 0;
                    var siblings = this.listView.content.prevAll(":visible");

                    siblings.each(function() {
                        var element = $(this);

                        if (element.hasClass("list-filter")) {
                            offsetHeight += element.children().outerHeight();
                        } else {
                            offsetHeight += element.outerHeight();
                        }
                    });

                    return offsetHeight;
                },

                _height: function(length) {
                    var that = this;
                    var list = that.list;
                    var height = that.options.height;
                    var visible = that.popup.visible();
                    var offsetTop;
                    var popups;

                    if (length) {
                        popups = list.add(list.parent(".animation-container")).show();

                        height = that.listView.content[0].scrollHeight > height ?
                            height : "auto";

                        popups.height(height);

                        if (height !== "auto") {
                            offsetTop = that._offsetHeight();

                            if (offsetTop) {
                                height -= offsetTop;
                            }
                        }

                        that.listView.content.height(height);

                        if (!visible) {
                            popups.hide();
                        }
                    }

                    return height;
                },

                _adjustListWidth: function() {
                    var list = this.list,
                        width = list[0].style.width,
                        wrapper = this.wrapper,
                        computedStyle, computedWidth;

                    if (!list.data(WIDTH) && width) {
                        return;
                    }

                    computedStyle = window.getComputedStyle ? window.getComputedStyle(
                        wrapper[0],
                        null) : 0;
                    computedWidth = computedStyle ? parseFloat(computedStyle.width) :
                        wrapper.outerWidth();

                    if (computedStyle && $.browser.msie) {
                        computedWidth += parseFloat(computedStyle.paddingLeft) +
                            parseFloat(
                                computedStyle.paddingRight) + parseFloat(computedStyle.borderLeftWidth) +
                            parseFloat(computedStyle.borderRightWidth);
                    }

                    if (list.css("box-sizing") !== "border-box") {
                        width = computedWidth - (list.outerWidth() - list.width());
                    } else {
                        width = computedWidth;
                    }

                    list.css({
                            fontFamily: wrapper.css("font-family"),
                            width: width
                        })
                        .data(WIDTH, width);

                    return true;
                },

                _openHandler: function(e) {
                    this._adjustListWidth();

                    if (this.trigger(OPEN)) {
                        e.preventDefault();
                    }
                },

                _closeHandler: function(e) {
                    if (this.trigger(CLOSE)) {
                        e.preventDefault();
                    }
                },

                _focusItem: function() {
                    var listView = this.listView;
                    var focusedItem = listView.focus();
                    var index = listView.select();

                    index = index[index.length - 1];

                    if (index === undefined && this.options.highlightFirst && !
                        focusedItem) {
                        index = 0;
                    }

                    if (index !== undefined) {
                        listView.focus(index);
                    } else {
                        listView.scrollToIndex(0);
                    }
                },


                _firstOpen: function() {
                    var height = this._height(this.dataSource.view().length);
                },

                _popup: function() {
                    var that = this;

                    that.popup = new Popup(that.list, extend({}, that.options.popup, {
                        anchor: that.wrapper,
                        open: proxy(that._openHandler, that),
                        close: proxy(that._closeHandler, that),
                        animation: that.options.animation
                    }));

                    that.popup.one(OPEN, proxy(that._firstOpen, that));
                },

                _makeUnselectable: function() {
                    if (fly.browser.ie < 9) {
                        this.list.find("*").not(".textbox").attr("unselectable", "on");
                    }
                },

                _toggleHover: function(e) {
                    $(e.currentTarget).toggleClass(STATEHOVER, e.type === "mouseenter");
                },

                _toggle: function(open, preventFocus) {
                    var that = this;

                    open = open !== undefined ? open : !that.popup.visible();

                    if (!preventFocus && that._focused[0] !== activeElement()) {
                        that._focused.focus();
                    }

                    that[open ? OPEN : CLOSE]();
                },

                _triggerCascade: function() {
                    var that = this;

                    if (!that._cascadeTriggered || that._old !== that.value() || that._oldIndex !==
                        that.selectedIndex) {
                        that._cascadeTriggered = true;
                        that.trigger("cascade", {
                            userTriggered: that._userTriggered
                        });
                    }
                },

                _unbindDataSource: function() {
                    var that = this;

                    that.dataSource.unbind(REQUESTSTART, that._requestStartHandler)
                        .unbind(REQUESTEND, that._requestEndHandler)
                        .unbind("error", that._errorHandler);
                }
            });

            extend(List, {
                inArray: function(node, parentNode) {
                    var idx, length, siblings = parentNode.children;

                    if (!node || node.parentNode !== parentNode) {
                        return -1;
                    }

                    for (idx = 0, length = siblings.length; idx < length; idx++) {
                        if (node === siblings[idx]) {
                            return idx;
                        }
                    }

                    return -1;
                }
            });


            var Select = List.extend({

                ctor: function(element, options) {
                    this._super(element, options);
                    this._initial = this.element.val();
                },

                setDataSource: function(dataSource) {
                    this.options.dataSource = dataSource;

                    this._dataSource();

                    this.listView.setDataSource(this.dataSource);

                    if (this.options.autoBind) {
                        this.dataSource.fetch();
                    }
                },

                close: function() {
                    this.popup.close();
                },

                select: function(candidate) {
                    var that = this;

                    if (candidate === undefined) {
                        return that.selectedIndex;
                    } else {
                        that._select(candidate);

                        that._old = that._accessor();
                        that._oldIndex = that.selectedIndex;
                    }
                },

                search: function(word) {
                    word = typeof word === "string" ? word : this.text();
                    var that = this;
                    var length = word.length;
                    var options = that.options;
                    var ignoreCase = options.ignoreCase;
                    var filter = options.filter;
                    var field = options.textField;

                    clearTimeout(that._typing);

                    if (!length || length >= options.minLength) {
                        that._state = "filter";
                        that.listView.filter(true);
                        if (filter === "none") {
                            that._filter(word);
                        } else {
                            that._open = true;
                            that._filterSource({
                                value: ignoreCase ? word.toLowerCase() : word,
                                field: field,
                                operator: filter,
                                ignoreCase: ignoreCase
                            });
                        }
                    }
                },

                _accessor: function(value, idx) {
                    return this[this._isSelect ? "_accessorSelect" : "_accessorInput"](
                        value, idx);
                },

                _accessorInput: function(value) {
                    var element = this.element[0];

                    if (value === undefined) {
                        return element.value;
                    } else {
                        element.value = value;
                    }
                },

                _accessorSelect: function(value, idx) {
                    var element = this.element[0];
                    var selectedIndex = element.selectedIndex;
                    var option;

                    if (value === undefined) {
                        if (selectedIndex > -1) {
                            option = element.options[selectedIndex];
                        }

                        if (option) {
                            value = option.value;
                        }
                        return value || "";
                    } else {
                        if (selectedIndex > -1) {
                            element.options[selectedIndex].removeAttribute(SELECTED);
                        }

                        if (idx === undefined) {
                            idx = -1;
                        }

                        if (value !== "" && idx == -1) {
                            this._custom(value);
                        } else {
                            if (value) {
                                element.value = value;
                            } else {
                                element.selectedIndex = idx;
                            }

                            if (element.selectedIndex > -1) {
                                option = element.options[element.selectedIndex];
                            }

                            if (option) {
                                option.setAttribute(SELECTED, SELECTED);
                            }
                        }
                    }
                },

                _custom: function(value) {
                    var that = this;
                    var element = that.element;
                    var custom = that._customOption;

                    if (!custom) {
                        custom = $("<option/>");
                        that._customOption = custom;

                        element.append(custom);
                    }

                    custom.text(value);
                    custom[0].setAttribute(SELECTED, SELECTED);
                },

                _hideBusy: function() {
                    var that = this;
                    clearTimeout(that._busy);
                    that._arrow.removeClass(LOADING);
                    that._busy = null;
                },

                _showBusy: function() {
                    var that = this;

                    that._request = true;

                    if (that._busy) {
                        return;
                    }

                    that._busy = setTimeout(function() {
                        if (that._arrow) {
                            that._arrow.addClass(LOADING);
                        }
                    }, 100);
                },

                _requestEnd: function() {
                    this._request = false;
                    this._hideBusy();
                },

                _dataSource: function() {
                    var that = this,
                        element = that.element,
                        options = that.options,
                        dataSource = options.dataSource || [],
                        idx;

                    dataSource = isArray(dataSource) ? {
                        data: dataSource
                    } : dataSource;

                    if (that._isSelect) {
                        idx = element[0].selectedIndex;
                        if (idx > -1) {
                            options.index = idx;
                        }

                        dataSource.select = element;
                        dataSource.fields = [{
                            field: options.textField
                        }, {
                            field: options.valueField
                        }];
                    }

                    if (that.dataSource) {
                        that._unbindDataSource();
                    } else {
                        that._requestStartHandler = proxy(that._showBusy, that);
                        that._requestEndHandler = proxy(that._requestEnd, that);
                        that._errorHandler = proxy(that._hideBusy, that);
                    }

                    that.dataSource = data.DataSource.create(dataSource)
                        .bind(REQUESTSTART, that._requestStartHandler)
                        .bind(REQUESTEND, that._requestEndHandler)
                        .bind("error", that._errorHandler);
                },

                _firstItem: function() {
                    this.listView.first();
                },

                _lastItem: function() {
                    this.listView.last();
                },

                _nextItem: function() {
                    this.listView.next();
                },

                _prevItem: function() {
                    this.listView.prev();
                },

                _move: function(e) {
                    var that = this;
                    var key = e.keyCode;
                    var ul = that.ul[0];
                    var down = key === keys.DOWN;
                    var dataItem;
                    var pressed;
                    var current;

                    if (key === keys.UP || down) {
                        if (e.altKey) {
                            that.toggle(down);
                        } else {
                            if (!that.listView.isBound()) {
                                if (!that._fetch) {
                                    that.dataSource.one(CHANGE, function() {
                                        that._fetch = false;
                                        that._move(e);
                                    });

                                    that._fetch = true;
                                    that._filterSource();
                                }

                                e.preventDefault();

                                return true; //pressed
                            }

                            current = that._focus();

                            if (!that._fetch && (!current || current.hasClass(
                                    STATESELECTED))) {
                                if (down) {
                                    that._nextItem();

                                    if (!that._focus()) {
                                        that._lastItem();
                                    }
                                } else {
                                    that._prevItem();

                                    if (!that._focus()) {
                                        that._firstItem();
                                    }
                                }
                            }

                            if (that.trigger(SELECT, {
                                    item: that.listView.focus()
                                })) {
                                that._focus(current);
                                return;
                            }

                            that._select(that._focus(), true);

                            if (!that.popup.visible()) {
                                that._blur();
                            }
                        }

                        e.preventDefault();
                        pressed = true;
                    } else if (key === keys.ENTER || key === keys.TAB) {
                        if (that.popup.visible()) {
                            e.preventDefault();
                        }

                        current = that._focus();
                        dataItem = that.dataItem();

                        if (!that.popup.visible() && (!dataItem || that.text() !== that
                                ._text(
                                    dataItem))) {
                            current = null;
                        }

                        var activeFilter = that.filterInput && that.filterInput[0] ===
                            activeElement();

                        if (current) {
                            if (that.trigger(SELECT, {
                                    item: current
                                })) {
                                return;
                            }

                            that._select(current);
                        } else if (that.input) {
                            that._accessor(that.input.val());
                            that.listView.value(that.input.val());
                        }

                        if (that._focusElement) {
                            that._focusElement(that.wrapper);
                        }

                        if (activeFilter && key === keys.TAB) {
                            that.wrapper.focusout();
                        } else {
                            that._blur();
                        }

                        that.close();
                        pressed = true;
                    } else if (key === keys.ESC) {
                        if (that.popup.visible()) {
                            e.preventDefault();
                        }
                        that.close();
                        pressed = true;
                    }

                    return pressed;
                },

                _fetchData: function() {
                    var that = this;
                    var hasItems = !!that.dataSource.view().length;

                    if (that.element[0].disabled || that._request || that.options.cascadeFrom) {
                        return;
                    }

                    if (!that.listView.isBound() && !that._fetch && !hasItems) {
                        that._fetch = true;
                        that.dataSource.fetch().done(function() {
                            that._fetch = false;
                        });
                    }
                },

                _options: function(data, optionLabel, value) {
                    var that = this,
                        element = that.element,
                        length = data.length,
                        options = "",
                        option,
                        dataItem,
                        dataText,
                        dataValue,
                        idx = 0;

                    if (optionLabel) {
                        options = optionLabel;
                    }

                    for (; idx < length; idx++) {
                        option = "<option";
                        dataItem = data[idx];
                        dataText = that._text(dataItem);
                        dataValue = that._value(dataItem);

                        if (dataValue !== undefined) {
                            dataValue += "";

                            if (dataValue.indexOf('"') !== -1) {
                                dataValue = dataValue.replace(quotRegExp, "&quot;");
                            }

                            option += ' value="' + dataValue + '"';
                        }

                        option += ">";

                        if (dataText !== undefined) {
                            //option += htmlEncode(dataText);
                            option += dataText;
                        }

                        option += "</option>";
                        options += option;
                    }

                    element.html(options);

                    if (value !== undefined) {
                        element.val(value);
                    }
                },

                _reset: function() {
                    var that = this,
                        element = that.element,
                        formId = element.attr("form"),
                        form = formId ? $("#" + formId) : element.closest("form");

                    if (form[0]) {
                        that._resetHandler = function() {
                            setTimeout(function() {
                                that.value(that._initial);
                            });
                        };

                        that._form = form.on("reset", that._resetHandler);
                    }
                },

                _cascade: function() {
                    var that = this,
                        options = that.options,
                        cascade = options.cascadeFrom,
                        parent, parentElement,
                        select, valueField,
                        change;

                    if (cascade) {
                        parentElement = $("#" + cascade);
                        parent = parentElement.data(fly.NS + that.name);

                        if (!parent) {
                            parent = parentElement.data(fly.NS + alternativeNames[that.name]);
                        }

                        if (!parent) {
                            return;
                        }

                        options.autoBind = false;
                        valueField = options.cascadeFromField || parent.options.valueField;

                        change = function() {
                            that.dataSource.unbind(CHANGE, change);

                            var value = that._accessor();

                            if (that._userTriggered) {
                                that._clearSelection(parent, true);
                            } else if (value) {
                                if (value !== that.listView.value()[0]) {
                                    that.value(value);
                                }

                                if (!that.dataSource.view()[0] || that.selectedIndex ===
                                    -1) {
                                    that._clearSelection(parent, true);
                                }
                            } else if (that.dataSource.view().length) {
                                that.select(options.index);
                            }

                            that.enable();
                            that._triggerCascade();
                            that._userTriggered = false;
                        };
                        select = function() {
                            var dataItem = parent.dataItem(),
                                filterValue = dataItem ? parent._value(dataItem) : null,
                                expressions, filters;

                            if (filterValue || filterValue === 0) {
                                expressions = that.dataSource.filter() || {};
                                removeFiltersForField(expressions, valueField);
                                filters = expressions.filters || [];

                                filters.push({
                                    field: valueField,
                                    operator: "eq",
                                    value: filterValue
                                });

                                var handler = function() {
                                    that.unbind("dataBound", handler);
                                    change.apply(that, arguments);
                                };

                                that.first("dataBound", handler);

                                that.dataSource.filter(filters);

                            } else {
                                that.enable(false);
                                that._clearSelection(parent);
                                that._triggerCascade();
                                that._userTriggered = false;
                            }
                        };

                        parent.first("cascade", function(e) {
                            that._userTriggered = e.userTriggered;
                            select();
                        });

                        //refresh was called
                        if (parent.listView.isBound()) {
                            select();
                        } else if (!parent.value()) {
                            that.enable(false);
                        }
                    }
                }
            });

            var StaticList = ui.DataBoundWidget.extend({

                name: 'StaticList',

                ctor: function(element, options) {
                    this._super(element, options);

                    this.element.attr("role", "listbox")
                        .on(CLICK + STATIC_LIST_NS, "li", proxy(this._click, this))
                        .on("mouseenter" + STATIC_LIST_NS, "li", function() {
                            $(this).addClass(STATEHOVER);
                        })
                        .on("mouseleave" + STATIC_LIST_NS, "li", function() {
                            $(this).removeClass(STATEHOVER);
                        });

                    this.content = this.element
                        .wrap("<div unselectable='on'></div>")
                        .parent()
                        .css({
                            "overflow": "auto",
                            "position": "relative"
                        });

                    this._bound = false;

                    this._GUID = fly.guid();

                    this._selectedIndices = [];

                    this._view = [];
                    this._dataItems = [];
                    this._values = [];

                    var value = this.options.value;

                    if (value) {
                        this._values = isArray(value) ? value.slice(0) : [value];
                    }

                    this._getter();
                    this._templates();

                    this.setDataSource(this.options.dataSource);

                    this._onScroll = proxy(function() {
                        var that = this;
                        clearTimeout(that._scrollId);
                    }, this);
                },

                options: {
                    name: "StaticList",
                    valueField: null,
                    selectable: true,
                    template: null
                },

                events: [
                    CLICK,
                    CHANGE,
                    "activate",
                    "deactivate",
                    "dataBinding",
                    "dataBound",
                    "selectedItemChange"
                ],

                setDataSource: function(source) {
                    var that = this;
                    var dataSource = source || {};
                    var value;

                    dataSource = isArray(dataSource) ? {
                        data: dataSource
                    } : dataSource;
                    dataSource = data.DataSource.create(dataSource);

                    if (that.dataSource) {
                        that.dataSource.unbind(CHANGE, that._refreshHandler);

                        // value = that.value();
                        value = that.options.value !== null ? that.options.value : that
                            .value();
                        // that.value([]);
                        that._bound = false;

                        that.value(value);
                    } else {
                        that._refreshHandler = proxy(that.refresh, that);
                    }

                    that.dataSource = dataSource.bind(CHANGE, that._refreshHandler);
                },

                setOptions: function(options) {
                    this._super.setOptions(options);

                    this._getter();
                    this._templates();
                    this._render();
                },

                destroy: function() {
                    this.element.off(STATIC_LIST_NS);

                    if (this._refreshHandler) {
                        this.dataSource.unbind(CHANGE, this._refreshHandler);
                    }

                    this._super.destroy();
                },

                scrollToIndex: function(index) {
                    var item = this.element[0].children[index];

                    if (item) {
                        this.scroll(item);
                    }
                },

                scroll: function(item) {
                    if (!item) {
                        return;
                    }

                    if (item[0]) {
                        item = item[0];
                    }

                    var content = this.content[0],
                        itemOffsetTop = item.offsetTop,
                        itemOffsetHeight = item.offsetHeight,
                        contentScrollTop = content.scrollTop,
                        contentOffsetHeight = content.clientHeight,
                        bottomDistance = itemOffsetTop + itemOffsetHeight,
                        yDimension, offsetHeight;

                    if (contentScrollTop > itemOffsetTop) {
                        contentScrollTop = itemOffsetTop;
                    } else if (bottomDistance > (contentScrollTop + contentOffsetHeight)) {
                        contentScrollTop = (bottomDistance - contentOffsetHeight);
                    }

                    content.scrollTop = contentScrollTop;
                },

                selectedDataItems: function(dataItems) {
                    var getter = this._valueGetter;

                    if (dataItems === undefined) {
                        return this._dataItems.slice();
                    }

                    this._dataItems = dataItems;

                    this._values = $.map(dataItems, function(dataItem) {
                        return getter(dataItem);
                    });
                },

                next: function() {
                    var current = this.focus();

                    if (!current) {
                        current = 0;
                    } else {
                        current = current.next();
                    }

                    this.focus(current);
                },

                prev: function() {
                    var current = this.focus();

                    if (!current) {
                        current = this.element[0].children.length - 1;
                    } else {
                        current = current.prev();
                    }

                    this.focus(current);
                },

                first: function() {
                    this.focus(this.element[0].children[0]);
                },

                last: function() {
                    this.focus(this.element[0].children[this.element[0].children.length -
                        1]);
                },

                focus: function(candidate) {
                    var that = this;
                    var id = that._GUID;
                    var hasCandidate;

                    if (candidate === undefined) {
                        return that._current;
                    }

                    candidate = that._get(candidate);
                    candidate = candidate[candidate.length - 1];
                    candidate = $(this.element[0].children[candidate]);

                    if (that._current) {
                        that._current
                            .removeClass(STATEFOCUED)
                            .removeAttr(ID);

                        that.trigger("deactivate");
                    }

                    hasCandidate = !!candidate[0];

                    if (hasCandidate) {
                        candidate.addClass(STATEFOCUED);
                        that.scroll(candidate);

                        candidate.attr("id", id);
                    }

                    that._current = hasCandidate ? candidate : null;
                    that.trigger("activate");
                },

                filter: function(filter, skipValueUpdate) {
                    if (filter === undefined) {
                        return this._filtered;
                    }

                    this._filtered = filter;
                },

                skipUpdate: function(skipUpdate) {
                    this._skipUpdate = skipUpdate;
                },

                select: function(indices) {
                    var that = this;
                    var selectable = that.options.selectable;
                    var singleSelection = selectable !== MULTIPLE && selectable !==
                        false;
                    var selectedIndices = that._selectedIndices;

                    var added = [];
                    var removed = [];
                    var result;

                    if (indices === undefined) {
                        return selectedIndices.slice();
                    }

                    indices = that._get(indices);

                    if (indices.length === 1 && indices[0] === -1) {
                        indices = [];
                    }

                    if (that._filtered && !singleSelection && that._deselectFiltered(
                            indices)) {
                        return;
                    }

                    if (singleSelection && !that._filtered && $.inArray(indices[indices
                                .length - 1],
                            selectedIndices) !== -1) {
                        if (that._dataItems.length && that._view.length) {
                            that._dataItems = [that._view[selectedIndices[0]].item];
                        }

                        return;
                    }

                    result = that._deselect(indices);

                    removed = result.removed;
                    indices = result.indices;

                    if (indices.length) {
                        if (singleSelection) {
                            indices = [indices[indices.length - 1]];
                        }

                        added = that._select(indices);
                    }

                    if (added.length || removed.length) {
                        that.trigger(CHANGE, {
                            added: added,
                            removed: removed
                        });
                    }
                },

                removeAt: function(position) {
                    this._selectedIndices.splice(position, 1);
                    this._values.splice(position, 1);

                    return {
                        position: position,
                        dataItem: this._dataItems.splice(position, 1)[0]
                    };
                },

                setValue: function(value) {
                    if (value === "" || value === null) {
                        value = [];
                    }

                    value = isArray(value) || value instanceof ObservableArray ? value.slice(
                        0) : [
                        value
                    ];

                    this._values = value;
                },

                value: function(value) {
                    var that = this;
                    var deferred = that._valueDeferred;
                    var indices;

                    if (value === undefined) {
                        return that._values.slice();
                    }

                    that.setValue(value);

                    if (!deferred || deferred.state() === "resolved") {
                        that._valueDeferred = deferred = $.Deferred();
                    }

                    if (that.isBound()) {
                        indices = that._valueIndices(that._values);

                        if (that.options.selectable === MULTIPLE) {
                            that.select(-1);
                        }

                        that.select(indices);

                        deferred.resolve();
                    }

                    that._skipUpdate = false;

                    return deferred;
                },

                _click: function(e) {
                    if (!e.isDefaultPrevented()) {
                        this.trigger(CLICK, {
                            item: $(e.currentTarget)
                        });
                    }
                },

                _dataItemPosition: function(dataItem, values) {
                    var value = this._valueGetter(dataItem);
                    var index = -1;

                    for (var idx = 0; idx < values.length; idx++) {
                        if (value == values[idx]) {
                            index = idx;
                            break;
                        }
                    }

                    return index;
                },

                _updateIndices: function(indices, values) {
                    var data = this._view;
                    var idx = 0;
                    var index;

                    if (!values.length) {
                        return [];
                    }

                    for (; idx < data.length; idx++) {
                        index = this._dataItemPosition(data[idx].item, values);

                        if (index !== -1) {
                            indices[index] = idx;
                        }
                    }

                    return this._normalizeIndices(indices);
                },

                _valueIndices: function(values) {
                    var indices = [];
                    return this._updateIndices(indices, values);
                },

                _getter: function() {
                    this._valueGetter = fly.getter(this.options.valueField);
                },

                _deselect: function(indices) {
                    var that = this;
                    var children = that.element[0].children;
                    var selectable = that.options.selectable;
                    var selectedIndices = that._selectedIndices;
                    var dataItems = that._dataItems;
                    var values = that._values;
                    var removed = [];
                    var i = 0;
                    var j;

                    var index, selectedIndex;
                    var removedIndices = 0;

                    indices = indices.slice();

                    if (selectable === true || !indices.length) {
                        for (; i < selectedIndices.length; i++) {
                            $(children[selectedIndices[i]]).removeClass(STATESELECTED);

                            removed.push({
                                position: i,
                                dataItem: dataItems[i]
                            });
                        }

                        that._values = [];
                        that._dataItems = [];
                        that._selectedIndices = [];
                    } else if (selectable === MULTIPLE) {
                        for (; i < indices.length; i++) {
                            index = indices[i];

                            if (!$(children[index]).hasClass(STATESELECTED)) {
                                continue;
                            }

                            for (j = 0; j < selectedIndices.length; j++) {
                                selectedIndex = selectedIndices[j];

                                if (selectedIndex === index) {
                                    $(children[selectedIndex]).removeClass(
                                        STATESELECTED);

                                    removed.push({
                                        position: j + removedIndices,
                                        dataItem: dataItems.splice(j, 1)[0]
                                    });

                                    selectedIndices.splice(j, 1);
                                    indices.splice(i, 1);
                                    values.splice(j, 1);

                                    removedIndices += 1;
                                    i -= 1;
                                    j -= 1;
                                    break;
                                }
                            }
                        }
                    }

                    return {
                        indices: indices,
                        removed: removed
                    };
                },

                _deselectFiltered: function(indices) {
                    var children = this.element[0].children;
                    var dataItem, index, position;
                    var removed = [];
                    var idx = 0;

                    for (; idx < indices.length; idx++) {
                        index = indices[idx];
                        dataItem = this._view[index].item;
                        position = this._dataItemPosition(dataItem, this._values);

                        if (position > -1) {
                            removed.push(this.removeAt(position));
                            $(children[index]).removeClass(STATESELECTED);
                        }
                    }

                    if (removed.length) {
                        this.trigger(CHANGE, {
                            added: [],
                            removed: removed
                        });

                        return true;
                    }

                    return false;
                },

                _select: function(indices) {
                    var that = this;
                    var children = that.element[0].children;
                    var data = that._view;
                    var dataItem, index;
                    var added = [];
                    var idx = 0;

                    if (indices[indices.length - 1] !== -1) {
                        that.focus(indices);
                    }

                    for (; idx < indices.length; idx++) {
                        index = indices[idx];
                        dataItem = data[index];

                        if (index === -1 || !dataItem) {
                            continue;
                        }

                        dataItem = dataItem.item;

                        that._selectedIndices.push(index);
                        that._dataItems.push(dataItem);
                        that._values.push(that._valueGetter(dataItem));

                        $(children[index]).addClass(STATESELECTED);

                        added.push({
                            dataItem: dataItem
                        });
                    }

                    return added;
                },

                _get: function(candidate) {
                    if (typeof candidate === "number") {
                        candidate = [candidate];
                    } else if (!isArray(candidate)) {
                        candidate = $(candidate).data("offset-index");

                        if (candidate === undefined) {
                            candidate = -1;
                        }

                        candidate = [candidate];
                    }

                    return candidate;
                },

                _template: function() {
                    var that = this;
                    var options = that.options;
                    var template = options.template;

                    if (!template) {
                        template = fly.template.compile(
                            '<li tabindex="-1" role="option" unselectable="on" class="item">{{' +
                            fly.expr(options.textField, '$data') + '}}</li>');
                    } else {
                        template = fly.template.compile(template);
                        template = function(data) {
                            return '<li tabindex="-1" role="option" unselectable="on" class="item">' +
                                template(data) + "</li>";
                        };
                    }

                    return template;
                },

                _templates: function() {
                    var template;
                    var templates = {
                        template: this.options.template
                    };

                    for (var key in templates) {
                        template = templates[key];
                        if (template && typeof template !== "function") {
                            templates[key] = fly.template.compile(template);
                        }
                    }

                    this.templates = templates;
                },

                _normalizeIndices: function(indices) {
                    var newIndices = [];
                    var idx = 0;

                    for (; idx < indices.length; idx++) {
                        if (indices[idx] !== undefined) {
                            newIndices.push(indices[idx]);
                        }
                    }

                    return newIndices;
                },

                _firstVisibleItem: function() {
                    var element = this.element[0];
                    var content = this.content[0];
                    var scrollTop = content.scrollTop;
                    var itemHeight = $(element.children[0]).height();
                    var itemIndex = Math.floor(scrollTop / itemHeight) || 0;
                    var item = element.children[itemIndex] || element.lastChild;
                    var forward = item.offsetTop < scrollTop;

                    while (item) {
                        if (forward) {
                            if ((item.offsetTop + itemHeight) > scrollTop || !item.nextSibling) {
                                break;
                            }

                            item = item.nextSibling;
                        } else {
                            if (item.offsetTop <= scrollTop || !item.previousSibling) {
                                break;
                            }

                            item = item.previousSibling;
                        }
                    }

                    return this._view[$(item).data("offset-index")];
                },

                _renderItem: function(context) {
                    var item =
                        '<li tabindex="-1" role="option" unselectable="on" class="item';

                    var dataItem = context.item;
                    var notFirstItem = context.index !== 0;
                    var selected = context.selected;

                    if (selected) {
                        item += ' state-selected';
                    }

                    item += '"' + ' data-offset-index="' + context.index + '">';

                    item += this.templates.template(dataItem);

                    return item + "</li>";
                },

                _render: function() {
                    var html = "";

                    var i = 0,
                        idx = 0,
                        context,
                        dataContext = [],
                        options = this.options,
                        view = this.dataSource.view(),
                        values = this.value();

                    for (i = 0; i < view.length; i++) {
                        context = {
                            selected: this._selected(view[i], values),
                            item: view[i],
                            index: i
                        };

                        dataContext[i] = context;

                        html += this._renderItem(context);
                    }

                    this._view = dataContext;

                    this.element[0].innerHTML = html;
                },

                _selected: function(dataItem, values) {
                    var select = !this._filtered || this.options.selectable ===
                        MULTIPLE;
                    return select && this._dataItemPosition(dataItem, values) !== -1;
                },

                refresh: function(e) {
                    var that = this;
                    var changedItems;
                    var action = e && e.action;

                    that.trigger("dataBinding");

                    that._render();

                    that._bound = true;

                    if (action === "itemchange") {
                        changedItems = findChangedItems(that._dataItems, e.items);
                        if (changedItems.length) {
                            that.trigger("selectedItemChange", {
                                items: changedItems
                            });
                        }
                    } else if (that._filtered || that._skipUpdate) {
                        that.focus(0);
                        if (that._skipUpdate) {
                            that._skipUpdate = false;
                            that._updateIndices(that._selectedIndices, that._values);
                        }
                    } else if (!action || action === "add") {
                        that.value(that._values);
                    }

                    if (that._valueDeferred) {
                        that._valueDeferred.resolve();
                    }

                    that.trigger("dataBound");
                },

                isBound: function() {
                    return this._bound;
                }
            });

            function findChangedItems(selected, changed) {
                var changedLength = changed.length;
                var result = [];
                var dataItem;
                var i, j;

                for (i = 0; i < selected.length; i++) {
                    dataItem = selected[i];

                    for (j = 0; j < changedLength; j++) {
                        if (dataItem === changed[j]) {
                            result.push({
                                index: i,
                                item: dataItem
                            });
                        }
                    }
                }

                return result;
            }

            function removeFiltersForField(expression, field) {
                var filters;
                var found = false;

                if (expression.filters) {
                    filters = $.grep(expression.filters, function(filter) {
                        found = removeFiltersForField(filter, field);
                        if (filter.filters) {
                            return filter.filters.length;
                        } else {
                            return filter.field != field;
                        }
                    });

                    if (!found && expression.filters.length !== filters.length) {
                        found = true;
                    }

                    expression.filters = filters;
                }

                return found;
            }

            ui.List = List;
            ui.Select = Select;
            ui.register(StaticList);
            module.exports = List;

        }, {
            "./fly.core": 9,
            "./fly.data": 10,
            "./fly.popup": 25,
            "./fly.ui": 32
        }
    ],
    22: [
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
                    return this._super.shouldSerialize(field) &&
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
            "./fly.core": 9,
            "./fly.format": 17,
            "./fly.observable": 23
        }
    ],
    23: [
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
                Class = require('./fly.class'),
                $ = fly.$,
                proxy = $.proxy,
                noop = $.noop;

            // 数据对象
            var data = {};

            // 缓存get/set
            var getterCache = {},
                setterCache = {};

            // 将类数组的对象转化为数组
            var slice = [].slice;

            // 强制转化为字符串
            var objectToString = {}.toString;

            // 静态变量
            var FUNCTION = 'function',
                STRING = 'string',
                CHANGE = 'change',
                GET = "get",
                OBJ = '[object Object]',
                ARR = '[object Array]';

            /**
             * 构建表达式
             * @param   {String}  [expression=''] 原始表达式
             * @param   {Boolean} safe            是否安全构建
             * @param   {String}  paramName       参数名
             * @returns {String}  [[Description]]
             */
            fly.expr = function(expression, safe, paramName) {
                expression = expression || '';

                if (typeof safe == STRING) {
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
                return getterCache[key] = getterCache[key] || new Function('d',
                    'return ' + fly.expr(expression, safe));
            }

            /**
             * 赋值
             * @param   {String}   expression 表达式
             * @returns {Function} 解析表达式的函数
             */
            fly.setter = function(expression) {
                return setterCache[expression] = setterCache[expression] || new Function(
                    'd, value', fly.expr(expression) + '=value');
            }

            /**
             * 阻止默认动作
             * @param {Object} e 事件对象
             */
            fly.preventDefault = function(e) {
                e.preventDefault();
            }

            /**
             * 包裹表达式
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

            // 观察者
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
                 * 遍历自身
                 * @param {Function} f [[Description]]
                 */
                forEach: function(f) {
                    for (var i in this) {
                        if (this.shouldSerialize(i)) {
                            f(this[i], i);
                        }
                    }
                },

                toJSON: function() {
                    var result = {},
                        value, field;

                    for (field in this) {
                        if (this.shouldSerialize(field)) {
                            value = this[field];

                            if (value instanceof ObservableObject || value instanceof ObservableArray) {
                                value = value.toJSON();
                            }

                            result[field] = value;
                        }
                    }

                    return result;
                },

                /*toFilter: function() {
        var filter = [],
            value, field;

        for (field in this) {
            if (this.shouldSerialize(field)) {
                value = this[field];

                if ((typeof value == 'number' ? true : value) && !(value instanceof ObservableObject ||
                        value instanceof ObservableArray)) {
                    filter.push({
                        field: field,
                        value: value
                    });
                }
            }
        }

        return filter;
    },*/

                get: function(field) {
                    var that = this,
                        result;

                    that.trigger(GET, {
                        field: field
                    });

                    if (field === "this") {
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
                        var isDataSource = object instanceof fly.data.DataSource;

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

                toJSON: function() {
                    var idx, length = this.length,
                        value, json = new Array(length);

                    for (idx = 0; idx < length; idx++) {
                        value = this[idx];

                        if (value instanceof ObservableObject) {
                            value = value.toJSON();
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
                        action: 'add',
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
                        result = pop.apply(this);

                    if (length) {
                        this.trigger(CHANGE, {
                            action: "remove",
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
                            action: "remove",
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
                            action: "add",
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
                            action: "remove",
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
                        action: "add",
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
                    this._super();

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

            fly.Observable = Observable;
            fly.ObservableObject = ObservableObject;
            fly.ObservableArray = ObservableArray;
            fly.LazyObservableArray = LazyObservableArray;


            /**
             * 隐式实例化VM
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
            "./fly.class": 7,
            "./fly.core": 9
        }
    ],
    24: [
        function(require, module, exports) {
            /**
             * 分页
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-08
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                data = require('./fly.data'),
                register = ui.register,
                Widget = ui.Widget,
                $ = fly.$,
                keys = fly.keys,
                proxy = $.proxy,
                math = Math;

            // 静态变量 
            var NAME = 'Pagination',
                NS = '.' + fly.NS + NAME,
                CLICK = 'click' + NS;
            var defaults = ui.defaults[NAME] = {
                numDisplayEntries: 5, //页码中间的个数
                numEdgeEntries: 2, //页码块两头的个数
                pages: '5,10,20,50',
                linkTo: '#', //分页静态页链接, 默认'#'
                firstText: '首页',
                lastText: '末页',
                prevText: '上一页',
                nextText: '下一页',
                showTotal: true, //是否显示总数
                showSwitch: true,
                showNumber: true
            };

            var Pagination = Widget.extend({

                name: NAME,

                options: defaults,

                ctor: function(element, options) {
                    var that = this;
                    if (!element) return;

                    that._super(element, options);
                    that._wrapper();
                    that.setDataSource(that.options.dataSource || {});
                },
                /**
                 * 分页组件的封装
                 */
                _wrapper: function() {
                    var that = this,
                        options = that.options,
                        pages = $.map(options.pages.split(','), function(v) {
                            return {
                                text: v,
                                value: v
                            }
                        }),
                        pageControl;
                    that.element.addClass('pagination clearfix'); //添加class
                    that.numberView = $('<div class="number" />').appendTo(that.element);
                    pageControl = $('<div class="control" />').appendTo(that.element);
                    that.totalView = $('<div class="info" />').appendTo(pageControl);
                    that.switchView = $('<div class="switch" />').appendTo(pageControl);

                    that.numberView.on(CLICK, 'a', proxy(that._clickHandler, that));

                    if (options.showSwitch) {
                        that.switchView.html(
                            '每页大小 <input style="width:80px" type="input">');
                        that.switchPage = new fly.ui.DropDownList(that.switchView.find(
                            'input')[0], {
                            dataSource: pages,
                            value: 5,
                            change: proxy(that._switchHandler, that)
                        });
                    }
                },
                /**
                 * 设置数据源
                 * @param   dataSource
                 */
                setDataSource: function(dataSource) {
                    var that = this;

                    if (that.dataSource) {
                        that._unbindDataSource(); //清除 empty、error、change 代理绑定
                    }
                    //数据源创建，重新empty、error、change 代理绑定
                    that.dataSource = data.DataSource.create(dataSource)
                        .bind("empty", proxy(that._emptyHandler, that))
                        .bind("error", proxy(that._errorHandler, that))
                        .bind("change", proxy(that.selectPage, that));

                    that.selectPage();
                },

                _unbindDataSource: function() {
                    var that = this;

                    that.dataSource
                        .unbind("empty", proxy(that._emptyHandler, that))
                        .unbind("error", proxy(that._errorHandler, that))
                        .unbind("change", proxy(that.selectPage, that));
                },
                /**
                 * 计算总页数
                 * @returns  totalPages
                 */
                _getTotalPages: function() {
                    var dataSource = this.dataSource;
                    if (dataSource.options.total === false) {
                        return 0;
                    }
                    return dataSource.totalPages();
                },
                /**
                 * 计算分页间隔
                 * @returns  start end
                 */
                _getInterval: function(currentPage) {
                    var options = this.options,
                        dataSource = this.dataSource,
                        totalPages = this._getTotalPages(),
                        numDisplayEntries = options.numDisplayEntries;

                    var ne_half = math.ceil(numDisplayEntries / 2),
                        upper_limit = totalPages - numDisplayEntries;

                    var start = currentPage > ne_half ? math.max(math.min(currentPage -
                        ne_half,
                        upper_limit), 0) : 0;
                    var end = currentPage > ne_half ? math.min(currentPage + ne_half +
                        (
                            numDisplayEntries % 2), totalPages) : math.min(
                        numDisplayEntries,
                        totalPages);
                    return {
                        start: start,
                        end: end
                    };
                },

                _emptyHandler: function() {
                    if (this.dataSource.page() > 1) {
                        alert('已到达最后一页！');
                    } else {
                        this.element.hide();
                    }
                },

                _errorHandler: function() {
                    this.element.hide();
                },

                _switchHandler: function(e) {
                    this.dataSource.pageSize(parseInt(this.switchPage.value()));
                },

                _clickHandler: function(e) {
                    var newPage = $(e.target).data('pageNumber');
                    this.dataSource && this.dataSource.page(newPage);
                    return false;
                },
                //选择分页
                selectPage: function(page) {
                    if (typeof page == 'number') {
                        this.dataSource.page(page);
                        return;
                    }

                    page = this.dataSource.page();
                    if (!page || this.dataSource.data().length == 0) {
                        return;
                    }
                    this.element.show();
                    this.numberView.empty(); //清空分页
                    this._drawLinks(page); //重新加载分页信息
                    this._drawInfo(); //计算总条数和页数
                },
                //创建分页按钮
                _createLink: function(page_id, current_page, appendopts) {
                    var lnk,
                        cls,
                        np = this._getTotalPages();

                    page_id = page_id < 1 ? 1 : ((page_id <= np || np == 0) ? page_id :
                        np);
                    appendopts = $.extend({
                        text: page_id,
                        classes: ''
                    }, appendopts || {});
                    cls = appendopts.classes;

                    if (page_id == current_page) {
                        lnk = $('<span class="btn ' + ((cls == 'prev' || cls == 'next') ?
                                'btn-default' : 'btn-primary') + ' current">' +
                            appendopts.text + '</span>');
                    } else {
                        lnk = $('<a class="btn btn-default">' + appendopts.text +
                                '</a>')
                            .attr('href', this.options.linkTo.replace(/__id__/, page_id));
                    }
                    if (cls) {
                        lnk.addClass(cls);
                    }
                    lnk.data('pageNumber', page_id);
                    return lnk;
                },

                _appendRange: function(current_page, start, end, opts) {
                    var i = start;
                    for (; i < end; i++) {
                        this._createLink(i + 1, current_page, opts).appendTo(this.numberView);
                    }
                },

                _drawLinks: function(current_page) {
                    var begin, end,
                        that = this,
                        opts = that.options,
                        interval = that._getInterval(current_page),
                        np = that._getTotalPages(),
                        numEdgeEntries = opts.numEdgeEntries,
                        numberView = that.numberView;

                    if (opts.firstText) {
                        numberView.append(that._createLink(1, current_page, {
                            text: opts.firstText,
                            classes: "prev"
                        }));
                    }

                    if (opts.prevText) {
                        numberView.append(that._createLink(current_page - 1,
                            current_page, {
                                text: opts.prevText,
                                classes: "prev"
                            }));
                    }

                    if (opts.showNumber) {
                        if (interval.start > 0 && numEdgeEntries > 0) {
                            end = math.min(numEdgeEntries, interval.start);
                            that._appendRange(current_page, 0, end, {
                                classes: 'sp'
                            });
                            if (numEdgeEntries < interval.start) {
                                $('<span class="ellipsis"></span>').appendTo(numberView);
                            }
                        }

                        that._appendRange(current_page, interval.start, interval.end);

                        if (interval.end <= np && numEdgeEntries > 0) {
                            if (np - numEdgeEntries > interval.end) {
                                $('<span class="ellipsis"></span>').appendTo(numberView);
                            }
                            begin = math.max(np - numEdgeEntries, interval.end);
                            that._appendRange(current_page, begin, np, {
                                classes: 'ep'
                            });
                        }
                    }

                    if (opts.nextText) {
                        numberView.append(that._createLink(current_page + 1,
                            current_page, {
                                text: opts.nextText,
                                classes: "next"
                            }));
                    }

                    if (opts.lastText) {
                        numberView.append(that._createLink(np, current_page, {
                            text: opts.lastText,
                            classes: "next"
                        }));
                    }
                },
                /**
                 * 展示总条数和总页数
                 */
                _drawInfo: function() {
                    var dataSource = this.dataSource;
                    if (this.options.showTotal && dataSource.options.total !== false) {
                        this.totalView.html('总' + dataSource.total() + '条，共' +
                            dataSource.totalPages() +
                            '页');
                    } else if (dataSource.options.total === false) {
                        this.totalView.html('当前第' + dataSource.page() + '页');
                    }
                },
                /**
                 *组件销毁
                 */
                destroy: function() {
                    var that = this;
                    that.element.empty().off();
                    that._super.destroy();
                }
            });

            register(Pagination);
            module.exports = Pagination;
        }, {
            "./fly.core": 9,
            "./fly.data": 10,
            "./fly.ui": 32
        }
    ],
    25: [
        function(require, module, exports) {
            /**
             * 弹出框
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-08
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                register = ui.register,
                Widget = ui.Widget,
                $ = fly.$,
                keys = fly.keys,
                proxy = $.proxy,
                extend = $.extend,
                $html = fly.$html,
                $win = fly.$win;

            // 静态变量
            var NAME = 'Popup',
                NS = '.' + fly.NS + NAME,
                CLICK = 'click',
                OPEN = "open",
                CLOSE = "close",
                DEACTIVATE = "deactivate",
                ACTIVATE = "activate",
                CENTER = "center",
                LEFT = "left",
                RIGHT = "right",
                TOP = "top",
                BOTTOM = "bottom",
                ABSOLUTE = "absolute",
                HIDDEN = "hidden",
                BODY = "body",
                LOCATION = "location",
                POSITION = "position",
                VISIBLE = "visible",
                EFFECTS = "effects",
                ACTIVE = "state-active",
                ACTIVEBORDER = "state-border",
                ACTIVEBORDERREGEXP = /state-border-(\w+)/,
                ACTIVECHILDREN = ".picker-wrap, .dropdown-wrap, .link",
                MOUSEDOWN = "down",
                SCROLL = "scroll",
                RESIZE_SCROLL = "resize scroll",
                styles = [
                    "font-size",
                    "font-family",
                    "font-stretch",
                    "font-style",
                    "font-weight",
                    "line-height"
                ];

            var eventRegEx = /([^ ]+)/g,
                percentRegExp = /%/;

            var defaults = ui.defaults[NAME] = {
                toggleEvent: "click",
                origin: BOTTOM + " " + LEFT,
                position: TOP + " " + LEFT,
                anchor: BODY,
                appendTo: null,
                collision: "flip fit",
                viewport: window,
                copyAnchorStyles: true,
                autosize: false,
                modal: false,
                adjustSize: {
                    width: 0,
                    height: 0
                },
                animation: {
                    open: {
                        effects: "slideIn:down",
                        transition: true,
                        duration: 200
                    },
                    close: {
                        duration: 100,
                        hide: true
                    }
                }
            };

            var directions = {
                left: {
                    reverse: RIGHT
                },
                right: {
                    reverse: LEFT
                },
                down: {
                    reverse: "up"
                },
                up: {
                    reverse: "down"
                },
                top: {
                    reverse: BOTTOM
                },
                bottom: {
                    reverse: TOP
                },
                "in": {
                    reverse: "out"
                },
                out: {
                    reverse: "in"
                }
            };

            var eventMap = {
                down: "touchstart mousedown",
                move: "mousemove touchmove",
                up: "mouseup touchend touchcancel",
                cancel: "mouseleave touchcancel"
            };

            var contains = function(container, target) {
                return container === target || $.contains(container, target);
            };

            var getEventMap = function(e) {
                return (eventMap[e] || e);
            };

            var applyEventMap = function(events, ns) {
                events = events.replace(eventRegEx, getEventMap);

                if (ns) {
                    events = events.replace(eventRegEx, "$1." + ns);
                }

                return events;
            };

            function wrap(element, autosize) {
                var percentage;

                if (!element.parent().hasClass("animation-container")) {
                    var width = element[0].style.width,
                        height = element[0].style.height,
                        percentWidth = percentRegExp.test(width),
                        percentHeight = percentRegExp.test(height);

                    percentage = percentWidth || percentHeight;

                    if (!percentWidth && (!autosize || (autosize && width))) {
                        width = element.outerWidth();
                    }
                    if (!percentHeight && (!autosize || (autosize && height))) {
                        height = element.outerHeight();
                    }

                    element.wrap(
                        $("<div/>")
                        .addClass("animation-container")
                        .css({
                            width: width,
                            height: height
                        }));

                    if (percentage) {
                        element.css({
                            width: "100%",
                            height: "100%",
                            boxSizing: "border-box",
                            mozBoxSizing: "border-box",
                            webkitBoxSizing: "border-box"
                        });
                    }
                } else {
                    var wrapper = element.parent(".animation-container"),
                        wrapperStyle = wrapper[0].style;

                    if (wrapper.is(":hidden")) {
                        wrapper.show();
                    }

                    percentage = percentRegExp.test(wrapperStyle.width) || percentRegExp.test(
                        wrapperStyle.height);

                    if (!percentage) {
                        wrapper.css({
                            width: element.outerWidth(),
                            height: element.outerHeight(),
                            boxSizing: "content-box",
                            mozBoxSizing: "content-box",
                            webkitBoxSizing: "content-box"
                        });
                    }
                }

                if ($.browser.msie && Math.floor($.browser.version) <= 7) {
                    element.css({
                        zoom: 1
                    });
                }

                return element.parent();
            }


            // 按钮组件
            var Popup = Widget.extend({

                name: NAME,

                ctor: function(element, options) {
                    var that = this,
                        parentPopup;

                    options = options || {};

                    that._super(element, options);

                    element = that.element;
                    options = that.options;

                    that.collisions = options.collision ? options.collision.split(" ") : [];
                    that.downEvent = applyEventMap(MOUSEDOWN, fly.guid());

                    if (that.collisions.length === 1) {
                        that.collisions.push(that.collisions[0]);
                    }

                    parentPopup = $(that.options.anchor).closest(".popup").filter(
                        ":not([class^=km-])");
                    options.appendTo = $($(options.appendTo)[0] || parentPopup[0] ||
                        BODY);

                    that.element.hide()
                        .addClass("popup reset")
                        .css({
                            position: ABSOLUTE
                        })
                        .appendTo(options.appendTo)
                        .on("mouseenter" + NS, function() {
                            that._hovered = true;
                        })
                        .on("mouseleave" + NS, function() {
                            that._hovered = false;
                        });

                    that.wrapper = $();

                    if (options.animation === false) {
                        options.animation = {
                            open: {
                                effects: {}
                            },
                            close: {
                                hide: true,
                                effects: {}
                            }
                        };
                    }

                    extend(options.animation.open, {
                        complete: function() {
                            that.wrapper.css({
                                overflow: VISIBLE
                            });
                            that._activated = true;
                            that._trigger(ACTIVATE);
                        }
                    });

                    extend(options.animation.close, {
                        complete: function() {
                            that._animationClose();
                        }
                    });

                    that._mousedownProxy = function(e) {
                        that._mousedown(e);
                    };

                    that._resizeProxy = function(e) {
                        that._resize(e);
                    };

                    if (options.toggleTarget) {
                        $(options.toggleTarget).on(options.toggleEvent + NS, proxy(that
                            .toggle,
                            that));
                    }
                },

                events: [
                    OPEN,
                    ACTIVATE,
                    CLOSE,
                    DEACTIVATE
                ],

                options: defaults,

                _animationClose: function() {
                    var that = this,
                        options = that.options;

                    that.wrapper.hide();

                    var location = that.wrapper.data(LOCATION),
                        anchor = $(options.anchor),
                        direction, dirClass;

                    if (location) {
                        that.wrapper.css(location);
                    }

                    if (options.anchor != BODY) {
                        direction = ((anchor.attr("class") || "").match(
                            ACTIVEBORDERREGEXP) || ["",
                            "down"
                        ])[1];
                        dirClass = ACTIVEBORDER + "-" + direction;

                        anchor
                            .removeClass(dirClass)
                            .children(ACTIVECHILDREN)
                            .removeClass(ACTIVE)
                            .removeClass(dirClass);

                        that.element.removeClass(ACTIVEBORDER + "-" + directions[
                            direction].reverse);
                    }

                    that._closing = false;
                    that._trigger(DEACTIVATE);
                },

                destroy: function() {
                    var that = this,
                        options = that.options,
                        element = that.element.off(NS),
                        parent;

                    that._super.destroy();

                    if (options.toggleTarget) {
                        $(options.toggleTarget).off(NS);
                    }

                    if (!options.modal) {
                        $html.unbind(that.downEvent, that._mousedownProxy);
                        that._scrollableParents().unbind(SCROLL, that._resizeProxy);
                        $win.unbind(RESIZE_SCROLL, that._resizeProxy);
                    }

                    fly.destroy(that.element.children());
                    element.removeData();

                    if (options.appendTo[0] === document.body) {
                        parent = element.parent(".animation-container");

                        if (parent[0]) {
                            parent.remove();
                        } else {
                            element.remove();
                        }
                    }
                },

                open: function(x, y) {
                    var that = this,
                        fixed = {
                            isFixed: !isNaN(parseInt(y, 10)),
                            x: x,
                            y: y
                        },
                        element = that.element,
                        options = that.options,
                        direction = "down",
                        animation, wrapper,
                        anchor = $(options.anchor);

                    if (!that.visible()) {
                        if (options.copyAnchorStyles) {
                            element.css(fly.getComputedStyles(anchor[0], styles));
                        }

                        if (element.data("animating") || that._trigger(OPEN)) {
                            return;
                        }

                        that._activated = false;

                        if (!options.modal) {
                            $html.unbind(that.downEvent, that._mousedownProxy)
                                .bind(that.downEvent, that._mousedownProxy);

                            that._scrollableParents()
                                .unbind(SCROLL, that._resizeProxy)
                                .bind(SCROLL, that._resizeProxy);
                            $win.unbind(RESIZE_SCROLL, that._resizeProxy)
                                .bind(RESIZE_SCROLL, that._resizeProxy);
                        }

                        that.wrapper = wrapper = wrap(element, options.autosize)
                            .css({
                                overflow: HIDDEN,
                                display: "block",
                                position: ABSOLUTE
                            });

                        wrapper.css(POSITION);

                        if ($(options.appendTo)[0] == document.body) {
                            wrapper.css(TOP, "-10000px");
                        }

                        animation = extend(true, {}, options.animation.open);
                        that.flipped = that._position(fixed);

                        direction = animation.effects.slideIn ? animation.effects.slideIn
                            .direction :
                            direction;

                        if (options.anchor != BODY) {
                            var dirClass = ACTIVEBORDER + "-" + direction;

                            element.addClass(ACTIVEBORDER + "-" + directions[direction]
                                .reverse);

                            anchor
                                .addClass(dirClass)
                                .children(ACTIVECHILDREN)
                                .addClass(ACTIVE)
                                .addClass(dirClass);
                        }

                        element.data(EFFECTS, animation.effects).stop(true).animated(
                            animation);
                    }
                },

                toggle: function() {
                    var that = this;

                    that[that.visible() ? CLOSE : OPEN]();
                },

                visible: function() {
                    return this.element.is(":" + VISIBLE);
                },

                close: function(skipEffects) {
                    var that = this,
                        options = that.options,
                        wrap,
                        animation, openEffects, closeEffects;

                    if (that.visible()) {
                        wrap = (that.wrapper[0] ? that.wrapper : wrap(that.element).hide());

                        if (that._closing || that._trigger(CLOSE)) {
                            return;
                        }

                        // Close all inclusive popups.
                        that.element.find(".popup").each(function() {
                            var that = $(this),
                                popup = that.data("flyPopup");

                            if (popup) {
                                popup.close(skipEffects);
                            }
                        });

                        $html.unbind(that.downEvent, that._mousedownProxy);
                        that._scrollableParents().unbind(SCROLL, that._resizeProxy);
                        $win.unbind(RESIZE_SCROLL, that._resizeProxy);

                        if (skipEffects) {
                            animation = {
                                hide: true,
                                effects: {}
                            };
                        } else {
                            animation = extend(true, {}, options.animation.close);
                            openEffects = that.element.data(EFFECTS);
                            closeEffects = animation.effects;

                            if (!closeEffects && !$.isEmptyObject(closeEffects) &&
                                openEffects && $
                                .isEmptyObject(
                                    openEffects)) {
                                animation.effects = openEffects;
                                animation.reverse = true;
                            }

                            that._closing = true;
                        }

                        that.element.stop();
                        wrap.css({
                            overflow: HIDDEN
                        });
                        that.element.animated(animation);
                    }
                },

                _trigger: function(ev) {
                    return this.trigger(ev, {
                        type: ev
                    });
                },

                _resize: function(e) {
                    var that = this;

                    if (e.type === "resize") {
                        clearTimeout(that._resizeTimeout);
                        that._resizeTimeout = setTimeout(function() {
                            that._position();
                            that._resizeTimeout = null;
                        }, 50);
                    } else {
                        if (!that._hovered || (that._activated && that.element.hasClass(
                                "list-container"))) {
                            that.close();
                        }
                    }
                },

                _mousedown: function(e) {
                    var that = this,
                        container = that.element[0],
                        options = that.options,
                        anchor = $(options.anchor)[0],
                        toggleTarget = options.toggleTarget,
                        target = e.target,
                        popup = $(target).closest(".popup");

                    e.stopPropagation();
                    popup = popup[0];
                    if (popup && popup !== that.element[0]) {
                        return false;
                    }

                    // This MAY result in popup not closing in certain cases.
                    if ($(e.target).closest("a").data("rel") === "popover") {
                        return false;
                    }

                    if (!contains(container, target) && !contains(anchor, target) && !(
                            toggleTarget &&
                            contains($(toggleTarget)[0], target))) {
                        that.close();
                    }
                },

                _fit: function(position, size, viewPortSize) {
                    var output = 0;

                    if (position + size > viewPortSize) {
                        output = viewPortSize - (position + size);
                    }

                    if (position < 0) {
                        output = -position;
                    }

                    return output;
                },

                _flip: function(offset, size, anchorSize, viewPortSize, origin,
                    position, boxSize) {
                    var output = 0;
                    boxSize = boxSize || size;

                    if (position !== origin && position !== CENTER && origin !== CENTER) {
                        if (offset + boxSize > viewPortSize) {
                            output += -(anchorSize + size);
                        }

                        if (offset + output < 0) {
                            output += anchorSize + size;
                        }
                    }
                    return output;
                },

                _scrollableParents: function() {
                    return $(this.options.anchor)
                        .parentsUntil("body")
                        .filter(function(index, element) {
                            return fly.isScrollable(element);
                        });
                },

                _position: function(fixed) {
                    var that = this,
                        element = that.element.css(POSITION, ""),
                        wrapper = that.wrapper,
                        options = that.options,
                        viewport = $(options.viewport),
                        viewportOffset = viewport.offset(),
                        anchor = $(options.anchor),
                        origins = options.origin.toLowerCase().split(" "),
                        positions = options.position.toLowerCase().split(" "),
                        collisions = that.collisions,
                        siblingContainer, parents,
                        parentZIndex, zIndex = 10002,
                        isWindow = !!((viewport[0] == window) && window.innerWidth),
                        idx = 0,
                        length, viewportWidth, viewportHeight;

                    // $(window).height() uses documentElement to get the height
                    viewportWidth = isWindow ? window.innerWidth : viewport.width();
                    viewportHeight = isWindow ? window.innerHeight : viewport.height();

                    if (isWindow && document.documentElement.offsetWidth - document.documentElement
                        .clientWidth > 0) {
                        viewportWidth -= fly.support.scrollbar();
                    }

                    siblingContainer = anchor.parents().filter(wrapper.siblings());

                    if (siblingContainer[0]) {
                        parentZIndex = Math.max(Number(siblingContainer.css("zIndex")),
                            0);

                        // set z-index to be more than that of the container/sibling
                        // compensate with more units for window z-stack
                        if (parentZIndex) {
                            zIndex = parentZIndex + 10;
                        } else {
                            parents = anchor.parentsUntil(siblingContainer);
                            for (length = parents.length; idx < length; idx++) {
                                parentZIndex = Number($(parents[idx]).css("zIndex"));
                                if (parentZIndex && zIndex < parentZIndex) {
                                    zIndex = parentZIndex + 10;
                                }
                            }
                        }
                    }

                    wrapper.css("zIndex", zIndex);

                    if (fixed && fixed.isFixed) {
                        wrapper.css({
                            left: fixed.x,
                            top: fixed.y
                        });
                    } else {
                        wrapper.css(that._align(origins, positions));
                    }

                    var pos = wrapper.position(),
                        offset = wrapper.offset(),
                        anchorParent = anchor.offsetParent().parent(
                            ".animation-container,.popup"); // If the parent is positioned, get the current positions

                    if (anchorParent.length) {
                        pos = wrapper[POSITION]();
                        offset = wrapper.offset();
                    }

                    if (viewport[0] === window) {
                        offset.top -= (window.pageYOffset || document.documentElement.scrollTop ||
                            0);
                        offset.left -= (window.pageXOffset || document.documentElement.scrollLeft ||
                            0);
                    } else {
                        offset.top -= viewportOffset.top;
                        offset.left -= viewportOffset.left;
                    }

                    if (!that.wrapper.data(LOCATION)) { // Needed to reset the popup location after every closure - fixes the resize bugs.
                        wrapper.data(LOCATION, extend({}, pos));
                    }

                    var offsets = extend({}, offset),
                        location = extend({}, pos),
                        adjustSize = options.adjustSize;

                    if (collisions[0] === "fit") {
                        location.top += that._fit(offsets.top, wrapper.outerHeight() +
                            adjustSize.height,
                            viewportHeight);
                    }

                    if (collisions[1] === "fit") {
                        location.left += that._fit(offsets.left, wrapper.outerWidth() +
                            adjustSize.width,
                            viewportWidth);
                    }

                    var flipPos = extend({}, location);

                    if (collisions[0] === "flip") {
                        location.top += that._flip(offsets.top, element.outerHeight(),
                            anchor.outerHeight(),
                            viewportHeight, origins[0], positions[0], wrapper.outerHeight()
                        );
                    }

                    if (collisions[1] === "flip") {
                        location.left += that._flip(offsets.left, element.outerWidth(),
                            anchor.outerWidth(),
                            viewportWidth, origins[1], positions[1], wrapper.outerWidth()
                        );
                    }

                    element.css(POSITION, ABSOLUTE);
                    wrapper.css(location);

                    return (location.left != flipPos.left || location.top != flipPos.top);
                },

                _align: function(origin, position) {
                    var that = this,
                        element = that.wrapper,
                        anchor = $(that.options.anchor),
                        verticalOrigin = origin[0],
                        horizontalOrigin = origin[1],
                        verticalPosition = position[0],
                        horizontalPosition = position[1],
                        anchorOffset = anchor.offset(),
                        appendTo = $(that.options.appendTo),
                        appendToOffset,
                        width = element.outerWidth(),
                        height = element.outerHeight(),
                        anchorWidth = anchor.outerWidth(),
                        anchorHeight = anchor.outerHeight(),
                        top = anchorOffset.top,
                        left = anchorOffset.left,
                        round = Math.round;

                    if (appendTo[0] != document.body) {
                        appendToOffset = appendTo.offset();
                        top -= appendToOffset.top;
                        left -= appendToOffset.left;
                    }


                    if (verticalOrigin === BOTTOM) {
                        top += anchorHeight;
                    }

                    if (verticalOrigin === CENTER) {
                        top += round(anchorHeight / 2);
                    }

                    if (verticalPosition === BOTTOM) {
                        top -= height;
                    }

                    if (verticalPosition === CENTER) {
                        top -= round(height / 2);
                    }

                    if (horizontalOrigin === RIGHT) {
                        left += anchorWidth;
                    }

                    if (horizontalOrigin === CENTER) {
                        left += round(anchorWidth / 2);
                    }

                    if (horizontalPosition === RIGHT) {
                        left -= width;
                    }

                    if (horizontalPosition === CENTER) {
                        left -= round(width / 2);
                    }

                    return {
                        top: top,
                        left: left
                    };
                }
            });

            register(Popup);
            module.exports = Popup;

        }, {
            "./fly.core": 9,
            "./fly.ui": 32
        }
    ],
    26: [
        function(require, module, exports) {
            /**
             * 路由 暂未实现
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update:
             */

            module.exports = null;
        }, {}
    ],
    27: [
        function(require, module, exports) {
            module.exports = require(1)
        }, {
            "F:\\flyui\\flyui1.0\\git\\flyui-ex\\.build\\temp\\fly.accordion.js": 1
        }
    ],
    28: [
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

            var toString = function(value, type) {

                if (typeof value !== 'string') {
                    type = typeof value;
                    if (type === 'number') {
                        value += '';
                    } else if (type === 'function') {
                        value = toString(value.call(value));
                    } else {
                        value = '';
                    }
                }

                return value;

            };

            var escapeFn = function(s) {
                return escapeMap[s];
            };

            var escapeHTML = function(content) {
                return toString(content)
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
                                code = "$escape(" + code + ")";
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
            "./fly.core": 9
        }
    ],
    29: [
        function(require, module, exports) {
            /**普通文本框
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-08
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                register = ui.register,
                Widget = ui.Widget,
                $ = fly.$,
                proxy = $.proxy;

            // 静态变量
            var NAME = 'TextBox',
                NS = '.' + fly.NS + NAME,
                CLICK = 'click' + NS,
                DISABLED = "disabled",
                READONLY = "readonly",
                CHANGE = "change",
                DEFAULT = "state-default",
                FOCUSED = "state-focused",
                STATEDISABLED = "state-disabled",
                STATEHOVER = "state-hover",
                MOUSEENTER = "mouseenter" + NS,
                MOUSELEAVE = "mouseleave" + NS,
                NULL = null;

            // 默认配置参数 
            var defaults = ui.defaults[NAME] = {
                enabled: true,
                placeholder: '',
                value: null
            };

            // 按钮组件
            var TextBox = Widget.extend({

                // textBox的名称 
                name: NAME,

                /**
                 * [构造函数-识别解析DOM]
                 * @param  {[Object]} element [DOM]
                 * @param  {[Object]} options [DOM的配置参数对象]
                 */
                ctor: function(element, options) {
                    var that = this;
                    if (!element) return;

                    that._super(element, options);

                    options = that.options;
                    options.placeholder = options.placeholder || that.element.attr(
                        'placeholder');

                    that._wrapper();
                    that._enable();

                    that._placeholder();
                    fly.notify(that);
                },

                // 默认的配置项信息 
                options: defaults,

                // 绑定事件 
                events: [
                    CHANGE,
                    'focus',
                    'blur'
                ],

                // textBox销毁事件 
                destroy: function() {
                    var that = this;
                    that.element.off(ns);
                    that._inputWrapper.off(ns);
                    that._super.destroy();
                },

                // textBox聚焦事件 
                _inputFocus: function(e) {
                    this._inputWrapper.addClass(FOCUSED);
                    this._placeholder(false);
                    this.trigger('focus', e);
                },

                // textBox失焦事件 
                _inputFocusout: function(e) {
                    var that = this;
                    that._inputWrapper.removeClass(FOCUSED);
                    that._placeholder();
                    this.trigger('blur', e);
                },

                // textBox内容的改变事件 
                _inputChange: function() {
                    this.trigger(CHANGE);
                },

                // 设置textBox的只读状态 
                _enable: function() {
                    var that = this,
                        options = that.options,
                        disabled = that.element.is('[disabled]');

                    if (options.enable !== undefined) {
                        options.enabled = options.enable;
                    }

                    if (!options.enabled || disabled) {
                        that.enable(false);
                    } else {
                        that.readonly(that.element.is('[readonly]'));
                    }
                },

                /**
                 * [可编辑状态处理]
                 * @param  {[Object]} options [textBox定义参数对象]
                 */
                _editable: function(options) {
                    var that = this,
                        disable = options.disable,
                        readonly = options.readonly,
                        wrapper = that._inputWrapper.off(NS),
                        input = that.element.off(NS);

                    // 只有在没有设置只读(readonly和disable)的情况下设置可编辑样式及绑定事件 
                    if (!readonly && !disable) {

                        // 给DOM添加样式和绑定鼠标移入和移出事件 
                        wrapper
                            .addClass(DEFAULT)
                            .removeClass(STATEDISABLED)
                            .on(MOUSEENTER, function() {
                                wrapper.toggleClass(STATEHOVER, true);
                            })
                            .on(MOUSELEAVE, function() {
                                wrapper.toggleClass(STATEHOVER, false);
                            });

                        // 移出disable和readonly属性，绑定聚焦和失焦及改变事件 
                        input.removeAttr(DISABLED)
                            .removeAttr(READONLY)
                            .on("focus" + NS, proxy(that._inputFocus, that))
                            .on("focusout" + NS, proxy(that._inputFocusout, that))
                            .on(CHANGE + NS, proxy(that._inputChange, that));

                    } else {

                        // 设置只读状态 
                        wrapper
                            .addClass(disable ? STATEDISABLED : DEFAULT)
                            .removeClass(disable ? DEFAULT : STATEDISABLED);

                        input.attr(DISABLED, disable)
                            .attr(READONLY, readonly);
                    }
                },

                /**
                 * readonly表示只读，但是值可以被传递
                 * 设置文本框的readonly只读状态
                 * @param  {[Boolean]} readonly [布尔值,false表示取消只读，true表示设置只读]
                 */
                readonly: function(readonly) {
                    this._editable({
                        readonly: readonly === undefined ? true : readonly,
                        disable: false
                    });
                },

                /**
                 * disable表示只读，但是文本框中的值不会被获取
                 * [设置文本框的disable只读状态]
                 * @param  {[Boolean]} enable [布尔值,false表示取消只读，true表示设置只读]
                 */
                enable: function(enable) {
                    this._editable({
                        readonly: false,
                        disable: !(enable = enable === undefined ? true : enable)
                    });
                },

                /**
                 * [给文本框赋值操作]
                 * @param  {[String]} value [内容，是需要给文本框设置的值]
                 */
                value: function(value) {
                    if (value === undefined) {
                        value = this.element.val();
                        if (!fly.support.html5 && value == this.options.placeholder) {
                            value = '';
                        }
                        return value;
                    }
                    this.element.val(value);
                    this._placeholder();
                },

                /**
                 * [设置placeholder是否显示]
                 * @param  {[Boolean]} show [是否显示，false表示不显示，然后根据value去判断是否显示]
                 */
                _placeholder: function(show) {

                    if (fly.support.html5) {
                        return;
                    }

                    var that = this,
                        input = that.element,
                        placeholder = that.options.placeholder,
                        value;

                    // 只有dom加载的设置了placeholder才会去处理 
                    if (placeholder) {
                        value = that.value();

                        if (show === undefined) {
                            show = !value;
                        }

                        input.toggleClass("readonly", show);

                        if (!show) {
                            if (!value) {
                                placeholder = "";
                            } else {
                                return;
                            }
                        }

                        input.val(placeholder);

                        if (!placeholder && input[0] === fly.activeElement()) {
                            fly.caret(input[0], 0, 0);
                        }
                    }
                },

                // dom处理，解析页面dom成制定制定结构样式 
                _wrapper: function() {
                    var that = this,
                        options = that.options,
                        element = that.element,
                        inputWrapper = element.parent(),
                        wrapper = inputWrapper.parent();

                    if (!wrapper.is("span.widget")) {
                        inputWrapper = element.addClass('input').wrap(
                            '<span class="textbox-wrap ' +
                            DEFAULT + '" />').parent();
                        wrapper = inputWrapper.wrap('<span class="widget textbox" />').parent();
                        wrapper[0].style.cssText = element[0].style.cssText;
                    }

                    that.wrapper = wrapper.addClass(element[0].className);
                    that._inputWrapper = inputWrapper;
                }
            });

            register(TextBox);
            module.exports = TextBox;

        }, {
            "./fly.core": 9,
            "./fly.ui": 32
        }
    ],
    30: [
        function(require, module, exports) {
            /**
             * 提示框
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-28
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                template = require('./fly.template'),
                Dialog = require('./fly.dialog'),
                Widget = ui.Widget,
                register = ui.register,
                $ = fly.$,
                extend = $.extend;

            var NAME = 'Tooltip',
                MOUSEDOWN = 'mousedown.tooltip.close';

            // 默认配置
            var defaults = ui.defaults[NAME] = {
                id: 'fly' + NAME,
                padding: '5px 8px',
                align: 'bottom left',
                quickClose: false,
                modal: false,
                backdropOpacity: 0,
                backfocus: false
            };

            // 内容模板
            var contentTmpl =
                '<div class="tooltip">' +
                '<i class="tooltip-icon glyphicon glyphicon-{{icon}}"></I>' +
                '<span class="tooltip-content">{{content}}</span>' + '</div>';

            // 内容模板预编译
            var parseContent = template.compile(contentTmpl);

            var Tooltip = Widget.extend({

                name: NAME,

                options: defaults,

                ctor: function(element, options) {
                    var that = this,
                        dialog = Tooltip.dialog;

                    // 如果存在icon，则使用内容模板
                    if (options.icon) {
                        options.content = parseContent(options);
                    }

                    that._super(element, options, false);

                    if (dialog) {
                        // 如果已经存在dialog则继续使用
                        dialog.content(that.options.content).show(that.element[0]);
                    } else {
                        that.popup = Dialog.popup();
                        Tooltip.dialog = new Dialog(that.popup, that.options).show(that
                            .element[0]);
                    }

                    that.quickClose();
                },

                quickClose: function() {
                    var that = this;
                    $(document).on(MOUSEDOWN, function(e) {
                        if ($(e.target).closest(that.popup).length == 0) {
                            that.destroy();
                            $(document).off(MOUSEDOWN);
                        }
                    });
                },

                destroy: function() {
                    Tooltip.dialog && Tooltip.dialog.close().destroy();
                    Tooltip.dialog = null;
                }

            });

            register(Tooltip);
            module.exports = Tooltip;

        }, {
            "./fly.core": 9,
            "./fly.dialog": 12,
            "./fly.template": 28,
            "./fly.ui": 32
        }
    ],
    31: [
        function(require, module, exports) {
            /**
             * 按钮
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update: 2015-09-08
             */

            'use strict';

            // 依赖模块
            var fly = require('./fly.core'),
                ui = require('./fly.ui'),
                data = require('./fly.data'),
                template = require('./fly.template'),
                register = ui.register,
                Widget = ui.Widget,
                DataBoundWidget = ui.DataBoundWidget,
                NodeDataSource = data.NodeDataSource,
                $ = fly.$,
                keys = fly.keys,
                extend = $.extend,
                isArray = $.isArray,
                proxy = $.proxy;

            //"TreeView","subGroup","nodeContents","nodeIcon","window"

            // 静态变量
            var NAME = 'Tree',
                NS = '.' + fly.NS + NAME,
                c, d, u, h, p,
                SELECT = "select",
                CHECK = "check",
                NAVIGATE = "navigate",
                EXPAND = "expand",
                CHANGE = "change",
                ERROR = "error",
                CHECKED = "checked",
                INDETERMINATE = "indeterminate",
                COLLAPSE = "collapse",
                DRAGSTART = "dragstart",
                DRAG = "drag",
                DROP = "drop",
                DRAGEND = "dragend",
                DATABOUND = "dataBound",
                CLICK = "click",
                VISIBILITY = "visibility",
                UNDEFINED = "undefined",
                STATEHOVER = "state-hover",
                TREEVIEW = "treeview",
                VISIBLE = ":visible",
                NODE = ".item",
                STRING = "string",
                bindings = {
                    text: "textField",
                    url: "urlField",
                    imageCss: "imageCssField",
                    imageUrl: "imageUrlField"
                };


            var isDomElement = function(element) {
                    if ("object" == typeof HTMLElement) {
                        return element instanceof HTMLElement;
                    } else {
                        return element && "object" == typeof element && 1 === element.nodeType &&
                            typeof element
                            .nodeName === STRING;
                    }
                },
                subGroup = contentChild(".group"),
                nodeContents = contentChild(".group,.content"),
                nodeIcon = function(e) {
                    return e.children("div").children(".icon")
                },
                p = /sprite/;

            var defaults = ui.defaults[NAME] = {
                dataSource: {},
                animation: {
                    expand: {
                        effects: "expand:vertical",
                        duration: 200
                    },
                    collapse: {
                        duration: 100
                    }
                },
                messages: {
                    loading: '正在加载···',
                    requestFailed: '加载失败。',
                    retry: '重试'
                },
                disabled: {
                    expand: true // 禁用状态下的展开
                },
                dragAndDrop: false,
                checkboxes: true,
                autoBind: true,
                loadOnDemand: true,
                template: "",
                textField: 'text',
                urlField: 'url',
                imageCssField: 'iconCss',
                imageUrlField: 'iconUrl'
            };

            var Tree = DataBoundWidget.extend({

                name: NAME,

                options: defaults,

                ctor: function(element, options) {
                    var n, i = false,
                        that = this,
                        o = false,
                        a = options && !!options.dataSource;

                    if (isArray(options)) {
                        n = !0;
                        options = {
                            dataSource: options
                        }
                    }

                    if (options && typeof options.loadOnDemand == UNDEFINED && isArray(
                            options.dataSource)) {
                        options.loadOnDemand = !1;
                    }

                    that._super(element, options);
                    element = that.element;
                    options = that.options;

                    if (element.is("ul")) {
                        i = element;
                    } else if (element.hasClass(TREEVIEW)) {
                        i = element.children("ul");
                    }

                    o = !a && i.length;
                    if (o) {
                        options.dataSource.list = i;
                    }

                    that._animation();
                    that._templates();

                    if (element.hasClass(TREEVIEW)) {
                        that.wrapper = element;
                        that.root = element.children("ul").eq(0);
                    } else {
                        that._wrapper();
                        if (i) {
                            that.root = element;
                            that._group(that.wrapper);
                        }
                    }

                    that._tabindex();
                    that.root.attr("role", "tree");
                    that._dataSource(o);
                    that._attachEvents();
                    //that._dragging();

                    if (o) {
                        that._syncHtmlAndDataSource();
                    } else if (options.autoBind) {
                        that._progress(!0);
                        that.dataSource.fetch();
                    }

                    if (options.checkboxes && options.checkboxes.checkChildren) {
                        that.updateIndeterminate();
                    }

                    //fly.notify(that);
                },
                _attachEvents: function() {
                    var t = this,
                        n =
                        ".in:not(.state-selected,.state-disabled)",
                        i = "mouseenter";
                    t.wrapper
                        .on(i + NS, ".in.state-selected", function(e) {
                            e.preventDefault()
                        })
                        .on(i + NS, n, function() {
                            $(this).addClass(STATEHOVER)
                        })
                        .on("mouseleave" + NS, n, function() {
                            $(this).removeClass(STATEHOVER)
                        })
                        .on(CLICK + NS, n, proxy(t._click, t))
                        .on("dblclick" + NS, ".in:not(.state-disabled)", proxy(t._toggleButtonClick,
                            t))
                        .on(CLICK + NS, ".plus,.minus,.minus-disabled,.plus-disabled",
                            proxy(t._toggleButtonClick, t))
                        .on("keydown" + NS, proxy(t._keydown, t))
                        .on("focus" + NS, proxy(t._focus, t))
                        .on("blur" + NS, proxy(t._blur, t))
                        .on("mousedown" + NS, ".in,.checkbox :checkbox,.plus,.minus",
                            proxy(t._mousedown, t))
                        .on("change" + NS, ".checkbox :checkbox", proxy(t._checkboxChange,
                            t))
                        .on("click" + NS, ".checkbox :checkbox", proxy(t._checkboxClick,
                            t))
                        .on("click" + NS, ".request-retry", proxy(t._retryRequest, t))
                        .on("click" + NS, function(n) {
                            if ($(n.target).is(":focusable")) {
                                t.focus();
                            }
                        });
                },

                _checkboxClick: function(e) {
                    var checkbox = $(e.target);
                    if (checkbox.data(INDETERMINATE)) {
                        checkbox.data(INDETERMINATE, false)
                            .prop(INDETERMINATE, false)
                            .prop(CHECKED, true);
                        this._checkboxChange(e);
                    }
                },

                _syncHtmlAndDataSource: function(e, t) {
                    var ul = ul || this.root,
                        dataSource = dataSource || this.dataSource,
                        viewData = dataSource.view(),
                        hasCheckbox = this.options.checkboxes,
                        lis = ul.children('li'),
                        li,
                        expanded = 'data-expanded',
                        uid = 'data-uid',
                        item,
                        length = lis.length,
                        i = 0;
                    for (; i < length; i++) {
                        item = viewData[i];
                        li = lis.eq(i);
                        li.attr('role', 'treeitem').attr(uid, item.uid);
                        item.expanded = li.attr(expanded) === 'true';
                        if (hasCheckbox) {
                            item.checked = findCheckboxes(li).prop(CHECKED);
                        }
                        this._syncHtmlAndDataSource(li.children("ul"), item.children);
                    }
                },

                _animation: function() {
                    var options = this.options,
                        animation = options.animation;

                    if (animation === false) {
                        animation = {
                            expand: {
                                effects: {}
                            },
                            collapse: {
                                hide: true,
                                effects: {}
                            }
                        };
                    } else if (animation.collapse && !("effects" in animation.collapse)) {
                        animation.collapse = extend({
                            reverse: true
                        }, animation.expand);
                    }

                    extend(animation.collapse, {
                        hide: true
                    });

                    options.animation = animation;
                },

                _dragging: function() {
                    /*var drag = this.options.dragAndDrop,
            dragging = this.dragging;

        if (drag && !dragging) {
            this.dragging = new TreeViewDragAndDrop(this);
        } else if (!drag && dragging) {
            dragging.destroy();
            this.dragging = null;
        }*/
                },

                _templates: function() {
                    var that = this,
                        options = that.options;

                    var e = this,
                        t = e.options,
                        text = t.textField,
                        url = t.urlField,
                        imageUrl = t.imageUrlField,
                        imageCss = t.imageCssField;

                    if (t.template) {
                        if (typeof t.template == STRING) {
                            t.template = template(t.template);
                        }
                    } else {
                        // data.item.encoded 是否包含编码html标签
                        t.template = template.compile('{{ item.' + text + '}}');
                    }

                    e._checkboxes();

                    e.templates = {
                        wrapperCssClass: function(e, t) {
                            var n = "item",
                                i = t.index;
                            return e.firstLevel && 0 === i &&
                                (n += " first"), i == e.length -
                                1 && (n += " last"), n
                        },
                        cssClass: function(e, t) {
                            var n = "",
                                i = t.index,
                                r = e.length - 1;
                            return e.firstLevel && 0 === i && (n +=
                                    "top "), n += 0 === i && i != r ?
                                "top" : i == r ? "bot" : "mid"
                        },
                        textClass: function(e) {
                            var t = "in";
                            return e.enabled === !1 && (t +=
                                    " state-disabled"), e
                                .selected === !0 && (t +=
                                    " state-selected"), t
                        },
                        toggleButtonClass: function(e) {
                            var icon = 'icon';
                            icon += e.expanded !== true ? ' plus' : ' minus';
                            if (e.enabled === false && options.disabled.expand ===
                                false) {
                                icon += '-disabled';
                            }
                            return icon;
                        },
                        groupAttributes: function(e) {
                            var groupAttr = '';

                            if (!e.firstLevel) {
                                groupAttr += 'role="group"';
                            }
                            if (e.expanded !== true) {
                                groupAttr += ' style="display:none"';
                            }

                            return groupAttr;
                        },
                        groupCssClass: function(e) {
                            var t = "group";
                            return e.firstLevel && (t +=
                                " treeview-lines"), t
                        },
                        dragClue: templateNoWith(
                            '<div class="header drag-clue">' +
                            '    <span class="icon drag-status" />{{# treeview.template($data) }}' +
                            '</div>'
                        ),
                        group: templateNoWith(
                            '<ul class="{{ r.groupCssClass(group) }}" {{# r.groupAttributes(group) }}>' +
                            '    {{# renderItems($data) }}' +
                            '</ul>'
                        ),
                        itemContent: templateNoWith(
                            '{{ if item.' + imageUrl + ' }}' +
                            '<img class="image" alt="" src="{{item.' + imageUrl +
                            '}}" />' +
                            '{{/if}}' +
                            '{{ if item.' + imageCss + ' }}' +
                            '<span class="icon icon-{{ item.' + imageCss +
                            ' }}"></span>' +
                            '{{/if}}' +
                            '{{# treeview.template($data) }}'
                        ),
                        itemElement: templateNoWith(
                            '<div class="{{ r.cssClass($data.group, $data.item) }}">' +
                            '{{ if item.hasChildren}}' +
                            '<span class="{{ r.toggleButtonClass($data.item) }}"></span>' +
                            '{{/if}}' +
                            '{{ if treeview.checkboxes}}' +
                            '<span class="checkbox">{{# treeview.checkboxes.template($data) }}</span>' +
                            '{{/if}}' +
                            '{{ if item.' + url + '}}' +
                            '<a href="{{ item.' + url +
                            '}}" class="{{ r.textClass($data.item) }}">{{# r.itemContent($data) }}</a>' +
                            '{{ else }}' +
                            '<span class="{{ r.textClass($data.item) }}">{{# r.itemContent($data) }}</span>' +
                            '{{/if}}' +
                            '</div>'
                        ),
                        item: templateNoWith(
                            '<li role="treeitem" class="{{ r.wrapperCssClass($data.group, $data.item) }}"' +
                            '    data-uid="{{ item.uid }}"' +
                            '    {{ if item.expanded }}' +
                            '    data-expanded="true" ' +
                            '    {{/if}} >' +
                            '{{# r.itemElement($data) }}' +
                            '</li>'
                        ),
                        //'<span class="icon icon-loading"></span> {{# messages.loading }}'
                        loading: templateNoWith('<span>暂无数据</span>'),
                        retry: templateNoWith(
                            '{{# messages.requestFailed }}' +
                            '<button class="button buttun-default">{{ messages.retry }}</button>'
                        )
                    }
                },

                items: function() {
                    return this.element.find(
                        ".item > div:first-child")
                },

                setDataSource: function(e) {
                    var t = this.options;
                    t.dataSource = e, this._dataSource(), this.dataSource
                        .fetch(), t.checkboxes && t.checkboxes.checkChildren &&
                        this.updateIndeterminate()
                },

                _bindDataSource: function() {
                    this._refreshHandler = proxy(this.refresh, this);
                    this._errorHandler = proxy(this._error, this);
                    this.dataSource.bind(CHANGE, this._refreshHandler);
                    this.dataSource.bind(ERROR, this._errorHandler);
                },

                _unbindDataSource: function() {
                    var dataSource = this.dataSource;
                    if (dataSource) {
                        dataSource.unbind(CHANGE, this._refreshHandler);
                        dataSource.unbind(ERROR, this._errorHandler);
                    }
                },

                _dataSource: function(e) {
                    function t(e) {
                        for (var n = 0; e.length > n; n++) e[n]
                            ._initChildren(), e[n].children.fetch(),
                            t(e[n].children.view())
                    }
                    var n = this,
                        i = n.options,
                        r = i.dataSource;
                    r = isArray(r) ? {
                            data: r
                        } : r, n._unbindDataSource(), r.fields || (
                            r.fields = [{
                                field: "text"
                            }, {
                                field: "url"
                            }, {
                                field: "imageCss"
                            }, {
                                field: "imageUrl"
                            }]), n.dataSource = r = NodeDataSource.create(r), e &&
                        (r.fetch(), t(r.view())), n._bindDataSource()
                },

                events: [
                    DRAG,
                    DROP,
                    DRAGEND,
                    DATABOUND,
                    EXPAND,
                    COLLAPSE,
                    SELECT,
                    CHANGE,
                    NAVIGATE,
                    CHECK
                ],

                _fieldAccessor: function(field) {
                    return this.options[bindings[field]] || field;
                },

                setOptions: function(e) {
                    this._super.setOptions(e);
                    this._animation();
                    //this._dragging();
                    this._templates();
                },

                _trigger: function(e, t) {
                    return this.trigger(e, {
                        node: t.closest(NODE)[0]
                    })
                },

                _setChecked: function(t, n) {
                    if (t && $.isFunction(t.view)) {
                        for (var i = 0, r = t.view(); r.length > i; i++) {
                            r[i][CHECKED] = n;
                            r[i].children && this._setChecked(r[i].children, n);
                        }
                    }
                },

                _setIndeterminate: function(e) {
                    var group = subGroup(e),
                        checkboxes = group.length && findCheckboxes(group.children()),
                        length = checkboxes.length,
                        i, a = true;

                    if (!group.length) return;

                    if (length > 1) {
                        for (i = 1; length > i; i++) {
                            if (checkboxes[i].checked != checkboxes[i - 1].checked ||
                                checkboxes[i].indeterminate ||
                                checkboxes[i - 1].indeterminate
                            ) {
                                a = false;
                                break;
                            }
                        }
                    } else {
                        a = !checkboxes[0].indeterminate;
                    }

                    return findCheckboxes(e).data(INDETERMINATE, !a).prop(INDETERMINATE, !
                        a).prop(
                        CHECKED, a && checkboxes[0].checked);
                },

                updateIndeterminate: function(e) {
                    var t, n, i;
                    if (e = e || this.wrapper, t = subGroup(e).children(),
                        t.length) {
                        for (n = 0; t.length > n; n++) this.updateIndeterminate(
                            t.eq(n));
                        i = this._setIndeterminate(e), i && i.prop(
                            CHECKED) && (this.dataItem(e).checked = !
                            0)
                    }
                },

                _bubbleIndeterminate: function(e) {
                    if (e.length) {
                        var t, n = this.parent(e);
                        n.length && (this._setIndeterminate(n), t =
                            n.children("div").find(
                                ".checkbox :checkbox"), t.prop(
                                INDETERMINATE) === !1 ? this.dataItem(n).set(
                                CHECKED, t.prop(CHECKED)) : this.dataItem(n)
                            .checked = !1, this._bubbleIndeterminate(
                                n))
                    }
                },

                _checkboxChange: function(t) {
                    var n = $(t.target),
                        i = n.prop(CHECKED),
                        r = n.closest(NODE);
                    this.dataItem(r).set(CHECKED, i), this._trigger(CHECK, r)
                },

                _toggleButtonClick: function(t) {
                    this.toggle($(t.target).closest(NODE))
                },

                _mousedown: function(t) {
                    var n = $(t.currentTarget).closest(NODE);
                    this._clickTarget = n, this.current(n)
                },

                _focusable: function(e) {
                    return e && e.length && e.is(":visible") && !e.find(
                        ".in:first").hasClass(
                        "state-disabled")
                },

                _focus: function() {
                    var t = this.select(),
                        n = this._clickTarget;
                    fly.support.touch || (n && n.length && (t = n),
                        this._focusable(t) || (t = this.current()),
                        this._focusable(t) || (t = this._nextVisible(
                            $())), this.current(t))
                },

                focus: function() {
                    var e, t = this.wrapper,
                        n = t[0],
                        i = [],
                        r = [],
                        o = document.documentElement;
                    do n = n.parentNode, n.scrollHeight > n.clientHeight &&
                        (i.push(n), r.push(n.scrollTop)); while (n !=
                        o);
                    for (t.focus(), e = 0; i.length > e; e++) i[e].scrollTop =
                        r[e]
                },

                _blur: function() {
                    this.current().find(".in:first").removeClass(
                        "state-focused")
                },

                _enabled: function(e) {
                    return !e.children("div").children(".in").hasClass(
                        "state-disabled")
                },

                parent: function(t) {
                    var n, i, r = /\btreeview\b/,
                        o = /\bitem\b/;
                    typeof t == STRING && (t = this.element.find(t)), isDomElement(
                        t) || (t = t[0]), i = o.test(t.className);
                    do t = t.parentNode, o.test(t.className) && (i ?
                        n = t : i = !0); while (!r.test(t.className) &&
                        !n);
                    return $(n)
                },

                _nextVisible: function(e) {
                    function t(e) {
                        for (; e.length && !e.next().length;) e =
                            i.parent(e);
                        return e.next().length ? e.next() : e
                    }
                    var n, i = this,
                        r = i._expanded(e);
                    return e.length && e.is(":visible") ? r ? (n =
                            subGroup(e).children().first(), n.length || (n =
                                t(e))) : n = t(e) : n = i.root.children()
                        .eq(0), i._enabled(n) || (n = i._nextVisible(
                            n)), n
                },

                _previousVisible: function(e) {
                    var t, n, i = this;
                    if (!e.length || e.prev().length)
                        for (n = e.length ? e.prev() : i.root.children()
                            .last(); i._expanded(n) && (t = subGroup(n).children()
                                .last(), t.length);) n = t;
                    else n = i.parent(e) || e;
                    return i._enabled(n) || (n = i._previousVisible(
                        n)), n
                },

                _keydown: function(n) {
                    var i, r = this,
                        o = n.keyCode,
                        a = r.current(),
                        s = r._expanded(a),
                        l = a.find(".checkbox:first :checkbox");
                    n.target == n.currentTarget && (o == keys.RIGHT ? s ? i = r._nextVisible(
                            a) : r.expand(a) : o == keys.LEFT ? s ? r.collapse(a) :
                        (i = r.parent(a), r._enabled(i) || (i =
                            t)) : o == keys.DOWN ? i = r._nextVisible(
                            a) : o == keys.UP ? i = r._previousVisible(
                            a) : o == keys.HOME ? i = r._nextVisible(
                            $()) : o == keys.END ? i = r._previousVisible(
                            $()) : o == keys.ENTER ? a.find(
                            ".in:first").hasClass(
                            "state-selected") || r._trigger(SELECT,
                            a) || r.select(a) : o == keys.SPACEBAR &&
                        l.length && (l.prop(CHECKED, !l.prop(CHECKED)).data(
                            INDETERMINATE, !1).prop(INDETERMINATE, !1), r._checkboxChange({
                            target: l
                        }), i = a), i && (n.preventDefault(), a[
                            0] != i[0] && (r._trigger(NAVIGATE, i),
                            r.current(i))))
                },

                _click: function(e) {
                    var that = this,
                        target = $(e.currentTarget),
                        node = nodeContents(target.closest(NODE)),
                        href = target.attr("href"),
                        link;
                    if (href) {
                        link = "#" == href || href.indexOf("#" + this.element.id + "-") >=
                            0;
                    } else {
                        link = node.length && !node.children().length;
                    }

                    if (link) {
                        e.preventDefault();
                    }

                    if (!target.hasClass(".state-selected")) {
                        if (!that._trigger(SELECT, target)) {
                            that.select(target);
                        }
                    }
                },

                _wrapper: function() {
                    var e, t, n = this,
                        i = n.element,
                        r = "widget treeview";
                    i.is("ul") ? (e = i.wrap("<div />").parent(), t =
                            i) : (e = i, t = e.children("ul").eq(0)),
                        n.wrapper = e.addClass(r), n.root = t
                },

                _group: function(e) {
                    var t = this,
                        n = e.hasClass(TREEVIEW),
                        i = {
                            firstLevel: n,
                            expanded: n || t._expanded(e)
                        },
                        r = e.children("ul");
                    r.addClass(t.templates.groupCssClass(i)).css(
                        "display", i.expanded ? "" : "none");
                    t._nodes(r, i)
                },

                _nodes: function(t, n) {
                    var i, r = this,
                        o = t.children("li");
                    n = extend({
                        length: o.length
                    }, n);
                    o.each(function(t, o) {
                        o = $(o);
                        i = {
                            index: t,
                            expanded: r._expanded(o)
                        };
                        updateNodeHtml(o);
                        r._updateNodeClasses(o, n, i);
                        r._group(o);
                    })
                },

                _checkboxes: function() {
                    var options = this.options,
                        checkboxes = options.checkboxes,
                        templateStr;

                    if (checkboxes) {
                        templateStr = '<input type="checkbox" ' +
                            (checkboxes.name ? 'name="' + checkboxes.name + '"' : '') +
                            '{{if item.enabled === false}}disabled{{/if}} ' +
                            '{{if item.checked}}checked{{/if}} />';
                        checkboxes = extend({
                            template: templateStr
                        }, checkboxes);

                        if (typeof checkboxes.template == STRING) {
                            checkboxes.template = template(checkboxes.template);
                        }

                        options.checkboxes = checkboxes;
                    }
                },

                _updateNodeClasses: function(e, t, n) {
                    var i = e.children("div"),
                        r = e.children("ul"),
                        o = this.templates;

                    if (!e.hasClass("treeview")) {
                        n = n || {};
                        n.expanded = typeof n.expanded != UNDEFINED ? n.expanded : this
                            ._expanded(e);
                        n.index = typeof n.index != UNDEFINED ? n.index : e.index();
                        n.enabled = typeof n.enabled != UNDEFINED ? n.enabled : !i.children(
                            ".in").hasClass(
                            "state-disabled");
                        t = t || {};
                        t.firstLevel = typeof t.firstLevel != UNDEFINED ? t.firstLevel :
                            e.parent()
                            .parent().hasClass();
                        t.length = typeof t.length != UNDEFINED ? t.length : e.parent()
                            .children().length,

                            e.removeClass("first last")
                            .addClass(o.wrapperCssClass(t, n));
                        i.removeClass("top mid bot")
                            .addClass(o.cssClass(t, n));
                        i.children(".in").removeClass("in state-default state-disabled")
                            .addClass(o.textClass(n));

                        if (r.length ||
                            "true" == e.attr("data-hasChildren")
                        ) {
                            i.children(".icon").removeClass(
                                "plus minus plus-disabled minus-disabled"
                            ).addClass(o.toggleButtonClass(n));
                            r.addClass("group");
                        }
                    }
                },

                _processNodes: function(t, n) {
                    var i = this;
                    i.element.find(t).each(function(t, r) {
                        n.call(i, t, $(r).closest(NODE))
                    })
                },

                dataItem: function(t) {
                    var n = $(t).closest(NODE).data("uid"),
                        i = this.dataSource;
                    return i && i.getByUid(n)
                },

                _insertNode: function(t, n, i, r, o) {
                    var a, l, c, u, h = this,
                        p = subGroup(i),
                        f = p.children().length + 1,
                        g = {
                            firstLevel: i.hasClass(TREEVIEW),
                            expanded: !o,
                            length: f
                        },
                        m = "",
                        v = function(e, t) {
                            e.appendTo(t)
                        };
                    for (c = 0; t.length > c; c++) u = t[c], u.index =
                        n + c, m += h._renderItem({
                            group: g,
                            item: u
                        });
                    if (l = $(m), l.length) {
                        for (p.length || (p = $(h._renderGroup({
                                group: g
                            })).appendTo(i)), r(l, p), i.hasClass(
                                "item") && (updateNodeHtml(i), h._updateNodeClasses(
                                i)), h._updateNodeClasses(l.prev().first()),
                            h._updateNodeClasses(l.next().last()),
                            c = 0; t.length > c; c++) {
                            u = t[c];
                            if (u.hasChildren) {
                                a = u.children.data();
                                a.length && h._insertNode(a, u.index, l.eq(c), v, !h._expanded(
                                    l.eq(
                                        c)));
                            }
                        }
                        return l
                    }
                },

                _updateNodes: function(t, n) {
                    function i(e, t) {
                        e.find(".checkbox :checkbox").prop(CHECKED,
                            t).data(INDETERMINATE, !1).prop(INDETERMINATE, !1)
                    }
                    var r, o, a, s, l, c, d, h = this,
                        p = {
                            treeview: h.options,
                            item: s
                        };
                    if ("selected" == n) s = t[0], o = h.findByUid(
                            s.uid).find(".in:first").removeClass(
                            "state-hover").toggleClass(
                            "state-selected", s[n]).end(), s[n] &&
                        h.current(o);
                    else {
                        for (d = $.map(t, function(e) {
                                return h.findByUid(e.uid).children("div")
                            }), r = 0; t.length > r; r++) {
                            p.item = s = t[r];
                            a = d[r];
                            o = a.parent();

                            if (n != "expanded" && n != "checked") {
                                a.children(".in").html(h.templates.itemContent(p));
                            }

                            if (n == CHECKED) {
                                l = s[n];
                                i(a, l);
                                if (h.options.checkboxes.checkChildren) {
                                    i(o.children(".group"), l);
                                    h._setChecked(s.children, l);
                                    h._bubbleIndeterminate(o);
                                }
                            } else if (n == "expanded") {
                                h._toggle(o, s, s[n]);
                            } else if (n == "enabled") {
                                o.find(".checkbox :checkbox").prop("disabled", !s[n]);
                                c = !nodeContents(o).is(VISIBLE);
                                if (!s[n]) {
                                    s.selected && s.set("selected", false);
                                    s.expanded && s.set("expanded", false);
                                    c = true;
                                }
                                h._updateNodeClasses(o, {
                                    enabled: s[n],
                                    expanded: !c
                                });
                            }

                            a.length && this.trigger("itemChange", {
                                item: a,
                                data: s,
                                ns: ui
                            });
                        }
                    }
                },

                _appendItems: function(e, t, n) {
                    var i = subGroup(n),
                        r = i.children(),
                        o = !this._expanded(n);
                    typeof e == UNDEFINED && (e = r.length), this._insertNode(
                        t, e, n,
                        function(t, n) {
                            e >= r.length ? t.appendTo(n) : t.insertBefore(
                                r.eq(e))
                        }, o), this._expanded(n) && (this._updateNodeClasses(
                        n), subGroup(n).css("display", "block"))
                },

                _refreshChildren: function(e, t, n) {
                    var i, r, o, a = this.options,
                        l = a.loadOnDemand,
                        c = a.checkboxes && a.checkboxes.checkChildren;
                    if (subGroup(e).empty(), t.length)
                        for (this._appendItems(n, t, e), r = subGroup(e).children(),
                            l && c && this._bubbleIndeterminate(r.last()),
                            i = 0; r.length > i; i++) o = r.eq(i),
                            this.trigger("itemChange", {
                                item: o.children("div"),
                                data: this.dataItem(o),
                                ns: ui
                            });
                    else updateNodeHtml(e)
                },

                _refreshRoot: function(t) {
                    var n, i, r, o = this._renderGroup({
                        items: t,
                        group: {
                            firstLevel: !0,
                            expanded: !0
                        }
                    });
                    for (this.root.length ? (this._angularItems(
                            "cleanup"), n = $(o), this.root.attr(
                            "class", n.attr("class")).html(n.html())) :
                        this.root = this.wrapper.html(o).children(
                            "ul"), this.root.attr("role", "tree"),
                        i = 0; t.length > i; i++) r = this.root.children(
                        ".item"), this.trigger("itemChange", {
                        item: r.eq(i),
                        data: t[i],
                        ns: ui
                    });
                    this._angularItems("compile")
                },

                refresh: function(e) {
                    var n, i, r = e.node,
                        o = e.action,
                        a = e.items,
                        s = this.wrapper,
                        l = this.options,
                        c = l.loadOnDemand,
                        d = l.checkboxes && l.checkboxes.checkChildren;
                    if (e.field) {
                        if (!a[0] || !a[0].level) return;
                        return this._updateNodes(a, e.field)
                    }
                    if (r && (s = this.findByUid(r.uid), this._progress(
                            s, !1)), d && "remove" != o) {
                        for (i = !1, n = 0; a.length > n; n++)
                            if ("checked" in a[n]) {
                                i = !0;
                                break
                            }
                        if (!i && r && r.checked)
                            for (n = 0; a.length > n; n++) a[n].checked = !
                                0
                    }

                    if ("add" == o) {
                        this._appendItems(e.index, a, s);
                    } else if ("remove" == o) {
                        this._remove(this.findByUid(a[0].uid), !1);
                    } else if ("itemchange" == o) {
                        this._updateNodes(a);
                    } else if ("itemloaded" == o) {
                        this._refreshChildren(s, a, e.index)
                    } else {
                        this._refreshRoot(a)
                    }

                    if ("remove" != o) {
                        for (n = 0; a.length > n; n++) {
                            (!c || a[n].expanded) && a[n].load();
                        }
                    }

                    this.trigger(DATABOUND, {
                        node: r ? s : undefined
                    })
                },

                _error: function(e) {
                    var t = e.node && this.findByUid(e.node.uid),
                        n = this.templates.retry({
                            messages: this.options.messages
                        });
                    t ? (this._progress(t, !1), this._expanded(t, !
                            1), nodeIcon(t).addClass("i-refresh"), e
                        .node.loaded(!1)) : (this._progress(!1),
                        this.element.html(n))
                },

                _retryRequest: function(e) {
                    e.preventDefault(), this.dataSource.fetch()
                },

                _checked: function(nodes, checkedNodes) {
                    for (var i = 0; i < nodes.length; i++) {
                        if (nodes[i].checked && nodes[i].enabled !== false) {
                            checkedNodes.push(nodes[i]);
                        }

                        if (nodes[i].hasChildren) {
                            this._checked(nodes[i].children.view(), checkedNodes);
                        }
                    }
                },

                getCheckedNodes: function(field) {
                    var nodes = this.dataSource.view(),
                        checkedNodes = [],
                        items = [],
                        i = 0,
                        length;
                    this._checked(nodes, checkedNodes);

                    if (field) {
                        for (length = checkedNodes.length; i < length; i++) {
                            items.push(checkedNodes[i][field]);
                        }
                    } else {
                        items = checkedNodes;
                    }

                    return items;
                },

                expand: function(e) {
                    this._processNodes(e, function(e, t) {
                        this.toggle(t, !0)
                    })
                },

                collapse: function(e) {
                    this._processNodes(e, function(e, t) {
                        this.toggle(t, !1)
                    })
                },

                enable: function(e, t) {
                    t = 2 == arguments.length ? !!t : !0, this._processNodes(
                        e,
                        function(e, n) {
                            this.dataItem(n).set("enabled", t)
                        })
                },

                current: function(n) {
                    var i = this,
                        r = i._current,
                        o = i.element;
                    return arguments.length > 0 && n && n.length ?
                        (r && (r.find(".in:first").removeClass(
                                "state-focused")), r = i._current =
                            $(n, o).closest(NODE), r.find(
                                ".in:first").addClass(
                                "state-focused"), undefined) :
                        (r || (r = i._nextVisible($())), r)
                },

                select: function(node) {
                    var that = this,
                        element = that.element;
                    if (arguments.length) {
                        node = $(node, element).closest(NODE);
                        element.find(".state-selected").each(function() {
                            var dataItem = that.dataItem(this);
                            if (dataItem) {
                                dataItem.set("selected", false);
                                delete dataItem.selected;
                            } else {
                                $(this).removeClass("state-selected");
                            }
                        });
                        node.length && that.dataItem(node).set("selected", true);
                        that.trigger(CHANGE);
                    } else {
                        return element.find(".state-selected").closest(NODE);
                    }
                },

                _toggle: function(e, t, n) {
                    var i, r, o = this.options,
                        a = nodeContents(e),
                        s = n ? "expand" : "collapse";
                    a.data("animating") || this._trigger(s, e) || (
                        this._expanded(e, n), i = t && t.loaded(),
                        r = !a.children().length, !n || i && !r ?
                        (this._updateNodeClasses(e, {}, {
                                expanded: n
                            }), n || a.css("height", a.height())
                            .css("height"), a.stop(!0, !0)
                            .animated(extend({
                                reset: !0
                            }, o.animation[s], {
                                complete: function() {
                                    n && a.css(
                                        "height",
                                        "")
                                }
                            }))) : (o.loadOnDemand && this._progress(
                            e, !0), a.remove(), t.load()))
                },

                toggle: function(t, n) {
                    t = $(t);
                    if (nodeIcon(t).is(".minus,.plus,.minus-disabled,.plus-disabled")) {
                        if (1 == arguments.length) {
                            n = !this._expanded(t);
                        }
                        this._expanded(t, n);
                    }
                },

                destroy: function() {
                    var e = this;
                    Widget.fn.destroy.call(e), e.wrapper.off(C), e._unbindDataSource(),
                        e.dragging && e.dragging.destroy(), fly.destroy(
                            e.element), e.root = e.wrapper = e.element =
                        null
                },

                _expanded: function(e, n) {
                    var expanded = 'data-expanded',
                        dataItem = this.dataItem(e);
                    if (arguments.length == 1) {
                        if (e.attr(expanded) !== 'true') {
                            return dataItem && dataItem.expanded;
                        } else {
                            return true;
                        }
                    } else {
                        if (!nodeContents(e).data("animating")) {
                            if (dataItem) {
                                dataItem.set("expanded", n);
                                n = dataItem.expanded;
                            }
                            if (n) {
                                e.attr(expanded, "true");
                            } else {
                                e.removeAttr(expanded);
                            }
                        }
                    }
                },

                _progress: function(e, t) {
                    var n = this.element,
                        i = this.templates.loading({
                            messages: this.options.messages
                        });
                    1 == arguments.length ? (t = e, t ? n.html(i) :
                        n.empty()) : nodeIcon(e).toggleClass(
                        "icon-loading", t).removeClass(
                        "i-refresh")
                },

                text: function(e, n) {
                    var i = this.dataItem(e),
                        r = this.options[bindings.text],
                        o = i.level(),
                        a = r.length,
                        s = r[Math.min(o, a - 1)];
                    return n ? (i.set(s, n), undefined) : i[s]
                },

                _objectOrSelf: function(t) {
                    return $(t).closest("[data-role=treeview]").data(
                        "flyTree") || this
                },

                _dataSourceMove: function(t, n, i, r) {
                    var o, a = this._objectOrSelf(i || n),
                        s = a.dataSource,
                        l = $.Deferred().resolve().promise();
                    return i && i[0] != a.element[0] && (o = a.dataItem(
                            i), o.loaded() || (a._progress(i, !
                            0), l = o.load()), i != this.root &&
                        (s = o.children, s && s instanceof NodeDataSource ||
                            (o._initChildren(), o.loaded(!0), s =
                                o.children))), t = this._toObservableData(
                        t), r.call(this, s, t, l)
                },

                _toObservableData: function(t) {
                    var n, i, r = t;
                    return (t instanceof window.jQuery || isDomElement(t)) &&
                        (n = this._objectOrSelf(t).dataSource, i =
                            $(t).data("uid"), r = n.getByUid(
                                i), r && (r = n.remove(r))), r
                },

                _insert: function(e, t, n) {
                    t instanceof fly.data.ObservableArray ? t = t.toJSON() :
                        isArray(t) || (t = [t]);
                    var i = e.parent();
                    return i && i._initChildren && (i.hasChildren = !
                        0, i._initChildren()), e.splice.apply(e, [
                        n, 0
                    ].concat(t)), this.findByUid(e[n].uid)
                },

                insertAfter: insertAction(1),

                insertBefore: insertAction(0),

                append: function(t, n, i) {
                    var r = this,
                        o = r.root;
                    return n && (o = subGroup(n)), r._dataSourceMove(t, o,
                        n,
                        function(t, o, a) {
                            function s() {
                                n && r._expanded(n, !0);
                                var e = t.data(),
                                    i = Math.max(e.length,
                                        0);
                                return r._insert(e, o, i)
                            }
                            var l;
                            return a.then(function() {
                                l = s(), (i = i || $.noop)
                                    (l)
                            }), l || null
                        })
                },

                _remove: function(t, n) {
                    var i, r, o, a = this;
                    return t = $(t, a.element), this.angular(
                            "cleanup",
                            function() {
                                return {
                                    elements: t.get()
                                }
                            }), i = t.parent().parent(), r = t.prev(),
                        o = t.next(), t[n ? "detach" : "remove"](),
                        i.hasClass("item") && (updateNodeHtml(i), a._updateNodeClasses(
                            i)), a._updateNodeClasses(r), a._updateNodeClasses(
                            o), t
                },

                remove: function(e) {
                    var t = this.dataItem(e);
                    t && this.dataSource.remove(t)
                },

                detach: function(e) {
                    return this._remove(e, !0)
                },

                findByText: function(t) {
                    return $(this.element).find(".in").filter(
                        function(n, i) {
                            return $(i).text() == t
                        }).closest(NODE)
                },

                findByUid: function(t) {
                    var n, i, r = this.element.find(".item"),
                        o = "data-uid";
                    for (i = 0; r.length > i; i++)
                        if (r[i].getAttribute(o) == t) {
                            n = r[i];
                            break
                        }
                    return $(n)
                },

                expandPath: function(n, i) {
                    function r(e, t, n) {
                        e && !e.loaded() ? e.set("expanded", !0) : t.call(n)
                    }
                    var o, a, s;
                    for (n = n.slice(0), o = this, a = this.dataSource,
                        s = a.get(n[0]), i = i || $.noop; n.length >
                        0 && s && (s.expanded || s.loaded());) s.set(
                        "expanded", !0), n.shift(), s = a.get(n[
                        0]);
                    return n.length ? (a.bind("change", function(e) {
                        var t, s = e.node && e.node.id;
                        s && s === n[0] && (n.shift(),
                            n.length ? (t = a.get(n[
                                0]), r(t, i, o)) :
                            i.call(o))
                    }), r(s, i, o)) : i.call(o)
                },

                _parents: function(node) {
                    var parentNode = node && node.parentNode();
                    for (var nodes = []; parentNode && parentNode.parentNode;) {
                        nodes.push(parentNode);
                        parentNode = parentNode.parentNode();
                    }
                    return nodes;
                },

                expandTo: function(node) {
                    var parentNode = this._parents(node),
                        length = parentNode.length,
                        i = 0;

                    node = node instanceof fly.data.Node ? node : this.dataSource.get(
                        node);

                    for (; i < length; i++) {
                        node[i].set("expanded", true);
                    }
                },

                _renderItem: function(e) {
                    e.group || (e.group = {});
                    e.treeview = this.options;
                    e.r = this.templates;
                    return this.templates.item(e);
                },

                _renderGroup: function(e) {
                    var t = this;
                    e.renderItems = function(e) {
                        var n = "",
                            i = 0,
                            r = e.items,
                            o = r ? r.length : 0,
                            a = e.group;
                        for (a.length = o; o > i; i++) e.group =
                            a, e.item = r[i], e.item.index = i,
                            n += t._renderItem(e);
                        return n
                    };
                    e.r = t.templates;
                    return t.templates.group(e);
                }

            });

            function contentChild(selector) {
                return function(target) {
                    var dom = target.children(".animation-container");
                    if (!dom.length) {
                        dom = target;
                    }
                    return dom.children(selector);
                }
            }

            function templateNoWith(template) {
                return fly.template(template)
            }

            function findCheckboxes(e) {
                return e.find("> div .checkbox [type=checkbox]")
            }

            function insertAction(e) {
                return function(t, n) {
                    n = n.closest(NODE);
                    var i, r = n.parent();
                    return r.parent().is("li") && (i = r.parent()),
                        this._dataSourceMove(t, r, i, function(t, i) {
                            return this._insert(t.data(), i, n.index() +
                                e)
                        })
                }
            }

            function moveContents(t, n) {
                for (var i; t && "ul" != t.nodeName.toLowerCase();) i = t,
                    t = t.nextSibling, 3 == i.nodeType && (i.nodeValue = e.trim(
                        i.nodeValue)), p.test(i.className) ? n.insertBefore(
                        i, n.firstChild) : n.appendChild(i)
            }

            function updateNodeHtml(t) {
                var n = t.children("div"),
                    i = t.children("ul"),
                    r = n.children(".icon"),
                    o = t.children(":checkbox"),
                    s = n.children(".in");
                t.hasClass("treeview") || (n.length || (n = $("<div />").prependTo(
                        t)), !r.length && i.length ? r = $(
                        "<span class='icon' />").prependTo(n) : i.length &&
                    i.children().length || (r.remove(), i.remove()), o.length &&
                    $("<span class='checkbox' />").appendTo(n).append(
                        o), s.length || (s = t.children("a").eq(0).addClass(
                            "in"), s.length || (s = $(
                            "<span class='in' />")), s.appendTo(n), n
                        .length && moveContents(n[0].nextSibling, s[0])))
            }

            /*
function TreeViewDragAndDrop(e) {
    var t = this;
    t.treeview = e, t.hovered = e.element, t._draggable = new g
        .Draggable(e.element, {
            filter: "div:not(.state-disabled) .in",
            hint: function(t) {
                return e.templates.dragClue({
                    item: e.dataItem(t),
                    treeview: e.options
                })
            },
            cursorOffset: {
                left: 10,
                top: fly.support.mobileOS ? -40 / fly.support.zoomLevel() : 10
            },
            dragstart: proxy(t.dragstart, t),
            dragcancel: proxy(t.dragcancel, t),
            drag: proxy(t.drag, t),
            dragend: proxy(t.dragend, t),
            $angular: e.options.$angular
        })
}

TreeViewDragAndDrop.prototype = {
    _removeTouchHover: function() {
        var e = this;
        fly.support.touch && e.hovered && (e.hovered.find("." +
            STATEHOVER).removeClass(STATEHOVER), e.hovered = !1)
    },
    _hintStatus: function(n) {
        var i = this._draggable.hint.find(".drag-status")[
            0];
        return n ? (i.className = "icon drag-status " +
            n, t) : $.trim(i.className.replace(
            /(icon|drag-status)/g, ""))
    },
    dragstart: function(t) {
        var n = this,
            i = n.treeview,
            r = n.sourceNode = t.currentTarget.closest(NODE);
        i.trigger(DRAGSTART, {
            sourceNode: r[0]
        }) && t.preventDefault(), n.dropHint = $(
            "<div class='drop-hint' />").css(VISIBILITY,
            "hidden").appendTo(i.element)
    },
    drag: function(t) {
        var n, i, r, o, a, s, l, c, d, u, h = this,
            p = h.treeview,
            g = h.sourceNode,
            m = h.dropTarget = $(fly.eventTarget(t)),
            v = m.closest(".treeview");
        v.length ? $.contains(g[0], m[0]) ? n = "denied" :
            (n = "insert-middle", i = m.closest(
                    ".top,.mid,.bot"), i.length ? (o =
                    i.outerHeight(), a = fly.getOffset(i).top,
                    s = m.closest(".in"), l = o / (s.length >
                        0 ? 4 : 2), c = a + l > t.y.location,
                    d = t.y.location > a + o - l, h._removeTouchHover(),
                    u = s.length && !c && !d, h.hovered = u ?
                    v : !1, h.dropHint.css(VISIBILITY, u ? "hidden" :
                        "visible"), s.toggleClass(STATEHOVER, u), u ?
                    n = "add" : (r = i.position(), r.top +=
                        c ? 0 : o, h.dropHint.css(r)[c ?
                            "prependTo" : "appendTo"](m.closest(
                            NODE).children("div:first")), c &&
                        i.hasClass("top") && (n =
                            "insert-top"), d && i.hasClass(
                            "bot") && (n =
                            "insert-bottom"))) : m[0] !=
                h.dropHint[0] && (n = v[0] != p.element[0] ?
                    "add" : "denied")) : (n =
                "denied", h._removeTouchHover()), p.trigger(
                DRAG, {
                    sourceNode: g[0],
                    dropTarget: m[0],
                    pageY: t.y.location,
                    pageX: t.x.location,
                    statusClass: n.substring(2),
                    setStatusClass: function(e) {
                        n = e
                    }
                }), 0 !== n.indexOf("insert") && h.dropHint
            .css(VISIBILITY, "hidden"), h._hintStatus(n)
    },
    dragcancel: function() {
        this.dropHint.remove()
    },
    dragend: function() {
        function $(e) {
            a.updateIndeterminate(), a.trigger(DRAGEND, {
                sourceNode: e && e[0],
                destinationNode: n[0],
                dropPosition: s
            })
        }
        var n, i, r, o = this,
            a = o.treeview,
            s = "over",
            l = o.sourceNode,
            c = o.dropHint,
            d = o.dropTarget;
        return "visible" == c.css(VISIBILITY) ? (s = c.prevAll(
                    ".in").length > 0 ? "after" :
                "before", n = c.closest(NODE)) : d && (n = d.closest(
                ".treeview .item"), n.length || (n =
                d.closest(".treeview"))), i = {
                sourceNode: l[0],
                destinationNode: n[0],
                valid: "denied" != o._hintStatus(),
                setValid: function(e) {
                    this.valid = e
                },
                dropTarget: d[0],
                dropPosition: s
            }, r = a.trigger(DROP, i), c.remove(), o._removeTouchHover(), !
            i.valid || r ? (o._draggable.dropped = i.valid,
                t) : (o._draggable.dropped = !0, "over" ==
                s ? a.append(l, n, e) : ("before" == s ? l =
                    a.insertBefore(l, n) : "after" == s &&
                    (l = a.insertAfter(l, n)), $(l)), t)
    },
    destroy: function() {
        this._draggable.destroy()
    }
}
*/

            register(Tree);
            module.exports = Tree;

        }, {
            "./fly.core": 9,
            "./fly.data": 10,
            "./fly.template": 28,
            "./fly.ui": 32
        }
    ],
    32: [
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
                $ = fly.$,
                NS = fly.NS,
                slice = [].slice;

            var STRING = 'string',
                FUNCTION = 'function',
                ROLE = 'role',
                HANDLER = 'handler';

            var ui = {
                roles: {},
                defaults: {}
            };

            ui.Widget = Observable.extend({

                ctor: function(element, options, cache) {
                    var that = this,
                        name = that.name || '',
                        dataSource;

                    options = options || {};

                    that.element = $(element);
                    that._super();

                    dataSource = options.dataSource || null;

                    if (dataSource) {
                        options = $.extend({}, options, {
                            dataSource: {}
                        });
                    }

                    options = that.options = $.extend(true, {}, that.options, options);

                    if (dataSource) {
                        options.dataSource = dataSource;
                    }

                    if (cache !== false) {
                        that.element.data(ROLE, name.toLowerCase());
                        that.element.data(HANDLER, that);
                        that.element.data(NS + name, that);
                    }

                    that.bind(that.events, options);
                },

                events: [],

                options: {
                    prefix: ''
                },

                _hasBindingTarget: function() {
                    return !!this.element[0].flyBindingTarget;
                },

                _tabindex: function(target) {
                    target = target || this.wrapper;

                    var element = this.element,
                        TABINDEX = 'tabindex',
                        tabindex = target.attr(TABINDEX) || element.attr(TABINDEX);

                    element.removeAttr(TABINDEX);

                    target.attr(TABINDEX, !isNaN(tabindex) ? tabindex : 0);
                },

                setOptions: function(options) {
                    this._setEvents(options);
                    $.extend(this.options, options);
                },

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

                getSize: function() {
                    return {
                        width: this.element.width(),
                        height: this.element.height()
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

                destroy: function() {
                    var that = this;

                    that.element.removeData(that.name);
                    that.element.removeData(HANDLER);
                    that.unbind();
                },

                angular: function() {}
            });

            ui.DataBoundWidget = ui.Widget.extend({

                dataItems: function() {
                    return this.dataSource.view();
                },

                _angularItems: function(cmd) {
                    var that = this;
                    that.angular(cmd, function() {
                        return {
                            elements: that.items(),
                            data: $.map(that.dataItems(), function(dataItem) {
                                return {
                                    dataItem: dataItem
                                };
                            })
                        };
                    });
                }
            });

            ui.register = function(widget, register) {
                var name = widget.fn.name,
                    getter;

                register = register || fly.ui;
                register[name] = widget;
                register.roles[name.toLowerCase()] = widget;

                getter = 'getFly' + name;
                name = NS + name;

                $.fn[name] = function(options) {
                    var value = this,
                        args;

                    options = options || {};

                    if (typeof options === STRING) {
                        args = slice.call(arguments, 1);

                        this.each(function() {
                            var widget = $.data(this, name),
                                method,
                                result;

                            if (!widget) {
                                throw new Error('Cannot call method "' + options + '" of ' +
                                    name + ' before it is initialized');
                            }

                            method = widget[options];

                            if (typeof method !== FUNCTION) {
                                throw new Error('Cannot find method "' + options + '" of ' +
                                    name);
                            }

                            result = method.apply(widget, args);

                            if (result !== undefined) {
                                value = result;
                                return false;
                            }
                        });
                    } else {
                        this.each(function() {
                            new widget(this, options);
                        });
                    }

                    return value;
                };

                $.fn[name].widget = widget;

                $.fn[getter] = function() {
                    return this.data(name);
                };
            };

            ui.initWidget = function(element, options, roles) {
                var result,
                    option,
                    widget,
                    idx,
                    length,
                    role,
                    value,
                    dataSource,
                    fullPath,
                    widgetKeyRegExp;

                if (!roles) {
                    roles = fly.ui.roles;
                } else if (roles.roles) {
                    roles = roles.roles;
                }

                element = element.nodeType ? element : element[0];

                role = element.getAttribute('data-role');

                if (!role) {
                    return;
                }

                widget = roles[role];

                var data = $(element).data(),
                    name = widget.fn.name,
                    widgetKey = widget ? 'fly' + name : '';

                widgetKeyRegExp = new RegExp("^" + widgetKey + "$", "i");

                for (var key in data) {
                    if (key.match(widgetKeyRegExp)) {
                        // we have detected a widget of the same kind - save its reference, we will set its options
                        if (key === widgetKey) {
                            result = data[key];
                        } else {
                            return data[key];
                        }
                    }
                }

                if (!widget) {
                    return;
                }

                dataSource = utils.parseOption(element, 'dataSource');

                options = $.extend({}, utils.parseEleOptions(element, widget.fn.options),
                    options);

                if (dataSource) {
                    if (typeof dataSource === STRING) {
                        options.dataSource = fly.getter(dataSource)(window);
                    } else {
                        options.dataSource = dataSource;
                    }
                }

                for (idx = 0, length = widget.fn.events.length; idx < length; idx++) {
                    option = widget.fn.events[idx];

                    value = utils.parseOption(element, option);

                    if (value !== undefined) {
                        options[option] = fly.getter(value)(window);
                    }
                }

                if (!result) {
                    result = new widget(element, options);
                } else if (!$.isEmptyObject(options)) {
                    result.setOptions(options);
                }

                return result;
            };

            fly.ui = ui;
            module.exports = ui;

        }, {
            "./fly.core": 9,
            "./fly.observable": 23,
            "./fly.utils": 34
        }
    ],
    33: [
        function(require, module, exports) {
            return {};

        }, {}
    ],
    34: [
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
            var $ = fly.$;

            // 工具类库
            var utils = fly.utils || {};

            // 用来检测类型，例如 objectToString.call(value) => "[object Date]"
            var objectToString = {}.toString;

            // 不换行空格，例如&nbsp;
            var nonBreakingSpaceRegExp = /\u00A0/g;

            // 科学计数法
            var exponentRegExp = /[eE][\-+]?[0-9]+/;

            var shortTimeZoneRegExp = /[+|\-]\d{1,2}/,
                longTimeZoneRegExp = /[+|\-]\d{1,2}:?\d{2}/,
                dateRegExp = /^\/Date\((.*?)\)\/$/,
                dashRegExp = /([A-Z])/g,
                jsonRegExp = /^\s*(?:\{(?:.|\r\n|\n)*\}|\[(?:.|\r\n|\n)*\])\s*$/,
                jsonFormatRegExp = /^\{(\d+)(:[^\}]+)?\}|^\[[A-Za-z_]*\]$/,
                numberRegExp = /^(\+|-?)\d+(\.?)\d*$/;

            var offsetRegExp = /[+-]\d*/;

            var formatsSequence = ['G', 'g', 'd', 'F', 'D', 'y', 'm', 'T', 't'];

            /**
             * 获取URL中的参数值
             * @param  {String} name 参数名
             * @return {String} 参数值，若没有该参数，则返回''
             */
            utils.getQueryString = function(name) {
                var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
                var r = window.location.search.substr(1).match(reg);
                if (r != null) {
                    return unescape(r[2]);
                }
                return '';
            };

            /**
             * 获取时间戳
             */
            utils.now = Date.now || function() {
                return new Date().getTime();
            };

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
            utils.throttle = function(func, wait, options) {
                var context, args, result;
                var timeout = null;
                var previous = 0;
                if (!options) options = {};
                var later = function() {
                    previous = options.leading === false ? 0 : utils.now();
                    timeout = null;
                    result = func.apply(context, args);
                    if (!timeout) context = args = null;
                };
                return function() {
                    var now = utils.now();
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
            utils.debounce = function(func, wait, immediate) {
                var timeout, args, context, timestamp, result;

                var later = function() {
                    var last = utils.now() - timestamp;
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
                    timestamp = utils.now();
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
             * 检查元素是否在视野中
             * @param  {Element} element 需要检查的元素
             * @param  {Object}  options 设置选项，可以设置顶部和左边的偏移量
             * @return {Boolean} 在当前视野中，返回true；否则返回false
             */
            utils.isInView = function(element, options) {
                var $element = $(element);

                if (!$element.is(':visible')) {
                    return false;
                }

                var windowLeft = fly.$win.scrollLeft(),
                    windowTop = fly.$win.scrollTop(),
                    windowWidth = fly.$win.width(),
                    windowHeight = fly.$win.height(),
                    width = $element.width(),
                    height = $element.height(),
                    offset = $element.offset(),
                    left = offset.left,
                    top = offset.top;

                options = $.extend({
                    top: 0,
                    left: 0
                }, options);

                // 下边缘在屏幕顶部以下
                // 上边缘在屏幕底部以上
                // 右边缘在屏幕左部以右
                // 左边缘在屏幕右部以左
                if (top + height >= windowTop &&
                    top - options.top <= windowTop + windowHeight &&
                    left + width >= windowLeft &&
                    left - options.left <= windowLeft + windowWidth) {
                    return true;
                } else {
                    return false;
                }
            };

            /**
             * 处理url
             * @param   {String} url 原始url
             * @returns {String} 完整url
             */
            utils.url = function(url) {
                var path = typeof(CONTEXTPATH) == 'undefined' ? '' : CONTEXTPATH;

                if (!url) return '';

                if (url.indexOf('http://') == 0 || url.indexOf('https://') == 0 || url.indexOf(
                        '//') == 0 || (path && url.indexOf(path) == 0)) {
                    return url;
                } else {
                    return path + url;
                }
            };

            /**
             * 解析元素指定的属性值
             * @param   {Object} element 元素
             * @param   {String} option  属性
             * @returns {Any}    解析后的值
             */
            utils.parseOption = function(element, option) {
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
            utils.parseEleOptions = function(element, options) {
                var result = {},
                    option,
                    value;

                for (option in options) {
                    value = utils.parseOption(element, option);

                    if (value !== undefined) {
                        /*if (templateRegExp.test(option)) {
                value = fly.template($("#" + value).html());
            }*/
                        result[option] = value;
                    }
                }

                return result;
            };

            /**
             * 计算字符串的字节长度
             * @param   {String} str 需要计算长度的字符串
             * @returns {Number} 字节长度
             */
            utils.getByteLen = function(str) {
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
             * 在输入框中选取字符
             * @param   {Number} start [[Description]]
             * @param   {Number} end   [[Description]]
             * @returns {Object} document
             */
            utils.selectRange = function(start, end) {
                var ele = this[0] || this;
                if (ele.createTextRange) {
                    var range = ele.createTextRange();
                    range.collapse(true);
                    range.moveEnd('character', end);
                    range.moveStart('character', start);
                    range.select();
                } else {
                    ele.focus();
                    ele.setSelectionRange(start, end);
                }
                return ele;
            };

            /**
             * POST发送数据
             * @param   {String}   url  数据接口
             * @param   {Object}   data 需要传输的数据
             * @param   {String}   type 接收数据的方式
             * @returns {Function} jQuery Ajax
             */
            utils.post = function(url, data, type) {
                type = type || 'json';
                return $.ajax({
                    url: utils.url(url),
                    data: data || {},
                    dataType: type || 'json',
                    type: 'POST'
                });
            };

            /**
             * GET请求数据
             * @param   {String}   url  数据接口
             * @param   {Object}   data 需要传输的数据
             * @param   {String}   type 接收数据的方式
             * @returns {Function} jQuery Ajax
             */
            utils.get = function(url, data, type) {
                type = type || 'json';
                return $.ajax({
                    url: utils.url(url),
                    cache: false,
                    data: data || {},
                    dataType: type || 'json',
                    type: 'GET'
                });
            };

            /**
             * 获取最高层级的window
             * @returns {Object} 引用flyui的最高层级的window对象
             */
            fly.top = function() {
                var top = window,
                    test = function(name) {
                        try {
                            var doc = window[name].document; // 跨域|无权限
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
             * 销毁vm绑定的组件
             * @param {Object} element
             */
            fly.destroy = function(element) {
                $(element).find('[data-role]').addBack().each(function() {
                    var data = $(this).data();
                    for (var key in data) {
                        if (key.indexOf(fly.NS) === 0 && typeof data[key].destroy ===
                            FUNCTION) {
                            data[key].destroy();
                        }
                    }
                });
            };

            /**
             * 获取计算后的样式
             * @param   {Object} element    DOM
             * @param   {Array}  properties 属性
             * @returns {Object} 样式对象
             */
            fly.getComputedStyles = function(element, properties) {
                var defaultView = document.defaultView,
                    styles = {},
                    computedStyle;

                if (defaultView && defaultView.getComputedStyle) {
                    computedStyle = defaultView.getComputedStyle(element, "");

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

            /**
             * 是否支持滚动条
             * @param   {Object}  element DOM
             * @returns {Boolean} 是则支持，否则不支持
             */
            fly.isScrollable = function(element) {
                return fly.getComputedStyles(element, ["overflow"]).overflow != "visible";
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
             * 插入字符
             * @param   {Object} element DOM
             * @param   {Number} start   开始位置
             * @param   {Number} end     结束位置
             * @returns {Array}  [[Description]]
             */
            fly.caret = function(element, start, end) {
                var rangeElement;
                var isPosition = start !== undefined;

                if (end === undefined) {
                    end = start;
                }

                if (element[0]) {
                    element = element[0];
                }

                if (isPosition && element.disabled) {
                    return;
                }

                try {
                    if (element.selectionStart !== undefined) {
                        if (isPosition) {
                            element.focus();
                            element.setSelectionRange(start, end);
                        } else {
                            start = [element.selectionStart, element.selectionEnd];
                        }
                    } else if (document.selection) {
                        if ($(element).is(":visible")) {
                            element.focus();
                        }

                        rangeElement = element.createTextRange();

                        if (isPosition) {
                            rangeElement.collapse(true);
                            rangeElement.moveStart("character", start);
                            rangeElement.moveEnd("character", end - start);
                            rangeElement.select();
                        } else {
                            var rangeDuplicated = rangeElement.duplicate(),
                                selectionStart, selectionEnd;

                            rangeElement.moveToBookmark(document.selection.createRange().getBookmark());
                            rangeDuplicated.setEndPoint('EndToStart', rangeElement);
                            selectionStart = rangeDuplicated.text.length;
                            selectionEnd = selectionStart + rangeElement.text.length;

                            start = [selectionStart, selectionEnd];
                        }
                    }
                } catch (e) {
                    start = [];
                }

                return start;
            };

            fly.utils = utils;
            module.exports = utils;
        }, {
            "./fly.core": 9
        }
    ],
    35: [
        function(require, module, exports) {
            /**
             * 数据校验
             * @author: huanzhang
             * @email: huanzhang@iflytek.com
             * @update:
             */

            'use strict';

            // 依赖core
            var fly = require('./fly.core'),
                utils = require('./fly.utils'),
                calc = require('./fly.calculate'),
                format = require('./fly.format'),
                $ = fly.$;

            // 验证库
            var REGEXP = {
                EMAIL: "^[a-z0-9._%-]+@([a-z0-9-]+\\.)+[a-z]{2,4}$",
                NUMBER: "^\\-?\\d+(\\.\\d+)?$",
                URL: "^(http|https|ftp)\\:\\/\\/[a-z0-9\\-\\.]+\\.[a-z]{2,3}(:[a-z0-9]*)?\\/?([a-z0-9\\-\\._\\?\\,\\'\\/\\\\\\+&amp;%\\$#\\=~])*$",
                TEL: "^1\\d{10}$",
                ZIPCODE: "^\\d{6}$"
            };

            // 提示语
            var PROMPT = {
                radio: '请选择一个选项',
                checkbox: '如果要继续，请选中此框',
                select: '请选择列表中的一项',
                email: '请输入电子邮件地址',
                url: '请输入网站地址',
                tel: '请输入手机号码',
                number: '请输入数值',
                date: '请输入日期',
                pattern: '内容格式不符合要求',
                empty: '请填写此字段',
                multiple: '多条数据使用逗号分隔'
            };

            var UNDEFINED = 'undefined',
                NUMBER = 'number',
                FUNCTION = 'function',
                STRING = 'string';

            var specialChars = /\W+$/;

            var showTooltip = true;

            var isRegExp = function(valid) {
                var ele = $(this),
                    value = $.trim(ele.val()),
                    type = valid.type || ele.attr('type'),
                    regex = valid.pattern;

                // 获取正则表达式，pattern属性获取优先，然后通过type类型匹配。
                // 注意，不处理为空的情况
                regex = regex || (function() {
                    return ele.attr('pattern');
                })() || (function() {
                    // 文本框类型处理，可能有管道符——多类型重叠，如手机或邮箱
                    return type && $.map(type.split('|'), function(typeSplit) {
                        var matchRegex = REGEXP[typeSplit.toUpperCase()];
                        if (matchRegex) return matchRegex;
                    }).join('|');
                })();

                // 若值为空或正则为空
                if (value === '' || !regex) return true;

                // multiple多数据的处理
                var isMultiple = !!$(ele).attr('multiple'),
                    newRegExp = new RegExp(regex);

                // number类型下multiple无效
                if (isMultiple && !/^number|range$/i.test(type)) {
                    var isAllPass = true;
                    $.each(value.split(','), function(i, partValue) {
                        partValue = $.trim(partValue);
                        if (isAllPass && !newRegExp.test(partValue)) {
                            isAllPass = false;
                        }
                    });
                    return isAllPass;
                } else {
                    return newRegExp.test(value);
                }
            };

            var tooltip = function(ele, content) {
                if (!showTooltip) return;

                if (fly.validateTip) {
                    fly.validateTip(content);
                    return;
                }

                var widget = ele.closest('.widget');
                ele = widget.length ? widget : ele;
                ele.flyTooltip && ele.flyTooltip({
                    content: content
                });
            };

            var isEmpty = function(value) {
                var ele = $(this),
                    trimValue = ele.val();

                value = value || ele.attr('placeholder');

                if (ele.attr('type') !== 'password') {
                    trimValue = $.trim(trimValue);
                }

                if (trimValue === '' || trimValue === value) {
                    return true;
                }

                return false;
            };

            var isOverflow = function(valid) {
                var ele = $(this);
                if (!ele) return false;

                var value = ele.val(),
                    step = ele.attr('step'),
                    type = ele.data('type') || ele.attr('type'),
                    min = ele.attr('min'),
                    max = ele.attr('max');

                valid = valid || {};

                if (typeof(valid.min) !== UNDEFINED) min = valid.min;
                if (typeof(valid.max) !== UNDEFINED) max = valid.max;
                if (typeof(valid.step) !== UNDEFINED) step = valid.step;
                if (typeof(valid.type) !== UNDEFINED) type = valid.type;

                if (type === NUMBER) {
                    if (typeof(min) !== UNDEFINED && value < min) {
                        tooltip(ele, '值必须大于或等于' + min);
                    } else if (typeof(max) !== UNDEFINED && value > max) {
                        tooltip(ele, '值必须小于或等于' + max);
                    } else if (typeof(step) !== UNDEFINED && !
                        /^\d+$/.test(calc.div(Math.abs(calc.sub(value, min || 0)), step))) {
                        tooltip(ele, '值无效');
                    } else {
                        return false;
                    }
                    ele.focus();
                    ele.select();
                } else {
                    if (typeof(min) !== UNDEFINED && value.length < min) {
                        tooltip(ele, '至少输入' + min + '个字符');
                        ele.focus();
                    } else if (typeof(max) !== UNDEFINED && value.length > max) {
                        tooltip(ele, '最多输入' + max + '个字符');
                        utils.selectRange.call(ele, max, value.length);
                    } else {
                        return false;
                    }
                }

                return true;
            };

            var customValid = function(valid) {
                var ele = $(this),
                    value = ele.val(),
                    check = valid.check;

                if (typeof(check) === FUNCTION) {
                    return check.call(ele);
                }

                return true;
            };

            var remind = function(valid, tag) {

                var control = $(this),
                    type = valid.type,
                    key = valid.key || control.data('key'),
                    text = valid.title || $.trim(control.closest('.widget').children(
                        '.label').text()).replace(
                        /\*/ig, '').replace(/＊/ig, '').replace(/：/ig, '').replace(/:/ig, ''),
                    placeholder;

                // 如果元素完全显示
                if ($(control).is(':visible')) {
                    if (type == 'radio' || type == 'checkbox') {
                        tooltip(control, PROMPT[type]);
                        control.focus();
                    } else if (tag == 'select' || tag == 'empty') {
                        // 下拉值为空或文本框文本域等为空
                        tooltip(control, (tag == 'empty' && text) ? '您尚未输入' + text : PROMPT[
                            tag]);
                        control.focus();
                    } else if (/^range|number$/i.test(type) && Number(control.val())) {
                        // 整数值与数值的特殊提示
                        tooltip(control, '值无效');
                        control.focus();
                        control.select();
                    } else {
                        // 文本框文本域格式不准确
                        // 提示文字的获取	
                        var finalText = PROMPT[type] || PROMPT['pattern'];
                        if (text) {
                            finalText = '您输入的' + text + '格式不准确';
                        }
                        if (type != 'number' && !!control.attr('multiple')) {
                            finalText += "，" + PROMPT["multiple"];
                        }

                        tooltip(control, finalText);
                        control.focus();
                        control.select();
                    }
                } else {
                    // 元素隐藏，寻找关联提示元素, 并走label提示流(radio, checkbox除外)
                    var selector = control.data('target'),
                        target = typeof selector == STRING ? $((document.getElementById(
                            selector) ? '#' : '.') + selector) : selector,
                        customTxt = '您尚未' + (key || (tag == 'empty' ? '输入' : '选择')) + ((!
                            /^radio|checkbox$/i.test(type) && text) || '该项内容'),
                        offset;
                    if (target && target.length) {
                        tooltip(target, customTxt);
                    } else {
                        // alert
                        //fly.tip(customTxt);
                    }
                }
                return false;
            };

            var validate = function(ele, valid, hasTooltip) {
                ele = $(ele);
                if (ele.length === 0) {
                    return true;
                }

                valid = valid || {};
                showTooltip = hasTooltip === false ? false : true;

                var type = valid.type || ele.data('type') || ele.attr('type'),
                    tag = ele[0].tagName,
                    required = valid.required || !!ele.attr('required'),
                    target = valid.target || ele.attr('mind-target'),
                    accept = target ? $('[mind-accept="' + target + '"]') : null,
                    name = ele.attr('name'),
                    isPass = true;

                // 禁用字段不验证
                // 或target是禁用状态也不验证
                if (ele.is(':disabled') || (accept && accept.is(':disabled'))) {
                    return true;
                }

                // 无需验证的状态
                if (type == 'submit' || type == 'reset' || type == 'file' || type ==
                    'image') {
                    return true;
                }

                // 需要验证的有
                // input文本框, type, required, pattern, max, min
                // radio, checkbox
                // select
                // textarea
                if ((type == 'radio' || type == 'checkbox') && required) {
                    // 单选框和复选框，只需验证是否必选
                    var eles = name ? $('input[type="' + type + '"][name="' + name + '"]') :
                        ele,
                        pass = false;

                    eles.each(function() {
                        if (pass == false && $(this).is(':checked')) {
                            pass = true;
                            return;
                        }
                    });

                    if (pass == false) {
                        isPass = remind.call(eles.get(0), type, tag);
                    }
                } else if (tag == 'select' && required && !ele.val()) {
                    // 下拉框只要关心值
                    isPass = remind.call(ele, valid, tag);
                } else if (required && isEmpty.call(ele)) {
                    // 空值
                    // 需要判断当前控件的类型
                    remind.call(ele, valid, 'empty');
                    isPass = false;
                } else if (!isRegExp.call(ele, valid)) {
                    // 各种类型文本框以及文本域
                    // allpass为true表示是为空，为false表示验证不通过
                    remind.call(ele, valid, tag);
                    isPass = false;
                } else if (isOverflow.call(ele, valid)) {
                    // 最大值最小值, 个数是否超出的验证
                    isPass = false;
                } else if (!customValid.call(ele, valid)) {
                    // 最后校验 自定义校验
                    isPass = false;
                    ele.focus();
                }

                ele.toggleClass('error', !isPass);

                return isPass;
            };

            fly.validate = validate;
            module.exports = validate;

        }, {
            "./fly.calculate": 5,
            "./fly.core": 9,
            "./fly.format": 17,
            "./fly.utils": 34
        }
    ],
    36: [
        function(require, module, exports) {
            'use strict';

            var fly = {};

            fly = require('./fly.core');
            require('./fly.binder');
            require('./fly.calculate');
            require('./fly.class');
            require('./fly.data');
            require('./fly.drag');
            require('./fly.format');
            require('./fly.legacy');
            require('./fly.model');
            require('./fly.observable');
            require('./fly.router');
            require('./fly.template');
            require('./fly.ui');
            require('./fly.utils');
            require('./fly.validate');
            require('./fly.alert');
            require('./fly.button');
            require('./fly.calender');
            require('./fly.combobox');
            require('./fly.datepicker');
            require('./fly.dialog');
            require('./fly.dropdownlist');
            require('./fly.dropdowntree');
            require('./fly.form');
            require('./fly.list');
            require('./fly.pagination');
            require('./fly.popup');
            require('./fly.textbox');
            require('./fly.tooltip');
            require('./fly.tree');
            require('./fly.upload');
            require('./fly.accordion');
            require('./fly.grid');
            require('./fly.lightbox');
            require('./fly.tab');

            module.exports = fly;

        }, {
            "./fly.accordion": 1,
            "./fly.alert": 2,
            "./fly.binder": 3,
            "./fly.button": 4,
            "./fly.calculate": 5,
            "./fly.calender": 6,
            "./fly.class": 7,
            "./fly.combobox": 8,
            "./fly.core": 9,
            "./fly.data": 10,
            "./fly.datepicker": 11,
            "./fly.dialog": 12,
            "./fly.drag": 13,
            "./fly.dropdownlist": 14,
            "./fly.dropdowntree": 15,
            "./fly.form": 16,
            "./fly.format": 17,
            "./fly.grid": 18,
            "./fly.legacy": 19,
            "./fly.lightbox": 20,
            "./fly.list": 21,
            "./fly.model": 22,
            "./fly.observable": 23,
            "./fly.pagination": 24,
            "./fly.popup": 25,
            "./fly.router": 26,
            "./fly.tab": 27,
            "./fly.template": 28,
            "./fly.textbox": 29,
            "./fly.tooltip": 30,
            "./fly.tree": 31,
            "./fly.ui": 32,
            "./fly.upload": 33,
            "./fly.utils": 34,
            "./fly.validate": 35
        }
    ]
}, {}, [36]);