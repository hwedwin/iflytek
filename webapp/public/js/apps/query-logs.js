require.config(requireConfig);
require(['jquery', 'fly'], function($, fly) {
	fly.template.helper('formatDate', function(e, format) {
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
			if (v !== undefined) {
				if (all.length > 1) {
					v = '0' + v;
					v = v.substr(v.length - 2);
				}
				return v;
			} else if (t === 'y') {
				return (date.getFullYear() + '').substr(4 - all.length);
			}
			return all;
		});
		return format;
	});
	var formData = {},
		vm = window.vm = fly.observable({
			system: fly.dataSource({
				read: {
					url: 'http://localhost:8080/audit-backend/dictionary/getBusinessSystem',
					dataType: 'json',
					type: 'GET',
					dataFilter: function(res) {
						var res = fly.evalJSON(res);
						if (res.length > 0) {
							return JSON.stringify(res);
						}
					}
				}
			}),
			tableData: fly.dataSource({
				read: {
					url: 'http://localhost:8080/audit-backend/log/getLogList',
					dataType: 'json',
					type: 'POST',
					dataFilter: function(res) {
						var res = fly.evalJSON(res),
							data = {
								rows: res.rows || [],
								total: res.total || 0
							};
						if (data.rows.length <= 0) {
							$('#gridList').html('<tr><td colspan="8">暂无数据</td></tr>');
						}
						return JSON.stringify(data);
					}
				},
				pageSize: 5
			}),
			searchClick: function(e) {
				//按条件查询列表数据
				var $form = $('#formWrap').flyForm({}),
					data = $form.data('flyForm').data();
				//存放查询的表单条件
				formData = data;
				//在有查询条件的情况下执行下一页或者执行选中页码的操作，需要限满足的条件，设置read的筛选条件
				vm.tableData.options.read.data = formData;
				//根据条件查询之后，将页码设置为第一页，否则内容和页码对应不上
				vm.tableData.page(1);
			},
			editClick: function(e) {
				var obj = e.handleObj.data;
				top.fly.dialog({
					id: 'dialogEdit',
					title: '日志详情',
					url: '/views/edit-log.html',
					width: '800px',
					height: '300px',
					padding: '25px',
					backdropOpacity: 0.3,
					objId: obj.id
				});
			},
			addClick: function(e) {
				top.fly.dialog({
					id: 'dialogAdd',
					title: '日志详情',
					url: '/views/add-log.html',
					width: '800px',
					height: '350px',
					padding: '25px',
					backdropOpacity: 0.3
				}).bind('refresh', function(e) {
					fly.alert({
						content: '添加成功',
						css: 'success'
					});
					//重置页码，刷新列表,page会自动调用read函数，且会携带表单的查询条件
					vm.tableData.page(1);
				});
			},
			deleteClick: function(e) {
				var logId = e.handleObj.data.id
				top.fly.dialog({
					title: '删除日志信息',
					content: '确定要删除该行日志信息吗',
					width: '300px',
					height: '100px',
					padding: '25px',
					backdropOpacity: 0.3,
					okValue: '确定',
		            ok: function() {
		            	data = {logId: logId};
		                $.ajax({
							type: "GET",
							url: "http://localhost:8080/audit-backend/log/deleteLogById",
							data: data,
							success: function(res) {
		            			vm.tableData.page(1);
								fly.alert("数据已删除");
							}
						});
		            },
		            cancelValue: '取消',
		            cancel: function() {}
				});
			}
		});
	fly.bind('body', vm);
});