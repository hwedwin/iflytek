require.config(requireConfig);
require(['jquery', 'fly'], function($, fly) {
	var user = sessionStorage.getItem("user");
	user = fly.evalJSON(user);
	var vm = window.vm = fly.observable({
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
		sureClick: function() {
			var $form = $('#formWrap').flyForm({
					valid: {
						businessSystem: {
							required: true,
							title: '业务系统',
						},
						operateTime: {
							required: true,
							title: '操作时间'
						},
						terminalIdentity: {
							required: true,
							title: '终端标识'
						},
						functionModule: {
							required: true,
							title: '功能模块'
						},
						operateCondition: {
							required: true,
							title: '操作条件'
						}
					}
				}),
			data = $form.data('flyForm').data(),
			$dialogAdd = top.fly.dialog.list['dialogAdd'];
			if (!data) {
				return false;
			}
			data.operateUserId = user.id;
			$.ajax({
				type: "GET",
				url: "http://localhost:8080/audit-backend/log/addLog",
				data: data,
				success: function(res) {
					res = fly.evalJSON(res);
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