require.config(requireConfig);
require(['jquery', 'fly'], function($, fly) {
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
		businessSystem: fly.dataSource({
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
		cancelClick: function(e) {
			var $dialogAdd = top.fly.dialog.list['dialogAdd'];
			$dialogAdd.close().destroy();
		},
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
						warnTime: {
							required: true,
							title: '预警时间'
						},
						exceptionValue: {
							required: true,
							type: 'number',
							min: 1,
							max: 100,
							step: 1,
							title: '异常情况'
						},
						businessSystem: {
							required: true,
							title: '业务系统'
						},
						optionType: {
							required: true,
							title: '操作类型'
						}
					}
				}),
				data = $form.data('flyForm').data(),
				$dialogAdd = top.fly.dialog.list['dialogAdd'];
			if (!data) {
				return false;
			}
			var user = sessionStorage.getItem('user');
			user = fly.evalJSON(user);
			data.createUserId = user.id;
			$.ajax({
				type: "POST",
				url: "http://localhost:8080/audit-backend/listWarn/addListWarn",
				contentType: 'application/json',
				dataType: 'json',
				data: JSON.stringify(data),
				success: function(res) {
					if (res.code == '1') {
						$dialogAdd.trigger('refresh');
						$dialogAdd.close().destroy();
					}
				}
			});
		}
	});
	fly.bind('body', vm);
});