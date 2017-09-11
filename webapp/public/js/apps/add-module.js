require.config(requireConfig);
require(['jquery', 'fly'], function($, fly) {
	var user = sessionStorage.getItem("user");
	user = fly.evalJSON(user);
	var vm = window.vm = fly.observable({
		optionType: fly.dataSource({
			read: {
				url: 'http://localhost:8080/audit-backend/dictionary/getOptionType',
				dataType: 'json',
				type: 'GET',
				dataFilter: function(res) {
					var res = fly.evalJSON(res);
					if (res.length > 0) {
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
					if (res.length > 0) {
						return JSON.stringify(res);
					} else {
						fly.alert('业务系统数据请求失败');
					}
				}
			}
		}),
		remindWays: fly.dataSource({
			read: {
				url: 'http://localhost:8080/audit-backend/dictionary/getRemindWay',
				dataType: 'json',
				type: 'GET',
				dataFilter: function(res) {
					var res = fly.evalJSON(res);
					if (res.length > 0) {
						return JSON.stringify(res);
					} else {
						fly.alert('提醒方式数据请求失败');
					}
				}
			}
		}),
		systemVal: '',
		optionTypeVal: '',
		remindWayVal: '',
		addClick: function(e) {
			var $form = $('#formWrap').flyForm({
					valid: {
						theme: {
							required: true,
							title: '主题',
							check: function(e) {
								var val = this.val();
								if (val.length > 20) {
									this.flyTooltip({
										content: '主题最长不超过20个字符'
									});
									return false;
								}
								return val;
							}
						},
						businessSystem: {
							required: true,
							title: '业务系统'
						},
						optionType: {
							required: true,
							title: '操作类型'
						},
						remindWay: {
							required: true,
							title: '提醒方式'
						}
					}
				}),
				data = $form.data('flyForm').data(),
				$dialogAdd = top.fly.dialog.list['dialogAdd'];
			if (!data) {
				return false;
			}
			data.createUserId = user.id;
			$.ajax({
				type: "GET",
				url: "http://localhost:8080/audit-backend/model/addModel",
				data: data,
				success: function(res) {
					res = fly.evalJSON(res);
					if (res.code == '1') {
						$dialogAdd.trigger('refresh');
						$dialogAdd.close().destroy();
						fly.alert('添加成功');
					}
				}
			});
		}
	});
	fly.bind('body', vm);
});