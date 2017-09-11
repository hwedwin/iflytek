
    var siglesel = fly.ui.Widget.extend({
        name: 'siglesel',
        options: {
            autoBind: true,
            textField: 'text',
            valueField: 'value',
            optionLabel: '全选',
            itemTemplate: '',
            index: null
        },

        events: ['change'],

        ctor: function (element, options) {
            var that = this;
            that._super(element, options);
            that._dataSource();
            that._template();
            if (that.options.autoBind) {
                that.dataSource.fetch();
            }
            //逐个选中
            that.element.on('click', 'span[data-uid]', function () {
                var uid = $(this).data('uid'),
                    item = that.dataSource.get(uid, 'uid');
                that.value(item[that.options.valueField]);
                that.trigger('change');
            });
        },

        _template: function () {
            var options = this.options;
            this.itemTemplate = fly.template(
                options.itemTemplate ||
                '<span {{if checked}}class="checked"{{/if}} data-uid="{{uid}}" title="{{' + options.textField + '}}"><i class="ico ico-sigle"></i><span>{{' + options.textField + '}}</span></span>');
        },

        _dataSource: function () {
            var that = this,
                dataSource = that.options.dataSource || {};

            if (that.dataSource && that._refreshHandle) {
                that._unbindDataSource();
            } else {
                that._refreshHandle = $.proxy(that.refresh, that);
            }

            that.dataSource = fly.data.DataSource.create(dataSource)
                .bind("change", that._refreshHandle)
                .one('change', function () {
                    that.value(that.dataSource._values ? that.dataSource._values : '');
                });
        },

        setDataSource: function (dataSource) {
            this.options.dataSource = dataSource;
            this._dataSource();
            if (this.options.autoBind) {
                this.dataSource.fetch();
            }
        },

        _unbindDataSource: function () {
            var that = this;

            that.dataSource
                .unbind("change", that._refreshHandle);
        },

        refresh: function (e) {
            var that = this,
                html = '',
                datas = this.dataSource.view();
            datas.forEach(function (item) {
                html += that.itemTemplate(item);
            });
            that.element.html(html);
        },

        value: function (val, isChecked) {
            var that = this;
            if (val === undefined) {
                return this._selectItem ? this._selectItem[this.options.valueField] : '';
            } else {
                this.dataSource._values = val;
                var selectedItem = val;
                    selectedItem = this.dataSource.get(val, this.options.valueField);
                if (selectedItem && !this.options.unCheck) {
                    this._selectItem && this._selectItem.set('checked', false);
                    selectedItem.set('checked', true);
                    this._selectItem = selectedItem;
                }else if(selectedItem && this.options.unCheck){
                    this._selectItem && this._selectItem.set('checked', false);
                    selectedItem.set('checked', !isChecked);
                    this._selectItem = selectedItem;
                }
            }
        }
    });
    fly.ui.register(siglesel);