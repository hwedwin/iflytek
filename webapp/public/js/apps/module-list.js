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
			tableData: fly.dataSource({
				read: {
					url: 'http://localhost:8080/audit-backend/model/getModelList',
					type: 'POST',
					dataType: 'json',
					dataFilter: function(res) {
						var res = fly.evalJSON(res),
							data = {
								rows: res.rows || [],
								total: res.total || 0
							};
						if (res.rows.length <= 0) {
							$('#gridList').html('<tr><td colspan="7">暂无数据</td></tr>');
						}
						return JSON.stringify(data);
					}
				},
				pageSize: 5
			}),
			deleteClick: function(e) {
				var id = e.handleObj.data.id;
				top.fly.dialog({
					title: '删除',
					content: '确定要删除该行数据吗',
					width: '300px',
					height: '100px',
					padding: '25px',
					backdropOpacity: 0.3,
					okValue: '确定',
					ok: function() {
						$.ajax({
							type: "GET",
							url: "http://localhost:8080/audit-backend/model/deleteModelById",
							data: {modelId: id},
							success: function(res) {
								res = fly.evalJSON(res);
								if (res) {
									fly.alert('删除成功');
								} else {
									fly.alert('删除失败');
								}
								vm.tableData.page(1);
							}
						});
						//重新拉取数据,会自动调用read函数
						vm.tableData.page(1);
					},
					cancelValue: '取消',
					cancel: function() {}
				});
			},
			searchClick: function(e) {
				var $form = $('#formWrap').flyForm({}),
					data = $form.data('flyForm').data();
				//将表单中的条件存放在formData中
				formData = data;
				//根据查询条件请求请求只符合满足条件的列表数据
				vm.tableData.options.read.data = formData;
				vm.tableData.page(1);
			},
			addClick: function(e) {
				top.fly.dialog({
					id: 'dialogAdd',
					title: '新增',
					url: '/views/add-module.html',
					width: '800px',
					height: '350px',
					padding: '25px',
					backdropOpacity: 0.3
				}).bind('refresh', function(e) {
					fly.alert({
						content: '添加成功',
						css: 'success'
					});
					vm.tableData.page(1);
				});
			}
		});
	fly.bind('body', vm);
});