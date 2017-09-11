require.config(requireConfig);
require(['jquery', 'fly'], function ($, fly) {
	fly.template.helper('formatDate', function (e, format) {
		//e为不满足格式的日期，format为格式
		date = new Date(e);
		var map = {
	        "M": date.getMonth() + 1, //月份
	        "d": date.getDate(), //日
	        "h": date.getHours(), //小时
	        "m": date.getMinutes(), //分
	        "s": date.getSeconds() //秒
	    };
	    format = format.replace(/([yMdhmsqS])+/g, function(all, t) {
	        var v = map[t];
	        if(v !== undefined){
	            if(all.length > 1){
	                v = '0' + v;
	                v = v.substr(v.length-2);
	            }
	            return v;
	        }
	        else if(t === 'y'){
	            return (date.getFullYear() + '').substr(4 - all.length);
	        }
	        return all;
	    });
	    return format;
	});
	var formData = {},
		vm = window.vm = fly.observable({
			allSelected: false,
			optionType: fly.dataSource({
				read: {
					url: 'http://localhost:8080/audit-backend/dictionary/getOptionType',
					dataType: 'json',
					type: 'GET',
					dataFilter: function(res) {
						var res = fly.evalJSON(res);
						if(res.length > 0) {
							return JSON.stringify(res);
						} else {
							fly.alert('操作类型数据请求失败');
						}
					}
				}
			}),
			system: fly.dataSource({
				read: {
					url: 'http://localhost:8080/audit-backend/dictionary/getBusinessSystem',
					dataType: 'json',
					type: 'GET',
					dataFilter: function(res) {
						var res = fly.evalJSON(res);
						if(res.length > 0) {
							return JSON.stringify(res);
						} else {
							fly.alert('业务系统数据请求失败');
						}
					}
				}
			}),
			tableData: fly.dataSource({
				read: {
					url: 'http://localhost:8080/audit-backend/listWarn/getListWarn',
					type: 'POST',
					dataType: 'json',
					dataFilter: function(res) {
						var res = fly.evalJSON(res),
							data = {
								rows: res.rows || [],
								total: res.total || 0
							}
						if(res.rows.length <= 0) {
							$('#gridList').html('<tr><td colspan="9">暂无数据</td></tr>');
						}
						//防止在全选的情况下选择页码后，全选还是被选中状态
						vm.set('allSelected', false);
						return JSON.stringify(data);
					}
				},
				pageSize: 5
			}).bind('change', function(e) {
			        var allChecked = true;
			        if (e.field === 'checked') {
			            this.view().forEach(function(item){
			                if (!item.checked) allChecked = false;
			            });
			            vm.set('allSelected', allChecked);
			        }
		    }),
			searchClick: function(e) {
				//按条件查询列表数据
				var $form = $('#formWrap').flyForm({}),
					data = $form.data('flyForm').data();
				formData = data;
				vm.tableData.options.read.data = formData;
				vm.tableData.page(1);
			},
			selectAll: function(e) {
				 $.each(this.tableData.view(), function () {
		            this.set('checked', e.target.checked);
		        });
			},
			selectItem: function(e) {
		        var item = e.handleObj.data;
		        item.set('checked', true);
		    },
		    deleteWarnInfo: function(e) {
		    	var data = [];
		    	$.each(this.tableData.view(), function (i, item) {
		            if(item.checked) {
		            	//将id传给后台，并将数据进行删除
		            	data.push(item.id);
		            }
		        });
		    	 //如果没有选中，直接返回，不进行删除操作
		    	if(data.length <= 0) {
		    		fly.alert({
	    				content: '请选择要删除的数据',
	    				css: 'info'
	    			});
		    		return;
		    	}
		    	top.fly.dialog({
					title: '删除名单预警信息',
					content: '确定要删除表格选中的数据吗',
					width: '300px',
					height: '100px',
					padding: '25px',
					backdropOpacity: 0.3,
					okValue: '确定',
		            ok: function() {
		            	data = {ids: data};
		                $.ajax({
							type: "GET",
							url: "http://localhost:8080/audit-backend/listWarn/deleteListWarn",
							data: data,
							success: function(res) {
								res = fly.evalJSON(res);
								if(res.code == '1') {
			            			vm.tableData.page(1);
									fly.alert("数据已删除");
								} else {
									fly.alert("数据删除失败");
								}
							}
						});
		            },
		            cancelValue: '取消',
		            cancel: function() {}
				});
		    },
		    addWarnInfo: function(e) {
		    	top.fly.dialog({
					id: 'dialogAdd',
					title: '新增名单预警信息',
					url: '/views/add-warn-info.html',
					width: '800px',
					height: '380px',
					padding: '25px',
					backdropOpacity: 0.3
				}).bind('refresh', function(e) {
					fly.alert({
						content: '数据添加成功',
						css: 'success'
					});
					//重置页码，刷新列表,page会自动调用read函数，且会携带表单的查询条件
					vm.tableData.page(1);
				});
		    },
		    eaditClick: function(e) {
		    	//将id传递到编辑框，编辑框根据id获取所有信息
		    	var item = e.handleObj.data;
		    	top.fly.dialog({
					id: 'dialogEdit',
					title: '编辑名单预警信息',
					url: '/views/edit-warn-info.html',
					width: '800px',
					height: '380px',
					padding: '25px',
					backdropOpacity: 0.3,
					itemId: item.id
				}).bind('refresh', function(e) {
					fly.alert({
						content: '编辑成功',
						css: 'success'
					});
					//重置页码，刷新列表,page会自动调用read函数，且切会带表单的查询条件
					vm.tableData.page(1);
				});
		    }
		});
	fly.bind('body',vm);

});