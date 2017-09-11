
    var multisel = fly.ui.Widget.extend({
        name: 'multisel',
        options: {
            autoBind: true,
            textField: 'text',
            valueField: 'value',
            optionLabel: '全选',
            itemTemplate: '',
            value:'',
            index: null,
            checkall:false,
            unCheck: true,
            flag: true,
            split:','
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
            this.checkparent = $('<div class=\"filter\"></div>');
            this.checkall = $('<div class=\"check-all\"></div>');

            //逐个选中
            that.element.on('click', 'span[data-uid]', function () {
                var uid = $(this).data('uid'),
                	flag = $(this).parent().parent().data('flag'),
                    item = that.dataSource.get(uid, 'uid'),
                    total = that.dataSource._total,
                    numChecked = 0;
                if (that.options.flag === false || flag === false) {
                	return false;
                }

                item.set('checked', !item.checked);
                that.trigger('change');

                numChecked = that._totalItems();

                if(item.checked && numChecked === total){
                    //如果当前所有被全选了
                    that.checkall.addClass('checked');
                }
                if(!item.checked && numChecked != total){
                    that.checkall.removeClass('checked');
                }
            });
            //如果点击多选
            that.element.on('click', '.check-all', function () {
                var numChecked = that._totalItems(),
                    isCheckedAll = numChecked === that.dataSource._total ? true : false;

                for (var i = 0; i < that.dataSource._total; i++){
                    var values = that.options.dataSource._view[i][that.options.valueField];
                    if(isCheckedAll){
                        //只要当前是全选，则去全选
                        that.value(values, true);
                    }else{
                        //只要有一个没有被选中，则全选
                       that.value(values);
                    }
                }
                that.trigger('change');
                if(isCheckedAll){
                	that.element.find('.check-all').removeClass('checked');
                }else{
                    //如果当前所有被全选了
                	that.element.find('.check-all').addClass('checked');
                }
            })
        },

        _totalItems: function() {
            var that = this,
                total = that.dataSource._total,
                numChecked = 0;

            for(var i = 0; i < total; i++){
                if(that.dataSource._data[i].checked){
                    numChecked++;
                }
            }
            return numChecked;
        },

        _template: function () {
            var options = this.options;
            this.itemTemplate = fly.template(
                options.itemTemplate ||
                '<span {{if checked}}class="checked"{{/if}} data-value="{{' + options.valueField + '}}" data-uid="{{uid}}" title="{{' + options.textField + '}}">' +
                    '<i class="ico ico-multi"></i>' +
                    '<span>{{' + options.textField + '}}</span>' +
                '</span>');
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
                .one("change", function () {
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

        refresh: function () {
            var that = this,
                html = '',
                numCheck = '',
                datas = this.dataSource.view();
            datas.forEach(function (item) {
                html += that.itemTemplate(item);
            });
            that.element.html('<div class=\"filter-multi\">' + html + '</div>');
            if(that.options.checkall){
                that.element.prepend(this.checkall);
                that.element.find('.check-all').html('<i class=\"ico ico-multi\"></i><span>全选</span>');
            }
        },

        value: function (val, isChecked) {
            var that = this,
                options = that.options,
                datas = that.dataSource.view(),
                values = [];
            if (val === undefined) {
                var value = [];
                datas.forEach(function(item){
                    if (item.checked) {
                        value.push(item[options.valueField]);
                    }
                });
                return value.join(options.split);
            } else {
            	if(val === '' || val === null){
            		
//            		datas.forEach(function(item){
//            			if (item.checked) {
//            				item.set('checked',false);
//            				that.checkall.removeClass('checked')
//            			}
//            		});
            		for(var i=0;i<datas.length;i++){
            			if(datas[i]){
            				if(datas[i].checked){
                				datas[i].set('checked',false);
                				that.checkall.removeClass('checked');
                			}
            			}
            			
            		}
            		
            	} else {
                    this.dataSource._values = val;
                    values = val.split(options.split);
                    for (var i = 0; i < values.length; i++){
                        var val = values[i];
                        var selectedItem = val;
                        selectedItem = this.dataSource.get(val, this.options.valueField);
                        !this._selectItems ? this._selectItems = {} : this._selectItems;
                        if (selectedItem && !this.options.unCheck) {
                            selectedItem.set('checked', true);
                            this._selectItems[selectedItem['uid']]  = selectedItem[this.options.valueField];
                        }else if(selectedItem && this.options.unCheck){
                            selectedItem.set('checked', !isChecked);
                            !isChecked ?
                                this._selectItems[selectedItem['uid']] = selectedItem[this.options.valueField]
                                : delete this._selectItems[selectedItem['uid']] ;
                        }
                    }
                    if (that._totalItems() ==  that.dataSource._total) {
                    	that.checkall.addClass('checked');
                    }
            	}
            }
        }
    });
    fly.ui.register(multisel);
